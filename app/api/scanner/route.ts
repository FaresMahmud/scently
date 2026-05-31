import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { carregarCatalogo } from "@/lib/catalogoFragella"
import { slugify } from "@/lib/utils"
import { scannerRateLimit, getClientIp } from "@/lib/rateLimit"
import { getAuthUser } from "@/lib/apiAuth"
import { db } from "@/lib/db"
import { scannerSchema, zodError } from "@/lib/schemas"

export interface GeminiResult {
  found: boolean
  name: string
  brand: string
  confidence: "high" | "medium" | "low"
  notes: string[]
  family: string
  occasions: string[]
  description: string
}

interface CatalogMatch {
  id: string
  nome: string
  marca: string
  concentracao?: string
  familia?: string
}

const VISION_PROMPT = `This is a perfume bottle or box. Identify the perfume.
Return JSON only — no markdown, no explanation, no text outside the JSON.
Schema: {"found":boolean,"name":string,"brand":string,"confidence":"high"|"medium"|"low","notes":string[],"family":string,"occasions":string[],"description":string}
- found: true if you can identify the perfume
- name: perfume name only (no brand)
- brand: brand/house name
- confidence: high = certain, medium = likely, low = possible
- notes: up to 6 olfactory notes in Portuguese (e.g. "Bergamota", "Âmbar", "Madeira")
- family: olfactory family in Portuguese (e.g. "Floral Amadeirado")
- occasions: up to 3 occasions in Portuguese (e.g. "Casual", "Romântico", "Noite")
- description: 1–2 sentence sensorial description in Portuguese
If you cannot identify: return {"found":false,"name":"","brand":"","confidence":"low","notes":[],"family":"","occasions":[],"description":""}`

function normalizar(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim()
}

function buscarMatchCatalogo(nome: string, marca: string): CatalogMatch | null {
  if (!nome && !marca) return null
  const n = normalizar(nome)
  const m = normalizar(marca)
  let best: { item: ReturnType<typeof carregarCatalogo>[0]; score: number } | null = null

  for (const p of carregarCatalogo()) {
    const pn = normalizar(p.nome)
    const pm = normalizar(p.marca)
    let score = 0
    if (pn === n)                               score += 4
    else if (pn.includes(n) || n.includes(pn)) score += 2
    if (pm === m)                               score += 3
    else if (pm.includes(m) || m.includes(pm)) score += 1
    if (score >= 3 && (!best || score > best.score)) best = { item: p, score }
  }

  if (!best) return null
  const p = best.item
  return {
    id:          `${slugify(p.nome)}-${slugify(p.marca)}`,
    nome:        p.nome,
    marca:       p.marca,
    concentracao:p.concentracao ?? undefined,
    familia:     p.familia     ?? undefined,
  }
}

export async function POST(req: NextRequest) {
  // Rate limit
  const ip = getClientIp(req)
  const { allowed, retryAfter } = scannerRateLimit(ip)
  if (!allowed) {
    return NextResponse.json(
      { error: "Limite de scans atingido. Tente novamente em breve." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    )
  }

  let raw: unknown
  try { raw = await req.json() } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 })
  }

  const parsed = scannerSchema.safeParse(raw)
  if (!parsed.success) return zodError(parsed)

  const { imageBase64, mimeType } = parsed.data

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "Serviço de identificação não configurado." }, { status: 503 })
  }

  let geminiResult: GeminiResult
  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    const result = await model.generateContent([
      { inlineData: { data: imageBase64, mimeType } },
      VISION_PROMPT,
    ])
    const raw = result.response.text().trim()
    const json = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()
    geminiResult = JSON.parse(json) as GeminiResult
  } catch {
    return NextResponse.json(
      { error: "Não foi possível identificar. Tente outro ângulo ou melhor iluminação." },
      { status: 422 }
    )
  }

  const catalogMatch = geminiResult.found
    ? buscarMatchCatalogo(geminiResult.name, geminiResult.brand)
    : null

  // Optionally save to acervo if user is authenticated
  const authUser = getAuthUser(req)
  if (authUser && geminiResult.found && geminiResult.confidence !== "low") {
    const pid = catalogMatch?.id ?? `${slugify(geminiResult.name)}-${slugify(geminiResult.brand)}`
    await db.userPerfume.upsert({
      where:  { userId_perfumeId: { userId: authUser.userId, perfumeId: pid } },
      create: {
        userId:      authUser.userId,
        perfumeId:   pid,
        perfumeName: catalogMatch?.nome  ?? geminiResult.name,
        brand:       catalogMatch?.marca ?? geminiResult.brand,
        status:      "QUERO_EXPERIMENTAR",
      },
      update: {},
    }).catch(() => null)
  }

  return NextResponse.json({ perfume: geminiResult, catalogMatch })
}

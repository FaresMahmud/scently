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
  notas?: string[]
}

const VISION_PROMPT = `Você é um especialista em perfumaria. Analise esta imagem e identifique o perfume.
Retorne APENAS um objeto JSON válido, sem markdown, sem explicação:
{
  "found": true/false,
  "name": "nome exato do perfume como escrito no frasco",
  "brand": "nome da marca apenas",
  "confidence": "high/medium/low",
  "notes": ["nota1", "nota2", "nota3"],
  "family": "família olfativa (floral/amadeirado/oriental/fresco/etc)",
  "occasions": ["ocasião1", "ocasião2"],
  "description": "descrição sensorial de 2-3 frases em português"
}
Retorne found: false apenas se não conseguir identificar o perfume de forma alguma.
Leia com atenção o texto no frasco ou na embalagem.`

function normalizar(s: string): string {
  return s.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
}

function similaridade(a: string, b: string): number {
  const wa = new Set(a.split(/\s+/).filter(w => w.length > 2))
  const wb = new Set(b.split(/\s+/).filter(w => w.length > 2))
  if (wa.size === 0 || wb.size === 0) return 0
  let matches = 0
  for (const w of wa) {
    if (wb.has(w) || [...wb].some(bw => bw.includes(w) || w.includes(bw))) matches++
  }
  return matches / Math.max(wa.size, wb.size)
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

    // Nome match
    if (pn === n) score += 5
    else if (pn.includes(n) || n.includes(pn)) score += 3
    else {
      const sim = similaridade(n, pn)
      if (sim >= 0.6) score += Math.round(sim * 3)
    }

    // Marca match
    if (pm === m) score += 4
    else if (pm.includes(m) || m.includes(pm)) score += 2
    else {
      const sim = similaridade(m, pm)
      if (sim >= 0.5) score += 1
    }

    // Threshold: precisa de score >= 3 com pelo menos algum match de nome
    if (score >= 3 && (!best || score > best.score)) best = { item: p, score }
  }

  if (!best) return null
  const p = best.item
  const notasCatalogo = [
    ...(p.notasTopo    ?? []),
    ...(p.notasCoracao ?? []),
    ...(p.notasFundo   ?? []),
  ].slice(0, 6)
  return {
    id: `${slugify(p.nome)}-${slugify(p.marca)}`,
    nome: p.nome,
    marca: p.marca,
    concentracao: p.concentracao ?? undefined,
    familia: p.familia ?? undefined,
    notas: notasCatalogo.length > 0 ? notasCatalogo : undefined,
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

  console.log("[Scanner] mimeType received:", mimeType)
  console.log("[Scanner] base64 length:", imageBase64?.length)

  let geminiResult: GeminiResult
  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
    const result = await model.generateContent([
      { inlineData: { mimeType, data: imageBase64 } },
      VISION_PROMPT,
    ])
    const raw = result.response.text().trim()
    const json = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()
    try {
      geminiResult = JSON.parse(json) as GeminiResult
    } catch {
      console.error("[Scanner] Gemini raw response:", raw)
      throw new Error("JSON inválido na resposta do Gemini")
    }
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string; errorDetails?: unknown; response?: unknown }
    console.error("[Scanner] Gemini error status:", e?.status)
    console.error("[Scanner] Gemini error message:", e?.message)
    console.error("[Scanner] Gemini error details:", JSON.stringify(e?.errorDetails ?? e?.response ?? "no details"))
    return NextResponse.json({ erro: "Gemini falhou", detail: e?.message }, { status: 422 })
  }

  // Tenta catalog match sempre que há nome/marca — independente de found/confidence
  const catalogMatch = (geminiResult.name && geminiResult.brand)
    ? buscarMatchCatalogo(geminiResult.name, geminiResult.brand)
    : null

  // Substitui notas inventadas pelo Gemini pelas notas reais do catálogo
  if (catalogMatch?.notas && catalogMatch.notas.length > 0) {
    geminiResult.notes = catalogMatch.notas
  }

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

import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai"
import { carregarCatalogo } from "@/lib/catalogoFragella"
import { slugify } from "@/lib/utils"
import { scannerRateLimit, getClientIp } from "@/lib/rateLimit"
import { getAuthUser } from "@/lib/apiAuth"
import { db } from "@/lib/db"
import { scannerSchema, zodError } from "@/lib/schemas"
import { z } from "zod"
import { SCANNER_TONE_GUIDE } from "@/lib/aiPrompts"

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GeminiResultSchema: any = {
  type: SchemaType.OBJECT,
  properties: {
    found: { type: SchemaType.BOOLEAN },
    name: { type: SchemaType.STRING },
    brand: { type: SchemaType.STRING },
    confidence: { type: SchemaType.STRING, enum: ["high", "medium", "low"] },
    notes: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    family: { type: SchemaType.STRING },
    occasions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    description: { type: SchemaType.STRING },
  },
  required: ["found", "name", "brand", "confidence", "notes", "family", "occasions", "description"],
}

interface CatalogMatch {
  id: string
  nome: string
  marca: string
  concentracao?: string
  familia?: string
  notas?: string[]
  imagem?: string
}

const VISION_PROMPT = `${SCANNER_TONE_GUIDE}
Retorne apenas um JSON com estes campos: found, name, brand, confidence, notes, family, occasions, description.
Use found=false so quando nao conseguir identificar com confianca.
Prefira texto do frasco ou da embalagem antes de inferir pelo formato.`

const NOTAS_PT: Record<string, string> = {
  "bergamot": "Bergamota", "lemon": "Limão", "orange": "Laranja",
  "grapefruit": "Pomelo", "mandarin": "Tangerina", "lime": "Limão Taiti",
  "rose": "Rosa", "jasmine": "Jasmim", "violet": "Violeta",
  "iris": "Íris", "lavender": "Lavanda", "peony": "Peônia",
  "lily": "Lírio", "tuberose": "Tuberosa", "ylang-ylang": "Ylang-Ylang",
  "geranium": "Gerânio", "orange blossom": "Flor de Laranjeira",
  "sandalwood": "Sândalo", "cedar": "Cedro", "vetiver": "Vetiver",
  "oud": "Oud", "patchouli": "Patchouli", "oakmoss": "Musgo de Carvalho",
  "vanilla": "Baunilha", "amber": "Âmbar", "musk": "Almíscar",
  "incense": "Incenso", "benzoin": "Benjoim", "tonka bean": "Fava Tonka",
  "cardamom": "Cardamomo", "cinnamon": "Canela", "pepper": "Pimenta",
  "cloves": "Cravo", "cumin": "Cominho", "saffron": "Açafrão",
  "nutmeg": "Noz-Moscada",
  "sea breeze": "Brisa Marinha", "aquatic": "Aquático",
  "mint": "Menta", "eucalyptus": "Eucalipto",
  "apple": "Maçã", "peach": "Pêssego", "pear": "Pêra",
  "plum": "Ameixa", "raspberry": "Framboesa", "blackcurrant": "Groselha",
  "grapes": "Uva", "dried fruits": "Frutas Secas", "rum": "Rum",
  "leather": "Couro", "tobacco": "Tabaco", "coffee": "Café",
  "chocolate": "Chocolate", "honey": "Mel", "caramel": "Caramelo",
  "woody": "Amadeirado", "fresh": "Fresco", "powdery": "Polvilhado",
  "smoky": "Defumado", "earthy": "Terroso",
}

const FAMILIAS_PT: Record<string, string> = {
  "floral": "Floral", "oriental floral": "Floral Oriental",
  "woody": "Amadeirado", "fresh woody": "Amadeirado Fresco",
  "oriental woody": "Oriental Amadeirado", "oriental": "Oriental",
  "fresh": "Fresco", "citrus": "Cítrico", "aquatic": "Aquático",
  "aromatic": "Aromático", "fougere": "Fougère", "chypre": "Chipre",
  "gourmand": "Gourmand", "powdery": "Polvilhado", "spicy": "Especiado",
  "musky": "Almiscarado", "leather": "Couro", "tobacco": "Tabaco",
}

function traduzirNota(nota: string): string {
  return NOTAS_PT[nota.toLowerCase().trim()] || nota
}

function traduzirFamilia(familia: string): string {
  return FAMILIAS_PT[familia.toLowerCase().trim()] || familia
}

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
    imagem: p.imagemTransparente || p.imagem || undefined,
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

  let imageBase64 = ""
  let mimeType = "image/jpeg"

  const contentType = req.headers.get("content-type") ?? ""
  if (contentType.includes("multipart/form-data")) {
    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      return NextResponse.json({ error: "Corpo inválido." }, { status: 400 })
    }

    const image = formData.get("file")
    if (!(image instanceof File) || image.size === 0) {
      return NextResponse.json({ error: "Imagem obrigatória." }, { status: 400 })
    }

    mimeType = image.type || "image/jpeg"
    const buffer = Buffer.from(await image.arrayBuffer())
    imageBase64 = buffer.toString("base64")
  } else {
    let raw: unknown
    try { raw = await req.json() } catch {
      return NextResponse.json({ error: "Corpo inválido." }, { status: 400 })
    }

    const parsed = scannerSchema.safeParse(raw)
    if (!parsed.success) return zodError(parsed)

    imageBase64 = parsed.data.imageBase64
    mimeType = parsed.data.mimeType
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "Serviço de identificação não configurado." }, { status: 503 })
  }

  console.log("[Scanner] mimeType received:", mimeType)
  console.log("[Scanner] base64 length:", imageBase64?.length)

  let geminiResult: GeminiResult
  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        maxOutputTokens: 320,
        responseMimeType: "application/json",
        responseSchema: GeminiResultSchema,
      },
    })
    const result = await model.generateContent([
      { inlineData: { mimeType, data: imageBase64 } },
      VISION_PROMPT,
    ])
    const json = result.response.text().trim()
    try {
      geminiResult = JSON.parse(json) as GeminiResult
    } catch {
      console.error("[Scanner] Gemini raw response:", json)
      throw new Error("JSON inválido na resposta do Gemini")
    }

    const GeminiZod = z.object({
      found: z.boolean(),
      name: z.string(),
      brand: z.string(),
      confidence: z.enum(["high", "medium", "low"]),
      notes: z.array(z.string()),
      family: z.string(),
      occasions: z.array(z.string()),
      description: z.string(),
    })

    const parsed = GeminiZod.safeParse(geminiResult)
    if (!parsed.success) {
      console.warn("[Scanner] Gemini response validation failed:", parsed.error.format())
      return NextResponse.json({ error: "Resposta inválida da IA" }, { status: 502 })
    }
    geminiResult = parsed.data as GeminiResult
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string; errorDetails?: unknown; response?: unknown }
    console.error("[Scanner] Gemini error status:", e?.status)
    console.error("[Scanner] Gemini error message:", e?.message)
    console.error("[Scanner] Gemini error details:", JSON.stringify(e?.errorDetails ?? e?.response ?? "no details"))
    return NextResponse.json({ erro: "Gemini falhou", detail: e?.message }, { status: 422 })
  }

  // Traduz notas e família para PT (Gemini responde em inglês mesmo com prompt PT)
  geminiResult.notes = geminiResult.notes.map(traduzirNota)
  geminiResult.family = traduzirFamilia(geminiResult.family)

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

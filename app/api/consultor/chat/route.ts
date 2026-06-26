// ============================================
// ARQUIVO: app/api/consultor/chat/route.ts
// O QUE FAZ: chat aberto com a consultora de fragrâncias (Gemini + grounding)
// DEPENDE DE: GEMINI_API_KEY, lib/catalogoFragella.ts, lib/rateLimit.ts
// QUANDO MANDAR PRA IA: quando quiser ajustar o tom, as regras de escopo, ou a
//                       busca de catálogo usada como contexto
// ============================================

import { NextRequest, NextResponse, after } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { consultorChatSchema } from "@/lib/schemas"
import { consultorChatRateLimit, getClientIp } from "@/lib/rateLimit"
import { CONSULTOR_CHAT_SYSTEM_PROMPT } from "@/lib/aiPrompts"
import { buscarNoCatalogo } from "@/lib/catalogoFragella"
import type { PerfumeFragella } from "@/lib/fragella"
import { getAuthUser } from "@/lib/apiAuth"
import { carregarMemorias, extrairEArmazenarFatos } from "@/lib/consultorMemoria"

// perfumes-expandido.json (marcas nacionais/nicho) é um catálogo separado do
// fragella (importados) — buscarNoCatalogo só cobre fragella, então o chat
// precisa buscar nos dois pra não perder perfumes como "Malbec Gold".
interface PerfumeExpandidoMin {
  id: string
  nome: string
  marca: string
  genero: string
  familia: string
}

let _expandido: PerfumeExpandidoMin[] | null = null
function getExpandido(): PerfumeExpandidoMin[] {
  if (_expandido) return _expandido
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _expandido = require("@/data/perfumes-expandido.json") as PerfumeExpandidoMin[]
  } catch {
    _expandido = []
  }
  return _expandido
}

function buscarNoExpandido(query: string, limit: number): PerfumeExpandidoMin[] {
  const q = query.toLowerCase().trim()
  if (!q) return []
  return getExpandido()
    .filter(p => p.nome.toLowerCase().includes(q) || p.marca.toLowerCase().includes(q))
    .slice(0, limit)
}

type CandidatoCatalogo = { id: string; nome: string; marca: string; genero: string; familia: string }

const ORIGENS_PERMITIDAS =
  process.env.NODE_ENV === "production"
    ? ["https://nozze.app", "https://www.nozze.app"]
    : ["https://nozze.app", "https://www.nozze.app", "http://localhost:3000"]

// Palavras com menos de 4 letras tendem a ser stopwords em PT ("de", "uma", "que")
// — exclui só das janelas de 1 palavra; janelas de 2-3 palavras passam mesmo curtas
// (ex: "1 million" tem token "1" de 1 char, mas a janela toda ainda é específica).
function extrairCandidatos(mensagem: string): string[] {
  const palavras = mensagem
    .toLowerCase()
    .replace(/[?!.,;:]/g, "")
    .split(/\s+/)
    .filter(Boolean)

  const candidatos = new Set<string>()
  for (let tam = 3; tam >= 1; tam--) {
    for (let i = 0; i + tam <= palavras.length; i++) {
      const janela = palavras.slice(i, i + tam).join(" ")
      if (tam === 1 && janela.length < 4) continue
      if (janela.length >= 3) candidatos.add(janela)
    }
  }
  return [...candidatos]
}

function buscarContextoCatalogo(mensagem: string): CandidatoCatalogo[] {
  const candidatos = extrairCandidatos(mensagem)
  const encontrados = new Map<string, CandidatoCatalogo>()

  for (const c of candidatos) {
    if (encontrados.size >= 5) break
    for (const p of buscarNoCatalogo(c, 3) as PerfumeFragella[]) {
      if (!encontrados.has(p.id)) encontrados.set(p.id, p)
    }
    for (const p of buscarNoExpandido(c, 3)) {
      if (!encontrados.has(p.id)) encontrados.set(p.id, p)
    }
  }
  return [...encontrados.values()].slice(0, 5)
}

function montarSystemInstruction(catalogo: CandidatoCatalogo[], memoria: string | null): string {
  let prompt = CONSULTOR_CHAT_SYSTEM_PROMPT

  if (catalogo.length > 0) {
    const lista = catalogo
      .map(p => `- "${p.nome}" (${p.marca}) — id: ${p.id} — gênero: ${p.genero || "?"} — família: ${p.familia || "?"}`)
      .join("\n")
    prompt += `\n\nCandidatos do catálogo Nozze relacionados à mensagem atual (priorize estes quando forem relevantes pra resposta):\n${lista}`
  }

  if (memoria) {
    prompt += `\n\n${memoria} Use isso pra personalizar a conversa sem fazer o cliente repetir o que já disse. Se o cliente perguntar diretamente o que você sabe ou lembra sobre ele (ex: "o que você sabe sobre mim?"), essa pergunta está dentro do seu escopo — responda contando essas informações de forma natural, como uma consultora que realmente conhece o cliente.`
  }

  return prompt
}

export async function POST(request: NextRequest) {
  const origem = request.headers.get("origin") ?? ""
  if (origem && !ORIGENS_PERMITIDAS.includes(origem)) {
    return NextResponse.json({ erro: "Origem não permitida" }, { status: 403 })
  }

  const contentLength = request.headers.get("content-length")
  if (contentLength && parseInt(contentLength) > 20_480) {
    return NextResponse.json({ erro: "Payload muito grande" }, { status: 413 })
  }

  const ip = getClientIp(request)
  const { allowed, retryAfter } = consultorChatRateLimit(ip)
  if (!allowed) {
    return NextResponse.json(
      { erro: "Muitas mensagens — espera um pouco antes de continuar." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    )
  }

  let raw: unknown
  try { raw = await request.json() } catch {
    return NextResponse.json({ erro: "Requisição inválida" }, { status: 400 })
  }

  const parsed = consultorChatSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ erro: "Requisição inválida" }, { status: 400 })
  }

  const { mensagem, historico } = parsed.data

  const chave = process.env.GEMINI_API_KEY
  if (!chave) {
    console.error("[API /consultor/chat] GEMINI_API_KEY não configurada")
    return NextResponse.json({ erro: "Consultora indisponível no momento." }, { status: 500 })
  }

  try {
    const usuario = getAuthUser(request)
    const catalogo = buscarContextoCatalogo(mensagem)
    const memoria = usuario ? await carregarMemorias(usuario.userId) : null

    const genAI = new GoogleGenerativeAI(chave)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: montarSystemInstruction(catalogo, memoria),
      tools: [{ googleSearch: {} } as never],
      generationConfig: { thinkingConfig: { thinkingBudget: 0 } } as never,
    })

    const chat = model.startChat({
      history: historico.map(h => ({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.content }],
      })),
    })

    const result = await chat.sendMessage(mensagem)
    const resposta = result.response.text().trim()

    if (!resposta) {
      return NextResponse.json({ erro: "Não foi possível gerar uma resposta." }, { status: 500 })
    }

    // Extração de memória roda após a resposta ser enviada — não atrasa o usuário
    if (usuario) {
      after(() => extrairEArmazenarFatos(usuario.userId, mensagem, resposta))
    }

    return NextResponse.json({ resposta, memoriaAtiva: !!usuario })
  } catch (err) {
    console.error("[API /consultor/chat] Erro:", err)
    return NextResponse.json({ erro: "Não foi possível gerar uma resposta." }, { status: 500 })
  }
}

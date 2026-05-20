// ============================================
// ARQUIVO: app/api/consultor/route.ts
// O QUE FAZ: endpoint POST que recebe as respostas do quiz e retorna a recomendação da IA
// QUANDO MANDAR PRA IA: quando quiser mudar validação, rate limiting ou tratamento de erro
// DEPENDE DE: lib/ai.ts, .env.local (GROQ_API_KEY — nunca exposta ao cliente)
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { gerarRecomendacao } from "@/lib/ai"

const ORIGENS_PERMITIDAS = [
  "http://localhost:3000",
  "https://scently.com.br",
  "https://www.scently.com.br",
  "https://scently-five.vercel.app",
]

// Rate limiting em memória: IP → { count, resetAt }
const limites = new Map<string, { count: number; resetAt: number }>()
const LIMITE_REQUESTS = 10
const JANELA_MS = 60 * 60 * 1000 // 1 hora

function verificarRateLimit(ip: string): boolean {
  const agora = Date.now()
  const entrada = limites.get(ip)

  if (!entrada || agora > entrada.resetAt) {
    limites.set(ip, { count: 1, resetAt: agora + JANELA_MS })
    return true
  }

  if (entrada.count >= LIMITE_REQUESTS) return false

  entrada.count++
  return true
}

export async function POST(request: NextRequest) {
  // Verificação de origem (CORS)
  const origem = request.headers.get("origin") ?? ""
  if (origem && !ORIGENS_PERMITIDAS.includes(origem)) {
    return NextResponse.json({ erro: "Origem não permitida" }, { status: 403 })
  }

  // Limite de payload
  const contentLength = request.headers.get("content-length")
  if (contentLength && parseInt(contentLength) > 10240) {
    return NextResponse.json({ erro: "Payload muito grande" }, { status: 413 })
  }

  // Rate limiting por IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"

  if (!verificarRateLimit(ip)) {
    return NextResponse.json(
      { erro: "Limite de consultas atingido. Tente novamente em 1 hora." },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const respostas: Record<string, unknown> = body?.respostas ?? body

    // Valida que respostas é um objeto com pelo menos 1 chave
    if (
      !respostas ||
      typeof respostas !== "object" ||
      Array.isArray(respostas) ||
      Object.keys(respostas).length === 0
    ) {
      return NextResponse.json(
        { erro: "Requisição inválida: respostas ausentes ou vazias." },
        { status: 400 }
      )
    }

    console.log("[API /consultor] Respostas recebidas:", JSON.stringify(respostas))

    const recomendacao = await gerarRecomendacao(respostas)

    console.log("[API /consultor] Resultado da IA:", recomendacao ? "OK" : "null")

    if (!recomendacao) {
      return NextResponse.json(
        { erro: "Não foi possível gerar a recomendação" },
        { status: 500 }
      )
    }

    return NextResponse.json(recomendacao)
  } catch (erro) {
    console.error("[API /consultor] Erro no handler:", erro)
    return NextResponse.json(
      { erro: "Requisição inválida" },
      { status: 400 }
    )
  }
}

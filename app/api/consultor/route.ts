import { NextRequest, NextResponse } from "next/server"
import { gerarRecomendacao, gerarRecomendacaoQuiz } from "@/lib/ai"
import { consultorRateLimit, getClientIp } from "@/lib/rateLimit"
import { consultorSchema } from "@/lib/schemas"
import { resolverRespostas } from "@/lib/quiz/questions"

// Only the production domains — nozze.vercel.app removed
const ORIGENS_PERMITIDAS =
  process.env.NODE_ENV === "production"
    ? ["https://nozze.app", "https://www.nozze.app"]
    : ["https://nozze.app", "https://www.nozze.app", "http://localhost:3000"]

export async function POST(request: NextRequest) {
  // CORS — reject unknown origins (browser-initiated cross-origin requests)
  const origem = request.headers.get("origin") ?? ""
  if (origem && !ORIGENS_PERMITIDAS.includes(origem)) {
    return NextResponse.json({ erro: "Origem não permitida" }, { status: 403 })
  }

  // Payload size guard (10 KB max)
  const contentLength = request.headers.get("content-length")
  if (contentLength && parseInt(contentLength) > 10_240) {
    return NextResponse.json({ erro: "Payload muito grande" }, { status: 413 })
  }

  // Rate limit: 20 requests per IP per hour
  const ip = getClientIp(request)
  const { allowed, retryAfter } = consultorRateLimit(ip)
  if (!allowed) {
    return NextResponse.json(
      { erro: "Limite de consultas atingido. Tente novamente em 1 hora." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    )
  }

  let raw: unknown
  try { raw = await request.json() } catch {
    return NextResponse.json({ erro: "Requisição inválida" }, { status: 400 })
  }

  // Parse the full raw body — preserves mode alongside respostas
  const parsed = consultorSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ erro: "Requisição inválida: respostas ausentes ou vazias." }, { status: 400 })
  }

  try {
    // New quiz engine (free / premium) — returns 4 recommendations
    if (parsed.data.mode === "free" || parsed.data.mode === "premium") {
      // Resolve option IDs (a/b/c/d) → full option text before sending to AI
      const respostasTexto = resolverRespostas(
        parsed.data.respostas as Record<string, string>,
        parsed.data.mode
      )
      const recomendacao = await gerarRecomendacaoQuiz(respostasTexto, parsed.data.mode)
      if (!recomendacao) {
        return NextResponse.json({ erro: "Não foi possível gerar a recomendação" }, { status: 500 })
      }
      return NextResponse.json(recomendacao)
    }

    // Legacy engine — returns perfumePrincipal + alternativa
    const recomendacao = await gerarRecomendacao(parsed.data.respostas as Record<string, unknown>)
    if (!recomendacao) {
      return NextResponse.json({ erro: "Não foi possível gerar a recomendação" }, { status: 500 })
    }
    return NextResponse.json(recomendacao)
  } catch (err) {
    console.error("[API /consultor] Erro:", err)
    return NextResponse.json({ erro: "Requisição inválida" }, { status: 400 })
  }
}

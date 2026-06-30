// ============================================
// ARQUIVO: app/api/catalogo/busca/route.ts
// O QUE FAZ: autocomplete de perfumes do catálogo — usado pela pergunta
//            "perfume que você já usa" do quiz (e outros campos de busca leve)
// QUANDO MANDAR PRA IA: quando quiser mudar o limite de resultados ou a fonte
// DEPENDE DE: lib/catalogoFragella.ts, lib/rateLimit.ts
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { buscarNoCatalogo } from "@/lib/catalogoFragella"
import { catalogoBuscaRateLimit, getClientIp } from "@/lib/rateLimit"

export function GET(req: NextRequest) {
  const ip = getClientIp(req)
  const { allowed, retryAfter } = catalogoBuscaRateLimit(ip)
  if (!allowed) {
    return NextResponse.json(
      { error: "Muitas requisições. Tente novamente em breve." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    )
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? ""
  if (q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const results = buscarNoCatalogo(q, 5).map(p => ({
    nome:  p.nome,
    marca: p.marca,
    id:    p.id,
  }))

  return NextResponse.json(
    { results },
    { headers: { "Cache-Control": "public, max-age=60" } }
  )
}

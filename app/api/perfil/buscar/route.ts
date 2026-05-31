import { NextRequest, NextResponse } from "next/server"
import { getAuthUser, unauthorized } from "@/lib/apiAuth"
import { perfilRateLimit } from "@/lib/rateLimit"
import { carregarCatalogo } from "@/lib/catalogoFragella"
import { slugify } from "@/lib/utils"

function normalizar(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
}

export function GET(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return unauthorized()

  const { allowed, retryAfter } = perfilRateLimit(user.userId)
  if (!allowed) {
    return NextResponse.json(
      { error: "Limite de requisições atingido." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    )
  }

  const q     = req.nextUrl.searchParams.get("q")?.trim() ?? ""
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "15"), 30)

  if (q.length < 2) return NextResponse.json({ results: [] })

  const termo = normalizar(q)
  const results = carregarCatalogo()
    .filter(p =>
      normalizar(p.nome ?? "").includes(termo) ||
      normalizar(p.marca ?? "").includes(termo)
    )
    .slice(0, limit)
    .map(p => ({
      id:           `${slugify(p.nome)}-${slugify(p.marca)}`,
      nome:         p.nome,
      marca:        p.marca,
      concentracao: p.concentracao ?? null,
    }))

  return NextResponse.json({ results })
}

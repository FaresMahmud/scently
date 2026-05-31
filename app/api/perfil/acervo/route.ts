import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser, unauthorized } from "@/lib/apiAuth"
import { perfilRateLimit } from "@/lib/rateLimit"
import { acervoPostSchema, zodError } from "@/lib/schemas"

function rl(userId: string) {
  const { allowed, retryAfter } = perfilRateLimit(userId)
  if (!allowed) {
    return NextResponse.json(
      { error: "Limite de requisições atingido. Tente novamente em breve." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    )
  }
  return null
}

export async function GET(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return unauthorized()
  const limited = rl(user.userId)
  if (limited) return limited

  const items = await db.userPerfume.findMany({
    where: { userId: user.userId },
    orderBy: { addedAt: "desc" },
  })

  return NextResponse.json({
    tenho:             items.filter(i => i.status === "TENHO"),
    jaSentiGostei:     items.filter(i => i.status === "JA_SENTI_GOSTEI"),
    queroExperimentar: items.filter(i => i.status === "QUERO_EXPERIMENTAR"),
  })
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return unauthorized()
  const limited = rl(user.userId)
  if (limited) return limited

  let raw: unknown
  try { raw = await req.json() } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 })
  }

  const parsed = acervoPostSchema.safeParse(raw)
  if (!parsed.success) return zodError(parsed)

  const { perfumeId, perfumeName, brand, status, rating, notes } = parsed.data

  const item = await db.userPerfume.upsert({
    where: { userId_perfumeId: { userId: user.userId, perfumeId } },
    create: { userId: user.userId, perfumeId, perfumeName, brand, status, rating: rating ?? null, notes: notes ?? null },
    update: { perfumeName, brand, status, rating: rating ?? null, notes: notes ?? null },
  })

  return NextResponse.json({ item })
}

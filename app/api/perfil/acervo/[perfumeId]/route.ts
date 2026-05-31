import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser, unauthorized } from "@/lib/apiAuth"
import { perfilRateLimit } from "@/lib/rateLimit"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ perfumeId: string }> }
) {
  const user = getAuthUser(req)
  if (!user) return unauthorized()

  const { allowed, retryAfter } = perfilRateLimit(user.userId)
  if (!allowed) {
    return NextResponse.json(
      { error: "Limite de requisições atingido." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    )
  }

  const { perfumeId } = await params

  const deleted = await db.userPerfume.deleteMany({
    where: { userId: user.userId, perfumeId },
  })

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Perfume não encontrado no acervo." }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}

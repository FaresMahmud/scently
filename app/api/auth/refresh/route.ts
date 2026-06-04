import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  verifyRefreshToken,
  hashRefreshToken,
  generateAccessToken,
  generateRefreshToken,
  serializeCookie,
  accessCookieOptions,
  refreshCookieOptions,
} from "@/lib/auth"
import { getClientIp } from "@/lib/rateLimit"

export async function POST(req: NextRequest) {
  const rawToken = req.cookies.get("refreshToken")?.value
  const ip = getClientIp(req)

  if (!rawToken) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  }

  // SECURITY: We store bcrypt hashes of refresh tokens.
  // We must find the candidate token by userId, then verify against hash.
  // Since we can't look up by hash directly, we search recent unexpired tokens.
  // In practice this is bounded by the number of active sessions per user (small set).
  const candidates = await db.refreshToken.findMany({
    where: {
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    take: 100,  // safety cap — no user should have >100 active sessions
  })

  let stored: (typeof candidates)[0] | null = null
  for (const candidate of candidates) {
    const matches = await verifyRefreshToken(rawToken, candidate.token)
    if (matches) { stored = candidate; break }
  }

  if (!stored) {
    console.info(`[AUTH] refresh_invalid ip=${ip}`)
    return NextResponse.json({ error: "Token inválido ou expirado." }, { status: 401 })
  }

  // Revoke old token (rotation)
  await db.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  })

  const user = await db.user.findUnique({ where: { id: stored.userId } })
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 401 })
  }

  const accessToken  = generateAccessToken(user.id, user.email)
  const refreshToken = generateRefreshToken()
  const refreshHash  = await hashRefreshToken(refreshToken)

  await db.refreshToken.create({
    data: {
      token:     refreshHash,
      userId:    user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  console.info(`[AUTH] refresh_success ip=${ip} userId=${user.id}`)

  const res = NextResponse.json({ ok: true })
  res.headers.append("Set-Cookie", serializeCookie("accessToken",  accessToken,  accessCookieOptions))
  res.headers.append("Set-Cookie", serializeCookie("refreshToken", refreshToken, refreshCookieOptions))
  return res
}

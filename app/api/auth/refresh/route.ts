import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  generateAccessToken,
  generateRefreshToken,
  serializeCookie,
  accessCookieOptions,
  refreshCookieOptions,
} from "@/lib/auth"

export async function POST(req: NextRequest) {
  const rawToken = req.cookies.get("refreshToken")?.value
  if (!rawToken) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  }

  const stored = await db.refreshToken.findUnique({ where: { token: rawToken } })

  if (!stored || stored.revokedAt !== null || stored.expiresAt < new Date()) {
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

  await db.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  const res = NextResponse.json({ ok: true })
  res.headers.append("Set-Cookie", serializeCookie("accessToken",  accessToken,  accessCookieOptions))
  res.headers.append("Set-Cookie", serializeCookie("refreshToken", refreshToken, refreshCookieOptions))

  return res
}

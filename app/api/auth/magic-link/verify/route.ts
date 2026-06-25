import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { db } from "@/lib/db"
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  serializeCookie,
  accessCookieOptions,
  refreshCookieOptions,
} from "@/lib/auth"
import { trackEvent } from "@/lib/analytics"
import { getClientIp } from "@/lib/rateLimit"

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req)
  const token = new URL(req.url).searchParams.get("token")

  if (!token) {
    return NextResponse.redirect(new URL("/entrar?error=magic_link", req.url))
  }

  const tokenHash = hashToken(token)
  const verification = await db.verificationToken.findUnique({ where: { token: tokenHash } })

  // SECURITY: consume the token immediately to prevent reuse, regardless of outcome
  if (verification) {
    await db.verificationToken.delete({ where: { id: verification.id } }).catch(() => null)
  }

  if (!verification || verification.expires < new Date()) {
    console.info(`[AUTH] magic_link_invalid ip=${ip}`)
    return NextResponse.redirect(new URL("/entrar?error=magic_link", req.url))
  }

  const normalizedEmail = verification.email

  let user = await db.user.findUnique({ where: { email: normalizedEmail } })
  if (!user) {
    user = await db.user.create({
      data: { email: normalizedEmail, provider: "magic_link" },
    })
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

  console.info(`[AUTH] magic_link_login_success ip=${ip} userId=${user.id}`)
  trackEvent("user_session", user.id, { ip, provider: "magic_link" }, user.id)

  const res = NextResponse.redirect(new URL("/", req.url))
  res.headers.append("Set-Cookie", serializeCookie("accessToken",  accessToken,  accessCookieOptions))
  res.headers.append("Set-Cookie", serializeCookie("refreshToken", refreshToken, refreshCookieOptions))
  return res
}

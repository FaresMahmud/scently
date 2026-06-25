import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  verifyPassword,
  hashRefreshToken,
  generateAccessToken,
  generateRefreshToken,
  serializeCookie,
  accessCookieOptions,
  refreshCookieOptions,
} from "@/lib/auth"
import { loginRateLimit, getClientIp } from "@/lib/rateLimit"
import { trackEvent } from "@/lib/analytics"
import { loginSchema, zodError } from "@/lib/schemas"

async function validateTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, response: token }),
  })
  const data = await res.json() as { success: boolean }
  return data.success
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const { allowed, retryAfter } = loginRateLimit(ip)
  if (!allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em breve." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    )
  }

  let raw: unknown
  try { raw = await req.json() } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 })
  }

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) return zodError(parsed)

  const { email, password, turnstileToken } = parsed.data

  // SECURITY: Turnstile mandatory in production
  if (process.env.TURNSTILE_SECRET_KEY) {
    if (!turnstileToken) {
      return NextResponse.json({ error: "Verificação de segurança obrigatória." }, { status: 400 })
    }
    const valid = await validateTurnstile(turnstileToken)
    if (!valid) {
      return NextResponse.json({ error: "Verificação de segurança falhou." }, { status: 400 })
    }
  }

  const normalizedEmail = email.toLowerCase().trim()
  const user = await db.user.findUnique({ where: { email: normalizedEmail } })

  if (!user) {
    // SECURITY: constant-time-ish response for non-existent users
    await new Promise(r => setTimeout(r, 200 + Math.random() * 100))
    console.info(`[AUTH] login_failed_no_user ip=${ip} email=${normalizedEmail}`)
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 })
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    console.info(`[AUTH] login_locked ip=${ip} userId=${user.id}`)
    return NextResponse.json(
      { error: "Conta temporariamente bloqueada.", lockedUntil: user.lockedUntil.toISOString() },
      { status: 423 }
    )
  }

  // Conta criada via Google/link mágico ainda não tem senha definida
  if (!user.passwordHash) {
    console.info(`[AUTH] login_failed_no_password ip=${ip} userId=${user.id}`)
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 })
  }

  const valid = await verifyPassword(password, user.passwordHash)

  if (!valid) {
    const newAttempts = user.failedLoginAttempts + 1
    const shouldLock  = newAttempts >= 5
    await db.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: newAttempts,
        lockedUntil: shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null,
      },
    })
    console.info(`[AUTH] login_failed ip=${ip} userId=${user.id} attempts=${newAttempts}`)
    if (shouldLock) {
      return NextResponse.json(
        {
          error: "Muitas tentativas incorretas. Conta bloqueada por 15 minutos.",
          lockedUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        },
        { status: 423 }
      )
    }
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 })
  }

  await db.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  })

  const accessToken  = generateAccessToken(user.id, user.email)
  const refreshToken = generateRefreshToken()
  const refreshHash  = await hashRefreshToken(refreshToken)

  await db.refreshToken.create({
    data: {
      token:     refreshHash,  // SECURITY: store hash, not plaintext
      userId:    user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  console.info(`[AUTH] login_success ip=${ip} userId=${user.id}`)
  trackEvent("user_session", user.id, { ip }, user.id)

  const res = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } })
  res.headers.append("Set-Cookie", serializeCookie("accessToken",  accessToken,  accessCookieOptions))
  res.headers.append("Set-Cookie", serializeCookie("refreshToken", refreshToken, refreshCookieOptions))
  return res
}

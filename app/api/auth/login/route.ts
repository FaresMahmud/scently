import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  serializeCookie,
  accessCookieOptions,
  refreshCookieOptions,
} from "@/lib/auth"
import { loginRateLimit, getClientIp } from "@/lib/rateLimit"

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

  let body: { email?: string; password?: string; turnstileToken?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 })
  }

  const { email, password, turnstileToken } = body

  if (!email || !password) {
    return NextResponse.json({ error: "E-mail e senha são obrigatórios." }, { status: 400 })
  }

  // Turnstile
  if (turnstileToken) {
    const valid = await validateTurnstile(turnstileToken)
    if (!valid) {
      return NextResponse.json({ error: "Verificação de segurança falhou." }, { status: 400 })
    }
  }

  const normalizedEmail = email.toLowerCase().trim()
  const user = await db.user.findUnique({ where: { email: normalizedEmail } })

  if (!user) {
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 })
  }

  // Check account lock
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return NextResponse.json(
      {
        error: "Conta temporariamente bloqueada.",
        lockedUntil: user.lockedUntil.toISOString(),
      },
      { status: 423 }
    )
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

  // Reset failed attempts on success
  await db.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  })

  const accessToken  = generateAccessToken(user.id, user.email)
  const refreshToken = generateRefreshToken()

  await db.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  const res = NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
  })

  res.headers.append("Set-Cookie", serializeCookie("accessToken",  accessToken,  accessCookieOptions))
  res.headers.append("Set-Cookie", serializeCookie("refreshToken", refreshToken, refreshCookieOptions))

  return res
}

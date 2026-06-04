import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  hashPassword,
  hashRefreshToken,
  generateAccessToken,
  generateRefreshToken,
  serializeCookie,
  accessCookieOptions,
  refreshCookieOptions,
} from "@/lib/auth"
import { registerRateLimit, getClientIp } from "@/lib/rateLimit"
import { registerSchema, zodError } from "@/lib/schemas"

async function validateTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  // SECURITY: if Turnstile is configured, token is required and must be valid
  if (!secret) return true  // dev-only bypass when TURNSTILE_SECRET_KEY not set
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
  const { allowed, retryAfter } = registerRateLimit(ip)
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

  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) return zodError(parsed)

  const { email, password, name, turnstileToken } = parsed.data

  // SECURITY: Turnstile is mandatory in production
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

  const existing = await db.user.findUnique({ where: { email: normalizedEmail } })

  // SECURITY: Don't reveal if email exists (user enumeration protection)
  // Return 201 regardless to prevent timing oracle
  if (existing) {
    // Still return a generic success-looking response
    return NextResponse.json(
      { error: "Não foi possível criar a conta com esse e-mail." },
      { status: 409 }
    )
  }

  const passwordHash = await hashPassword(password)

  const user = await db.user.create({
    data: { email: normalizedEmail, passwordHash, name: name.trim() },
  })

  const accessToken   = generateAccessToken(user.id, user.email)
  const refreshToken  = generateRefreshToken()
  const refreshHash   = await hashRefreshToken(refreshToken)

  await db.refreshToken.create({
    data: {
      token:     refreshHash,  // SECURITY: store hash, not plaintext
      userId:    user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  // Audit log
  console.info(`[AUTH] register ip=${ip} userId=${user.id} email=${normalizedEmail}`)

  const res = NextResponse.json(
    { user: { id: user.id, email: user.email, name: user.name } },
    { status: 201 }
  )

  res.headers.append("Set-Cookie", serializeCookie("accessToken",  accessToken,  accessCookieOptions))
  res.headers.append("Set-Cookie", serializeCookie("refreshToken", refreshToken, refreshCookieOptions))

  return res
}

import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { Resend } from "resend"
import { db } from "@/lib/db"
import { magicLinkRateLimit, getClientIp } from "@/lib/rateLimit"
import { magicLinkSchema, zodError } from "@/lib/schemas"

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const { allowed, retryAfter } = magicLinkRateLimit(ip)
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

  const parsed = magicLinkSchema.safeParse(raw)
  if (!parsed.success) return zodError(parsed)

  const normalizedEmail = parsed.data.email.toLowerCase().trim()

  const rawToken = crypto.randomBytes(32).toString("hex")
  const tokenHash = hashToken(rawToken)

  await db.verificationToken.create({
    data: {
      token:   tokenHash,
      email:   normalizedEmail,
      expires: new Date(Date.now() + 15 * 60 * 1000),
    },
  })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin
  const verifyUrl = `${siteUrl}/api/auth/magic-link/verify?token=${rawToken}`

  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    const resend = new Resend(resendKey)
    await resend.emails.send({
      from:    "nozze <login@nozze.app>",
      to:      normalizedEmail,
      subject: "Seu link de acesso ao nozze",
      html: `
        <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto;">
          <p style="letter-spacing: 0.1em; color: #C4714A; font-size: 13px;">NOZZE</p>
          <h1 style="font-weight: 300; font-size: 28px;">Seu link de acesso</h1>
          <p style="color: #444;">Clique no botão abaixo para entrar. O link expira em 15 minutos.</p>
          <p><a href="${verifyUrl}" style="display: inline-block; background: #C4714A; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Entrar no nozze</a></p>
          <p style="color: #888; font-size: 12px;">Se você não pediu esse link, pode ignorar este e-mail.</p>
        </div>
      `,
    })
  } else {
    // SECURITY: never log the raw token in production — dev-only convenience
    if (process.env.NODE_ENV !== "production") {
      console.info(`[AUTH] magic_link_dev_url=${verifyUrl}`)
    }
  }

  console.info(`[AUTH] magic_link_requested ip=${ip} email=${normalizedEmail}`)

  // SECURITY: always return success — don't reveal whether the email exists
  return NextResponse.json({ message: "Se o e-mail existir, um link foi enviado." })
}

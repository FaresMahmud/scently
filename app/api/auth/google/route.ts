import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { serializeCookie } from "@/lib/auth"

const OAUTH_STATE_COOKIE = "oauthState"

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: "Login com Google não configurado." }, { status: 503 })
  }

  const siteUrl     = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin
  const redirectUri = `${siteUrl}/api/auth/google/callback`
  const state        = crypto.randomBytes(32).toString("hex")

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: "code",
    scope:         "openid email profile",
    state,
    prompt:        "select_account",
  })

  const res = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
  // SECURITY: short-lived state cookie, verified on callback to prevent CSRF
  res.headers.append("Set-Cookie", serializeCookie(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   600,
    path:     "/api/auth/google",
  }))
  return res
}

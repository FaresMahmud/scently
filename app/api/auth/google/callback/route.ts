import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  serializeCookie,
  accessCookieOptions,
  refreshCookieOptions,
  clearCookie,
} from "@/lib/auth"
import { trackEvent } from "@/lib/analytics"
import { getClientIp } from "@/lib/rateLimit"

const OAUTH_STATE_COOKIE = "oauthState"

interface GoogleTokenResponse {
  access_token: string
  id_token: string
}

interface GoogleUserInfo {
  sub: string
  email: string
  email_verified: boolean
  name?: string
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req)
  const url = new URL(req.url)
  const code  = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const cookieState = req.cookies.get(OAUTH_STATE_COOKIE)?.value

  const failRedirect = (reason: string) => {
    console.info(`[AUTH] google_failed ip=${ip} reason=${reason}`)
    const res = NextResponse.redirect(new URL(`/entrar?error=google`, req.url))
    res.headers.append("Set-Cookie", clearCookie(OAUTH_STATE_COOKIE, "/api/auth/google"))
    return res
  }

  // SECURITY: state must be present, match the cookie, and code must exist
  if (!code || !state || !cookieState || state !== cookieState) {
    return failRedirect("invalid_state")
  }

  const clientId     = process.env.GOOGLE_CLIENT_ID
  const clientSecret  = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return failRedirect("not_configured")
  }

  const siteUrl     = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin
  const redirectUri = `${siteUrl}/api/auth/google/callback`

  let tokenData: GoogleTokenResponse
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id:     clientId,
        client_secret: clientSecret,
        redirect_uri:  redirectUri,
        grant_type:    "authorization_code",
      }),
    })
    if (!tokenRes.ok) return failRedirect("token_exchange_failed")
    tokenData = await tokenRes.json()
  } catch {
    return failRedirect("token_exchange_error")
  }

  let profile: GoogleUserInfo
  try {
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    if (!profileRes.ok) return failRedirect("profile_fetch_failed")
    profile = await profileRes.json()
  } catch {
    return failRedirect("profile_fetch_error")
  }

  if (!profile.email_verified) {
    return failRedirect("email_not_verified")
  }

  const normalizedEmail = profile.email.toLowerCase().trim()

  let user = await db.user.findUnique({ where: { googleId: profile.sub } })

  if (!user) {
    // Link to an existing credentials account with the same email, or create a new one
    user = await db.user.findUnique({ where: { email: normalizedEmail } })
    if (user) {
      user = await db.user.update({
        where: { id: user.id },
        data: { googleId: profile.sub },
      })
    } else {
      user = await db.user.create({
        data: {
          email:    normalizedEmail,
          name:     profile.name?.trim() || null,
          provider: "google",
          googleId: profile.sub,
        },
      })
    }
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

  console.info(`[AUTH] google_login_success ip=${ip} userId=${user.id}`)
  trackEvent("user_session", user.id, { ip, provider: "google" }, user.id)

  const res = NextResponse.redirect(new URL("/", req.url))
  res.headers.append("Set-Cookie", serializeCookie("accessToken",  accessToken,  accessCookieOptions))
  res.headers.append("Set-Cookie", serializeCookie("refreshToken", refreshToken, refreshCookieOptions))
  res.headers.append("Set-Cookie", clearCookie(OAUTH_STATE_COOKIE, "/api/auth/google"))
  return res
}

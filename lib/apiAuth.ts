import { NextRequest, NextResponse } from "next/server"
import { verifyAccessToken } from "./auth"

export interface AuthUser {
  userId: string
  email: string
}

/** Extract and verify the JWT from the accessToken cookie. */
export function getAuthUser(req: NextRequest): AuthUser | null {
  const token = req.cookies.get("accessToken")?.value
  if (!token) return null
  const payload = verifyAccessToken(token)
  if (!payload) return null
  return { userId: payload.sub, email: payload.email }
}

/** Returns a 401 response — use with early return in route handlers. */
export function unauthorized() {
  return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
}

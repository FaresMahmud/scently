import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import crypto from "crypto"

// SECURITY: Fail hard in production if the secret is missing/default
// This prevents signing tokens with "dev-secret-change-in-production"
const ACCESS_SECRET = (() => {
  const s = process.env.ACCESS_TOKEN_SECRET
  if (!s || s === "dev-secret-change-in-production" || s === "your-secret-here-min-32-chars") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("[FATAL] ACCESS_TOKEN_SECRET not set. Refusing to start with insecure default.")
    }
    return "dev-only-insecure-secret-NOT-for-production"
  }
  return s
})()

export interface JwtPayload {
  sub: string   // userId
  email: string
  iat?: number
  exp?: number
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateAccessToken(userId: string, email: string): string {
  return jwt.sign({ sub: userId, email } satisfies JwtPayload, ACCESS_SECRET, {
    expiresIn: "15m",
  })
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex")
}

/** Hash a refresh token for storage — prevents session hijack if DB is leaked */
export function hashRefreshToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10)
}

/** Verify a refresh token against its stored hash */
export function verifyRefreshToken(token: string, hash: string): Promise<boolean> {
  return bcrypt.compare(token, hash)
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, ACCESS_SECRET) as JwtPayload
  } catch {
    return null
  }
}

const isProduction = process.env.NODE_ENV === "production"

export const accessCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict" as const,  // upgraded from lax — auth cookies should be strict
  maxAge: 15 * 60,
  path: "/",
}

export const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict" as const,  // upgraded from lax
  maxAge: 30 * 24 * 60 * 60,
  path: "/api/auth",
}

export function serializeCookie(
  name: string,
  value: string,
  opts: {
    httpOnly?: boolean
    secure?: boolean
    sameSite?: "lax" | "strict" | "none"
    maxAge?: number
    path?: string
  }
): string {
  let str = `${name}=${encodeURIComponent(value)}`
  if (opts.path)              str += `; Path=${opts.path}`
  if (opts.maxAge !== undefined) str += `; Max-Age=${opts.maxAge}`
  if (opts.httpOnly)          str += `; HttpOnly`
  if (opts.secure)            str += `; Secure`
  if (opts.sameSite)          str += `; SameSite=${opts.sameSite}`
  return str
}

/** SECURITY: clearCookie must include the same security flags as the original Set-Cookie
 *  Without them, the browser may not clear the intended cookie. */
export function clearCookie(name: string, path = "/"): string {
  const secure = isProduction ? "; Secure" : ""
  return `${name}=; Path=${path}; Max-Age=0; HttpOnly${secure}; SameSite=Strict`
}

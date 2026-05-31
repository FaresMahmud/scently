import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import crypto from "crypto"

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET ?? "dev-secret-change-in-production"

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

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, ACCESS_SECRET) as JwtPayload
  } catch {
    return null
  }
}

/** Cookie options shared by both tokens */
const isProduction = process.env.NODE_ENV === "production"

export const accessCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  maxAge: 15 * 60,
  path: "/",
}

export const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  maxAge: 30 * 24 * 60 * 60,
  path: "/api/auth",
}

/** Serialize a Set-Cookie header string (no external dep needed) */
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
  if (opts.path)    str += `; Path=${opts.path}`
  if (opts.maxAge !== undefined) str += `; Max-Age=${opts.maxAge}`
  if (opts.httpOnly) str += `; HttpOnly`
  if (opts.secure)   str += `; Secure`
  if (opts.sameSite) str += `; SameSite=${opts.sameSite}`
  return str
}

export function clearCookie(name: string, path = "/"): string {
  return `${name}=; Path=${path}; Max-Age=0; HttpOnly`
}

import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const PROTECTED = ["/perfil", "/nozze-plus"]

const accessSecret = new TextEncoder().encode(
  process.env.ACCESS_TOKEN_SECRET ?? "dev-secret-change-in-production"
)

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isProtected = PROTECTED.some(prefix => pathname.startsWith(prefix))
  if (!isProtected) return NextResponse.next()

  const token = req.cookies.get("accessToken")?.value

  if (token) {
    try {
      await jwtVerify(token, accessSecret)
      return NextResponse.next()
    } catch {
      // Token invalid or expired — fall through to redirect
    }
  }

  const loginUrl = new URL("/entrar", req.url)
  loginUrl.searchParams.set("next", pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/perfil/:path*", "/nozze-plus/:path*"],
}

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clearCookie } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const rawToken = req.cookies.get("refreshToken")?.value

  if (rawToken) {
    // Best-effort revoke — ignore errors if token already gone
    await db.refreshToken.updateMany({
      where: { token: rawToken, revokedAt: null },
      data: { revokedAt: new Date() },
    }).catch(() => null)
  }

  const res = NextResponse.json({ ok: true })
  res.headers.append("Set-Cookie", clearCookie("accessToken",  "/"))
  res.headers.append("Set-Cookie", clearCookie("refreshToken", "/api/auth"))

  return res
}

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clearCookie, verifyRefreshToken } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const rawToken = req.cookies.get("refreshToken")?.value

  if (rawToken) {
    // SECURITY: tokens are stored as bcrypt hashes, so we must scan unrevoked
    // candidates and compare — same approach as app/api/auth/refresh/route.ts
    const candidates = await db.refreshToken.findMany({
      where: { revokedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100,
    }).catch(() => [])

    for (const candidate of candidates) {
      if (await verifyRefreshToken(rawToken, candidate.token)) {
        await db.refreshToken.update({
          where: { id: candidate.id },
          data: { revokedAt: new Date() },
        }).catch(() => null)
        break
      }
    }
  }

  const res = NextResponse.json({ ok: true })
  res.headers.append("Set-Cookie", clearCookie("accessToken",  "/"))
  res.headers.append("Set-Cookie", clearCookie("refreshToken", "/api/auth"))

  return res
}

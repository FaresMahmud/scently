import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyAccessToken } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const token = req.cookies.get("accessToken")?.value
  if (!token) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  }

  const payload = verifyAccessToken(token)
  if (!payload) {
    return NextResponse.json({ error: "Token inválido ou expirado." }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, createdAt: true },
  })

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 401 })
  }

  return NextResponse.json({ user })
}

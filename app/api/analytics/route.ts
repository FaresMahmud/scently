import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser } from "@/lib/apiAuth"
import type { Prisma } from "@prisma/client"
import { z } from "zod"

const schema = z.object({
  tipo:      z.string().min(1).max(64),
  sessionId: z.string().min(1).max(128),
  dados:     z.record(z.string(), z.unknown()).optional(),
})

export async function POST(req: NextRequest) {
  let raw: unknown
  try { raw = await req.json() } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const parsed = schema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 })

  const { tipo, sessionId, dados } = parsed.data
  const user = getAuthUser(req)

  db.analyticsEvent.create({
    data: { tipo, sessionId, userId: user?.userId ?? null, dados: (dados ?? undefined) as Prisma.InputJsonValue | undefined },
  }).catch(() => null)

  return NextResponse.json({ ok: true })
}

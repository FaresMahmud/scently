import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") ?? req.headers.get("authorization")?.replace("Bearer ", "")

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  revalidatePath("/tendencias")

  return NextResponse.json({
    ok: true,
    revalidated: "/tendencias",
    timestamp: new Date().toISOString(),
  })
}

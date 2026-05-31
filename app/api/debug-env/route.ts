import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    cron_secret_exists: !!process.env.CRON_SECRET,
    cron_secret_length: process.env.CRON_SECRET?.length ?? 0,
    cron_secret_first3: process.env.CRON_SECRET?.substring(0, 3) ?? "undefined",
    node_env: process.env.NODE_ENV,
  })
}

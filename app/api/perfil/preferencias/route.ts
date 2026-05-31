import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser, unauthorized } from "@/lib/apiAuth"
import { perfilRateLimit } from "@/lib/rateLimit"
import { preferenciasSchema, zodError } from "@/lib/schemas"

type Intensity = "LEVE" | "MODERADO" | "INTENSO" | "QUALQUER"

function rl(userId: string) {
  const { allowed, retryAfter } = perfilRateLimit(userId)
  if (!allowed) {
    return NextResponse.json(
      { error: "Limite de requisições atingido." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    )
  }
  return null
}

export async function GET(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return unauthorized()
  const limited = rl(user.userId)
  if (limited) return limited

  const pref = await db.userPreference.findUnique({ where: { userId: user.userId } })

  return NextResponse.json({
    favoriteNotes:     pref?.favoriteNotes     ?? [],
    avoidNotes:        pref?.avoidNotes        ?? [],
    favoriteOccasions: pref?.favoriteOccasions ?? [],
    favoriteFamilies:  pref?.favoriteFamilies  ?? [],
    intensity:         pref?.intensity         ?? "QUALQUER",
    updatedAt:         pref?.updatedAt         ?? null,
  })
}

export async function PUT(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return unauthorized()
  const limited = rl(user.userId)
  if (limited) return limited

  let raw: unknown
  try { raw = await req.json() } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 })
  }

  const parsed = preferenciasSchema.safeParse(raw)
  if (!parsed.success) return zodError(parsed)

  const { favoriteNotes, avoidNotes, favoriteOccasions, favoriteFamilies, intensity } = parsed.data

  const pref = await db.userPreference.upsert({
    where:  { userId: user.userId },
    create: {
      userId:            user.userId,
      favoriteNotes:     favoriteNotes     ?? [],
      avoidNotes:        avoidNotes        ?? [],
      favoriteOccasions: favoriteOccasions ?? [],
      favoriteFamilies:  favoriteFamilies  ?? [],
      intensity:         (intensity as Intensity) ?? "QUALQUER",
    },
    update: {
      ...(favoriteNotes     !== undefined && { favoriteNotes }),
      ...(avoidNotes        !== undefined && { avoidNotes }),
      ...(favoriteOccasions !== undefined && { favoriteOccasions }),
      ...(favoriteFamilies  !== undefined && { favoriteFamilies }),
      ...(intensity         !== undefined && { intensity: intensity as Intensity }),
    },
  })

  return NextResponse.json({ pref })
}

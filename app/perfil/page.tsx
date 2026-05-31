import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { verifyAccessToken } from "@/lib/auth"
import { db } from "@/lib/db"
import PerfilClient from "@/components/perfil/PerfilClient"
import type { ItemAcervo } from "@/components/perfil/CartaoPerfumeAcervo"
import type { Preferencias } from "@/components/perfil/PreferenciasTab"

export const metadata: Metadata = {
  title: "Meu perfil — Nozze",
  description: "Seu acervo olfativo e preferências pessoais.",
}

export const dynamic = "force-dynamic"

export default async function PaginaPerfil() {
  const cookieStore = await cookies()
  const token = cookieStore.get("accessToken")?.value

  const payload = token ? verifyAccessToken(token) : null
  if (!payload) {
    redirect("/entrar?next=/perfil")
  }

  const [user, itemsRaw, prefRaw] = await Promise.all([
    db.user.findUnique({ where: { id: payload.sub }, select: { id: true, name: true, email: true } }),
    db.userPerfume.findMany({ where: { userId: payload.sub }, orderBy: { addedAt: "desc" } }),
    db.userPreference.findUnique({ where: { userId: payload.sub } }),
  ])

  if (!user) redirect("/entrar?next=/perfil")

  // Serialize Dates → strings for the client boundary
  const serialize = (items: typeof itemsRaw): ItemAcervo[] =>
    items.map(i => ({ ...i, addedAt: i.addedAt.toISOString() }))

  const acervo = {
    tenho:             serialize(itemsRaw.filter(i => i.status === "TENHO")),
    jaSentiGostei:     serialize(itemsRaw.filter(i => i.status === "JA_SENTI_GOSTEI")),
    queroExperimentar: serialize(itemsRaw.filter(i => i.status === "QUERO_EXPERIMENTAR")),
  }

  const preferencias: Preferencias = {
    favoriteNotes:     prefRaw?.favoriteNotes     ?? [],
    avoidNotes:        prefRaw?.avoidNotes        ?? [],
    favoriteOccasions: prefRaw?.favoriteOccasions ?? [],
    favoriteFamilies:  prefRaw?.favoriteFamilies  ?? [],
    intensity:         (prefRaw?.intensity as Preferencias["intensity"]) ?? "QUALQUER",
    updatedAt:         prefRaw?.updatedAt?.toISOString() ?? null,
  }

  return (
    <main style={{ backgroundColor: "var(--cor-base)", minHeight: "calc(100vh - 64px)" }}>
      <div className="container-site" style={{ paddingTop: "55px", paddingBottom: "89px" }}>
        <PerfilClient
          userName={user.name ?? user.email}
          acervo={acervo}
          preferencias={preferencias}
        />
      </div>
    </main>
  )
}

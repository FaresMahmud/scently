// ============================================
// ARQUIVO: app/marca/[slug]/page.tsx
// O QUE FAZ: exibe todos os perfumes de uma marca, enriquecidos com dados reais da Fragella
// QUANDO MANDAR PRA IA: quando quiser mudar o layout da página de marca
// DEPENDE DE: EbayPerfumeRepository, ContratipoRepository, mockData, fragella, catalogoFragella, lib/utils
// ============================================

import type { Metadata } from "next"
import Link from "next/link"
import { ebayRepository } from "@/lib/repositories/EbayPerfumeRepository"
import { contratipoRepository } from "@/lib/repositories/ContratipoRepository"
import { PERFUMES_MOCK } from "@/lib/mockData"
import { buscarPorMarca } from "@/lib/fragella"
import { buscarPorMarcaLocal, carregarCatalogo, marcasUnicas } from "@/lib/catalogoFragella"
import type { PerfumeFragella } from "@/lib/fragella"
import { slugify } from "@/lib/utils"
import CardPerfume from "@/components/perfume/CardPerfume"
import type { DadosCardPerfume } from "@/components/perfume/CardPerfume"

// ISR: revalida a cada 24h para pegar novos dados da Fragella
export const revalidate = 86400

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Resolve o nome original da marca a partir do slug, consultando todas as fontes */
function resolverNomeMarca(slug: string): string {
  for (const p of ebayRepository.findAll())       if (slugify(p.marca) === slug) return p.marca
  for (const p of contratipoRepository.findAll()) if (slugify(p.marca) === slug) return p.marca
  for (const p of PERFUMES_MOCK)                  if (slugify(p.marca) === slug) return p.marca
  for (const p of carregarCatalogo())             if (slugify(p.marca) === slug) return p.marca
  return ""
}

/** Coleta perfumes de eBay + contratipos + mock para uma marca */
function coletarPerfumesLocais(slug: string): DadosCardPerfume[] {
  const lista: DadosCardPerfume[] = []

  for (const p of ebayRepository.findAll()) {
    if (slugify(p.marca) === slug) {
      lista.push({
        id: `${ebayRepository.toSlug(p.titulo, p.marca)}-ebay`,
        nome: p.titulo,
        marca: p.marca,
        concentracao: p.tipo,
        familia: p.genero,
      })
    }
  }

  for (const p of contratipoRepository.findAll()) {
    if (slugify(p.marca) === slug) {
      lista.push({
        id: `${p.id}-ct`,
        nome: p.nome,
        marca: p.marca,
        concentracao: p.tipo,
        familia: p.genero,
        notas: p.notas,
      })
    }
  }

  for (const p of PERFUMES_MOCK) {
    if (slugify(p.marca) === slug) {
      lista.push({
        id: p.id,
        nome: p.nome,
        marca: p.marca,
        concentracao: p.concentracao ?? undefined,
        familia: p.familia ?? undefined,
        imagem: p.imagem ?? undefined,
      })
    }
  }

  return lista
}

/** Enriquece locais com dados Fragella e adiciona perfumes exclusivos da API */
function enriquecerComFragella(locais: DadosCardPerfume[], fragella: PerfumeFragella[]): DadosCardPerfume[] {
  const fragellaMap = new Map(fragella.map(p => [p.nome.toLowerCase(), p]))
  const nomesLocais = new Set(locais.map(p => p.nome.toLowerCase()))

  const enriquecidos = locais.map(local => {
    const f = fragellaMap.get(local.nome.toLowerCase())
    if (!f) return local
    return {
      ...local,
      imagem: f.imagemTransparente || f.imagem || local.imagem,
      notas:  f.notasTopo.length ? f.notasTopo : local.notas,
      familia: f.familia || local.familia,
      rating: f.rating,
    }
  })

  const extras: DadosCardPerfume[] = fragella
    .filter(f => !nomesLocais.has(f.nome.toLowerCase()))
    .map(f => ({
      id:           f.id,
      nome:         f.nome,
      marca:        f.marca,
      concentracao: f.concentracao,
      familia:      f.familia,
      imagem:       f.imagemTransparente || f.imagem,
      notas:        f.notasTopo,
      rating:       f.rating,
    }))

  return [...enriquecidos, ...extras]
}

// ── Static params ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  const slugs = new Set<string>()

  for (const p of ebayRepository.findAll())        slugs.add(slugify(p.marca))
  for (const p of contratipoRepository.findAll())  slugs.add(slugify(p.marca))
  for (const p of PERFUMES_MOCK)                   slugs.add(slugify(p.marca))
  for (const marca of marcasUnicas())              slugs.add(slugify(marca))

  return Array.from(slugs).map(slug => ({ slug }))
}

// ── Metadata ──────────────────────────────────────────────────────────────────

const BASE_URL = "https://nozze.app"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const nome = resolverNomeMarca(slug)
  if (!nome) return { title: "Marca não encontrada" }

  const locais    = coletarPerfumesLocais(slug)
  const fragLocal = buscarPorMarcaLocal(nome)
  const total     = Math.max(locais.length, fragLocal.length)
  const url       = `${BASE_URL}/marca/${slug}`
  const titulo    = `${nome} — Fragrâncias | Nozze`
  const descricao = `Explore ${total > 0 ? total + " " : ""}fragrâncias da ${nome} no Nozze. Notas, avaliações e consultoria personalizada.`

  return {
    title: titulo,
    description: descricao,
    keywords: `${nome}, perfumes ${nome}, fragrâncias ${nome}, comprar ${nome}`,
    alternates: { canonical: url },
    openGraph: {
      title:       `${nome} — Fragrâncias`,
      description: descricao,
      url,
      siteName:    "Nozze",
      locale:      "pt_BR",
      type:        "website",
    },
    twitter: {
      card:        "summary",
      title:       `${nome} — Fragrâncias`,
      description: descricao,
    },
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PaginaMarca({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const nomeMarca = resolverNomeMarca(slug)

  if (!nomeMarca) {
    return (
      <main className="container-site" style={{ paddingTop: "5rem", paddingBottom: "5rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--cor-texto-suave)", marginBottom: "1rem" }}>
          404
        </p>
        <h1 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, marginBottom: "1rem" }}>
          Marca não encontrada
        </h1>
        <p style={{ marginBottom: "34px" }}>Nenhuma fragrância encontrada para esta marca.</p>
        <Link href="/catalogo" style={{ color: "var(--cor-destaque)", fontFamily: "var(--fonte-corpo)", fontSize: "0.875rem" }}>
          ← Explorar catálogo
        </Link>
      </main>
    )
  }

  const locais = coletarPerfumesLocais(slug)

  // 1. Busca no catálogo local Fragella — zero requests de API
  const fragLocal = buscarPorMarcaLocal(nomeMarca)

  // 2. Enriquece locais com dados do catálogo local
  let perfumes = enriquecerComFragella(locais, fragLocal)

  // 3. Fallback para API apenas em runtime, quando não há dados locais suficientes
  const isBuild     = process.env.NEXT_PHASE === "phase-production-build"
  const semDadosLocais = fragLocal.length === 0 && locais.length < 3

  if (!isBuild && process.env.FRAGELLA_API_KEY && semDadosLocais) {
    const fragApi = await buscarPorMarca(nomeMarca, 50).catch(() => [])
    if (fragApi.length > 0) {
      perfumes = enriquecerComFragella(locais, fragApi)
    }
  }

  return (
    <main>
      <div className="container-site" style={{ paddingTop: "4rem", paddingBottom: "5rem" }}>

        {/* Header da marca */}
        <section style={{ marginBottom: "3rem" }}>
          <p style={{ fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--cor-texto-suave)", marginBottom: "0.75rem" }}>
            marca
          </p>
          <h1 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "clamp(2.5rem, 6vw, 4rem)", lineHeight: 1 }}>
            {nomeMarca}
          </h1>
          <div className="separador" />
          <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.9rem", color: "var(--cor-texto-suave)" }}>
            {perfumes.length.toLocaleString("pt-BR")}{" "}
            {perfumes.length === 1 ? "fragrância" : "fragrâncias"} no catálogo
          </p>
        </section>

        {/* Grid de perfumes */}
        <section>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1.25rem" }}>
            {perfumes.map(p => (
              <CardPerfume key={p.id} perfume={p} />
            ))}
          </div>
        </section>

      </div>
    </main>
  )
}

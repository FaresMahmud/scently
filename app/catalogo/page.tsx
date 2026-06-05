// ============================================
// ARQUIVO: app/catalogo/page.tsx
// O QUE FAZ: catálogo completo — Fragella (7.9k) + eBay + contratipos, filtros em pill multi-select
// QUANDO MANDAR PRA IA: quando quiser mudar layout, filtros ou fonte dos dados
// DEPENDE DE: lib/catalogoFragella, lib/repositories/*, components/catalogo/CatalogClient
// ============================================

import type { Metadata } from "next"
import { Suspense } from "react"
import CatalogClient from "@/components/catalogo/CatalogClient"
import type { CardUnificado } from "@/components/catalogo/CatalogClient"
import { carregarCatalogo, totalPerfumes } from "@/lib/catalogoFragella"
import { ebayRepository } from "@/lib/repositories/EbayPerfumeRepository"
import { contratipoRepository } from "@/lib/repositories/ContratipoRepository"
import { slugify } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Catálogo — Nozze",
  description: "Explore milhares de fragrâncias — perfumes internacionais, nacionais e contratipos.",
}

// Força SSR em cada request enquanto debugamos imagens — voltar para 3600 depois
export const revalidate = 0

// ── Mapeamento de gênero ──────────────────────────────────────────────────────

type GeneroNorm = "Masculino" | "Feminino" | "Unissex"

function normalizarGenero(g: string | undefined): GeneroNorm | undefined {
  if (!g) return undefined
  const lower = g.toLowerCase()
  if (lower === "men"      || lower === "masculino") return "Masculino"
  if (lower === "women"    || lower === "feminino")  return "Feminino"
  if (lower === "unisex"   || lower === "unissex")   return "Unissex"
  return undefined
}

// ── Conversores para CardUnificado ────────────────────────────────────────────

function ebayParaCard(p: ReturnType<typeof ebayRepository.findAll>[number]): CardUnificado {
  return {
    id:          `${ebayRepository.toSlug(p.titulo, p.marca)}-ebay`,
    nome:        p.titulo,
    marca:       p.marca,
    concentracao:p.tipo,
    familia:     p.genero,
    preco_brl:   p.preco_brl,
    vendidos:    p.vendidos,
    generoNorm:  normalizarGenero(p.genero),
    fonte:       "ebay",
  }
}

function contratipoParaCard(p: ReturnType<typeof contratipoRepository.findAll>[number]): CardUnificado {
  return {
    id:            p.id,
    nome:          p.nome,
    marca:         p.marca,
    concentracao:  p.tipo,
    familia:       p.genero,
    notas:         p.notas,
    preco_brl:     p.preco_brl,
    vendidos:      0,
    inspiracaoInfo:`inspirado em ${p.inspiradoEm} da ${p.marcaOriginal}`,
    categoria:     p.categoria,
    generoNorm:    normalizarGenero(p.genero),
    fonte:         "contratipo",
  }
}

function fragellaParaCard(p: ReturnType<typeof carregarCatalogo>[number]): CardUnificado {
  return {
    id:           p.id,
    nome:         p.nome,
    marca:        p.marca,
    concentracao: p.concentracao || undefined,
    familia:      p.familia || undefined,
    // Full fallback chain passed to card — card will try each on error
    imagemTransparente: p.imagemTransparente || undefined,
    imagem:             p.imagem || undefined,
    imagemFallbacks:    p.imagemFallbacks?.length ? p.imagemFallbacks : undefined,
    rating:       p.rating ?? undefined,
    generoNorm:   normalizarGenero(p.genero),
    fonte:        "fragella",
    acordes:      p.acordesPrincipais?.length ? p.acordesPrincipais : undefined,
  }
}

// ── Merge + deduplicação ──────────────────────────────────────────────────────

function chave(nome: string, marca: string): string {
  return `${nome.toLowerCase().trim()}|${marca.toLowerCase().trim()}`
}

/** Compares two perfume names for similarity, optionally stripping each brand from its name. */
function nomesSimilares(a: string, b: string, marcaA?: string, marcaB?: string): boolean {
  let sa = slugify(a)
  let sb = slugify(b)

  // Strip brand slug from name slug when brand appears in the name
  // (e.g. "sauvage-dior" → "sauvage" when marca is "dior")
  if (marcaA) { const sm = slugify(marcaA); sa = sa.replace(sm, "").replace(/^-+|-+$/g, "").trim() }
  if (marcaB) { const sm = slugify(marcaB); sb = sb.replace(sm, "").replace(/^-+|-+$/g, "").trim() }

  if (!sa || !sb) return false
  if (sa === sb) return true
  if (sa.includes(sb) || sb.includes(sa)) return true

  // Word-overlap: ≥70% of meaningful words (length > 2) must match
  const wa = sa.split("-").filter(w => w.length > 2)
  const wb = sb.split("-").filter(w => w.length > 2)
  if (wa.length === 0 || wb.length === 0) return false
  const overlap = wa.filter(w => wb.includes(w)).length
  return overlap / Math.max(wa.length, wb.length) >= 0.5
}

function mesclarPerfumes(): CardUnificado[] {
  const mapa = new Map<string, CardUnificado>()

  // 1. eBay — base (tem dados de preço e vendas)
  for (const p of ebayRepository.findAll()) {
    const card = ebayParaCard(p)
    mapa.set(chave(p.titulo, p.marca), card)
  }

  // 2. Contratipos — adicionam entradas novas
  for (const p of contratipoRepository.findAll()) {
    const k = chave(p.nome, p.marca)
    if (!mapa.has(k)) mapa.set(k, contratipoParaCard(p))
  }

  // 3. Fragella — enriquece existentes (imagens + rating) e adiciona novos
  const fragellaList = carregarCatalogo()
  for (const p of fragellaList) {
    const k = chave(p.nome, p.marca)
    const existente = mapa.get(k)
    if (existente) {
      // Enriquece com cadeia completa de imagens se não existia
      if (!existente.imagemTransparente && p.imagemTransparente) {
        existente.imagemTransparente = p.imagemTransparente
      }
      if (!existente.imagem && p.imagem) {
        existente.imagem = p.imagem
      }
      if (!existente.imagemFallbacks && p.imagemFallbacks?.length) {
        existente.imagemFallbacks = p.imagemFallbacks
      }
      if (!existente.rating && p.rating) {
        existente.rating = p.rating
      }
    } else {
      mapa.set(k, fragellaParaCard(p))
    }
  }

  // 4. Fuzzy image lookup — cards still without images try name-similarity match
  for (const card of mapa.values()) {
    if (card.imagemTransparente || card.imagem) continue

    // Brand-only listing: titulo equals the brand name (e.g. "COACH | Coach")
    // Use the most popular (first) perfume from that brand in Fragella
    const nomeNorm  = card.nome.toLowerCase().trim()
    const marcaNorm = (card.marca ?? "").toLowerCase().trim()
    if (nomeNorm === marcaNorm || slugify(nomeNorm) === slugify(marcaNorm)) {
      const brandMatch = fragellaList.find(f =>
        slugify(f.marca) === slugify(card.marca ?? "")
      )
      if (brandMatch) {
        if (brandMatch.imagemTransparente) card.imagemTransparente = brandMatch.imagemTransparente
        if (brandMatch.imagem)             card.imagem             = brandMatch.imagem
        if (brandMatch.imagemFallbacks?.length) card.imagemFallbacks = brandMatch.imagemFallbacks
      }
      continue // skip further fuzzy matching for this card
    }

    const fuzzy = fragellaList.find(f =>
      nomesSimilares(card.nome, f.nome, card.marca, f.marca)
    )
    if (fuzzy) {
      if (fuzzy.imagemTransparente) card.imagemTransparente = fuzzy.imagemTransparente
      if (fuzzy.imagem)             card.imagem             = fuzzy.imagem
      if (fuzzy.imagemFallbacks?.length) card.imagemFallbacks = fuzzy.imagemFallbacks
    }
  }

  return Array.from(mapa.values())
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PaginaCatalogo() {
  const perfumes = mesclarPerfumes()
  const totalFrag = totalPerfumes()

  return (
    <main>
      <div className="container-site" style={{ paddingTop: "55px", paddingBottom: "89px" }}>

        {/* Título */}
        <div style={{ marginBottom: "34px" }}>
          <p style={{ fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--cor-texto-suave)", marginBottom: "0.75rem" }}>
            fragrâncias
          </p>
          <h1 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "clamp(42px, 6vw, 68px)", lineHeight: 1 }}>
            catálogo
          </h1>
          <div className="separador" />
          <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.9rem", color: "var(--cor-texto-suave)" }}>
            {perfumes.length.toLocaleString("pt-BR")} fragrâncias de{" "}
            {totalFrag.toLocaleString("pt-BR")} do catálogo Fragella
          </p>
        </div>

        <Suspense fallback={
          <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.85rem", color: "var(--cor-texto-suave)", padding: "4rem 0" }}>
            Carregando catálogo…
          </p>
        }>
          <CatalogClient perfumes={perfumes} totalFragella={totalFrag} />
        </Suspense>

      </div>
    </main>
  )
}

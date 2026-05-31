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

// Revalida a cada hora (dados do catálogo raramente mudam)
export const revalidate = 3600

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
    imagem:       p.imagemTransparente || p.imagem || undefined,
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

  // 3. Fragella — enriquece existentes (imagem + rating) e adiciona novos
  for (const p of carregarCatalogo()) {
    const k = chave(p.nome, p.marca)
    const existente = mapa.get(k)
    if (existente) {
      // Enriquece com imagem e rating se não existiam
      if (!existente.imagem && (p.imagemTransparente || p.imagem)) {
        existente.imagem = p.imagemTransparente || p.imagem
      }
      if (!existente.rating && p.rating) {
        existente.rating = p.rating
      }
    } else {
      mapa.set(k, fragellaParaCard(p))
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

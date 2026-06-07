// ============================================
// ARQUIVO: app/catalogo/page.tsx
// O QUE FAZ: catálogo completo — contratipos + expandido + Fragella (11k importados)
// QUANDO MANDAR PRA IA: quando quiser mudar layout, filtros ou fonte dos dados
// DEPENDE DE: data/contratipos.json, data/perfumes-expandido.json,
//             lib/catalogoFragella (data/catalogo-fragella.json)
// ============================================

import type { Metadata } from "next"
import { Suspense } from "react"
import CatalogClient from "@/components/catalogo/CatalogClient"
import type { CardUnificado } from "@/components/catalogo/CatalogClient"
import contratiposData from "@/data/contratipos.json"
import expandidoData from "@/data/perfumes-expandido.json"
import { carregarCatalogo } from "@/lib/catalogoFragella"
import type { PerfumeFragella } from "@/lib/fragella"

export const metadata: Metadata = {
  title: "Catálogo — Nozze",
  description: "Explore fragrâncias — contratipos, nacionais, árabes e 11 mil importados.",
}

export const revalidate = 86400

// ── Tipos locais ──────────────────────────────────────────────────────────────

type GeneroNorm = "Masculino" | "Feminino" | "Unissex"

interface ContratipoEntry {
  id: string; nome: string; marca: string; tipo: string; genero: string
  familia: string; notas: string[]; preco_brl: number
  inspiradoEm: string; marcaOriginal: string; categoria: string
}

interface ExpandidoEntry {
  id: string; nome: string; marca: string; tipo: string; genero: string
  familia: string; notas: string[]; preco_brl: number
  categoria: string; inspiradoEm?: string; marcaOriginal?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Normaliza gênero independente de idioma (PT ou EN, Fragella usa EN) */
function normalizarGenero(g: string | undefined): GeneroNorm | undefined {
  if (!g) return undefined
  const lower = g.toLowerCase()
  if (lower === "masculino" || lower === "men"   || lower === "male")   return "Masculino"
  if (lower === "feminino"  || lower === "women" || lower === "female") return "Feminino"
  if (lower === "unissex"   || lower === "unisex")                      return "Unissex"
  return undefined
}

function contratipoParaCard(p: ContratipoEntry): CardUnificado {
  return {
    id:             p.id,
    nome:           p.nome,
    marca:          p.marca,
    concentracao:   p.tipo,
    familia:        p.familia,
    notas:          p.notas,
    preco_brl:      p.preco_brl,
    inspiracaoInfo: `inspirado em ${p.inspiradoEm} da ${p.marcaOriginal}`,
    categoria:      p.categoria,
    generoNorm:     normalizarGenero(p.genero),
    fonte:          "contratipo",
  }
}

function expandidoParaCard(p: ExpandidoEntry): CardUnificado {
  const inspiracaoInfo = p.inspiradoEm
    ? `inspirado em ${p.inspiradoEm}${p.marcaOriginal ? ` da ${p.marcaOriginal}` : ""}`
    : undefined
  return {
    id:             p.id,
    nome:           p.nome,
    marca:          p.marca,
    concentracao:   p.tipo,
    familia:        p.familia,
    notas:          p.notas,
    preco_brl:      p.preco_brl,
    inspiracaoInfo,
    categoria:      p.categoria,
    generoNorm:     normalizarGenero(p.genero),
    fonte:          "expandido",
  }
}

function fragellaParaCard(p: PerfumeFragella): CardUnificado {
  return {
    id:                 p.id,
    nome:               p.nome,
    marca:              p.marca,
    concentracao:       p.concentracao || undefined,
    familia:            p.familia || undefined,
    imagemTransparente: p.imagemTransparente || undefined,
    imagem:             p.imagem || undefined,
    imagemFallbacks:    p.imagemFallbacks?.length ? p.imagemFallbacks : undefined,
    rating:             p.rating ?? undefined,
    categoria:          "importado-designer",
    generoNorm:         normalizarGenero(p.genero),
    fonte:              "fragella",
    acordes:            p.acordesPrincipais?.length ? p.acordesPrincipais : undefined,
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PaginaCatalogo() {
  const contratipos = (contratiposData as ContratipoEntry[]).map(contratipoParaCard)
  const expandido   = (expandidoData as ExpandidoEntry[]).map(expandidoParaCard)
  const fragella    = carregarCatalogo().map(fragellaParaCard)
  const perfumes    = [...contratipos, ...expandido, ...fragella]

  return (
    <main>
      <div className="container-site" style={{ paddingTop: "55px", paddingBottom: "89px" }}>

        {/* Título */}
        <div style={{ marginBottom: "34px" }}>
          <p style={{
            fontSize: "0.72rem", letterSpacing: "0.15em",
            textTransform: "uppercase", color: "var(--cor-texto-suave)", marginBottom: "0.75rem",
          }}>
            fragrâncias
          </p>
          <h1 style={{
            fontFamily: "var(--fonte-titulo)", fontWeight: 300,
            fontSize: "clamp(42px, 6vw, 68px)", lineHeight: 1,
          }}>
            catálogo
          </h1>
          <div className="separador" />
          <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.9rem", color: "var(--cor-texto-suave)" }}>
            {perfumes.length.toLocaleString("pt-BR")} fragrâncias — contratipos, nacionais, árabes e importados
          </p>
        </div>

        <Suspense fallback={
          <p style={{
            fontFamily: "var(--fonte-corpo)", fontSize: "0.85rem",
            color: "var(--cor-texto-suave)", padding: "4rem 0",
          }}>
            Carregando catálogo…
          </p>
        }>
          <CatalogClient perfumes={perfumes} />
        </Suspense>

      </div>
    </main>
  )
}

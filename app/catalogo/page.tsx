// ============================================
// ARQUIVO: app/catalogo/page.tsx
// O QUE FAZ: catálogo completo — contratipos.json + perfumes-expandido.json
// QUANDO MANDAR PRA IA: quando quiser mudar layout, filtros ou fonte dos dados
// DEPENDE DE: data/contratipos.json, data/perfumes-expandido.json, components/catalogo/CatalogClient
// ============================================

import type { Metadata } from "next"
import { Suspense } from "react"
import CatalogClient from "@/components/catalogo/CatalogClient"
import type { CardUnificado } from "@/components/catalogo/CatalogClient"
import contratiposData from "@/data/contratipos.json"
import expandidoData from "@/data/perfumes-expandido.json"

export const metadata: Metadata = {
  title: "Catálogo — Nozze",
  description: "Explore fragrâncias — contratipos, nacionais, árabes e importados.",
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

function normalizarGenero(g: string | undefined): GeneroNorm | undefined {
  if (!g) return undefined
  const lower = g.toLowerCase()
  if (lower === "masculino") return "Masculino"
  if (lower === "feminino")  return "Feminino"
  if (lower === "unissex")   return "Unissex"
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PaginaCatalogo() {
  const contratipos = (contratiposData as ContratipoEntry[]).map(contratipoParaCard)
  const expandido   = (expandidoData as ExpandidoEntry[]).map(expandidoParaCard)
  const perfumes    = [...contratipos, ...expandido]

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

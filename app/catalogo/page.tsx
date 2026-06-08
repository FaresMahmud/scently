// ============================================
// ARQUIVO: app/catalogo/page.tsx
// O QUE FAZ: catálogo completo — contratipos + expandido + Fragella (11k importados)
// QUANDO MANDAR PRA IA: quando quiser mudar layout, filtros ou fonte dos dados
// DEPENDE DE: data/contratipos.json, data/perfumes-expandido.json,
//             lib/catalogoFragella (data/catalogo-fragella.json)
// ============================================

import type { Metadata } from "next"
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

// Payload otimizado para o catálogo — sem imagem jpg (só webp), sem fallbacks,
// sem acordes, sem notas. Reduz ~3MB do RSC payload (7.6 → ~2MB).
// acordes e imagem completos só existem na página de detalhe (/perfume/[id]).
function fragellaParaCard(p: PerfumeFragella): CardUnificado {
  return {
    id:                 p.id,
    nome:               p.nome,
    marca:              p.marca,
    concentracao:       p.concentracao || undefined,
    familia:            p.familia || undefined,
    // Só webp (CDN Fragella confirma 200 OK). Fallbacks fragrancenet retornam 403.
    imagemTransparente: p.imagemTransparente || undefined,
    // DROPPED: imagem (jpg duplicata), imagemFallbacks (403), acordes
    rating:             p.rating ?? undefined,
    categoria:          "importado-designer",
    generoNorm:         normalizarGenero(p.genero),
    fonte:              "fragella",
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

// Palavras-chave que indicam produtos não-perfume (fora da função para reutilizar)
const NAO_PERFUME = /desodorante|body\s?splash|col[oô]nia corporal|hidratante|splash/i

export default function PaginaCatalogo() {
  // ── FIX: filtrar não-perfumes em TODAS as fontes ──────────────────────────
  const contratipos = (contratiposData as ContratipoEntry[]).map(contratipoParaCard)

  const expandido = (expandidoData as ExpandidoEntry[])
    .filter(p => !NAO_PERFUME.test(p.tipo ?? "") && !NAO_PERFUME.test(p.nome))
    .map(expandidoParaCard)

  // Todos os 11k perfumes com campos lean (~3.3MB RSC) — sem limite de corte.
  // O limite de 5k por popularidade foi removido porque a ordenação da Fragella
  // não reflete popularidade real (Dior/Chanel ficavam abaixo de marcas obscuras).
  const fragella = carregarCatalogo()
    .filter(p => !NAO_PERFUME.test(p.concentracao ?? "") && !NAO_PERFUME.test(p.nome))
    .map(fragellaParaCard)

  // ── FIX: deduplicar importado-designer do expandido quando Fragella tem o mesmo nome ──
  // Usa só o nome normalizado (sem marca) porque expandido usa "Dior" e Fragella usa
  // "Christian Dior" — chave nome+marca não bate. Só remove se categoria for importado.
  function normNome(s: string): string {
    return s.toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  }

  const fragellaNames = new Set(fragella.map(p => normNome(p.nome)))

  const expandidoDedup = expandido.filter(p => {
    // Remove todos os importado-designer do expandido — Fragella cobre essa categoria
    // com 11k entradas com imagem. Os 93 importados do expandido não têm imagem e
    // ficam no início do bucket, empurrando as entradas Fragella para fora dos 48 visíveis.
    if (p.categoria === "importado-designer") return false
    return true
  })

  const perfumes = [...contratipos, ...expandidoDedup, ...fragella]

  console.log("[Catalog] Sources:", {
    contratipos:     contratipos.length,
    expandido:       expandido.length,
    expandidoDedup:  expandidoDedup.length,
    fragella:        fragella.length,
    total:           perfumes.length,
  })

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

        <CatalogClient perfumes={perfumes} />

      </div>
    </main>
  )
}

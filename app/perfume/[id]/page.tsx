// ARQUIVO: app/perfume/[id]/page.tsx
// O QUE FAZ: página individual de perfume
//   Fontes: contratipos.json → expandido.json → catalogo-fragella.json (11k)
// QUANDO MANDAR PRA IA: quando quiser mudar o layout da página de perfume
// DEPENDE DE: data/*.json, lib/catalogoFragella, components/perfume/
// TODO ROADMAP:
//   - Fase 1.1: Criar Skeleton Shimmer Loader dourado para o carregamento assíncrono do detalhe do perfume.
//   - Fase 3.1: Exibir carrossel de "Encontre Similares" cruzando com contratipos/nacionais que inspiram esta fragrância.
//   - Fase 3.3: Criar componente visual interativo da Pirâmide Olfativa (Topo, Coração e Fundo).
// ============================================

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import OndeComprar from "@/components/perfume/OndeComprar"
import type { PerfumeFragella, NotaFragella } from "@/lib/fragella"
import contratiposData from "@/data/contratipos.json"
import expandidoData from "@/data/perfumes-expandido.json"
import { carregarCatalogo } from "@/lib/catalogoFragella"
import { NotasPerfume } from "@/components/perfume/NotasPerfume"
import ImagemPerfume from "@/components/perfume/ImagemPerfume"
import AcordesPerfume from "@/components/perfume/AcordesPerfume"
import { RankingPerfume } from "@/components/perfume/RankingPerfume"
import MetricaCard from "@/components/perfume/MetricaCard"
import TagInfo from "@/components/perfume/TagInfo"
import { slugify, traduzir } from "@/lib/utils"
import { limparNomePerfume } from "@/lib/limparNomePerfume"
import { gerarRankingEstacao, gerarRankingOcasiao } from "@/lib/gerarRanking"
import type { Acorde } from "@/lib/types"
import { getEditorialContent } from "@/lib/perfumeEditorial"
import PerfumeViewTracker from "@/components/perfume/PerfumeViewTracker"
import { safeJsonLd } from "@/lib/jsonld"
import CardPerfume from "@/components/perfume/CardPerfume"
import type { CardUnificado } from "@/components/catalogo/CatalogClient"

export const dynamicParams = true
export const revalidate = 86400

// ── Tipos ─────────────────────────────────────────────────────────────────────

type FontePerfume = "contratipo" | "expandido" | "fragella"

interface ContratipoEntry {
  id: string; nome: string; marca: string; tipo: string; genero: string
  familia: string; notas: string[]; preco_brl: number
  inspiradoEm: string; marcaOriginal: string; categoria: string
  imagemTransparente?: string; imagem?: string; imagemFallbacks?: string[]
}

interface ExpandidoEntry {
  id: string; nome: string; marca: string; tipo: string; genero: string
  familia: string; notas: string[] | { topo?: string[]; coracao?: string[]; fundo?: string[] }; preco_brl: number
  categoria: string; inspiradoEm?: string; marcaOriginal?: string
  linkCompra?: string
}

/** Campos extras além de PerfumeFragella — específicos de cada fonte */
interface PerfumeExtra {
  categoria?:     string
  inspiradoEm?:   string
  marcaOriginal?: string
  preco_brl?:     number
  linkCompra?:    string
}

interface ResolverResult {
  perfume: PerfumeFragella
  fonte:   FontePerfume
  extra:   PerfumeExtra
}

const CATEGORIA_LABELS: Record<string, string> = {
  "contratipo":         "CONTRATIPO",
  "nacional":           "NACIONAL",
  "arabe":              "ÁRABE",
  "importado-designer": "IMPORTADO",
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DESCRITOR_PARA_PCT: Record<string, number> = {
  Dominant: 92, Prominent: 76, Moderate: 58, Subtle: 38, Trace: 22,
}

function acordesFragellaParaAcorde(pct: Record<string, string> | undefined): Acorde[] {
  if (!pct) return []
  return Object.entries(pct)
    .map(([nome, desc]) => ({ nome: traduzir(nome), porcentagem: DESCRITOR_PARA_PCT[desc] ?? 50 }))
    .sort((a, b) => b.porcentagem - a.porcentagem)
    .slice(0, 6)
}

function resolverNotas(
  completas: NotaFragella[] | undefined,
  simples: string[] | undefined
): { name: string; imageUrl?: string }[] {
  if (completas?.length) return completas
  return (simples ?? []).map(name => ({ name }))
}

/** Constrói PerfumeFragella mínimo a partir de dados locais */
function perfumeMinimo(
  nome: string, marca: string, concentracao: string,
  genero: string, familia: string, notas: string[]
): PerfumeFragella {
  return {
    id: `${slugify(nome)}-${slugify(marca)}`,
    nome, marca, concentracao, genero, ano: 0,
    familia, descricao: "", imagem: "",
    notasTopo: notas.slice(0, 3),
    notasCoracao: notas.slice(3, 6),
    notasFundo: notas.slice(6),
  }
}

function normalizeId(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[\s_]+/g, "-")
}

// ── Fragella local lookup ─────────────────────────────────────────────────────
// Usado para enriquecer contratipos/expandido com imagem e notas do catálogo local.
// Busca o perfume de referência (original ou próprio) no catalogo-fragella.json.

let _fgCache: PerfumeFragella[] | null = null

function fragellaCached(): PerfumeFragella[] {
  if (!_fgCache) _fgCache = carregarCatalogo()
  return _fgCache
}

/**
 * Busca o perfume mais próximo no catálogo Fragella por nome + marca opcional.
 * Strips parentheticals: "Aventus (fórmula 2010)" → "aventus"
 * Returns the best match with at least some image data, or null.
 */
function buscarEmFragellaLocal(nomeBusca: string, marcaBusca?: string): PerfumeFragella | null {
  const fgList = fragellaCached()
  // Strip parentheticals and normalize
  const q = normalizeId(nomeBusca.replace(/\s*\(.*?\)/g, "").trim())
  const m = marcaBusca ? normalizeId(marcaBusca) : null

  // Pass 1: exact or prefix name match + brand match (most precise)
  if (m) {
    const hit = fgList.find(p => {
      const pn = normalizeId(p.nome)
      const pm = normalizeId(p.marca)
      const brandOk = pm === m || pm.includes(m) || m.includes(pm)
      if (!brandOk) return false
      return pn === q || pn.startsWith(q) || q.startsWith(pn)
    })
    if (hit) return hit
  }

  // Pass 2: name-only exact or prefix match
  const hit2 = fgList.find(p => {
    const pn = normalizeId(p.nome)
    return pn === q || pn.startsWith(q + "-") || q.startsWith(pn + "-")
  })
  if (hit2) return hit2

  // Pass 3: name substring (with brand filter if provided)
  return fgList.find(p => {
    const pn = normalizeId(p.nome)
    if (!pn.includes(q) && !q.includes(pn)) return false
    if (m) {
      const pm = normalizeId(p.marca)
      return pm.includes(m) || m.includes(pm)
    }
    return true
  }) ?? null
}

/** Enriquece um PerfumeFragella mínimo com imagem e notas do catálogo local */
function enriquecerComFragella(
  perfume: PerfumeFragella,
  nomeBusca: string,
  marcaBusca?: string,
  notasLocais: string[] = []
): void {
  const ref = buscarEmFragellaLocal(nomeBusca, marcaBusca)
  if (!ref) return

  // Imagem: sempre usa a referência (contratipo não tem imagem própria)
  if (ref.imagemTransparente) perfume.imagemTransparente = ref.imagemTransparente
  if (ref.imagem)             perfume.imagem             = ref.imagem
  if (ref.imagemFallbacks?.length) perfume.imagemFallbacks = ref.imagemFallbacks

  // Notas: só usa Fragella se as locais são muito esparsas (< 2 notas)
  if (notasLocais.length < 2 && ref.notasCompletas) {
    perfume.notasTopo    = ref.notasTopo    ?? []
    perfume.notasCoracao = ref.notasCoracao ?? []
    perfume.notasFundo   = ref.notasFundo   ?? []
    perfume.notasCompletas = ref.notasCompletas
  } else if (notasLocais.length < 2) {
    perfume.notasTopo    = ref.notasTopo    ?? []
    perfume.notasCoracao = ref.notasCoracao ?? []
    perfume.notasFundo   = ref.notasFundo   ?? []
  }
}

// ── Resolver ──────────────────────────────────────────────────────────────────

async function resolverPerfume(id: string): Promise<ResolverResult | null> {
  // Safety net: strip legacy suffixes
  const cleanId = id.replace(/-(ebay|ct|fragella-src|contratipo-src)$/, "")
  if (cleanId !== id) console.log("[Perfume] Stripped suffix:", id, "→", cleanId)
  id = cleanId

  // Step 1: exact match in contratipos.json
  const ct = (contratiposData as ContratipoEntry[]).find(p => p.id === id)
  if (ct) {
    const perfume = perfumeMinimo(ct.nome, ct.marca, ct.tipo, ct.genero, ct.familia, ct.notas)
    // Enrich: image from original perfume + notes if sparse
    enriquecerComFragella(perfume, ct.inspiradoEm, ct.marcaOriginal, ct.notas)
    return {
      perfume,
      fonte: "contratipo",
      extra: {
        categoria:     ct.categoria ?? "contratipo",
        inspiradoEm:   ct.inspiradoEm,
        marcaOriginal: ct.marcaOriginal,
        preco_brl:     ct.preco_brl,
      },
    }
  }

  // Step 2: exact match in perfumes-expandido.json
  const ex = (expandidoData as ExpandidoEntry[]).find(p => p.id === id)
  if (ex) {
    const notasEx: string[] = Array.isArray(ex.notas)
      ? ex.notas
      : [...(ex.notas.topo ?? []), ...(ex.notas.coracao ?? []), ...(ex.notas.fundo ?? [])]
    const perfume = perfumeMinimo(ex.nome, ex.marca, ex.tipo, ex.genero, ex.familia, notasEx)
    // Enrich: use original if has inspiradoEm, else search by own name+brand
    const nomeBusca  = ex.inspiradoEm ?? ex.nome
    const marcaBusca = ex.inspiradoEm ? ex.marcaOriginal : ex.marca
    enriquecerComFragella(perfume, nomeBusca, marcaBusca, notasEx)
    return {
      perfume,
      fonte: "expandido",
      extra: {
        categoria:     ex.categoria,
        inspiradoEm:   ex.inspiradoEm,
        marcaOriginal: ex.marcaOriginal,
        preco_brl:     ex.preco_brl,
        linkCompra:    ex.linkCompra,
      },
    }
  }

  // Step 3: exact match in catalogo-fragella.json (11k perfumes)
  const fgList = fragellaCached()
  const fg = fgList.find(p => p.id === id)
  if (fg) {
    return {
      perfume: fg,
      fonte: "fragella",
      extra: { categoria: "importado-designer" },
    }
  }

  // Step 4: normalized includes fallback (contratipos + expandido)
  const normId = normalizeId(id)

  const ctLoose = (contratiposData as ContratipoEntry[]).find(p => {
    const n = normalizeId(p.id)
    if (Math.abs(n.length - normId.length) >= 20) return false
    return n.includes(normId) || normId.includes(n)
  })
  if (ctLoose) {
    console.log("[Perfume] Normalized match (ct):", ctLoose.id, "→", id)
    const perfume = perfumeMinimo(ctLoose.nome, ctLoose.marca, ctLoose.tipo, ctLoose.genero, ctLoose.familia, ctLoose.notas)
    enriquecerComFragella(perfume, ctLoose.inspiradoEm, ctLoose.marcaOriginal, ctLoose.notas)
    return {
      perfume,
      fonte: "contratipo",
      extra: {
        categoria:     ctLoose.categoria ?? "contratipo",
        inspiradoEm:   ctLoose.inspiradoEm,
        marcaOriginal: ctLoose.marcaOriginal,
        preco_brl:     ctLoose.preco_brl,
      },
    }
  }

  const exLoose = (expandidoData as ExpandidoEntry[]).find(p => {
    const n = normalizeId(p.id)
    if (Math.abs(n.length - normId.length) >= 20) return false
    return n.includes(normId) || normId.includes(n)
  })
  if (exLoose) {
    console.log("[Perfume] Normalized match (ex):", exLoose.id, "→", id)
    const notasExLoose: string[] = Array.isArray(exLoose.notas)
      ? exLoose.notas
      : [...(exLoose.notas.topo ?? []), ...(exLoose.notas.coracao ?? []), ...(exLoose.notas.fundo ?? [])]
    const perfume = perfumeMinimo(exLoose.nome, exLoose.marca, exLoose.tipo, exLoose.genero, exLoose.familia, notasExLoose)
    const nomeBusca  = exLoose.inspiradoEm ?? exLoose.nome
    const marcaBusca = exLoose.inspiradoEm ? exLoose.marcaOriginal : exLoose.marca
    enriquecerComFragella(perfume, nomeBusca, marcaBusca, notasExLoose)
    return {
      perfume,
      fonte: "expandido",
      extra: {
        categoria:     exLoose.categoria,
        inspiradoEm:   exLoose.inspiradoEm,
        marcaOriginal: exLoose.marcaOriginal,
        preco_brl:     exLoose.preco_brl,
        linkCompra:    exLoose.linkCompra,
      },
    }
  }

  console.log("[Perfume] Not found:", id)
  return null
}

function cleanNameForMatch(str: string): string {
  if (!str) return ""
  return normalizeId(str)
    .replace(/edp/g, "")
    .replace(/edt/g, "")
    .replace(/edc/g, "")
    .replace(/extrait/g, "")
    .replace(/parfum/g, "")
    .replace(/cologne/g, "")
    .replace(/intense/g, "")
    .replace(/elixir/g, "")
    .replace(/extreme/g, "")
    .replace(/pourhomme/g, "")
    .replace(/pourfemme/g, "")
    .trim()
}

function buscarSimilares(
  id: string,
  perfume: PerfumeFragella,
  extra: { categoria?: string; inspiradoEm?: string; marcaOriginal?: string }
): CardUnificado[] {
  const normalizarGenero = (g: string | undefined): any => {
    if (!g) return undefined
    const lower = g.toLowerCase()
    if (lower === "masculino" || lower === "men" || lower === "male") return "Masculino"
    if (lower === "feminino" || lower === "women" || lower === "female") return "Feminino"
    if (lower === "unissex" || lower === "unisex") return "Unissex"
    return undefined
  }

  const safeNormalize = (str: any): string => {
    if (typeof str !== "string") return ""
    return normalizeId(str)
  }

  const calcularSimilaridadeRaw = (p2: any, p2Categoria: string, p2Fonte: string): number => {
    if (p2.id === id) return -1

    let score = 0

    // Gênero correspondente
    const g1 = perfume.genero?.toLowerCase()
    const g2 = p2.genero?.toLowerCase()
    if (g1 && g2 && g1 !== "unissex" && g2 !== "unissex" && g1 !== g2) {
      return -1
    }

    // Família Olfativa
    const f1 = safeNormalize(perfume.familia || "")
    const f2 = safeNormalize(p2.familia || "")
    if (f1 && f2) {
      if (f1 === f2) score += 35
      else {
        const words1 = f1.split(/\s+/)
        const words2 = f2.split(/\s+/)
        let sharedWords = 0
        for (const w of words1) {
          if (w.length > 3 && words2.includes(w)) sharedWords++
        }
        score += sharedWords * 12
      }
    }

    // Notas olfativas compartilhadas
    const n1 = new Set([
      ...(perfume.notasTopo || []).map(safeNormalize),
      ...(perfume.notasCoracao || []).map(safeNormalize),
      ...(perfume.notasFundo || []).map(safeNormalize)
    ].filter(Boolean))

    const p2NotasRaw = Array.isArray(p2.notas)
      ? p2.notas
      : [...(p2.notas?.topo ?? []), ...(p2.notas?.coracao ?? []), ...(p2.notas?.fundo ?? [])]

    const n2 = [
      ...(p2.notasTopo || []).map(safeNormalize),
      ...(p2.notasCoracao || []).map(safeNormalize),
      ...(p2.notasFundo || []).map(safeNormalize),
      ...p2NotasRaw.map(safeNormalize)
    ].filter(Boolean)

    let matchedNotes = 0
    for (const note of n2) {
      if (n1.has(note)) matchedNotes++
    }
    if (n1.size > 0) {
      score += (matchedNotes / n1.size) * 35
    }

    // Acordes compartilhados
    const a1 = perfume.acordesPorcentagem ? Object.keys(perfume.acordesPorcentagem).map(safeNormalize) : []
    const a2Raw = p2.acordesPorcentagem ? Object.keys(p2.acordesPorcentagem).map(safeNormalize) : []
    const a2 = p2.acordes ? p2.acordes.map(safeNormalize) : a2Raw
    if (a1.length > 0 && a2.length > 0) {
      let matchedAccords = 0
      for (const acc of a2) {
        if (a1.includes(acc)) matchedAccords++
      }
      score += (matchedAccords / a1.length) * 30
    }

    // Inspiração direta (Dá um boost de +55 ou +85 pontos)
    const eContratipo1 = extra.categoria === "contratipo" || !!extra.inspiradoEm
    const nomeInsp1 = eContratipo1 ? extra.inspiradoEm : perfume.nome
    const marcaInsp1 = eContratipo1 ? extra.marcaOriginal : perfume.marca

    if (nomeInsp1) {
      const qClean = cleanNameForMatch(nomeInsp1)
      const mNorm = safeNormalize(marcaInsp1 || "")

      // Caso A: p2 é clone de nomeInsp1
      if (p2.inspiradoEm) {
        const p2InspClean = cleanNameForMatch(p2.inspiradoEm)
        const p2MarcaNorm = safeNormalize(p2.marcaOriginal || "")
        const nomeOk = p2InspClean.includes(qClean) || qClean.includes(p2InspClean)
        const marcaOk = !mNorm || p2MarcaNorm === mNorm || p2MarcaNorm.includes(mNorm) || mNorm.includes(p2MarcaNorm)
        if (nomeOk && marcaOk) {
          score += 55
        }
      }

      // Caso B: perfume visualizado é clone e p2 é o original importado correspondente
      if (eContratipo1 && p2Fonte === "fragella") {
        const fClean = cleanNameForMatch(p2.nome)
        const fMarcaNorm = safeNormalize(p2.marca)
        const brandOk = fMarcaNorm === mNorm || fMarcaNorm.includes(mNorm) || mNorm.includes(fMarcaNorm)
        const nameOk = fClean.includes(qClean) || qClean.includes(fClean)
        if (brandOk && nameOk) {
          score += 85
        }
      }
    }

    return score
  }

  const candidatesScored: Array<{ raw: any; categoria: string; fonte: string; score: number }> = []

  for (const p of contratiposData as any[]) {
    const score = calcularSimilaridadeRaw(p, p.categoria || "contratipo", "contratipo")
    if (score > 0) candidatesScored.push({ raw: p, categoria: p.categoria || "contratipo", fonte: "contratipo", score })
  }

  for (const p of expandidoData as any[]) {
    const score = calcularSimilaridadeRaw(p, p.categoria || "expandido", "expandido")
    if (score > 0) candidatesScored.push({ raw: p, categoria: p.categoria || "expandido", fonte: "expandido", score })
  }

  for (const p of fragellaCached()) {
    const score = calcularSimilaridadeRaw(p, "importado-designer", "fragella")
    if (score > 0) candidatesScored.push({ raw: p, categoria: "importado-designer", fonte: "fragella", score })
  }

  candidatesScored.sort((a, b) => b.score - a.score)

  let clonesCount = 0
  const selected: Array<{ raw: any; categoria: string; fonte: string }> = []

  for (const item of candidatesScored) {
    const isClone = item.categoria === "contratipo" || !!item.raw.inspiradoEm

    if (isClone) {
      if (clonesCount >= 2) continue
      clonesCount++
    }

    selected.push(item)
    if (selected.length >= 6) break
  }

  const contratipoParaCard = (p: any): CardUnificado => ({
    id: p.id,
    nome: p.nome,
    marca: p.marca,
    concentracao: p.tipo,
    familia: p.familia,
    notas: p.notas,
    preco_brl: p.preco_brl,
    inspiracaoInfo: `inspirado em ${p.inspiradoEm} da ${p.marcaOriginal}`,
    categoria: p.categoria,
    generoNorm: normalizarGenero(p.genero),
    fonte: "contratipo",
    imagemTransparente: p.imagemTransparente || undefined,
    imagem: p.imagem || undefined,
    imagemFallbacks: p.imagemFallbacks || undefined,
  })

  const expandidoParaCard = (p: any): CardUnificado => {
    const notas = Array.isArray(p.notas)
      ? p.notas
      : [...(p.notas?.topo ?? []), ...(p.notas?.coracao ?? []), ...(p.notas?.fundo ?? [])]
    return {
      id: p.id,
      nome: p.nome,
      marca: p.marca,
      concentracao: p.tipo,
      familia: p.familia,
      notas,
      preco_brl: p.preco_brl,
      inspiracaoInfo: p.inspiradoEm ? `inspirado em ${p.inspiradoEm}${p.marcaOriginal ? ` da ${p.marcaOriginal}` : ""}` : undefined,
      categoria: p.categoria,
      generoNorm: normalizarGenero(p.genero),
      fonte: "expandido",
      imagemTransparente: p.imagemTransparente || undefined,
      imagem: p.imagem || undefined,
      imagemFallbacks: p.imagemFallbacks || undefined,
    }
  }

  const fragellaParaCard = (p: PerfumeFragella): CardUnificado => ({
    id: p.id,
    nome: p.nome,
    marca: p.marca,
    concentracao: p.concentracao || undefined,
    familia: p.familia || undefined,
    imagemTransparente: p.imagemTransparente || undefined,
    rating: p.rating ?? undefined,
    categoria: "importado-designer",
    generoNorm: normalizarGenero(p.genero),
    fonte: "fragella",
  })

  return selected.map(item => {
    if (item.fonte === "contratipo") return contratipoParaCard(item.raw)
    if (item.fonte === "expandido") return expandidoParaCard(item.raw)
    return fragellaParaCard(item.raw)
  })
}

// ── Static params ─────────────────────────────────────────────────────────────
// Pre-gera contratipos + expandido. Fragella (11k) é gerado on-demand via ISR.

export function generateStaticParams() {
  const slugs = new Set<string>()
  for (const p of contratiposData as ContratipoEntry[]) slugs.add(p.id)
  for (const p of expandidoData as ExpandidoEntry[])    slugs.add(p.id)
  return Array.from(slugs).map(id => ({ id }))
}

// ── Metadata ──────────────────────────────────────────────────────────────────

const BASE_URL = "https://nozze.app"

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const result = await resolverPerfume(id)
  if (!result) return { title: "Perfume não encontrado" }
  const { perfume, extra } = result

  const insp    = extra.inspiradoEm ? ` · inspirado em ${extra.inspiradoEm}` : ""
  const titulo  = `${perfume.nome} — ${perfume.marca} | Nozze`
  const descricao = perfume.descricao
    ? perfume.descricao.slice(0, 155) + (perfume.descricao.length > 155 ? "…" : "")
    : `${perfume.nome} da ${perfume.marca}${insp}. Descubra notas, família e onde comprar.`
  const imagem  = perfume.imagemTransparente || perfume.imagem || ""
  const url     = `${BASE_URL}/perfume/${id}`

  const keywords = [perfume.nome, perfume.marca]
  if (perfume.familia)      keywords.push(perfume.familia)
  if (perfume.concentracao) keywords.push(perfume.concentracao)
  if (extra.inspiradoEm)   keywords.push(extra.inspiradoEm)
  if (perfume.notasTopo?.length) keywords.push(...perfume.notasTopo.slice(0, 3))

  return {
    title: titulo,
    description: descricao,
    keywords: keywords.join(", "),
    alternates: { canonical: url },
    openGraph: {
      title: `${perfume.nome} — ${perfume.marca}`,
      description: descricao,
      url,
      siteName: "Nozze",
      locale: "pt_BR",
      type: "website",
      ...(imagem ? { images: [{ url: imagem, alt: `${perfume.nome} — ${perfume.marca}` }] } : {}),
    },
    twitter: {
      card: imagem ? "summary_large_image" : "summary",
      title: `${perfume.nome} — ${perfume.marca}`,
      description: descricao,
      ...(imagem ? { images: [imagem] } : {}),
    },
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PaginaPerfume(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await resolverPerfume(id)
  if (!result) notFound()
  const { perfume, fonte, extra } = result

  const similares = buscarSimilares(id, perfume, extra)

  // Rankings de estação e ocasião
  const notasAll = [
    ...(perfume.notasTopo    || []),
    ...(perfume.notasCoracao || []),
    ...(perfume.notasFundo   || []),
  ]
  const [rankingEstacao, rankingOcasiao, editorial] = await Promise.all([
    gerarRankingEstacao(perfume.nome, perfume.familia || "", notasAll),
    gerarRankingOcasiao(perfume.nome, perfume.familia || "", notasAll),
    getEditorialContent(id),
  ])

  const acordes: Acorde[] = acordesFragellaParaAcorde(perfume.acordesPorcentagem)

  const imagemSrc =
    perfume.imagemTransparente ||
    perfume.imagem ||
    (Array.isArray(perfume.imagemFallbacks) && perfume.imagemFallbacks[0]) ||
    ""

  const descricaoTraduzida = perfume.descricao
    ?.split(/[,.]/)
    .map(p => traduzir(p.trim()))
    .filter(Boolean)
    .join(", ")

  // Notas
  const notasTopo    = resolverNotas(perfume.notasCompletas?.Top,    perfume.notasTopo)
  const notasCoracao = resolverNotas(perfume.notasCompletas?.Middle, perfume.notasCoracao)
  const notasFundo   = resolverNotas(perfume.notasCompletas?.Base,   perfume.notasFundo)
  const temNotas     = notasTopo.length > 0 || notasCoracao.length > 0 || notasFundo.length > 0

  // Link de compra: direto (expandido) ou Sephora BR (Fragella)
  const linkComprar = extra.linkCompra
    || (fonte === "fragella"
      ? `https://www.sephora.com.br/catalogsearch/result?q=${encodeURIComponent(perfume.nome + " " + perfume.marca)}`
      : null)

  // Métricas Fragella
  function tooltipDaMetrica(valor: string, tipo: "longevidade" | "sillage" | "rating"): string {
    const v = valor.toLowerCase()
    if (tipo === "longevidade") {
      if (/excepcional|very long/.test(v)) return "Dura mais de 12 horas. Uma ou duas borrifadas são suficientes para o dia todo."
      if (/longa|long lasting/.test(v))   return "Dura mais de 8 horas na pele. Ideal para quem não quer reaplicar."
      if (/moderada|moderate/.test(v))    return "Dura entre 4 e 6 horas. Considere reaplicar no meio do dia."
      return "Dura menos de 3 horas. Prefira aplicar em roupas para mais persistência."
    }
    if (tipo === "sillage") {
      if (/enormous/.test(v))             return "Projeção máxima. Uma borrifada já é suficiente."
      if (/strong|forte/.test(v))         return "Deixa rastro intenso. Use com moderação em ambientes fechados."
      if (/moderate|moderada/.test(v))    return "Projeção equilibrada. Discreto para os demais."
      return "Projeção íntima. Só quem está bem próximo vai sentir."
    }
    const r = parseFloat(valor)
    if (r >= 4.5) return "Avaliação excepcional. Um dos mais bem avaliados do mundo."
    if (r >= 4.0) return "Avaliação excelente. Amplamente amado pela comunidade."
    return "Boa avaliação. Perfume sólido com boa aceitação."
  }

  function corDaMetrica(valor: string, tipo: "longevidade" | "sillage") {
    const v = valor.toLowerCase()
    if (tipo === "longevidade") {
      if (/very long|excepcional|long lasting|longa/.test(v)) return { bg: "#EAF3DE", borda: "#8FBD6A", texto: "#3B6D11" }
      if (/moderate|moderada/.test(v))                        return { bg: "#FFF8E7", borda: "#D4A050", texto: "#8B6000" }
      return { bg: "#FCEBEB", borda: "#E09090", texto: "#A32D2D" }
    }
    if (/enormous|strong|forte|muito/.test(v)) return { bg: "#EAF3DE", borda: "#8FBD6A", texto: "#3B6D11" }
    if (/moderate|moderada|soft|suave/.test(v)) return { bg: "#FFF8E7", borda: "#D4A050", texto: "#8B6000" }
    return { bg: "#F5EFE8", borda: "#C0946A", texto: "#6B4A28" }
  }

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: perfume.nome,
    brand: { "@type": "Brand", name: perfume.marca },
    description: descricaoTraduzida || perfume.descricao || "",
    ...(imagemSrc ? { image: imagemSrc } : {}),
    ...(perfume.rating && perfume.rating > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: perfume.rating.toFixed(1), bestRating: "5", worstRating: "1" } }
      : {}),
    url: `${BASE_URL}/perfume/${id}`,
  }

  // ── Categoria badge styles ─────────────────────────────────────────────────
  const CATEGORIA_STYLE: Record<string, { bg: string; text: string; border: string }> = {
    "contratipo":         { bg: "rgba(196,113,74,0.08)", text: "var(--cor-destaque)", border: "var(--cor-destaque)" },
    "nacional":           { bg: "rgba(46,120,64,0.08)",  text: "#2E7840",             border: "#2E7840" },
    "arabe":              { bg: "rgba(201,168,76,0.1)",  text: "var(--cor-dourado)",  border: "var(--cor-dourado)" },
    "importado-designer": { bg: "rgba(26,26,24,0.05)",   text: "var(--cor-texto)",    border: "rgba(26,26,24,0.3)" },
  }
  const catStyle = extra.categoria ? (CATEGORIA_STYLE[extra.categoria] ?? CATEGORIA_STYLE["importado-designer"]) : null
  const catLabel = extra.categoria ? (CATEGORIA_LABELS[extra.categoria] ?? extra.categoria.toUpperCase()) : null

  return (
    <main>
      <PerfumeViewTracker perfumeId={id} nome={perfume.nome} marca={perfume.marca} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <div className="container-site" style={{ paddingTop: "34px", paddingBottom: "89px" }}>

        {/* Breadcrumb */}
        <p style={{ fontSize: "0.8rem", color: "var(--cor-texto-suave)", marginBottom: "34px" }}>
          <Link href="/" style={{ color: "var(--cor-destaque)" }}>nozze</Link>
          {" / "}
          <Link href={`/marca/${slugify(perfume.marca)}`} style={{ color: "var(--cor-texto-suave)" }}>
            {perfume.marca}
          </Link>
        </p>

        {/* Layout duas colunas */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(290px, 100%), 1fr))",
          gap: "55px",
          alignItems: "start",
        }}>

          {/* Coluna esquerda — imagem */}
          <ImagemPerfume
            src={imagemSrc}
            alt={`${perfume.nome} — ${perfume.marca}`}
            nome={perfume.nome}
            marca={perfume.marca}
          />

          {/* Coluna direita — informações */}
          <div>

            {/* Tags: categoria + familia + concentracao + genero + ano */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem", alignItems: "center" }}>
              {/* Categoria badge */}
              {catLabel && catStyle && (
                <span style={{
                  fontFamily: "var(--fonte-corpo)", fontSize: "0.65rem", fontWeight: 600,
                  letterSpacing: "0.14em", textTransform: "uppercase",
                  padding: "0.2rem 0.7rem", borderRadius: "var(--raio-borda)",
                  backgroundColor: catStyle.bg, color: catStyle.text,
                  border: `1px solid ${catStyle.border}`,
                }}>
                  {catLabel}
                </span>
              )}
              {perfume.familia     && <TagInfo>{traduzir(perfume.familia)}</TagInfo>}
              {perfume.concentracao && <TagInfo cor="dourado">{perfume.concentracao}</TagInfo>}
              {perfume.genero      && <TagInfo>{traduzir(perfume.genero)}</TagInfo>}
              {perfume.ano > 0     && <TagInfo>{perfume.ano}</TagInfo>}
            </div>

            {/* Métricas Fragella: Duração, Sillage, Rating */}
            {(perfume.longevidade || perfume.sillage || (perfume.rating && perfume.rating > 0)) && (
              <div style={{ display: "flex", gap: "8px", marginBottom: "21px", flexWrap: "wrap" }}>
                {perfume.longevidade && (() => {
                  const c = corDaMetrica(perfume.longevidade!, "longevidade")
                  return (
                    <MetricaCard
                      label="DURAÇÃO"
                      valor={traduzir(perfume.longevidade!)}
                      corTexto={c.texto}
                      tooltip={tooltipDaMetrica(traduzir(perfume.longevidade!), "longevidade")}
                    />
                  )
                })()}
                {perfume.sillage && (() => {
                  const c = corDaMetrica(perfume.sillage!, "sillage")
                  return (
                    <MetricaCard
                      label="SILLAGE"
                      valor={traduzir(perfume.sillage!)}
                      corTexto={c.texto}
                      tooltip={tooltipDaMetrica(traduzir(perfume.sillage!), "sillage")}
                    />
                  )
                })()}
                {perfume.rating && perfume.rating > 0 && (
                  <MetricaCard
                    label="AVALIAÇÃO"
                    valor={`★ ${perfume.rating.toFixed(1)}`}
                    corTexto="#C9943A"
                    tooltip={tooltipDaMetrica(perfume.rating.toFixed(1), "rating")}
                  />
                )}
              </div>
            )}

            {/* Marca */}
            <Link
              href={`/marca/${slugify(perfume.marca)}`}
              className="link-marca"
              style={{
                fontFamily: "var(--fonte-titulo)", fontSize: "0.95rem",
                letterSpacing: "0.12em", textTransform: "uppercase",
                display: "block", marginBottom: "0.4rem",
              }}
            >
              {perfume.marca}
            </Link>

            {/* Nome */}
            <h1 style={{
              fontFamily: "var(--fonte-titulo)", fontWeight: 300,
              lineHeight: 1.08, marginBottom: "21px",
            }}>
              {limparNomePerfume(perfume.nome, perfume.marca)}
            </h1>

            {/* ── INSPIRADO EM — destaque para contratipos ─────────────────── */}
            {extra.inspiradoEm && (
              <div style={{
                marginBottom: "21px",
                padding: "13px 21px",
                backgroundColor: "rgba(196, 113, 74, 0.05)",
                borderLeft: "3px solid var(--cor-destaque)",
                borderRadius: "0 4px 4px 0",
              }}>
                <p style={{
                  fontFamily: "var(--fonte-corpo)", fontSize: "0.88rem",
                  color: "var(--cor-texto-suave)", margin: 0, lineHeight: 1.5,
                }}>
                  Inspirado em{" "}
                  <strong style={{ color: "var(--cor-texto)", fontWeight: 500 }}>
                    {extra.inspiradoEm}
                  </strong>
                  {extra.marcaOriginal && (
                    <> da <strong style={{ color: "var(--cor-texto)", fontWeight: 500 }}>{extra.marcaOriginal}</strong></>
                  )}
                </p>
              </div>
            )}

            {/* ── PREÇO ───────────────────────────────────────────────────── */}
            {extra.preco_brl && (
              <div style={{ marginBottom: "21px" }}>
                <span style={{
                  fontFamily: "var(--fonte-titulo)", fontSize: "clamp(26px, 4vw, 34px)",
                  fontWeight: 300, color: "var(--cor-texto)",
                }}>
                  R${" "}{extra.preco_brl.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {/* ── AÇÕES: comprar + ver original ───────────────────────────── */}
            {(linkComprar || extra.inspiradoEm) && (
              <div style={{ display: "flex", gap: "13px", flexWrap: "wrap", alignItems: "center", marginBottom: "34px" }}>
                {linkComprar && (
                  <a
                    href={linkComprar}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex", alignItems: "center",
                      padding: "0 21px", minHeight: "44px",
                      backgroundColor: "var(--cor-destaque)", color: "#fff",
                      borderRadius: "var(--raio-borda)",
                      fontFamily: "var(--fonte-corpo)", fontWeight: 500,
                      fontSize: "0.875rem", textDecoration: "none",
                    }}
                  >
                    {fonte === "fragella" ? "Buscar na Sephora →" : "Comprar agora →"}
                  </a>
                )}
                {extra.inspiradoEm && (
                  <a
                    href={`https://www.fragrantica.com/search/?query=${encodeURIComponent(extra.inspiradoEm)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex", alignItems: "center",
                      fontFamily: "var(--fonte-corpo)", fontSize: "0.82rem",
                      color: "var(--cor-texto-suave)", minHeight: "44px",
                    }}
                  >
                    Ver original na Fragrantica ↗
                  </a>
                )}
              </div>
            )}

            {/* Descrição (Fragella) */}
            {descricaoTraduzida && (
              <p style={{ lineHeight: 1.8, marginBottom: "34px", fontSize: "0.95rem" }}>
                {descricaoTraduzida}
              </p>
            )}

            <div className="divisor" />

            {/* Pirâmide olfativa */}
            {temNotas && (
              <div style={{ marginTop: "34px", marginBottom: "34px" }}>
                <h3 style={{
                  fontFamily: "var(--fonte-titulo)", fontWeight: 300,
                  fontSize: "26px", marginBottom: "21px",
                }}>
                  Pirâmide olfativa
                </h3>
                <NotasPerfume
                  topo={notasTopo}
                  coracao={notasCoracao}
                  fundo={notasFundo}
                />
              </div>
            )}

            {/* Acordes principais (Fragella) */}
            {acordes.length > 0 && (
              <>
                <div className="divisor" />
                <div style={{ marginTop: "34px", marginBottom: "34px" }}>
                  <AcordesPerfume acordes={acordes} />
                </div>
              </>
            )}

            {/* Rankings estação + ocasião (Fragella) */}
            {(perfume.rankingEstacao?.length || perfume.rankingOcasiao?.length) && (
              <>
                <hr style={{ border: "none", borderTop: "0.5px solid var(--cor-borda)", margin: "0" }} />
                <RankingPerfume
                  estacao={rankingEstacao.length > 0 ? rankingEstacao : (perfume.rankingEstacao ?? [])}
                  ocasiao={rankingOcasiao.length > 0 ? rankingOcasiao : (perfume.rankingOcasiao ?? [])}
                  nomePerfume={perfume.nome}
                  familia={perfume.familia ?? ""}
                />
              </>
            )}

            {/* ── EDITORIAL ───────────────────────────────────────── */}
            {editorial && (
              <div style={{ marginTop: "55px" }}>
                <p style={{
                  fontFamily: "var(--fonte-corpo)", fontSize: "11px",
                  letterSpacing: "0.14em", textTransform: "uppercase",
                  color: "var(--cor-texto-suave)", margin: "0 0 34px",
                }}>
                  Sobre o perfume
                </p>
                {[
                  { label: "Como ele cheira",  value: editorial.comoCheira },
                  { label: "Para quem é",      value: editorial.paraQuem },
                  { label: "Quando usar",      value: editorial.quandoUsar },
                  { label: "Como se comporta", value: editorial.comoSeComporta },
                ].map(({ label, value }, i) => (
                  <div key={label} style={{ marginBottom: i < 3 ? "34px" : 0 }}>
                    <p style={{
                      fontFamily: "var(--fonte-corpo)", fontSize: "11px",
                      letterSpacing: "0.14em", textTransform: "uppercase",
                      color: "var(--cor-texto-suave)", margin: "0 0 13px",
                    }}>
                      {label}
                    </p>
                    <p style={{
                      fontFamily: "var(--fonte-corpo)",
                      fontSize: "16px", lineHeight: 1.65,
                      color: "var(--cor-texto)", margin: 0,
                    }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Onde encontrar — affiliate links */}
            <div style={{ marginTop: "34px", paddingTop: "34px", borderTop: "1px solid rgba(26,26,24,0.1)" }}>
              <OndeComprar perfumeName={perfume.nome} brand={perfume.marca} />
            </div>

            <div className="divisor" />

            {/* CTA consultor */}
            <div style={{ marginTop: "34px" }}>
              <p style={{ fontSize: "0.85rem", color: "var(--cor-texto-suave)", marginBottom: "13px" }}>
                Não tem certeza se é o certo para você?
              </p>
              <Link
                href="/consultor"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.4rem",
                  color: "var(--cor-destaque)", fontFamily: "var(--fonte-corpo)",
                  fontSize: "0.875rem", fontWeight: 500,
                  letterSpacing: "0.04em", minHeight: "44px",
                }}
              >
                Consultar seu consultor →
              </Link>
            </div>

          </div>
        </div>

        {/* ── Encontre Similares ────────────────────────── */}
        {similares.length > 0 && (
          <section style={{ marginTop: "55px", paddingTop: "55px", borderTop: "1px solid var(--cor-borda)" }}>
            <h3 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "clamp(21px, 4vw, 28px)", color: "var(--cor-texto)", marginBottom: "8px" }}>
              Perfumes Similares & Custo-benefício
            </h3>
            <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "14px", color: "var(--cor-texto-suave)", marginBottom: "34px" }}>
              Fragrâncias com o mesmo perfil olfativo, inspiração ou alternativas acessíveis.
            </p>
            <div className="perfumes-grid">
              {similares.map((p) => (
                <CardPerfume key={p.id} perfume={p} />
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  )
}

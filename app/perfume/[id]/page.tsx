// ============================================
// ARQUIVO: app/perfume/[id]/page.tsx
// O QUE FAZ: página individual de perfume
//   Fontes: contratipos.json → expandido.json → catalogo-fragella.json (11k)
// QUANDO MANDAR PRA IA: quando quiser mudar o layout da página de perfume
// DEPENDE DE: data/*.json, lib/catalogoFragella, components/perfume/
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

export const dynamicParams = true
export const revalidate = 86400

// ── Tipos ─────────────────────────────────────────────────────────────────────

type FontePerfume = "contratipo" | "expandido" | "fragella"

interface ContratipoEntry {
  id: string; nome: string; marca: string; tipo: string; genero: string
  familia: string; notas: string[]; preco_brl: number
  inspiradoEm: string; marcaOriginal: string; categoria: string
}

interface ExpandidoEntry {
  id: string; nome: string; marca: string; tipo: string; genero: string
  familia: string; notas: string[]; preco_brl: number
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

// ── Resolver ──────────────────────────────────────────────────────────────────

async function resolverPerfume(id: string): Promise<ResolverResult | null> {
  // Safety net: strip legacy suffixes
  const cleanId = id.replace(/-(ebay|ct|fragella-src|contratipo-src)$/, "")
  if (cleanId !== id) console.log("[Perfume] Stripped suffix:", id, "→", cleanId)
  id = cleanId

  // Step 1: exact match in contratipos.json
  const ct = (contratiposData as ContratipoEntry[]).find(p => p.id === id)
  if (ct) {
    return {
      perfume: perfumeMinimo(ct.nome, ct.marca, ct.tipo, ct.genero, ct.familia, ct.notas),
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
    return {
      perfume: perfumeMinimo(ex.nome, ex.marca, ex.tipo, ex.genero, ex.familia, ex.notas),
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
  const fgList = carregarCatalogo()
  const fg = fgList.find(p => p.id === id)
  if (fg) {
    return {
      perfume: fg,
      fonte: "fragella",
      extra: { categoria: "importado-designer" },
    }
  }

  // Step 4: normalized includes fallback (contratipos + expandido)
  // Handles: missing -100ml suffix, accent differences
  const normId = normalizeId(id)

  const ctLoose = (contratiposData as ContratipoEntry[]).find(p => {
    const n = normalizeId(p.id)
    if (Math.abs(n.length - normId.length) >= 20) return false
    return n.includes(normId) || normId.includes(n)
  })
  if (ctLoose) {
    console.log("[Perfume] Normalized match (ct):", ctLoose.id, "→", id)
    return {
      perfume: perfumeMinimo(ctLoose.nome, ctLoose.marca, ctLoose.tipo, ctLoose.genero, ctLoose.familia, ctLoose.notas),
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
    return {
      perfume: perfumeMinimo(exLoose.nome, exLoose.marca, exLoose.tipo, exLoose.genero, exLoose.familia, exLoose.notas),
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

  // Rankings de estação e ocasião
  const notasAll = [
    ...(perfume.notasTopo    || []),
    ...(perfume.notasCoracao || []),
    ...(perfume.notasFundo   || []),
  ]
  const [rankingEstacao, rankingOcasiao] = await Promise.all([
    gerarRankingEstacao(perfume.nome, perfume.familia || "", notasAll),
    gerarRankingOcasiao(perfume.nome, perfume.familia || "", notasAll),
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
          gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
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
      </div>
    </main>
  )
}

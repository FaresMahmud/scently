// ============================================
// ARQUIVO: app/perfume/[id]/page.tsx
// O QUE FAZ: página individual de perfume — cobre catálogo Fragella (7.9k) + mock
// QUANDO MANDAR PRA IA: quando quiser mudar o layout da página de perfume
// DEPENDE DE: lib/catalogoFragella, lib/fragella, lib/mockData, components/perfume/
// ============================================

import type { Metadata } from "next"
import Link from "next/link"
import OndeComprar from "@/components/perfume/OndeComprar"
import { buscarPerfumePorSlug, perfumesPopulares } from "@/lib/catalogoFragella"
import { buscarPerfumePorId, buscarPorNome } from "@/lib/fragella"
import type { PerfumeFragella, NotaFragella } from "@/lib/fragella"
import { buscarMockPorId, PERFUMES_MOCK } from "@/lib/mockData"
import { ebayRepository } from "@/lib/repositories/EbayPerfumeRepository"
import { contratipoRepository } from "@/lib/repositories/ContratipoRepository"
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

// Páginas além do top 500 são geradas on-demand (ISR)
export const dynamicParams = true
export const revalidate = 86400 // 24h

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

/** Retorna notas como Nota[] para o componente NotasPerfume */
function resolverNotas(
  completas: NotaFragella[] | undefined,
  simples: string[] | undefined
): { name: string; imageUrl?: string }[] {
  if (completas?.length) return completas
  return (simples ?? []).map(name => ({ name }))
}

type FontePerfume = "local" | "api" | "mock" | "ebay" | "contratipo" | null

/** Constrói um PerfumeFragella mínimo a partir de dados locais (eBay / contratipo) */
function perfumeMinimo(
  nome: string, marca: string, concentracao: string,
  genero: string, familia: string, notas: string[], descricao = ""
): PerfumeFragella {
  return {
    id: `${slugify(nome)}-${slugify(marca)}`,
    nome, marca, concentracao, genero, ano: 0,
    familia, descricao, imagem: "",
    notasTopo: notas.slice(0, 3),
    notasCoracao: notas.slice(3, 6),
    notasFundo: notas.slice(6),
  }
}

/**
 * Resolver em cascata:
 * 1. Catálogo local Fragella (sem API call — O(n) em memória)
 * 2. Fragella API por ID
 * 3. Fragella API por nome extraído do slug
 * 4. Mock local
 * 5. eBay repository
 * 6. Contratipos repository
 */
async function resolverPerfume(id: string): Promise<{
  perfume: PerfumeFragella | null
  fonte: FontePerfume
}> {
  const slugLimpo = id.replace(/-(ebay|contratipo|fragella)$/, "")

  // 1. Catálogo local
  const local = buscarPerfumePorSlug(id)
  if (local?.nome && local?.marca) return { perfume: local, fonte: "local" }

  // 2. Fragella API — por ID
  const porId = await buscarPerfumePorId(slugLimpo).catch(() => null)
  if (porId?.nome && porId?.marca) return { perfume: porId, fonte: "api" }

  // 3. Fragella API — por nome extraído do slug
  const nomeBusca = slugLimpo.replace(/-/g, " ").replace(/\s+\d+$/, "").trim()
  if (nomeBusca.length >= 3) {
    const resultados = await buscarPorNome(nomeBusca, 3).catch(() => [])
    if (resultados.length > 0) return { perfume: resultados[0], fonte: "api" }
  }

  // 4. Mock local
  const mock = buscarMockPorId(id) ?? buscarMockPorId(slugLimpo)
  if (mock) return { perfume: mock as unknown as PerfumeFragella, fonte: "mock" }

  // 5. eBay — busca por slug do título+marca
  for (const p of ebayRepository.findAll()) {
    const s = `${slugify(p.titulo)}-${slugify(p.marca)}`
    if (s === slugLimpo || s === id) {
      return {
        perfume: perfumeMinimo(p.titulo, p.marca, p.tipo, p.genero, p.genero, []),
        fonte: "ebay",
      }
    }
  }

  // 6. Contratipos — busca por id ou slug nome+marca
  for (const p of contratipoRepository.findAll()) {
    const s = `${slugify(p.nome)}-${slugify(p.marca)}`
    if (p.id === id || p.id === slugLimpo || s === slugLimpo || s === id) {
      const descricao = `Contratipo inspirado em ${p.inspiradoEm} da ${p.marcaOriginal}`
      return {
        perfume: perfumeMinimo(p.nome, p.marca, p.tipo, p.genero, p.familia, p.notas, descricao),
        fonte: "contratipo",
      }
    }
  }

  return { perfume: null, fonte: null }
}

// ── Static params (top 500 por popularidade) ─────────────────────────────────

export function generateStaticParams() {
  const slugs = new Set<string>()

  // Mocks existentes
  for (const p of PERFUMES_MOCK) slugs.add(p.id)

  // Top 500 do catálogo Fragella por popularidade/rating
  for (const p of perfumesPopulares(500)) slugs.add(p.id)

  return Array.from(slugs).map(id => ({ id }))
}

// ── Metadata ──────────────────────────────────────────────────────────────────

const BASE_URL = "https://nozze.app"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const { perfume } = await resolverPerfume(id)
  if (!perfume) return { title: "Perfume não encontrado" }

  const titulo      = `${perfume.nome} — ${perfume.marca} | Nozze`
  const descricao   = perfume.descricao
    ? perfume.descricao.slice(0, 155) + (perfume.descricao.length > 155 ? "…" : "")
    : `${perfume.nome} da ${perfume.marca}. Descubra notas, sillage, duração e avaliações.`
  const imagem      = perfume.imagemTransparente || perfume.imagem || ""
  const url         = `${BASE_URL}/perfume/${id}`

  const keywords: string[] = [perfume.nome, perfume.marca]
  if (perfume.familia)      keywords.push(perfume.familia)
  if (perfume.concentracao) keywords.push(perfume.concentracao)
  if (perfume.notasTopo?.length) keywords.push(...perfume.notasTopo.slice(0, 3))

  return {
    title: titulo,
    description: descricao,
    keywords: keywords.join(", "),
    alternates: { canonical: url },
    openGraph: {
      title:       `${perfume.nome} — ${perfume.marca}`,
      description: descricao,
      url,
      siteName:    "Nozze",
      locale:      "pt_BR",
      type:        "website",
      ...(imagem ? { images: [{ url: imagem, alt: `${perfume.nome} — ${perfume.marca}` }] } : {}),
    },
    twitter: {
      card:        imagem ? "summary_large_image" : "summary",
      title:       `${perfume.nome} — ${perfume.marca}`,
      description: descricao,
      ...(imagem ? { images: [imagem] } : {}),
    },
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PaginaPerfume({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { perfume, fonte } = await resolverPerfume(id)

  if (!perfume) {
    return (
      <main className="container-site" style={{ paddingTop: "5rem", paddingBottom: "5rem" }}>
        <h1 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, marginBottom: "1rem" }}>
          Perfume não encontrado
        </h1>
        <p style={{ marginBottom: "34px" }}>O perfume que você procura não existe ou foi removido.</p>
        <Link href="/catalogo" style={{ color: "var(--cor-destaque)" }}>← Explorar catálogo</Link>
      </main>
    )
  }

  // Rankings de estação e ocasião via IA (fallback para dados Fragella)
  const notasAll = [
    ...(perfume.notasTopo    || []),
    ...(perfume.notasCoracao || []),
    ...(perfume.notasFundo   || []),
  ]
  const [rankingEstacao, rankingOcasiao] = await Promise.all([
    gerarRankingEstacao(perfume.nome, perfume.familia || "", notasAll),
    gerarRankingOcasiao(perfume.nome, perfume.familia || "", notasAll),
  ])

  // Acordes — prefere porcentagens reais, senão mock
  const mockData = fonte === "mock" ? buscarMockPorId(id) : null
  const acordes: Acorde[] =
    acordesFragellaParaAcorde(perfume.acordesPorcentagem).length > 0
      ? acordesFragellaParaAcorde(perfume.acordesPorcentagem)
      : (mockData?.acordes ?? [])

  // Imagem — cadeia de fallback: transparente → jpg → fallbacks[0] → placeholder
  const imagemSrc =
    perfume.imagemTransparente ||
    perfume.imagem ||
    (Array.isArray(perfume.imagemFallbacks) && perfume.imagemFallbacks[0]) ||
    ""

  // Descrição traduzida (Fragella retorna em inglês)
  const descricaoTraduzida = perfume.descricao
    ?.split(/[,.]/)
    .map(p => traduzir(p.trim()))
    .filter(Boolean)
    .join(", ")

  // Tooltips das métricas
  function tooltipDaMetrica(valor: string, tipo: "longevidade" | "sillage" | "rating"): string {
    const v = valor.toLowerCase()
    if (tipo === "longevidade") {
      if (/excepcional|very long/.test(v))    return "Dura mais de 12 horas. Uma ou duas borrifadas são suficientes para o dia todo."
      if (/longa|long lasting/.test(v))       return "Dura mais de 8 horas na pele. Ideal para quem não quer reaplicar ao longo do dia."
      if (/moderada|moderate/.test(v))        return "Dura entre 4 e 6 horas. Considere reaplicar no meio do dia."
      return "Dura menos de 3 horas. Prefira aplicar em roupas ou cabelo para mais persistência."
    }
    if (tipo === "sillage") {
      if (/muito forte|enormous/.test(v))     return "Projeção máxima. Uma borrifada já é suficiente. Evite usar em espaços pequenos ou reuniões."
      if (/forte|strong/.test(v))             return "Deixa rastro intenso. As pessoas ao redor vão perceber. Use com moderação em ambientes fechados."
      if (/moderada|moderate/.test(v))        return "Projeção equilibrada. Perceptível para quem está perto, discreto para os demais."
      if (/suave|soft/.test(v))               return "Projeção íntima. Só quem está bem próximo vai sentir. Perfeito para ambientes formais."
      return "Praticamente um perfume de pele. Quase só você vai sentir. Ideal para quem prefere discrição total."
    }
    // rating (valor numérico como string)
    const r = parseFloat(valor)
    if (r >= 4.5) return "Avaliação excepcional. Um dos perfumes mais bem avaliados do mundo."
    if (r >= 4.0) return "Avaliação excelente. Amplamente amado pela comunidade de perfumaria."
    if (r >= 3.5) return "Boa avaliação. Perfume sólido com boa aceitação geral."
    return "Avaliação moderada. Pode não agradar a todos os gostos."
  }

  // Cores das métricas de longevidade / sillage / rating
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

  // Notas — usa notasCompletas (com imageUrl) se disponível
  const notasTopo    = resolverNotas(perfume.notasCompletas?.Top,    perfume.notasTopo)
  const notasCoracao = resolverNotas(perfume.notasCompletas?.Middle, perfume.notasCoracao)
  const notasFundo   = resolverNotas(perfume.notasCompletas?.Base,   perfume.notasFundo)
  const temNotas     = notasTopo.length > 0 || notasCoracao.length > 0 || notasFundo.length > 0

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
          <Link href={`/marca/${slugify(perfume.marca)}`} style={{ color: "var(--cor-texto-suave)" }}>{perfume.marca}</Link>
        </p>

        {/* Layout duas colunas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: "55px", alignItems: "start" }}>

          {/* Coluna esquerda — imagem (sticky em desktop, relative em mobile) */}
          <ImagemPerfume
            src={imagemSrc}
            alt={`${perfume.nome} — ${perfume.marca}`}
            nome={perfume.nome}
            marca={perfume.marca}
          />

          {/* Coluna direita — informações */}
          <div>
            {/* Tags info com hover */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem", alignItems: "center" }}>
              {perfume.familia && <TagInfo>{traduzir(perfume.familia)}</TagInfo>}
              {perfume.concentracao && <TagInfo cor="dourado">{perfume.concentracao}</TagInfo>}
              {perfume.genero && <TagInfo>{traduzir(perfume.genero)}</TagInfo>}
              {perfume.ano > 0 && <TagInfo>{perfume.ano}</TagInfo>}
            </div>

            {/* Métricas em destaque: Duração, Sillage, Avaliação */}
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
              style={{ fontFamily: "var(--fonte-titulo)", fontSize: "0.95rem", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}
            >
              {perfume.marca}
            </Link>

            {/* Nome */}
            <h1 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, lineHeight: 1.08, marginBottom: "34px" }}>
              {limparNomePerfume(perfume.nome, perfume.marca)}
            </h1>

            {/* Descrição */}
            {descricaoTraduzida && (
              <p style={{ lineHeight: 1.8, marginBottom: "34px", fontSize: "0.95rem" }}>
                {descricaoTraduzida}
              </p>
            )}

            <div className="divisor" />

            {/* Pirâmide olfativa */}
            {temNotas && (
              <div style={{ marginTop: "34px", marginBottom: "34px" }}>
                <h3 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "26px", marginBottom: "21px" }}>
                  Pirâmide olfativa
                </h3>
                <NotasPerfume
                  topo={notasTopo}
                  coracao={notasCoracao}
                  fundo={notasFundo}
                />
              </div>
            )}

            {/* Acordes principais */}
            {acordes.length > 0 && (
              <>
                <div className="divisor" />
                <div style={{ marginTop: "34px", marginBottom: "34px" }}>
                  <AcordesPerfume acordes={acordes} />
                </div>
              </>
            )}

            {/* Rankings estação + ocasião */}
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

            {/* Onde encontrar — affiliate links, always after all perfume content */}
            <div
              style={{
                marginTop: "34px",
                paddingTop: "34px",
                borderTop: "1px solid rgba(26,26,24,0.1)",
              }}
            >
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
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--cor-destaque)", fontFamily: "var(--fonte-corpo)", fontSize: "0.875rem", fontWeight: 500, letterSpacing: "0.04em", minHeight: "44px" }}
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

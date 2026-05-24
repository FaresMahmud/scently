// ============================================
// ARQUIVO: app/perfume/[id]/page.tsx
// O QUE FAZ: página individual de perfume — cobre catálogo Fragella (7.9k) + mock
// QUANDO MANDAR PRA IA: quando quiser mudar o layout da página de perfume
// DEPENDE DE: lib/catalogoFragella, lib/fragella, lib/mockData, components/perfume/
// ============================================

import type { Metadata } from "next"
import Link from "next/link"
import { buscarPerfumePorSlug, perfumesPopulares } from "@/lib/catalogoFragella"
import { buscarPerfumePorId, buscarPorNome } from "@/lib/fragella"
import type { PerfumeFragella, NotaFragella } from "@/lib/fragella"
import { buscarMockPorId, PERFUMES_MOCK } from "@/lib/mockData"
import { NotasPerfume } from "@/components/perfume/NotasPerfume"
import AcordesPerfume from "@/components/perfume/AcordesPerfume"
import Tag from "@/components/ui/Tag"
import { slugify, traduzir } from "@/lib/utils"
import type { Acorde } from "@/lib/types"

// Páginas além do top 500 são geradas on-demand (ISR)
export const dynamicParams = true

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

/**
 * Resolver em cascata:
 * 1. Catálogo local (sem API call — O(n) em memória)
 * 2. Fragella API por ID
 * 3. Fragella API por nome extraído do slug
 * 4. Mock local
 */
async function resolverPerfume(id: string): Promise<{
  perfume: PerfumeFragella | null
  fonte: "local" | "api" | "mock" | null
}> {
  // 1. Catálogo local
  const local = buscarPerfumePorSlug(id)
  if (local?.nome && local?.marca) return { perfume: local, fonte: "local" }

  // 2. Fragella API — por ID
  const porId = await buscarPerfumePorId(id).catch(() => null)
  if (porId?.nome && porId?.marca) return { perfume: porId, fonte: "api" }

  // 3. Fragella API — por nome extraído do slug
  const nomeBusca = id.replace(/-/g, " ").replace(/\s+\d+$/, "").trim()
  if (nomeBusca.length >= 3) {
    const resultados = await buscarPorNome(nomeBusca, 3).catch(() => [])
    if (resultados.length > 0) return { perfume: resultados[0], fonte: "api" }
  }

  // 4. Mock local
  const mock = buscarMockPorId(id)
  if (mock) return { perfume: mock as unknown as PerfumeFragella, fonte: "mock" }

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

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const { perfume } = await resolverPerfume(id)
  if (!perfume) return { title: "Perfume não encontrado" }
  return {
    title: `${perfume.nome} — ${perfume.marca}`,
    description: perfume.descricao || `${perfume.nome} da ${perfume.marca}.`,
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
        <p style={{ marginBottom: "2rem" }}>O perfume que você procura não existe ou foi removido.</p>
        <Link href="/catalogo" style={{ color: "var(--cor-destaque)" }}>← Explorar catálogo</Link>
      </main>
    )
  }

  // Acordes — prefere porcentagens reais, senão mock
  const mockData = fonte === "mock" ? buscarMockPorId(id) : null
  const acordes: Acorde[] =
    acordesFragellaParaAcorde(perfume.acordesPorcentagem).length > 0
      ? acordesFragellaParaAcorde(perfume.acordesPorcentagem)
      : (mockData?.acordes ?? [])

  // Imagem
  const imagemSrc = perfume.imagemTransparente || perfume.imagem || ""

  // Notas — usa notasCompletas (com imageUrl) se disponível
  const notasTopo    = resolverNotas(perfume.notasCompletas?.Top,    perfume.notasTopo)
  const notasCoracao = resolverNotas(perfume.notasCompletas?.Middle, perfume.notasCoracao)
  const notasFundo   = resolverNotas(perfume.notasCompletas?.Base,   perfume.notasFundo)
  const temNotas     = notasTopo.length > 0 || notasCoracao.length > 0 || notasFundo.length > 0

  return (
    <main>
      <div className="container-site" style={{ paddingTop: "3rem", paddingBottom: "5rem" }}>

        {/* Breadcrumb */}
        <p style={{ fontSize: "0.8rem", color: "var(--cor-texto-suave)", marginBottom: "3rem" }}>
          <Link href="/" style={{ color: "var(--cor-destaque)" }}>scently</Link>
          {" / "}
          <Link href={`/marca/${slugify(perfume.marca)}`} style={{ color: "var(--cor-texto-suave)" }}>{perfume.marca}</Link>
        </p>

        {/* Layout duas colunas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: "4rem", alignItems: "start" }}>

          {/* Coluna esquerda — imagem */}
          <div style={{
            backgroundColor: "var(--cor-borda)",
            aspectRatio: "3/4",
            borderRadius: "var(--raio-borda-suave)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            position: "sticky",
            top: "84px",
          }}>
            {imagemSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagemSrc}
                alt={`${perfume.nome} — ${perfume.marca}`}
                style={{ width: "100%", height: "100%", objectFit: "contain", padding: "1.5rem" }}
              />
            ) : (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontFamily: "var(--fonte-titulo)", fontSize: "6rem", fontWeight: 300, color: "var(--cor-texto-suave)", opacity: 0.25, lineHeight: 1, marginBottom: "0.5rem" }}>
                  {perfume.marca.charAt(0)}
                </p>
                <p style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--cor-texto-suave)", opacity: 0.5 }}>
                  {perfume.marca}
                </p>
              </div>
            )}
          </div>

          {/* Coluna direita — informações */}
          <div>
            {/* Tags info */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem", alignItems: "center" }}>
              {perfume.familia && <Tag>{traduzir(perfume.familia)}</Tag>}
              {perfume.concentracao && <Tag cor="dourado">{perfume.concentracao}</Tag>}
              {perfume.genero && <Tag>{traduzir(perfume.genero)}</Tag>}
              {perfume.ano > 0 && <Tag>{perfume.ano}</Tag>}
              {perfume.longevidade && <Tag>{traduzir(perfume.longevidade)}</Tag>}
              {perfume.sillage && <Tag>Sillage: {traduzir(perfume.sillage)}</Tag>}
              {perfume.rating && perfume.rating > 0 && (
                <span style={{ marginLeft: "auto", fontFamily: "var(--fonte-corpo)", fontSize: "0.8rem", color: "var(--cor-dourado)", letterSpacing: "0.04em" }}>
                  ★ {perfume.rating.toFixed(2)}
                </span>
              )}
            </div>

            {/* Marca */}
            <Link
              href={`/marca/${slugify(perfume.marca)}`}
              className="link-marca"
              style={{ fontFamily: "var(--fonte-titulo)", fontSize: "0.95rem", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}
            >
              {perfume.marca}
            </Link>

            {/* Nome */}
            <h1 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, lineHeight: 1.08, marginBottom: "2rem" }}>
              {perfume.nome}
            </h1>

            {/* Descrição */}
            {perfume.descricao && (
              <p style={{ lineHeight: 1.8, marginBottom: "2.5rem", fontSize: "0.95rem" }}>
                {perfume.descricao}
              </p>
            )}

            {/* Botão comprar */}
            {perfume.urlCompra && (
              <a
                href={perfume.urlCompra}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  backgroundColor: "var(--cor-destaque)",
                  color: "#fff",
                  fontFamily: "var(--fonte-corpo)",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  padding: "0.7rem 1.5rem",
                  borderRadius: "var(--raio-borda)",
                  textDecoration: "none",
                  marginBottom: "2.5rem",
                  transition: "opacity 0.15s",
                }}
              >
                Comprar →
              </a>
            )}

            <div className="divisor" />

            {/* Pirâmide olfativa */}
            {temNotas && (
              <div style={{ marginTop: "2rem", marginBottom: "2.5rem" }}>
                <h3 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "1.3rem", marginBottom: "1.5rem" }}>
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
                <div style={{ marginTop: "2rem", marginBottom: "2.5rem" }}>
                  <AcordesPerfume acordes={acordes} />
                </div>
              </>
            )}

            {/* Rankings estação + ocasião */}
            {(perfume.rankingEstacao?.length || perfume.rankingOcasiao?.length) ? (
              <>
                <div className="divisor" />
                <div style={{ marginTop: "2rem", marginBottom: "2.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                  {perfume.rankingEstacao?.length ? (
                    <div>
                      <p style={{ fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cor-texto-suave)", marginBottom: "0.75rem" }}>
                        Estação ideal
                      </p>
                      {perfume.rankingEstacao.slice(0, 3).map(r => (
                        <div key={r.name} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                          <span style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.8rem", color: "var(--cor-texto-suave)" }}>
                            {traduzir(r.name)}
                          </span>
                          <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: i < Math.round(r.score / 20) ? "#8B6F5E" : "#E0D9D0" }} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {perfume.rankingOcasiao?.length ? (
                    <div>
                      <p style={{ fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cor-texto-suave)", marginBottom: "0.75rem" }}>
                        Melhor ocasião
                      </p>
                      {perfume.rankingOcasiao.slice(0, 3).map(r => (
                        <div key={r.name} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                          <span style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.8rem", color: "var(--cor-texto-suave)" }}>
                            {traduzir(r.name)}
                          </span>
                          <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: i < Math.round(r.score / 20) ? "#8B6F5E" : "#E0D9D0" }} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}

            <div className="divisor" />

            {/* CTA consultor */}
            <div style={{ marginTop: "2rem" }}>
              <p style={{ fontSize: "0.85rem", color: "var(--cor-texto-suave)", marginBottom: "0.75rem" }}>
                Não tem certeza se é o certo para você?
              </p>
              <Link
                href="/consultor"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--cor-destaque)", fontFamily: "var(--fonte-corpo)", fontSize: "0.875rem", fontWeight: 500, letterSpacing: "0.04em" }}
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

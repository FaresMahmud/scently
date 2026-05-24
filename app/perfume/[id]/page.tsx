// ============================================
// ARQUIVO: app/perfume/[id]/page.tsx
// O QUE FAZ: página individual de cada perfume — notas, acordes, descrição, rankings e CTA
// QUANDO MANDAR PRA IA: quando quiser mudar o layout da página de perfume
// DEPENDE DE: lib/fragella.ts, lib/mockData.ts, components/perfume/
// ============================================

import type { Metadata } from "next"
import Link from "next/link"
import { buscarPerfumePorId, buscarPorNome } from "@/lib/fragella"
import type { PerfumeFragella } from "@/lib/fragella"
import { buscarMockPorId } from "@/lib/mockData"
import { NotasPerfume } from "@/components/perfume/NotasPerfume"
import AcordesPerfume from "@/components/perfume/AcordesPerfume"
import Tag from "@/components/ui/Tag"
import { slugify } from "@/lib/utils"
import type { Acorde } from "@/lib/types"
import { traduzir } from "@/lib/utils"

// Mapeia os descritores de força da Fragella para porcentagens numéricas
const DESCRITOR_PARA_PCT: Record<string, number> = {
  Dominant:  92,
  Prominent: 76,
  Moderate:  58,
  Subtle:    38,
  Trace:     22,
}

function acordesFragellaParaAcorde(pct: Record<string, string> | undefined): Acorde[] {
  if (!pct) return []
  return Object.entries(pct)
    .map(([nome, desc]) => ({ nome, porcentagem: DESCRITOR_PARA_PCT[desc] ?? 50 }))
    .sort((a, b) => b.porcentagem - a.porcentagem)
    .slice(0, 6)
}

// Tenta encontrar o perfume por ID; se não achar no mock, tenta busca por nome na Fragella
async function resolverPerfume(id: string): Promise<PerfumeFragella | null> {
  // 1. Tenta API pelo ID (slug → nome)
  const porId = await buscarPerfumePorId(id).catch(() => null)
  if (porId?.nome && porId?.marca) return porId

  // 2. Tenta busca livre pelo nome extraído do slug
  const nomeBusca = id.replace(/-/g, " ").replace(/\s+\d+$/, "").trim()
  if (nomeBusca.length >= 3) {
    const resultados = await buscarPorNome(nomeBusca, 3).catch(() => [])
    if (resultados.length > 0) return resultados[0]
  }

  return null
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const api = await resolverPerfume(id)
  const perfume = (api?.nome && api?.marca) ? api : buscarMockPorId(id)
  if (!perfume) return { title: "Perfume não encontrado" }
  return {
    title: `${perfume.nome} — ${perfume.marca}`,
    description: perfume.descricao || `${perfume.nome} da ${perfume.marca}.`,
  }
}

export default async function PaginaPerfume({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Prioridade: Fragella API > mock local
  const perfumeApi = await resolverPerfume(id)
  const perfumeMock = buscarMockPorId(id)
  const perfume = (perfumeApi?.nome && perfumeApi?.marca) ? perfumeApi : perfumeMock

  if (!perfume) {
    return (
      <main className="container-site" style={{ paddingTop: "5rem", paddingBottom: "5rem" }}>
        <h1 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, marginBottom: "1rem" }}>
          Perfume não encontrado
        </h1>
        <p style={{ marginBottom: "2rem" }}>O perfume que você procura não existe ou foi removido.</p>
        <Link href="/" style={{ color: "var(--cor-destaque)" }}>← Voltar ao início</Link>
      </main>
    )
  }

  // Acordes: prefere porcentagens reais da Fragella; fallback para o mock
  const acordes: Acorde[] =
    acordesFragellaParaAcorde(perfumeApi?.acordesPorcentagem).length > 0
      ? acordesFragellaParaAcorde(perfumeApi?.acordesPorcentagem)
      : (perfumeMock?.acordes ?? [])

  // Imagem: prefere versão transparente da Fragella (melhor visual no fundo claro)
  const imagemSrc = perfumeApi?.imagemTransparente || perfumeApi?.imagem || perfumeMock?.imagem || ""

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
            {/* Tags: família, concentração, gênero, ano, rating */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem", alignItems: "center" }}>
              {perfume.familia && <Tag>{perfume.familia}</Tag>}
              {perfume.concentracao && <Tag cor="dourado">{perfume.concentracao}</Tag>}
              {perfume.genero && <Tag>{traduzir(perfume.genero)}</Tag>}
              {perfume.ano > 0 && <Tag>{perfume.ano}</Tag>}
              {perfumeApi?.longevidade && <Tag>{traduzir(perfumeApi.longevidade)}</Tag>}
              {perfumeApi?.sillage && <Tag>Sillage: {traduzir(perfumeApi.sillage)}</Tag>}
              {perfumeApi?.rating && perfumeApi.rating > 0 && (
                <span style={{ marginLeft: "auto", fontFamily: "var(--fonte-corpo)", fontSize: "0.8rem", color: "var(--cor-dourado)", letterSpacing: "0.04em" }}>
                  ★ {perfumeApi.rating.toFixed(2)}
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
            <p style={{ lineHeight: 1.8, marginBottom: "2.5rem", fontSize: "0.95rem" }}>
              {perfume.descricao}
            </p>

            <div className="divisor" />

            {/* Pirâmide olfativa */}
            {(perfume.notasTopo?.length || perfume.notasCoracao?.length || perfume.notasFundo?.length) ? (
              <div style={{ marginTop: "2rem", marginBottom: "2.5rem" }}>
                <h3 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "1.3rem", marginBottom: "1.5rem" }}>
                  Pirâmide olfativa
                </h3>
                <NotasPerfume
                  topo={(perfume.notasTopo ?? []).map(name => ({ name }))}
                  coracao={(perfume.notasCoracao ?? []).map(name => ({ name }))}
                  fundo={(perfume.notasFundo ?? []).map(name => ({ name }))}
                />
              </div>
            ) : null}

            {/* Acordes principais */}
            {acordes.length > 0 && (
              <>
                <div className="divisor" />
                <div style={{ marginTop: "2rem", marginBottom: "2.5rem" }}>
                  <AcordesPerfume acordes={acordes} />
                </div>
              </>
            )}

            {/* Rankings de estação e ocasião (dados reais da Fragella) */}
            {(perfumeApi?.rankingEstacao?.length || perfumeApi?.rankingOcasiao?.length) && (
              <>
                <div className="divisor" />
                <div style={{ marginTop: "2rem", marginBottom: "2.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                  {perfumeApi?.rankingEstacao?.length ? (
                    <div>
                      <p style={{ fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cor-texto-suave)", marginBottom: "0.75rem" }}>
                        Estação ideal
                      </p>
                      {perfumeApi.rankingEstacao.slice(0, 3).map(r => (
                        <div key={r.name} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                          <span style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.8rem", color: "var(--cor-texto-suave)" }}>{traduzir(r.name)}</span>
                          <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: i < Math.round(r.score / 20) ? "#8B6F5E" : "#E0D9D0" }} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {perfumeApi?.rankingOcasiao?.length ? (
                    <div>
                      <p style={{ fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cor-texto-suave)", marginBottom: "0.75rem" }}>
                        Melhor ocasião
                      </p>
                      {perfumeApi.rankingOcasiao.slice(0, 3).map(r => (
                        <div key={r.name} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                          <span style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.8rem", color: "var(--cor-texto-suave)" }}>{traduzir(r.name)}</span>
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
            )}

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

// ============================================
// ARQUIVO: app/perfume/[id]/page.tsx
// O QUE FAZ: página individual de cada perfume — notas, acordes, descrição e CTA para o consultor
// QUANDO MANDAR PRA IA: quando quiser mudar o layout da página de perfume
// DEPENDE DE: lib/fragella.ts, lib/mockData.ts, components/perfume/
// ============================================

import type { Metadata } from "next"
import Link from "next/link"
import { buscarPerfumePorId } from "@/lib/fragella"
import { buscarMockPorId } from "@/lib/mockData"
import NotasPerfume from "@/components/perfume/NotasPerfume"
import AcordesPerfume from "@/components/perfume/AcordesPerfume"
import Tag from "@/components/ui/Tag"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const api = await buscarPerfumePorId(id).catch(() => null)
  const perfume = (api?.nome && api?.marca) ? api : buscarMockPorId(id)
  if (!perfume) return { title: "Perfume não encontrado" }
  return {
    title: `${perfume.nome} — ${perfume.marca}`,
    description: perfume.descricao,
  }
}

export default async function PaginaPerfume({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Tenta API real primeiro; fallback para mock
  const perfumeApi = await buscarPerfumePorId(id).catch(() => null)
  const perfumeMock = buscarMockPorId(id)
  const perfume = (perfumeApi?.nome && perfumeApi?.marca) ? perfumeApi : perfumeMock

  // 404 amigável
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

  // Acordes vêm do mock se disponível
  const acordes = perfumeMock?.acordes ?? []

  return (
    <main>
      <div className="container-site" style={{ paddingTop: "3rem", paddingBottom: "5rem" }}>
        {/* Breadcrumb */}
        <p style={{ fontSize: "0.8rem", color: "var(--cor-texto-suave)", marginBottom: "3rem" }}>
          <Link href="/" style={{ color: "var(--cor-destaque)" }}>scently</Link>
          {" / "}
          <Link href="/" style={{ color: "var(--cor-texto-suave)" }}>{perfume.marca}</Link>
        </p>

        {/* Layout duas colunas — stack no mobile */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
            gap: "4rem",
            alignItems: "start",
          }}
        >
          {/* Coluna esquerda — imagem */}
          <div
            style={{
              backgroundColor: "var(--cor-borda)",
              aspectRatio: "3/4",
              borderRadius: "var(--raio-borda-suave)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              position: "sticky",
              top: "84px",
            }}
          >
            {perfume.imagem ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={perfume.imagem}
                alt={`${perfume.nome} — ${perfume.marca}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              // Placeholder com inicial da marca
              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    fontFamily: "var(--fonte-titulo)",
                    fontSize: "6rem",
                    fontWeight: 300,
                    color: "var(--cor-texto-suave)",
                    opacity: 0.25,
                    lineHeight: 1,
                    marginBottom: "0.5rem",
                  }}
                >
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
            {/* Tags */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
              {perfume.familia && <Tag>{perfume.familia}</Tag>}
              {perfume.concentracao && <Tag cor="dourado">{perfume.concentracao}</Tag>}
              {perfume.genero && <Tag>{perfume.genero}</Tag>}
              {perfume.ano > 0 && <Tag>{perfume.ano}</Tag>}
            </div>

            {/* Marca */}
            <p
              style={{
                fontFamily: "var(--fonte-titulo)",
                fontSize: "0.95rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--cor-texto-suave)",
                marginBottom: "0.4rem",
              }}
            >
              {perfume.marca}
            </p>

            {/* Nome */}
            <h1
              style={{
                fontFamily: "var(--fonte-titulo)",
                fontWeight: 300,
                lineHeight: 1.08,
                marginBottom: "2rem",
              }}
            >
              {perfume.nome}
            </h1>

            {/* Descrição */}
            <p style={{ lineHeight: 1.8, marginBottom: "2.5rem", fontSize: "0.95rem" }}>
              {perfume.descricao}
            </p>

            <div className="divisor" />

            {/* Pirâmide olfativa */}
            <div style={{ marginTop: "2rem", marginBottom: "2.5rem" }}>
              <NotasPerfume
                notasTopo={perfume.notasTopo}
                notasCoracao={perfume.notasCoracao}
                notasFundo={perfume.notasFundo}
              />
            </div>

            {/* Acordes principais */}
            {acordes.length > 0 && (
              <>
                <div className="divisor" />
                <div style={{ marginTop: "2rem", marginBottom: "2.5rem" }}>
                  <AcordesPerfume acordes={acordes} />
                </div>
              </>
            )}

            <div className="divisor" />

            {/* CTA para o consultor */}
            <div style={{ marginTop: "2rem" }}>
              <p style={{ fontSize: "0.85rem", color: "var(--cor-texto-suave)", marginBottom: "0.75rem" }}>
                Não tem certeza se é o certo para você?
              </p>
              <Link
                href="/consultor"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  color: "var(--cor-destaque)",
                  fontFamily: "var(--fonte-corpo)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  letterSpacing: "0.04em",
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

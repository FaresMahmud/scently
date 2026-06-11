import type { Metadata } from "next"
import { getTendencias, getUltimaAtualizacao } from "@/lib/tendencias"
import { getTendenciasEditoriais, type EntradaEditorial } from "@/lib/tendenciasEditorial"
import { getCopyTendencia } from "@/lib/copyTendencia"
import CardTendencia from "@/components/tendencias/CardTendencia"
import { slugify } from "@/lib/utils"
import { limparNomePerfume } from "@/lib/limparNomePerfume"

export const revalidate = 21600 // 6 hours

export const metadata: Metadata = {
  title: "Tendências — Nozze",
  description: "Os perfumes mais procurados agora. Tendências semanais do mundo da perfumaria — importados, contratipos e nacionais.",
  openGraph: {
    title: "Tendências em perfumaria — Nozze",
    description: "Os perfumes mais procurados agora. Atualizado toda semana.",
    type: "website",
    url: "https://nozze.app/tendencias",
  },
}

function limparBadge(badge: string): string {
  return badge.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}↑↓]/gu, "").trim()
}

// ── Seção editorial — banda escura full-width ────────────────────────────────

function SecaoEditorial({ eyebrow, titulo, entradas }: {
  eyebrow: string
  titulo: string
  entradas: EntradaEditorial[]
}) {
  if (entradas.length === 0) return null

  return (
    <section
      className="editorial-banda"
      style={{
        backgroundColor: "#1A1A18",
        borderTop: "1px solid rgba(245,242,237,0.08)",
        padding: "89px 0",
      }}
    >
      <div className="container-site" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <p style={{
          fontFamily: "var(--fonte-corpo)",
          fontSize: "13px",
          fontWeight: 500,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--cor-destaque)",
          marginBottom: "13px",
        }}>
          {eyebrow}
        </p>
        <h2 style={{
          fontFamily: "var(--fonte-titulo)",
          fontWeight: 300,
          fontSize: "clamp(34px, 5vw, 42px)",
          lineHeight: 1.1,
          color: "#F5F2ED",
          marginBottom: "55px",
        }}>
          {titulo}
        </h2>

        <div className="editorial-grid">
          {entradas.map(entrada => (
            <div
              key={entrada.titulo}
              className="editorial-banda-card"
              style={{
                backgroundColor: "rgba(255,255,255,0.04)",
                padding: "34px",
                display: "flex",
                flexDirection: "column",
                gap: "13px",
              }}
            >
              <h3 style={{
                fontFamily: "var(--fonte-titulo)",
                fontWeight: 300,
                fontSize: "26px",
                lineHeight: 1.15,
                color: "#F5F2ED",
                margin: 0,
              }}>
                {entrada.titulo}
              </h3>
              <p style={{
                fontFamily: "var(--fonte-corpo)",
                fontSize: "14px",
                color: "rgba(245,242,237,0.65)",
                lineHeight: 1.6,
                margin: 0,
                flexGrow: 1,
              }}>
                {entrada.descricao}
              </p>

              {entrada.sugestoes.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {entrada.sugestoes.map(s => {
                    const label = (
                      <span style={{
                        fontSize: "11px",
                        fontWeight: 500,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase" as const,
                        color: "rgba(245,242,237,0.4)",
                      }}>
                        {s.papel ?? s.genero}
                      </span>
                    )
                    return s.perfumeId ? (
                      <a
                        key={`${s.genero}-${s.nome}`}
                        href={`/perfume/${s.perfumeId}`}
                        className="link-seta editorial-banda-link"
                        style={{
                          fontFamily: "var(--fonte-corpo)",
                          fontSize: "13px",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "baseline",
                          gap: "8px",
                        }}
                      >
                        {label}
                        <span className="link-seta-arrow" aria-hidden>→</span>
                        <span className="editorial-banda-sugestao-nome" style={{ color: "var(--cor-destaque)", fontWeight: 500 }}>{s.nome}</span>
                      </a>
                    ) : (
                      <span
                        key={`${s.genero}-${s.nome}`}
                        style={{
                          fontFamily: "var(--fonte-corpo)",
                          fontSize: "13px",
                          display: "inline-flex",
                          alignItems: "baseline",
                          gap: "8px",
                        }}
                      >
                        {label}
                        <span style={{ color: "rgba(245,242,237,0.4)" }}>{s.nome}</span>
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default async function PaginaTendencias() {
  const [tendencias, ultimaAtualizacaoDate, editoriais] = await Promise.all([
    getTendencias(),
    getUltimaAtualizacao(),
    getTendenciasEditoriais(),
  ])

  // Generate copies in parallel — manual copies resolve instantly, API as fallback
  const copies = await Promise.all(
    tendencias.map(p => getCopyTendencia(p.nome, p.marca, p.familia).catch(() => ""))
  )

  const ultimaFormatada = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(ultimaAtualizacaoDate)

  return (
    <main>
      {/* ── Hero dark ──────────────────────────────────── */}
      <section style={{ backgroundColor: "#1A1A18", borderBottom: "1px solid rgba(245,242,237,0.08)" }}>
        <div className="container-site" style={{ paddingTop: "89px", paddingBottom: "89px" }}>
          <p style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: "13px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#C4714A",
            marginBottom: "21px",
          }}>
            tendências
          </p>
          <h1 style={{
            fontFamily: "Cormorant Garamond, serif",
            fontWeight: 300,
            fontSize: "clamp(42px, 7vw, 82px)",
            color: "#F5F2ED",
            lineHeight: 1.05,
            marginBottom: "34px",
            letterSpacing: "-0.02em",
            maxWidth: "700px",
          }}>
            O que o mundo está usando agora.
          </h1>
          <p style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: "14px",
            color: "rgba(245,242,237,0.35)",
            letterSpacing: "0.04em",
          }}>
            Atualizado em {ultimaFormatada}
          </p>
        </div>
      </section>

      {/* ── Esta semana ────────────────────────────────── */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 var(--espaco-interno)" }}>
        <div style={{ paddingTop: "55px", paddingBottom: "89px" }}>
          <p style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: "13px",
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(26,26,24,0.4)",
            marginBottom: "0",
          }}>
            Esta semana
          </p>

          {/* Cards — single column, borders as dividers */}
          {tendencias.map((p, i) => (
            <CardTendencia
              key={p.id}
              rank={i + 1}
              nome={p.nome}
              marca={p.marca}
              badge={limparBadge(p.badge)}
              tipo={p.tipo}
              preco={p.preco_estimado}
              copy={copies[i] || p.descricaoSensorial}
              perfumeId={p.perfumeId ?? `${slugify(limparNomePerfume(p.nome, p.marca))}-${slugify(p.marca)}`}
            />
          ))}

          {/* Bottom border */}
          <div style={{ borderTop: "1px solid rgba(26,26,24,0.12)", marginTop: "0" }} />
        </div>
      </div>

      {/* ── Seções editoriais — bandas escuras full-width ── */}
      <SecaoEditorial
        eyebrow="esta estação"
        titulo="Tendências de inverno"
        entradas={editoriais.inverno}
      />
      <SecaoEditorial
        eyebrow="próxima estação"
        titulo="De olho na primavera"
        entradas={editoriais.primavera}
      />
      <SecaoEditorial
        eyebrow="o mundo"
        titulo="O mundo da perfumaria"
        entradas={editoriais.global}
      />

      {/* ── CTA footer ─────────────────────────────────── */}
      <section style={{ backgroundColor: "#1A1A18", borderTop: "1px solid rgba(245,242,237,0.08)" }}>
        <div
          className="container-site"
          style={{
            paddingTop: "89px",
            paddingBottom: "89px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "21px",
          }}
        >
          <p style={{
            fontFamily: "Cormorant Garamond, serif",
            fontWeight: 300,
            fontSize: "clamp(26px, 4vw, 42px)",
            color: "#F5F2ED",
            maxWidth: "520px",
            lineHeight: 1.2,
          }}>
            Não sabe qual perfume é o seu?
          </p>
          <p style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: "16px",
            color: "rgba(245,242,237,0.55)",
            maxWidth: "380px",
            lineHeight: 1.6,
          }}>
            Responda algumas perguntas e descubra a fragrância certa para você.
          </p>
          <a
            href="/consultor"
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: "44px",
              padding: "0 34px",
              backgroundColor: "#C4714A",
              color: "#F5F2ED",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "0.875rem",
              fontWeight: 500,
              letterSpacing: "0.07em",
              borderRadius: "var(--raio-borda)",
              textDecoration: "none",
              marginTop: "13px",
            }}
          >
            Iniciar consulta gratuita
          </a>
        </div>
      </section>
    </main>
  )
}

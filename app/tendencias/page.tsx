import type { Metadata } from "next"
import { getTendencias, getUltimaAtualizacao } from "@/lib/tendencias"
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

export default async function PaginaTendencias() {
  const [tendencias, ultimaAtualizacaoDate] = await Promise.all([
    getTendencias(),
    getUltimaAtualizacao(),
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

      {/* ── Conteúdo editorial ─────────────────────────── */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 var(--espaco-interno)" }}>

        {/* Seção — Esta semana */}
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
              nome={p.nome}
              marca={p.marca}
              badge={limparBadge(p.badge)}
              tipo={p.tipo}
              preco={p.preco_estimado}
              copy={copies[i] || p.descricaoSensorial}
              perfumeId={`${slugify(limparNomePerfume(p.nome, p.marca))}-${slugify(p.marca)}`}
            />
          ))}

          {/* Bottom border */}
          <div style={{ borderTop: "1px solid rgba(26,26,24,0.12)", marginTop: "0" }} />
        </div>
      </div>

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

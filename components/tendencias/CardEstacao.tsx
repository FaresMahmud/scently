import Link from "next/link"
import type { PerfumeTendencia } from "@/lib/tendencias"

interface Props {
  perfume: PerfumeTendencia
  estacao: { nome: string; emoji: string }
  contexto: string // editorial sentence about the season + this fragrance
}

export default function CardEstacao({ perfume, estacao, contexto }: Props) {
  const href = `/catalogo?busca=${encodeURIComponent(`${perfume.nome} ${perfume.marca}`)}`

  return (
    <Link href={href} style={{ textDecoration: "none", display: "block" }}>
      <article
        style={{
          backgroundColor: "#1A1A18",
          borderRadius: "var(--raio-borda-suave)",
          padding: "34px",
          display: "flex",
          flexDirection: "column",
          gap: "21px",
          minHeight: "320px",
          cursor: "pointer",
          transition: "opacity 0.2s",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Season badge */}
        <span
          style={{
            fontFamily: "var(--fonte-corpo)",
            fontSize: "0.72rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#C4714A",
          }}
        >
          {estacao.emoji} {estacao.nome}
        </span>

        {/* Perfume name */}
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontFamily: "var(--fonte-corpo)",
              fontSize: "0.75rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(245,242,237,0.5)",
              marginBottom: "13px",
            }}
          >
            {perfume.marca}
          </p>
          <h3
            style={{
              fontFamily: "var(--fonte-titulo)",
              fontWeight: 300,
              fontSize: "clamp(26px, 3.5vw, 42px)",
              lineHeight: 1.08,
              color: "#F5F2ED",
              marginBottom: "21px",
            }}
          >
            {perfume.nome}
          </h3>
          <p
            style={{
              fontFamily: "var(--fonte-corpo)",
              fontSize: "16px",
              color: "rgba(245,242,237,0.65)",
              lineHeight: 1.7,
            }}
          >
            {contexto}
          </p>
        </div>

        {/* Bottom: sensorial description */}
        <p
          style={{
            fontFamily: "var(--fonte-titulo)",
            fontStyle: "italic",
            fontSize: "16px",
            fontWeight: 300,
            color: "rgba(245,242,237,0.4)",
            lineHeight: 1.5,
            borderTop: "1px solid rgba(245,242,237,0.1)",
            paddingTop: "21px",
          }}
        >
          "{perfume.descricaoSensorial}"
        </p>
      </article>
    </Link>
  )
}

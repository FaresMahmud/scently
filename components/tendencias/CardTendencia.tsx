import Link from "next/link"
import type { PerfumeTendencia } from "@/lib/tendencias"

interface Props {
  perfume: PerfumeTendencia
  destaque?: boolean
}

const TIPO_COR: Record<PerfumeTendencia["tipo"], { bg: string; text: string }> = {
  importado:  { bg: "rgba(196,113,74,0.1)",  text: "#C4714A" },
  contratipo: { bg: "rgba(201,168,76,0.1)",  text: "#C9A84C" },
  nacional:   { bg: "rgba(80,140,100,0.1)",  text: "#508C64" },
}

const TIPO_LABEL: Record<PerfumeTendencia["tipo"], string> = {
  importado:  "importado",
  contratipo: "contratipo",
  nacional:   "nacional",
}

export default function CardTendencia({ perfume, destaque = false }: Props) {
  const tc = TIPO_COR[perfume.tipo]
  const href = `/catalogo?busca=${encodeURIComponent(`${perfume.nome} ${perfume.marca}`)}`

  return (
    <Link
      href={href}
      style={{ textDecoration: "none", display: "block" }}
    >
      <article
        style={{
          // Golden ratio: width / height ≈ 1.618 — enforced via min-height
          // At 320px wide → ~198px tall; at 480px → ~297px tall
          aspectRatio: "1.618 / 1",
          backgroundColor: "var(--cor-card)",
          border: destaque
            ? "1px solid rgba(196,113,74,0.4)"
            : "1px solid rgba(26,26,24,0.1)",
          borderRadius: "var(--raio-borda-suave)",
          padding: "21px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transition: "border-color 0.2s",
          cursor: "pointer",
          boxSizing: "border-box",
        }}
      >
        {/* Top row: badge + tipo */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--fonte-corpo)",
              fontSize: "0.72rem",
              fontWeight: 500,
              letterSpacing: "0.06em",
              color: "var(--cor-texto-suave)",
            }}
          >
            {perfume.badge}
          </span>
          <span
            style={{
              fontFamily: "var(--fonte-corpo)",
              fontSize: "0.65rem",
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              backgroundColor: tc.bg,
              color: tc.text,
              padding: "3px 8px",
              borderRadius: "2px",
              whiteSpace: "nowrap",
            }}
          >
            {TIPO_LABEL[perfume.tipo]}
          </span>
        </div>

        {/* Center: name + brand */}
        <div>
          <p
            style={{
              fontFamily: "var(--fonte-corpo)",
              fontSize: "0.72rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--cor-texto-suave)",
              marginBottom: "8px",
            }}
          >
            {perfume.marca}
          </p>
          <h3
            style={{
              fontFamily: "var(--fonte-titulo)",
              fontWeight: 300,
              fontSize: "clamp(26px, 3vw, 42px)",
              lineHeight: 1.08,
              color: "var(--cor-texto)",
            }}
          >
            {perfume.nome}
          </h3>
        </div>

        {/* Bottom row: família + preço */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: "8px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--fonte-corpo)",
              fontSize: "0.75rem",
              color: "var(--cor-texto-suave)",
              letterSpacing: "0.04em",
            }}
          >
            {perfume.familia}
          </p>
          <p
            style={{
              fontFamily: "var(--fonte-titulo)",
              fontSize: "16px",
              fontWeight: 300,
              color: "var(--cor-texto)",
              letterSpacing: "0.04em",
              whiteSpace: "nowrap",
            }}
          >
            {perfume.preco_estimado}
          </p>
        </div>
      </article>
    </Link>
  )
}

import Link from "next/link"
import type { PerfumeTendencia } from "@/lib/tendencias"

interface Props {
  marca: string
  perfumes: PerfumeTendencia[]
}

export default function CardMarca({ marca, perfumes }: Props) {
  const href = `/catalogo?busca=${encodeURIComponent(marca)}`
  const familias = [...new Set(perfumes.map(p => p.familia))].slice(0, 2).join(" · ")

  return (
    <Link href={href} style={{ textDecoration: "none", display: "block" }}>
      <article
        style={{
          border: "1px solid rgba(26,26,24,0.1)",
          borderRadius: "var(--raio-borda-suave)",
          padding: "34px",
          backgroundColor: "var(--cor-base)",
          display: "flex",
          flexDirection: "column",
          gap: "21px",
          transition: "border-color 0.2s",
          cursor: "pointer",
        }}
      >
        {/* Brand initial — typographic treatment */}
        <div
          style={{
            width: "55px",
            height: "55px",
            border: "1px solid var(--cor-borda)",
            borderRadius: "var(--raio-borda)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: "var(--fonte-titulo)",
              fontWeight: 300,
              fontSize: "26px",
              color: "var(--cor-texto)",
              letterSpacing: "0.05em",
              lineHeight: 1,
            }}
          >
            {marca.slice(0, 2).toUpperCase()}
          </span>
        </div>

        {/* Brand name */}
        <div>
          <h3
            style={{
              fontFamily: "var(--fonte-titulo)",
              fontWeight: 300,
              fontSize: "26px",
              lineHeight: 1.1,
              color: "var(--cor-texto)",
              marginBottom: "8px",
            }}
          >
            {marca}
          </h3>
          {familias && (
            <p
              style={{
                fontFamily: "var(--fonte-corpo)",
                fontSize: "0.75rem",
                color: "var(--cor-texto-suave)",
                letterSpacing: "0.06em",
              }}
            >
              {familias}
            </p>
          )}
        </div>

        {/* Perfume count */}
        <p
          style={{
            fontFamily: "var(--fonte-corpo)",
            fontSize: "0.72rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#C4714A",
            marginTop: "auto",
          }}
        >
          {perfumes.length} perfume{perfumes.length !== 1 ? "s" : ""} em destaque →
        </p>
      </article>
    </Link>
  )
}

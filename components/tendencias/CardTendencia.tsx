import { limparNomePerfume } from "@/lib/limparNomePerfume"

interface CardTendenciaProps {
  nome: string
  marca: string
  badge?: string
  tipo?: string
  preco?: string
  copy?: string
  perfumeId?: string
  rank?: number
  variant?: "list" | "card"
  onClick?: () => void
}

export default function CardTendencia({ nome, marca, badge, tipo, preco, copy, perfumeId, rank, variant = "list" }: CardTendenciaProps) {
  const nomeClean = limparNomePerfume(nome, marca)

  const badgeCor = badge?.toLowerCase().includes("alta")     ? "var(--cor-destaque)"
    : badge?.toLowerCase().includes("destaque") ? "var(--cor-dourado)"
    : "var(--cor-texto-suave)"

  const BadgeEl = badge ? (
    <span style={{
      fontSize: "11px",
      fontFamily: "var(--fonte-corpo)",
      fontWeight: 500,
      color: badgeCor,
      border: `1px solid ${badgeCor}`,
      padding: "3px 10px",
      letterSpacing: "0.1em",
      textTransform: "uppercase" as const,
      borderRadius: "var(--raio-borda)",
      whiteSpace: "nowrap",
    }}>{badge}</span>
  ) : null

  const MetaRow = (
    <div style={{ display: "flex", alignItems: "center", gap: "13px 21px", flexWrap: "wrap", marginTop: "8px" }}>
      {tipo && (
        <span style={{
          fontSize: "13px",
          fontFamily: "var(--fonte-corpo)",
          color: "var(--cor-texto-suave)",
          opacity: 0.7,
        }}>{tipo}</span>
      )}
      {preco && (
        <span style={{
          fontSize: "13px",
          fontFamily: "var(--fonte-corpo)",
          color: "var(--cor-texto-suave)",
          opacity: 0.7,
        }}>{preco}</span>
      )}
      <a
        href={perfumeId ? `/perfume/${perfumeId}` : "/consultor"}
        className="link-seta"
        style={{
          marginLeft: "auto",
          fontSize: "13px",
          fontFamily: "var(--fonte-corpo)",
          fontWeight: 500,
          color: "var(--cor-destaque)",
          textDecoration: "none",
          letterSpacing: "0.06em",
          textTransform: "uppercase" as const,
          whiteSpace: "nowrap",
        }}
      >
        {perfumeId ? "Ver perfume" : "Consultar"}
        <span className="link-seta-arrow" aria-hidden> →</span>
      </a>
    </div>
  )

  /* ── Card variant ─────────────────────────────────────── */
  if (variant === "card") {
    return (
      <div
        className="tendencia-card"
        style={{
          backgroundColor: "rgba(26,26,24,0.03)",
          border: "1px solid var(--cor-borda)",
          padding: "34px",
          display: "flex",
          flexDirection: "column",
          gap: "13px",
        }}
      >
        {/* Top row: rank · marca · badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "13px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "13px" }}>
            {rank != null && (
              <span style={{
                fontSize: "11px",
                fontFamily: "var(--fonte-corpo)",
                fontWeight: 500,
                color: "var(--cor-destaque)",
                opacity: 0.55,
                letterSpacing: "0.1em",
                userSelect: "none",
              }} aria-hidden>
                {String(rank).padStart(2, "0")}
              </span>
            )}
            <span style={{
              fontSize: "13px",
              fontFamily: "var(--fonte-corpo)",
              color: "var(--cor-texto-suave)",
              letterSpacing: "0.12em",
              textTransform: "uppercase" as const,
            }}>{marca}</span>
          </div>
          {BadgeEl}
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: "34px",
          fontFamily: "var(--fonte-titulo)",
          fontWeight: 300,
          color: "var(--cor-texto)",
          margin: 0,
          lineHeight: 1.1,
          letterSpacing: "-0.01em",
        }}>{nomeClean}</h3>

        {/* Copy */}
        {copy && (
          <p style={{
            fontSize: "15px",
            fontFamily: "var(--fonte-corpo)",
            color: "var(--cor-texto-suave)",
            margin: 0,
            lineHeight: 1.55,
            flex: 1,
          }}>{copy}</p>
        )}

        {MetaRow}
      </div>
    )
  }

  /* ── List variant (default) ───────────────────────────── */
  return (
    <div style={{
      borderTop: "1px solid var(--cor-borda)",
      paddingTop: "34px",
      paddingBottom: "34px",
      display: "flex",
      gap: "21px",
    }}>
      {/* Ghost numeral */}
      {rank != null && (
        <span className="card-tendencia-rank" aria-hidden style={{
          fontFamily: "var(--fonte-titulo)",
          fontSize: "42px",
          fontWeight: 300,
          lineHeight: 1,
          color: "var(--cor-destaque)",
          opacity: 0.3,
          minWidth: "55px",
          userSelect: "none",
        }}>
          {String(rank).padStart(2, "0")}
        </span>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "13px", flex: 1 }}>
        {/* Brand + badge row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "13px" }}>
          <span style={{
            fontSize: "13px",
            fontFamily: "var(--fonte-corpo)",
            color: "var(--cor-texto-suave)",
            letterSpacing: "0.12em",
            textTransform: "uppercase" as const,
          }}>{marca}</span>
          {BadgeEl}
        </div>

        {/* Perfume name */}
        <h3 style={{
          fontSize: "42px",
          fontFamily: "var(--fonte-titulo)",
          fontWeight: 300,
          color: "var(--cor-texto)",
          margin: 0,
          lineHeight: 1.1,
          letterSpacing: "-0.01em",
        }}>{nomeClean}</h3>

        {/* Copy line */}
        {copy && (
          <p style={{
            fontSize: "16px",
            fontFamily: "var(--fonte-corpo)",
            color: "var(--cor-texto-suave)",
            margin: 0,
            lineHeight: 1.5,
            maxWidth: "480px",
          }}>{copy}</p>
        )}

        {MetaRow}
      </div>
    </div>
  )
}

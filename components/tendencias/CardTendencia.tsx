import { limparNomePerfume } from "@/lib/limparNomePerfume"

interface CardTendenciaProps {
  nome: string
  marca: string
  badge?: string
  tipo?: string
  preco?: string
  copy?: string
  perfumeId?: string
  onClick?: () => void
}

export default function CardTendencia({ nome, marca, badge, tipo, preco, copy, perfumeId }: CardTendenciaProps) {
  const nomeClean = limparNomePerfume(nome, marca)

  const badgeColor = badge?.toLowerCase().includes("alta")     ? "#C4714A"
    : badge?.toLowerCase().includes("destaque") ? "#C9A84C"
    : "rgba(26,26,24,0.12)"

  const badgeText = badge?.toLowerCase().includes("alta")     ? "#F5F2ED"
    : badge?.toLowerCase().includes("destaque") ? "#F5F2ED"
    : "#1A1A18"

  return (
    <div style={{
      borderTop: "1px solid rgba(26,26,24,0.12)",
      paddingTop: "34px",
      paddingBottom: "34px",
      display: "flex",
      flexDirection: "column",
      gap: "13px",
    }}>
      {/* Brand + badge row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontSize: "13px",
          fontFamily: "DM Sans, sans-serif",
          color: "rgba(26,26,24,0.5)",
          letterSpacing: "0.08em",
          textTransform: "uppercase" as const,
        }}>{marca}</span>
        {badge && (
          <span style={{
            fontSize: "11px",
            fontFamily: "DM Sans, sans-serif",
            backgroundColor: badgeColor,
            color: badgeText,
            padding: "4px 10px",
            letterSpacing: "0.06em",
            textTransform: "uppercase" as const,
          }}>{badge}</span>
        )}
      </div>

      {/* Perfume name */}
      <h3 style={{
        fontSize: "42px",
        fontFamily: "Cormorant Garamond, serif",
        fontWeight: 300,
        color: "#1A1A18",
        margin: 0,
        lineHeight: 1.1,
        letterSpacing: "-0.01em",
      }}>{nomeClean}</h3>

      {/* Copy line */}
      {copy && (
        <p style={{
          fontSize: "16px",
          fontFamily: "DM Sans, sans-serif",
          color: "rgba(26,26,24,0.65)",
          margin: 0,
          lineHeight: 1.5,
          maxWidth: "480px",
        }}>{copy}</p>
      )}

      {/* Meta row */}
      <div style={{ display: "flex", alignItems: "center", gap: "21px", marginTop: "8px" }}>
        {tipo && (
          <span style={{
            fontSize: "13px",
            fontFamily: "DM Sans, sans-serif",
            color: "rgba(26,26,24,0.4)",
          }}>{tipo}</span>
        )}
        {preco && (
          <span style={{
            fontSize: "13px",
            fontFamily: "DM Sans, sans-serif",
            color: "rgba(26,26,24,0.4)",
          }}>{preco}</span>
        )}
        <a
          href={perfumeId ? `/perfume/${perfumeId}` : "/consultor"}
          style={{
            marginLeft: "auto",
            fontSize: "13px",
            fontFamily: "DM Sans, sans-serif",
            color: "#C4714A",
            textDecoration: "none",
            letterSpacing: "0.06em",
            textTransform: "uppercase" as const,
          }}
        >{perfumeId ? "Ver perfume →" : "Consultar →"}</a>
      </div>
    </div>
  )
}

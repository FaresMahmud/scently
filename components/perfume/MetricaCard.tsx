// ============================================
// ARQUIVO: components/perfume/MetricaCard.tsx
// O QUE FAZ: card de métrica (duração, sillage, avaliação) com tooltip no hover
// QUANDO MANDAR PRA IA: quando quiser mudar visual ou textos das métricas
// DEPENDE DE: nada
// ============================================

"use client"

import { useState } from "react"

interface Props {
  label: string
  valor: string
  bg: string
  borda: string
  texto: string
  tooltip: string
}

export default function MetricaCard({ label, valor, bg, borda, texto, tooltip }: Props) {
  const [hover, setHover] = useState(false)

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "8px 16px",
        borderRadius: "8px",
        background: bg,
        border: `1px solid ${borda}`,
        minWidth: "85px",
        cursor: "help",
      }}
    >
      <span style={{ fontSize: "10px", color: "var(--cor-texto-suave)", letterSpacing: "0.1em", marginBottom: "4px", fontFamily: "var(--fonte-corpo)" }}>
        {label}
      </span>
      <span style={{ fontSize: "13px", fontWeight: 500, color: texto, fontFamily: "var(--fonte-corpo)" }}>
        {valor}
      </span>
      {hover && (
        <div style={{
          position: "absolute",
          bottom: "calc(100% + 8px)",
          left: "50%",
          transform: "translateX(-50%)",
          width: "200px",
          background: "var(--cor-base)",
          border: "1px solid var(--cor-borda)",
          borderRadius: "8px",
          padding: "10px 12px",
          fontSize: "12px",
          lineHeight: 1.6,
          color: "var(--cor-texto)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          zIndex: 10,
          whiteSpace: "normal",
          textAlign: "center",
        }}>
          {tooltip}
        </div>
      )}
    </div>
  )
}

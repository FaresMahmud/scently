// ============================================
// ARQUIVO: components/perfume/MetricaCard.tsx
// O QUE FAZ: card de métrica pill (duração, sillage, avaliação) com tooltip no hover
// QUANDO MANDAR PRA IA: quando quiser mudar visual ou textos das métricas
// DEPENDE DE: nada
// ============================================

"use client"

import { useState } from "react"

interface Props {
  label: string
  valor: string
  corTexto: string
  tooltip: string
}

export default function MetricaCard({ label, valor, corTexto, tooltip }: Props) {
  const [hover, setHover] = useState(false)

  return (
    <div style={{ position: "relative" }}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1px",
          padding: "6px 16px",
          borderRadius: "999px",
          border: "1px solid #D4C8B8",
          background: hover ? "#F5F0EA" : "transparent",
          cursor: "help",
          transition: "background 0.15s",
        }}
      >
        <span style={{
          fontSize: "9px",
          letterSpacing: "0.12em",
          color: "#9B8B78",
          fontWeight: 500,
          textTransform: "uppercase" as const,
        }}>
          {label}
        </span>
        <span style={{ fontSize: "12px", fontWeight: 500, color: corTexto }}>
          {valor}
        </span>
      </div>
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

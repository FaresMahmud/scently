// ============================================
// ARQUIVO: components/perfume/MetricaCard.tsx
// O QUE FAZ: card de métrica pill (duração, sillage, avaliação) com tooltip clamped ao viewport
// QUANDO MANDAR PRA IA: quando quiser mudar visual ou textos das métricas
// DEPENDE DE: nada
// ============================================

"use client"

import { useState, useRef } from "react"

interface Props {
  label: string
  valor: string
  corTexto: string
  tooltip: string
}

export default function MetricaCard({ label, valor, corTexto, tooltip }: Props) {
  const [hover,      setHover]      = useState(false)
  const [touched,    setTouched]    = useState(false)
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, width: 200 })
  const pillRef = useRef<HTMLDivElement>(null)
  const visible = hover || touched

  function updateTooltipPos() {
    if (!pillRef.current) return
    const rect = pillRef.current.getBoundingClientRect()
    const tooltipWidth = Math.min(200, window.innerWidth - 32)
    let left = rect.left + rect.width / 2 - tooltipWidth / 2
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16))
    setTooltipPos({ top: rect.top - 8, left, width: tooltipWidth })
  }

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={pillRef}
        onMouseEnter={() => { updateTooltipPos(); setHover(true) }}
        onMouseLeave={() => setHover(false)}
        onTouchStart={(e) => { e.preventDefault(); updateTooltipPos(); setTouched(t => !t) }}
        style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1px",
          padding: "8px 13px",
          minHeight: "44px",
          borderRadius: "999px",
          border: "1px solid #D4C8B8",
          background: visible ? "#F5F0EA" : "transparent",
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
      {visible && (
        <div style={{
          position: "fixed",
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: tooltipPos.width,
          transform: "translateY(calc(-100% - 8px))",
          background: "var(--cor-base)",
          border: "1px solid var(--cor-borda)",
          borderRadius: "8px",
          padding: "10px 12px",
          fontSize: "12px",
          lineHeight: 1.6,
          color: "var(--cor-texto)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          zIndex: 1000,
          whiteSpace: "normal",
          textAlign: "center",
          pointerEvents: "none",
        }}>
          {tooltip}
        </div>
      )}
    </div>
  )
}

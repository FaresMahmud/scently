// ============================================
// ARQUIVO: components/consultor/SelecaoModo.tsx
// O QUE FAZ: tela inicial — usuário escolhe entre quiz free (6q) ou premium (8q, Nozze+)
// QUANDO MANDAR PRA IA: quando quiser mudar a apresentação inicial do consultor
// DEPENDE DE: styles/globals.css
// ============================================

"use client"

import { useState } from "react"

interface PropsSelecaoModo {
  onSelecionar: (modo: "free" | "premium") => void
}

export default function SelecaoModo({ onSelecionar }: PropsSelecaoModo) {
  const [hovered, setHovered] = useState<"free" | "premium" | null>(null)

  return (
    <div style={{ maxWidth: "560px", margin: "0 auto" }}>
      {/* Título */}
      <h1
        style={{
          fontFamily: "var(--fonte-titulo)",
          fontWeight: 300,
          fontSize: "clamp(26px, 5vw, 42px)",
          marginBottom: "13px",
          lineHeight: 1.15,
        }}
      >
        seu consultor
      </h1>

      <p
        style={{
          fontFamily: "var(--fonte-corpo)",
          fontSize: "0.9rem",
          color: "var(--cor-texto-suave)",
          marginBottom: "34px",
          maxWidth: "420px",
          lineHeight: 1.6,
        }}
      >
        Vamos encontrar o perfume certo para você.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
        {/* Quiz gratuito */}
        <button
          onClick={() => onSelecionar("free")}
          onMouseEnter={() => setHovered("free")}
          onMouseLeave={() => setHovered(null)}
          style={{ display: "block", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <div
            style={{
              padding: "21px",
              backgroundColor: "var(--cor-card)",
              border: hovered === "free" ? "1.5px solid var(--cor-destaque)" : "1px solid var(--cor-borda)",
              borderRadius: "var(--raio-borda-suave)",
              transition: "border-color 0.15s",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "13px" }}>
              <div>
                {/* Badge */}
                <span
                  style={{
                    display: "inline-block",
                    fontSize: "0.65rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "99px",
                    backgroundColor: "rgba(196,113,74,0.1)",
                    color: "var(--cor-destaque)",
                    border: "1px solid rgba(196,113,74,0.3)",
                    marginBottom: "10px",
                  }}
                >
                  Gratuito · 8 perguntas · 1 recomendação
                </span>
                <p
                  style={{
                    fontFamily: "var(--fonte-titulo)",
                    fontSize: "26px",
                    fontWeight: 300,
                    marginBottom: "6px",
                    color: "var(--cor-texto)",
                  }}
                >
                  Consulta rápida
                </p>
                <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.82rem", color: "var(--cor-texto-suave)", lineHeight: 1.5 }}>
                  Resultado em 1 minuto. 1 recomendação personalizada.
                </p>
              </div>
              <span style={{ color: "var(--cor-destaque)", fontSize: "1.1rem", marginTop: "0.3rem", flexShrink: 0 }}>→</span>
            </div>
          </div>
        </button>

        {/* Quiz premium */}
        <button
          onClick={() => onSelecionar("premium")}
          onMouseEnter={() => setHovered("premium")}
          onMouseLeave={() => setHovered(null)}
          style={{ display: "block", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <div
            style={{
              padding: "21px",
              backgroundColor: "var(--cor-card)",
              border: hovered === "premium" ? "1.5px solid var(--cor-dourado)" : "1px solid var(--cor-borda)",
              borderRadius: "var(--raio-borda-suave)",
              transition: "border-color 0.15s",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "13px" }}>
              <div>
                {/* Badge */}
                <span
                  style={{
                    display: "inline-block",
                    fontSize: "0.65rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "99px",
                    backgroundColor: "rgba(180,148,72,0.12)",
                    color: "var(--cor-dourado)",
                    border: "1px solid rgba(180,148,72,0.35)",
                    marginBottom: "10px",
                  }}
                >
                  Nozze+ · 10 perguntas · 3 recomendações
                </span>
                <p
                  style={{
                    fontFamily: "var(--fonte-titulo)",
                    fontSize: "26px",
                    fontWeight: 300,
                    marginBottom: "6px",
                    color: "var(--cor-texto)",
                  }}
                >
                  Consulta completa
                </p>
                <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.82rem", color: "var(--cor-texto-suave)", lineHeight: 1.5 }}>
                  Análise profunda em 10 etapas. Recomendação mais precisa.
                </p>
              </div>
              <span style={{ color: "var(--cor-dourado)", fontSize: "1.1rem", marginTop: "0.3rem", flexShrink: 0 }}>→</span>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}

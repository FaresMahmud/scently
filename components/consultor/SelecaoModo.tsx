// ============================================
// ARQUIVO: components/consultor/SelecaoModo.tsx
// O QUE FAZ: tela inicial do consultor — usuário escolhe entre consulta rápida (4 perguntas) ou completa (8)
// QUANDO MANDAR PRA IA: quando quiser mudar a apresentação inicial do consultor
// DEPENDE DE: config/site.ts, components/ui/Card.tsx, styles/globals.css
// ============================================

"use client"

import Card from "@/components/ui/Card"
import { textosConsultor } from "@/config/site"

interface PropsSelecaoModo {
  onSelecionar: (modo: "rapido" | "aprofundado") => void
}

export default function SelecaoModo({ onSelecionar }: PropsSelecaoModo) {
  return (
    <div style={{ maxWidth: "560px", margin: "0 auto" }}>
      {/* Título */}
      <h1
        style={{
          fontFamily: "var(--fonte-titulo)",
          fontWeight: 300,
          fontSize: "clamp(2rem, 5vw, 3rem)",
          marginBottom: "0.75rem",
          lineHeight: 1.15,
        }}
      >
        {textosConsultor.titulo}
      </h1>

      <p style={{ marginBottom: "3rem", maxWidth: "420px" }}>
        {textosConsultor.subtituloInicio}
      </p>

      {/* Opções de modo */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Modo rápido */}
        <button
          onClick={() => onSelecionar("rapido")}
          style={{ display: "block", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <Card
            style={{
              transition: "border-color 0.2s",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
              <div>
                <p
                  style={{
                    fontFamily: "var(--fonte-titulo)",
                    fontSize: "1.35rem",
                    fontWeight: 300,
                    marginBottom: "0.35rem",
                    color: "var(--cor-texto)",
                  }}
                >
                  {textosConsultor.botaoModoRapido}
                </p>
                <p style={{ fontSize: "0.85rem", color: "var(--cor-texto-suave)" }}>
                  {textosConsultor.botaoModoRapidoDescricao}
                </p>
              </div>
              {/* Seta decorativa */}
              <span style={{ color: "var(--cor-destaque)", fontSize: "1.2rem", marginTop: "0.2rem" }}>→</span>
            </div>
          </Card>
        </button>

        {/* Modo aprofundado */}
        <button
          onClick={() => onSelecionar("aprofundado")}
          style={{ display: "block", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <Card
            style={{
              transition: "border-color 0.2s",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
              <div>
                <p
                  style={{
                    fontFamily: "var(--fonte-titulo)",
                    fontSize: "1.35rem",
                    fontWeight: 300,
                    marginBottom: "0.35rem",
                    color: "var(--cor-texto)",
                  }}
                >
                  {textosConsultor.botaoModoAprofundado}
                </p>
                <p style={{ fontSize: "0.85rem", color: "var(--cor-texto-suave)" }}>
                  {textosConsultor.botaoModoAprofundadoDescricao}
                </p>
              </div>
              <span style={{ color: "var(--cor-dourado)", fontSize: "1.2rem", marginTop: "0.2rem" }}>→</span>
            </div>
          </Card>
        </button>
      </div>
    </div>
  )
}

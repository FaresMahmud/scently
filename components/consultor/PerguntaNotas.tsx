// ============================================
// ARQUIVO: components/consultor/PerguntaNotas.tsx
// O QUE FAZ: pergunta de seleção visual de notas — usuário marca o que ama e o que odeia
// QUANDO MANDAR PRA IA: quando quiser mudar como a seleção de notas funciona
// DEPENDE DE: styles/globals.css
// ============================================

"use client"

import { useState } from "react"
import Botao from "@/components/ui/Botao"

interface Nota {
  valor: string
  texto: string
  icone: string
}

interface PropsPerguntaNotas {
  notas: Nota[]
  progresso: string
  onResponder: (amadas: string[], odiadas: string[]) => void
}

type EstadoNota = "neutro" | "amo" | "odeio"

export default function PerguntaNotas({ notas, progresso, onResponder }: PropsPerguntaNotas) {
  // Rastreia o estado de cada nota (neutro / amo / odeio)
  const [estados, setEstados] = useState<Record<string, EstadoNota>>({})

  function alternarNota(valor: string) {
    setEstados((anterior) => {
      const atual = anterior[valor] ?? "neutro"
      // Ciclo: neutro → amo → odeio → neutro
      const proximo: EstadoNota = atual === "neutro" ? "amo" : atual === "amo" ? "odeio" : "neutro"
      return { ...anterior, [valor]: proximo }
    })
  }

  function confirmar() {
    const amadas = Object.entries(estados).filter(([, v]) => v === "amo").map(([k]) => k)
    const odiadas = Object.entries(estados).filter(([, v]) => v === "odeio").map(([k]) => k)
    onResponder(amadas, odiadas)
  }

  // Cor de fundo por estado
  const coresFundo: Record<EstadoNota, string> = {
    neutro: "var(--cor-card)",
    amo:    "var(--cor-destaque)",
    odeio:  "#4A4A47",
  }

  const coresTexto: Record<EstadoNota, string> = {
    neutro: "var(--cor-texto)",
    amo:    "#fff",
    odeio:  "#fff",
  }

  return (
    <div style={{ maxWidth: "560px", margin: "0 auto" }}>
      {/* Progresso */}
      <p style={{ fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cor-destaque)", marginBottom: "21px" }}>
        {progresso}
      </p>

      <h2 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "clamp(26px, 4vw, 42px)", marginBottom: "13px" }}>
        Tem nota que você ama ou odeia?
      </h2>

      {/* Instrução de como usar */}
      <p style={{ fontSize: "0.82rem", color: "var(--cor-texto-suave)", marginBottom: "34px" }}>
        Toque uma vez para marcar como favorita, duas vezes para marcar como evitar.
      </p>

      {/* Grade de notas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "8px", marginBottom: "34px" }}>
        {notas.map((nota) => {
          const estado = estados[nota.valor] ?? "neutro"
          return (
            <button
              key={nota.valor}
              onClick={() => alternarNota(nota.valor)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.4rem",
                padding: "1rem 0.5rem",
                backgroundColor: coresFundo[estado],
                color: coresTexto[estado],
                border: `1px solid ${estado === "neutro" ? "var(--cor-borda)" : "transparent"}`,
                borderRadius: "var(--raio-borda-suave)",
                cursor: "pointer",
                transition: "all 0.15s",
                fontFamily: "var(--fonte-corpo)",
              }}
            >
              <span style={{ fontSize: "1.4rem" }}>{nota.icone}</span>
              <span style={{ fontSize: "0.78rem", fontWeight: 400 }}>{nota.texto}</span>
              {estado !== "neutro" && (
                <span style={{ fontSize: "0.65rem", opacity: 0.85 }}>
                  {estado === "amo" ? "✓ adoro" : "✕ evitar"}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <Botao onClick={confirmar}>
        Continuar
      </Botao>
    </div>
  )
}

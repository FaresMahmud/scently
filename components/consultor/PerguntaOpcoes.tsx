// ============================================
// ARQUIVO: components/consultor/PerguntaOpcoes.tsx
// O QUE FAZ: pergunta de escolha — simples (auto-avança) ou múltipla (botão Continuar)
// QUANDO MANDAR PRA IA: quando quiser mudar o layout ou comportamento das perguntas
// DEPENDE DE: styles/globals.css
// ============================================

"use client"

import { useState } from "react"

interface Opcao {
  valor: string
  texto: string
  icone?: string
}

interface PropsPerguntaOpcoes {
  pergunta: string
  opcoes: Opcao[]
  progresso: string
  multipla?: boolean
  onResponder: (valor: string) => void
}

export default function PerguntaOpcoes({ pergunta, opcoes, progresso, multipla = false, onResponder }: PropsPerguntaOpcoes) {
  // Seleção única
  const [selecionado, setSelecionado] = useState<string | null>(null)
  // Seleção múltipla
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [hovered, setHovered] = useState<string | null>(null)

  // ── Seleção única — auto-avança após 280ms ──
  function selecionar(valor: string) {
    if (selecionado) return
    setSelecionado(valor)
    setTimeout(() => onResponder(valor), 280)
  }

  // ── Seleção múltipla — toggle ──
  function toggleMultipla(valor: string) {
    setSelecionados((prev) =>
      prev.includes(valor) ? prev.filter((v) => v !== valor) : [...prev, valor]
    )
  }

  function confirmarMultipla() {
    if (!selecionados.length) return
    onResponder(selecionados.join(","))
  }

  // Estilo compartilhado de cada opção
  function estiloOpcao(valor: string): React.CSSProperties {
    const ativo = multipla ? selecionados.includes(valor) : selecionado === valor
    const emHover = hovered === valor && !ativo

    return {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      width: "100%",
      padding: "1.1rem 1.5rem",
      minHeight: "44px",
      backgroundColor: ativo ? "rgba(196,113,74,0.06)" : "var(--cor-card)",
      color: "var(--cor-texto)",
      fontWeight: ativo ? 400 : 300,
      border: ativo
        ? "1.5px solid var(--cor-destaque)"
        : emHover
        ? "1px solid var(--cor-texto-suave)"
        : "1px solid var(--cor-borda)",
      borderRadius: "var(--raio-borda-suave)",
      cursor: "pointer",
      textAlign: "left",
      fontFamily: "var(--fonte-corpo)",
      fontSize: "0.9rem",
      transition: "border-color 0.15s, background-color 0.15s",
    }
  }

  return (
    <div style={{ maxWidth: "560px", margin: "0 auto" }}>
      <h2
        style={{
          fontFamily: "var(--fonte-titulo)",
          fontWeight: 300,
          fontSize: "clamp(26px, 4vw, 42px)",
          marginBottom: multipla ? "8px" : "34px",
          lineHeight: 1.2,
        }}
      >
        {pergunta}
      </h2>

      {/* Instrução de múltipla seleção */}
      {multipla && (
        <p style={{ fontSize: "0.8rem", color: "var(--cor-texto-suave)", marginBottom: "21px" }}>
          Pode selecionar mais de uma.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {opcoes.map((opcao) => (
          <button
            key={opcao.valor}
            onClick={() => multipla ? toggleMultipla(opcao.valor) : selecionar(opcao.valor)}
            onMouseEnter={() => setHovered(opcao.valor)}
            onMouseLeave={() => setHovered(null)}
            onTouchStart={() => setHovered(opcao.valor)}
            onTouchEnd={() => setHovered(null)}
            style={estiloOpcao(opcao.valor)}
          >
            {opcao.icone && <span style={{ fontSize: "1.1rem" }}>{opcao.icone}</span>}
            {opcao.texto}
          </button>
        ))}
      </div>

      {/* Botão Continuar — só para múltipla seleção */}
      {multipla && (
        <button
          onClick={confirmarMultipla}
          disabled={selecionados.length === 0}
          style={{
            marginTop: "21px",
            display: "inline-flex",
            alignItems: "center",
            backgroundColor: "var(--cor-destaque)",
            color: "#fff",
            fontFamily: "var(--fonte-corpo)",
            fontSize: "0.875rem",
            fontWeight: 500,
            letterSpacing: "0.07em",
            padding: "0.875rem 2rem",
            minHeight: "44px",
            borderRadius: "var(--raio-borda)",
            border: "none",
            cursor: selecionados.length ? "pointer" : "not-allowed",
            opacity: selecionados.length ? 1 : 0.4,
            transition: "opacity 0.2s",
          }}
        >
          Continuar
        </button>
      )}
    </div>
  )
}

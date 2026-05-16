// ============================================
// ARQUIVO: components/ui/OpcaoQuiz.tsx
// O QUE FAZ: botão de opção do quiz — muda visual quando selecionado
// QUANDO MANDAR PRA IA: quando quiser mudar como as opções do quiz aparecem
// DEPENDE DE: styles/globals.css
// ============================================

"use client"

interface PropsOpcaoQuiz {
  texto: string
  selecionado: boolean
  onClick: () => void
  icone?: string
  subtexto?: string
}

export default function OpcaoQuiz({ texto, selecionado, onClick, icone, subtexto }: PropsOpcaoQuiz) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "0.25rem",
        width: "100%",
        padding: "1rem 1.25rem",
        backgroundColor: selecionado ? "var(--cor-destaque)" : "var(--cor-card)",
        color: selecionado ? "#fff" : "var(--cor-texto)",
        border: selecionado
          ? "1px solid var(--cor-destaque)"
          : "1px solid var(--cor-borda)",
        borderRadius: "var(--raio-borda-suave)",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.15s ease",
        fontFamily: "var(--fonte-corpo)",
      }}
    >
      {/* Ícone + texto principal */}
      <span style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        {icone && <span style={{ fontSize: "1.1rem" }}>{icone}</span>}
        <span style={{ fontSize: "0.9rem", fontWeight: 400 }}>{texto}</span>
      </span>

      {/* Subtexto opcional — aparece mais suave */}
      {subtexto && (
        <span
          style={{
            fontSize: "0.78rem",
            opacity: selecionado ? 0.85 : 0.6,
            fontWeight: 300,
          }}
        >
          {subtexto}
        </span>
      )}
    </button>
  )
}

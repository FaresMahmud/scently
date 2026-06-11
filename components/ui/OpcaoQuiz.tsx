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
      className="opcao-quiz"
      aria-pressed={selecionado}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "0.25rem",
        width: "100%",
        padding: "1rem 1.25rem",
        backgroundColor: selecionado ? "rgba(196, 113, 74, 0.06)" : "var(--cor-card)",
        color: "var(--cor-texto)",
        border: selecionado
          ? "1px solid var(--cor-destaque)"
          : "1px solid var(--cor-borda)",
        borderRadius: "var(--raio-borda-suave)",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "var(--fonte-corpo)",
        position: "relative",
      }}
    >
      {/* Ícone + texto principal + indicador de seleção */}
      <span style={{ display: "flex", alignItems: "center", gap: "0.6rem", width: "100%" }}>
        {icone && <span style={{ fontSize: "1.1rem" }}>{icone}</span>}
        <span style={{ fontSize: "0.9rem", fontWeight: selecionado ? 500 : 400 }}>{texto}</span>
        {/* Ponto terracota — confirmação discreta da escolha */}
        <span
          aria-hidden
          style={{
            marginLeft: "auto",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "var(--cor-destaque)",
            opacity: selecionado ? 1 : 0,
            transform: selecionado ? "scale(1)" : "scale(0.5)",
            transition: "opacity 0.25s ease, transform 0.25s cubic-bezier(0.23, 1, 0.32, 1)",
            flexShrink: 0,
          }}
        />
      </span>

      {/* Subtexto opcional — aparece mais suave */}
      {subtexto && (
        <span
          style={{
            fontSize: "0.78rem",
            color: "var(--cor-texto-suave)",
            fontWeight: 300,
          }}
        >
          {subtexto}
        </span>
      )}
    </button>
  )
}

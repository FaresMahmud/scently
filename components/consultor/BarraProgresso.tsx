// ============================================
// ARQUIVO: components/consultor/BarraProgresso.tsx
// O QUE FAZ: barra fina no topo do quiz que mostra o progresso visual das perguntas
// QUANDO MANDAR PRA IA: quando quiser mudar o visual da barra de progresso
// DEPENDE DE: styles/globals.css
// ============================================

"use client"

interface PropsBarraProgresso {
  atual: number   // passo atual, 0-based
  total: number
}

export default function BarraProgresso({ atual, total }: PropsBarraProgresso) {
  const porcentagem = Math.round((atual / total) * 100)
  const perguntaAtual = Math.min(atual + 1, total)

  return (
    <div style={{ marginBottom: "34px" }}>
      {/* Contador — cada resposta é uma conquista, não um formulário */}
      <p style={{
        fontFamily: "var(--fonte-corpo)",
        fontSize: "0.72rem",
        fontWeight: 500,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "var(--cor-texto-suave)",
        marginBottom: "13px",
      }}>
        pergunta {perguntaAtual} de {total}
      </p>
      <div
        style={{
          width: "100%",
          height: "3px",
          backgroundColor: "var(--cor-borda)",
          borderRadius: "2px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${porcentagem}%`,
            backgroundColor: "var(--cor-destaque)",
            borderRadius: "2px",
            transition: "width 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        />
      </div>
    </div>
  )
}

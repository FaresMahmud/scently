// ============================================
// ARQUIVO: components/consultor/BarraProgresso.tsx
// O QUE FAZ: barra fina no topo do quiz que mostra o progresso visual das perguntas
// QUANDO MANDAR PRA IA: quando quiser mudar o visual da barra de progresso
// DEPENDE DE: styles/globals.css
// ============================================

"use client"

interface PropsBarraProgresso {
  atual: number
  total: number
}

export default function BarraProgresso({ atual, total }: PropsBarraProgresso) {
  const porcentagem = Math.round((atual / total) * 100)

  return (
    <div style={{ marginBottom: "34px" }}>
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
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  )
}

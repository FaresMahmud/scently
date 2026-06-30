// ============================================
// ARQUIVO: components/consultor/PerguntaBinariaDupla.tsx
// O QUE FAZ: pergunta com 2 pares A/B na mesma tela (ex: projeção + ousadia) —
//            conta como 1 pergunta na barra de progresso, avança quando os 2
//            pares estiverem respondidos
// QUANDO MANDAR PRA IA: quando quiser mudar o layout dessa pergunta combinada
// DEPENDE DE: styles/globals.css
// ============================================

"use client"

import { useState } from "react"
import type { ParBinario } from "@/lib/quiz/questions"

interface PropsPerguntaBinariaDupla {
  pergunta: string
  pares: ParBinario[]
  onResponder: (valores: Record<string, string>) => void
}

export default function PerguntaBinariaDupla({ pergunta, pares, onResponder }: PropsPerguntaBinariaDupla) {
  const [selecoes, setSelecoes] = useState<Record<string, string>>({})

  function selecionar(parId: string, valor: string) {
    const novas = { ...selecoes, [parId]: valor }
    setSelecoes(novas)
    // Avança automaticamente só quando todos os pares tiverem resposta
    if (pares.every((p) => novas[p.id])) {
      setTimeout(() => onResponder(novas), 280)
    }
  }

  function estiloOpcao(parId: string, valor: string): React.CSSProperties {
    const ativo = selecoes[parId] === valor
    return {
      flex: 1,
      padding: "1.1rem 1rem",
      minHeight: "44px",
      backgroundColor: ativo ? "rgba(196,113,74,0.06)" : "var(--cor-card)",
      color: "var(--cor-texto)",
      fontWeight: ativo ? 400 : 300,
      border: ativo ? "1.5px solid var(--cor-destaque)" : "1px solid var(--cor-borda)",
      borderRadius: "var(--raio-borda-suave)",
      cursor: "pointer",
      textAlign: "center",
      fontFamily: "var(--fonte-corpo)",
      fontSize: "0.875rem",
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
          marginBottom: "34px",
          lineHeight: 1.2,
        }}
      >
        {pergunta}
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "21px" }}>
        {pares.map((par) => (
          <div key={par.id} className="opcao-binaria-container">
            <button onClick={() => selecionar(par.id, par.opcaoA.id)} style={estiloOpcao(par.id, par.opcaoA.id)}>
              {par.opcaoA.texto}
            </button>
            <button onClick={() => selecionar(par.id, par.opcaoB.id)} style={estiloOpcao(par.id, par.opcaoB.id)}>
              {par.opcaoB.texto}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

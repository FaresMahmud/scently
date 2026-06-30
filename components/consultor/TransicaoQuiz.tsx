// ============================================
// ARQUIVO: components/consultor/TransicaoQuiz.tsx
// O QUE FAZ: tela de transição com Curiosity Gap entre última pergunta e resultado
//            frase personalizada com as respostas, 3 pontos animados, mín. 3s
// QUANDO MANDAR PRA IA: quando quiser alterar a frase ou o visual de transição
// DEPENDE DE: nada — apenas styles/globals.css
// ============================================

"use client"

import { useEffect } from "react"

interface Props {
  respostas: Record<string, string | string[]>
  onConcluir: () => void
}

function montarFrase(respostas: Record<string, string | string[]>): string {
  const ousadiaMap: Record<string, string> = {
    classico:   "clássico e seguro",
    diferente:  "diferente e marcante",
  }
  const projecaoMap: Record<string, string> = {
    discreto: "discreto, presente sem exagero",
    rastro:   "que deixa rastro por onde você passa",
  }
  const ocasiaoMap: Record<string, string> = {
    a: "o dia a dia",
    b: "o trabalho",
    c: "as noites",
    d: "ser sua assinatura",
  }

  const ousadia  = ousadiaMap[String(respostas.ousadia  ?? "")]
  const projecao = projecaoMap[String(respostas.projecao ?? "")]
  const ocasiao  = ocasiaoMap[String(respostas.ocasiao  ?? "")] ?? "o dia a dia"

  if (ousadia && projecao) return `Algo ${ousadia}, ${projecao}.`
  if (ousadia)             return `Algo ${ousadia}, para ${ocasiao}.`
  return `O perfume certo para ${ocasiao}.`
}

export default function TransicaoQuiz({ respostas, onConcluir }: Props) {
  const frase = montarFrase(respostas)

  useEffect(() => {
    const timer = setTimeout(onConcluir, 3000)
    return () => clearTimeout(timer)
  // onConcluir is stable (passed from parent with useCallback or inline stable ref)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      style={{
        textAlign: "center",
        padding: "89px 0",
        maxWidth: "480px",
        margin: "0 auto",
      }}
    >
      <p
        style={{
          fontFamily: "var(--fonte-titulo)",
          fontSize: "26px",
          fontWeight: 300,
          fontStyle: "italic",
          color: "var(--cor-texto)",
          lineHeight: 1.4,
          marginBottom: "21px",
        }}
      >
        {frase}
      </p>

      <p
        style={{
          fontFamily: "var(--fonte-corpo)",
          fontSize: "14px",
          color: "#C4714A",
          marginBottom: "28px",
          letterSpacing: "0.02em",
        }}
      >
        Analisando seu perfil...
      </p>

      {/* Três pontos pulsando */}
      <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#C4714A",
              animation: `fadeIn 0.8s ${i * 0.2}s infinite alternate`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

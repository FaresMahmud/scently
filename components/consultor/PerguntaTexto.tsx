// ============================================
// ARQUIVO: components/consultor/PerguntaTexto.tsx
// O QUE FAZ: pergunta com campo de texto livre — usada para "qual perfume você usa hoje?"
//            input simples, sem autocomplete — o texto digitado vai direto pro prompt da IA
// QUANDO MANDAR PRA IA: quando quiser mudar o comportamento da pergunta de texto
// DEPENDE DE: components/ui/Botao.tsx, styles/globals.css
// ============================================

"use client"

import { useState, useEffect } from "react"
import Botao from "@/components/ui/Botao"

interface PropsPerguntaTexto {
  pergunta: string
  placeholder?: string
  opcional?: boolean
  progresso: string
  id?: string
  onResponder: (valor: string) => void
}

export default function PerguntaTexto({
  pergunta,
  placeholder,
  opcional,
  progresso,
  id,
  onResponder,
}: PropsPerguntaTexto) {
  const [valor, setValor] = useState("")

  // Limpa o campo quando a pergunta muda
  useEffect(() => {
    setValor("")
  }, [id])

  return (
    <div style={{ maxWidth: "560px", margin: "0 auto" }}>
      {/* Pergunta */}
      <h2
        style={{
          fontFamily: "var(--fonte-titulo)",
          fontWeight: 300,
          fontSize: "clamp(26px, 4vw, 42px)",
          marginBottom: opcional ? "8px" : "34px",
          lineHeight: 1.2,
        }}
      >
        {pergunta}
      </h2>

      {/* Indicador de campo opcional */}
      {opcional && (
        <p style={{ fontSize: "0.8rem", color: "var(--cor-texto-suave)", marginBottom: "21px" }}>
          Campo opcional. Pode pular se preferir.
        </p>
      )}

      {/* Campo de texto */}
      <input
        type="text"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder={placeholder ?? "Digite aqui..."}
        onKeyDown={(e) => e.key === "Enter" && onResponder(valor)}
        style={{
          width: "100%",
          fontFamily: "var(--fonte-corpo)",
          fontSize: "0.95rem",
          fontWeight: 300,
          color: "var(--cor-texto)",
          backgroundColor: "var(--cor-card)",
          border: "1px solid var(--cor-borda)",
          borderRadius: "var(--raio-borda-suave)",
          padding: "0.9rem 1.1rem",
          outline: "none",
          marginBottom: "21px",
          transition: "border-color 0.2s",
        }}
      />

      {/* Botões de ação */}
      <div style={{ display: "flex", gap: "13px", flexWrap: "wrap" }}>
        <Botao onClick={() => onResponder(valor)} disabled={!opcional && !valor.trim()} style={{ opacity: !opcional && !valor.trim() ? 0.4 : 1 }}>
          Continuar
        </Botao>

        {/* Botão de pular — só aparece em campos opcionais */}
        {opcional && (
          <Botao variante="fantasma" onClick={() => onResponder("")}>
            Não tenho / não lembro
          </Botao>
        )}
      </div>
    </div>
  )
}

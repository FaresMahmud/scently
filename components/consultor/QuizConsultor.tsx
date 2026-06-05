// ============================================
// ARQUIVO: components/consultor/QuizConsultor.tsx
// O QUE FAZ: controlador principal do quiz — gerencia todas as telas e estados
// QUANDO MANDAR PRA IA: quando quiser mudar o fluxo do quiz ou adicionar perguntas
// DEPENDE DE: components/consultor/, lib/quiz/questions.ts, lib/ai.ts
// ============================================

"use client"

import { useState, useEffect } from "react"
import SelecaoModo      from "./SelecaoModo"
import PerguntaOpcoes   from "./PerguntaOpcoes"
import BarraProgresso   from "./BarraProgresso"
import ResultadoQuiz    from "./ResultadoQuiz"
import {
  FREE_QUIZ_QUESTIONS,
  PREMIUM_QUIZ_QUESTIONS,
} from "@/lib/quiz/questions"
import type { RecomendacaoQuiz } from "@/lib/ai"

type EstadoQuiz = "selecao" | "pergunta" | "carregando" | "resultado" | "erro"

export default function QuizConsultor() {
  const [estado, setEstado]           = useState<EstadoQuiz>("selecao")
  const [modo,   setModo]             = useState<"free" | "premium">("free")
  const [passo,  setPasso]            = useState(0)
  const [respostas, setRespostas]     = useState<Record<string, string>>({})
  const [recomendacao, setRecomendacao] = useState<RecomendacaoQuiz | null>(null)
  const [erroMsg, setErroMsg]         = useState<string | null>(null)

  const perguntas    = modo === "premium" ? PREMIUM_QUIZ_QUESTIONS : FREE_QUIZ_QUESTIONS
  const perguntaAtual = perguntas[passo]
  const totalPerguntas = perguntas.length

  // ── Fluxo ──────────────────────────────────────────────────────────────────

  function iniciarQuiz(modoEscolhido: "free" | "premium") {
    setModo(modoEscolhido)
    setPasso(0)
    setRespostas({})
    setRecomendacao(null)
    setErroMsg(null)
    setEstado("pergunta")
  }

  function voltar() {
    if (passo === 0) {
      setEstado("selecao")
    } else {
      setPasso(p => p - 1)
    }
  }

  /** Called when user picks an option — valor is the option id ("a"/"b"/"c"/"d") */
  function responder(optionId: string) {
    const novas = { ...respostas, [perguntaAtual.id]: optionId }
    setRespostas(novas)

    if (passo + 1 < totalPerguntas) {
      setPasso(p => p + 1)
    } else {
      enviarParaIA(novas)
    }
  }

  async function enviarParaIA(respostasFinais: Record<string, string>) {
    setEstado("carregando")
    setErroMsg(null)
    try {
      const res = await fetch("/api/consultor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respostas: respostasFinais, mode: modo }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { erro?: string }).erro ?? `HTTP ${res.status}`)
      }
      const data = await res.json() as RecomendacaoQuiz
      setRecomendacao(data)
      setEstado("resultado")
    } catch (err) {
      setErroMsg(err instanceof Error ? err.message : "Erro inesperado.")
      setEstado("erro")
    }
  }

  function recomecar() {
    setEstado("selecao")
    setPasso(0)
    setRespostas({})
    setRecomendacao(null)
    setErroMsg(null)
  }

  // Allow external reset (e.g. header logo click)
  useEffect(() => {
    const handler = () => recomecar()
    window.addEventListener("resetar-quiz", handler)
    return () => window.removeEventListener("resetar-quiz", handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Telas ──────────────────────────────────────────────────────────────────

  if (estado === "selecao") return <SelecaoModo onSelecionar={iniciarQuiz} />

  if (estado === "carregando") {
    return (
      <div style={{ textAlign: "center", padding: "89px 0" }}>
        <p
          style={{
            fontFamily: "var(--fonte-titulo)",
            fontSize: "26px",
            fontWeight: 300,
            color: "var(--cor-texto-suave)",
            marginBottom: "34px",
          }}
        >
          Analisando seu perfil...
        </p>
        {/* Três pontos animados */}
        <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "var(--cor-destaque)",
                animation: `fadeIn 0.8s ${i * 0.2}s infinite alternate`,
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (estado === "erro") {
    return (
      <div style={{ textAlign: "center", padding: "55px 0", maxWidth: "400px", margin: "0 auto" }}>
        <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.9rem", marginBottom: "21px", color: "var(--cor-texto-suave)" }}>
          {erroMsg ?? "Não consegui encontrar uma recomendação agora."}
        </p>
        <button
          onClick={recomecar}
          style={{
            color: "var(--cor-destaque)",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--fonte-corpo)",
            fontSize: "0.9rem",
            minHeight: "44px",
            padding: "0 13px",
          }}
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  if (estado === "resultado" && recomendacao) {
    return <ResultadoQuiz recomendacao={recomendacao} onRecomecar={recomecar} />
  }

  // ── Tela de pergunta ───────────────────────────────────────────────────────

  const progresso = `${passo + 1} de ${totalPerguntas}`

  return (
    <>
      {/* Barra + cabeçalho */}
      <div style={{ maxWidth: "560px", margin: "0 auto 0" }}>
        <BarraProgresso atual={passo} total={totalPerguntas} />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "34px",
          }}
        >
          <button
            onClick={voltar}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--cor-texto-suave)",
              fontFamily: "var(--fonte-corpo)",
              fontSize: "0.78rem",
              letterSpacing: "0.06em",
              padding: "0 8px",
              minHeight: "44px",
              minWidth: "44px",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            ← Voltar
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Mode badge */}
            <span
              style={{
                fontSize: "0.6rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "0.15rem 0.5rem",
                borderRadius: "99px",
                backgroundColor: modo === "premium"
                  ? "rgba(180,148,72,0.12)"
                  : "rgba(196,113,74,0.08)",
                color: modo === "premium" ? "var(--cor-dourado)" : "var(--cor-destaque)",
                border: modo === "premium"
                  ? "1px solid rgba(180,148,72,0.3)"
                  : "1px solid rgba(196,113,74,0.25)",
              }}
            >
              {modo === "premium" ? "Nozze+" : "Gratuito"}
            </span>

            {/* Counter */}
            <p
              style={{
                fontFamily: "var(--fonte-titulo)",
                fontSize: "0.75rem",
                letterSpacing: "0.2em",
                color: "var(--cor-destaque)",
              }}
            >
              {progresso.toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      {/* Pergunta — key força remontagem a cada passo, resetando seleção interna */}
      <PerguntaOpcoes
        key={passo}
        pergunta={perguntaAtual.pergunta}
        opcoes={perguntaAtual.opcoes.map(o => ({ valor: o.id, texto: o.texto }))}
        progresso={progresso}
        multipla={false}
        onResponder={responder}
      />
    </>
  )
}

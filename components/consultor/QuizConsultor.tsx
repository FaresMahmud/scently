// ============================================
// ARQUIVO: components/consultor/QuizConsultor.tsx
// O QUE FAZ: controlador principal do quiz — gerencia todas as telas e estados
// QUANDO MANDAR PRA IA: quando quiser mudar o fluxo do quiz ou adicionar perguntas
// DEPENDE DE: components/consultor/, lib/quiz/questions.ts, lib/ai.ts
// ============================================

"use client"

import { useState, useEffect, useRef } from "react"
import { track } from "@/lib/analytics-client"
import SelecaoModo        from "./SelecaoModo"
import TransicaoQuiz     from "./TransicaoQuiz"
import PerguntaOpcoes     from "./PerguntaOpcoes"
import PerguntaTexto       from "./PerguntaTexto"
import PerguntaBinariaDupla from "./PerguntaBinariaDupla"
import BarraProgresso     from "./BarraProgresso"
import ResultadoQuiz      from "./ResultadoQuiz"
import {
  FREE_QUIZ_QUESTIONS,
  PREMIUM_QUIZ_QUESTIONS,
} from "@/lib/quiz/questions"
import type { RecomendacaoQuiz } from "@/lib/ai"

type EstadoQuiz = "selecao" | "pergunta" | "transicao" | "carregando" | "resultado" | "erro"

export default function QuizConsultor() {
  const [estado, setEstado]           = useState<EstadoQuiz>("selecao")
  const [modo,   setModo]             = useState<"free" | "premium">("free")
  const [passo,  setPasso]            = useState(0)
  const [respostas, setRespostas]     = useState<Record<string, string | string[]>>({})
  const [recomendacao, setRecomendacao] = useState<RecomendacaoQuiz | null>(null)
  const [erroMsg, setErroMsg]         = useState<string | null>(null)

  // Refs para coordenar transição (3s mín.) com resposta da IA
  const recomendacaoRef = useRef<RecomendacaoQuiz | null>(null)
  const erroMsgRef      = useRef<string | null>(null)

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
    track("quiz_start", { modo: modoEscolhido })
    if (modoEscolhido === "premium") track("premium_click", { origem: "quiz_selecao" })
  }

  /**
   * Dispara quiz_abandoned com o id da última pergunta respondida (null se
   * nenhuma). Usa a última chave de `respostas` em vez de `passo` — `passo`
   * reflete a pergunta sendo EXIBIDA, que recua ao clicar "Voltar" mesmo que
   * a resposta anterior continue salva.
   */
  function trackAbandono() {
    const chaves = Object.keys(respostas)
    const idUltimaRespondida = chaves.length > 0 ? chaves[chaves.length - 1] : null
    track("quiz_abandoned", { modo, idUltimaRespondida })
  }

  function voltar() {
    if (passo === 0) {
      trackAbandono()
      setEstado("selecao")
    } else {
      // Math.max evita passo negativo se o botão for clicado 2x rápido antes
      // do re-render — a closure de `passo` ficaria desatualizada nas duas
      // chamadas síncronas, e sem o guard ambas decrementariam o estado real.
      setPasso(p => Math.max(0, p - 1))
    }
  }

  /**
   * Single-select / texto: store the chosen value (or raw text) and auto-advance.
   * Multipla questions (PerguntaOpcoes em modo multipla) chamam com uma string
   * de ids separados por vírgula — guardamos como string[].
   * Binaria-dupla (PerguntaBinariaDupla) chama com um Record já contendo as
   * chaves dos PARES (ex: { projecao: "rastro", ousadia: "diferente" }),
   * não a chave da pergunta-pai — por isso o spread direto em vez de indexar
   * por perguntaAtual.id.
   */
  function responder(valor: string | Record<string, string>) {
    let novas: Record<string, string | string[]>

    if (typeof valor === "string") {
      const isMulti = perguntaAtual.tipo === "multipla"
      const stored  = isMulti ? valor.split(",").filter(Boolean) : valor
      novas = { ...respostas, [perguntaAtual.id]: stored }
    } else {
      novas = { ...respostas, ...valor }
    }

    setRespostas(novas)

    track("quiz_question_answered", { modo, pergunta: passo + 1, perguntaId: perguntaAtual.id })

    if (passo + 1 < totalPerguntas) {
      setPasso(p => p + 1)
    } else {
      // Mostra transição enquanto a IA processa em paralelo
      setEstado("transicao")
      enviarParaIA(novas)
    }
  }

  async function enviarParaIA(respostasFinais: Record<string, string | string[]>) {
    erroMsgRef.current      = null
    recomendacaoRef.current = null
    setErroMsg(null)
    try {
      const respostasSerializadas: Record<string, string> = Object.fromEntries(
        Object.entries(respostasFinais).map(([k, v]) => [k, Array.isArray(v) ? v.join(",") : v])
      )
      const res = await fetch("/api/consultor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respostas: respostasSerializadas, mode: modo }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { erro?: string }).erro ?? `HTTP ${res.status}`)
      }
      const data = await res.json() as RecomendacaoQuiz
      recomendacaoRef.current = data
      setRecomendacao(data)
      // Se a transição já terminou (estado = "carregando"), vai direto pro resultado
      setEstado(prev => prev === "carregando" ? "resultado" : prev)
      track("quiz_completed", { modo })
      track("quiz_result_shown", {
        modo,
        perfumes: [data.ideal, data.alternativa, data.ousado]
          .filter(Boolean)
          .map(r => r!.nome),
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro inesperado."
      erroMsgRef.current = msg
      setErroMsg(msg)
      setEstado(prev => prev === "carregando" ? "erro" : prev)
    }
  }

  function onTransicaoConcluida() {
    if (recomendacaoRef.current) {
      setEstado("resultado")
    } else if (erroMsgRef.current) {
      setEstado("erro")
    } else {
      // IA ainda processando — mostra loading clássico até terminar
      setEstado("carregando")
    }
  }

  function recomecar() {
    if (estado === "pergunta") trackAbandono()
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

  // Abandono por saída da página (fechar aba, navegar pra fora) ou desmontagem
  // do componente em si — cobre os casos que não passam por voltar()/recomecar().
  const estadoAtualRef = useRef({ estado, modo, respostas })
  useEffect(() => {
    estadoAtualRef.current = { estado, modo, respostas }
  }, [estado, modo, respostas])

  useEffect(() => {
    function trackAbandonoSePergunta() {
      const atual = estadoAtualRef.current
      if (atual.estado !== "pergunta") return
      const chaves = Object.keys(atual.respostas)
      const idUltimaRespondida = chaves.length > 0 ? chaves[chaves.length - 1] : null
      track("quiz_abandoned", { modo: atual.modo, idUltimaRespondida })
    }
    window.addEventListener("beforeunload", trackAbandonoSePergunta)
    return () => {
      window.removeEventListener("beforeunload", trackAbandonoSePergunta)
      trackAbandonoSePergunta()
    }
  }, [])

  // ── Telas ──────────────────────────────────────────────────────────────────

  if (estado === "selecao") return <SelecaoModo onSelecionar={iniciarQuiz} />

  if (estado === "transicao") {
    return <TransicaoQuiz respostas={respostas} onConcluir={onTransicaoConcluida} />
  }

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
      {perguntaAtual.tipo === "texto" && (
        <PerguntaTexto
          key={passo}
          id={perguntaAtual.id}
          pergunta={perguntaAtual.pergunta}
          placeholder={perguntaAtual.placeholder}
          opcional={perguntaAtual.opcional}
          progresso={progresso}
          onResponder={responder}
        />
      )}

      {perguntaAtual.tipo === "binaria-dupla" && perguntaAtual.pares && (
        <PerguntaBinariaDupla
          key={passo}
          pergunta={perguntaAtual.pergunta}
          pares={perguntaAtual.pares}
          onResponder={responder}
        />
      )}

      {(!perguntaAtual.tipo || perguntaAtual.tipo === "escolha" || perguntaAtual.tipo === "multipla") && (
        <PerguntaOpcoes
          key={passo}
          pergunta={perguntaAtual.pergunta}
          opcoes={(perguntaAtual.opcoes ?? []).map(o => ({ valor: o.id, texto: o.texto }))}
          progresso={progresso}
          multipla={perguntaAtual.tipo === "multipla"}
          valorExclusivo={perguntaAtual.exclusiva}
          onResponder={responder}
        />
      )}
    </>
  )
}

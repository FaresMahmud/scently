// ============================================
// ARQUIVO: components/consultor/QuizConsultor.tsx
// O QUE FAZ: controlador principal do quiz — gerencia todas as telas e estados da consulta
// QUANDO MANDAR PRA IA: quando quiser mudar o fluxo completo do quiz ou adicionar perguntas
// DEPENDE DE: components/consultor/, config/site.ts, lib/ai.ts
// ============================================

"use client"

import { useState, useEffect } from "react"
import SelecaoModo from "./SelecaoModo"
import PerguntaOpcoes from "./PerguntaOpcoes"
import PerguntaNotas from "./PerguntaNotas"
import PerguntaTexto from "./PerguntaTexto"
import BarraProgresso from "./BarraProgresso"
import ResultadoConsultor from "./ResultadoConsultor"
import { perguntasRapidas, perguntasAprofundadas, textosConsultor } from "@/config/site"
import type { RecomendacaoIA, RespostasQuiz } from "@/lib/ai"

type EstadoQuiz = "selecao" | "pergunta" | "carregando" | "resultado" | "erro"

export default function QuizConsultor() {
  const [estado, setEstado] = useState<EstadoQuiz>("selecao")
  const [modo, setModo] = useState<"rapido" | "aprofundado">("rapido")
  const [passo, setPasso] = useState(0)
  const [respostas, setRespostas] = useState<Partial<RespostasQuiz>>({})
  const [recomendacao, setRecomendacao] = useState<RecomendacaoIA | null>(null)

  const todasPerguntas =
    modo === "rapido" ? perguntasRapidas : [...perguntasRapidas, ...perguntasAprofundadas]

  const perguntaAtual = todasPerguntas[passo]
  const totalPerguntas = todasPerguntas.length
  const progresso = `${passo + 1} de ${totalPerguntas}`

  function iniciarQuiz(modoEscolhido: "rapido" | "aprofundado") {
    setModo(modoEscolhido)
    setPasso(0)
    setRespostas({})
    setEstado("pergunta")
  }

  // Volta para a pergunta anterior
  function voltar() {
    if (passo === 0) {
      setEstado("selecao")
    } else {
      setPasso(passo - 1)
    }
  }

  function responderOpcao(valor: string) {
    // Normaliza genero: masculino+feminino juntos → unissex
    let valorFinal = valor
    if (perguntaAtual.id === "genero") {
      const selecionados = valor.split(",")
      if (selecionados.includes("masculino") && selecionados.includes("feminino")) {
        valorFinal = "unissex"
      } else {
        valorFinal = selecionados[selecionados.length - 1]
      }
    }
    const novas = { ...respostas, [perguntaAtual.id]: valorFinal }
    setRespostas(novas)
    avancar(novas)
  }

  function responderNotas(amadas: string[], odiadas: string[]) {
    const novas = { ...respostas, notasAmadas: amadas, notasOdiadas: odiadas }
    setRespostas(novas)
    avancar(novas)
  }

  function responderTexto(valor: string) {
    // Salva o perfume atual como âncora (pode ser vazio se usuário pulou)
    const novas = { ...respostas, perfumeAtual: valor || undefined }
    setRespostas(novas)
    avancar(novas)
  }

  async function avancar(novas: Partial<RespostasQuiz>) {
    if (passo + 1 < totalPerguntas) {
      setPasso(passo + 1)
    } else {
      await enviarParaIA(novas as RespostasQuiz)
    }
  }

  async function enviarParaIA(respostasFinais: RespostasQuiz) {
    setEstado("carregando")
    try {
      const resposta = await fetch("/api/consultor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respostas: respostasFinais }),
      })
      if (!resposta.ok) throw new Error()
      setRecomendacao(await resposta.json())
      setEstado("resultado")
    } catch {
      setEstado("erro")
    }
  }

  function recomecar() {
    setEstado("selecao")
    setPasso(0)
    setRespostas({})
    setRecomendacao(null)
  }

  useEffect(() => {
    function handleReset() {
      recomecar()
    }
    window.addEventListener("resetar-quiz", handleReset)
    return () => window.removeEventListener("resetar-quiz", handleReset)
  }, [])

  // ── Telas especiais (sem barra de progresso) ──

  if (estado === "selecao") return <SelecaoModo onSelecionar={iniciarQuiz} />

  if (estado === "carregando") {
    return (
      <div style={{ textAlign: "center", padding: "89px 0" }}>
        <p style={{ fontFamily: "var(--fonte-titulo)", fontSize: "26px", fontWeight: 300, color: "var(--cor-texto-suave)", marginBottom: "34px" }}>
          {textosConsultor.mensagemCarregando}
        </p>
        {/* Animação de três pontos */}
        <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
          {[0, 1, 2].map((i) => (
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
        <p style={{ marginBottom: "21px" }}>{textosConsultor.mensagemErro}</p>
        <button
          onClick={recomecar}
          style={{ color: "var(--cor-destaque)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--fonte-corpo)", fontSize: "0.9rem", minHeight: "44px", minWidth: "44px", padding: "0 13px" }}
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  if (estado === "resultado" && recomendacao) {
    return <ResultadoConsultor recomendacao={recomendacao} onRecomecar={recomecar} />
  }

  // ── Tela de pergunta ──

  // Botão de voltar + barra de progresso — aparecem em todas as perguntas
  const cabecalhoQuiz = (
    <div style={{ maxWidth: "560px", margin: "0 auto 0" }}>
      <BarraProgresso atual={passo} total={totalPerguntas} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "34px" }}>
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
        {/* Contador de pergunta */}
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
  )

  // Pergunta de seleção visual de notas (pergunta 5 no modo aprofundado)
  if ("tipo" in perguntaAtual && perguntaAtual.tipo === "selecao-visual" && "notasParaAmar" in perguntaAtual && perguntaAtual.notasParaAmar) {
    return (
      <>
        {cabecalhoQuiz}
        <PerguntaNotas notas={perguntaAtual.notasParaAmar} progresso={progresso} onResponder={responderNotas} />
      </>
    )
  }

  // Pergunta de texto livre (pergunta 7 no modo aprofundado — perfume atual)
  if ("tipo" in perguntaAtual && perguntaAtual.tipo === "texto-livre") {
    return (
      <>
        {cabecalhoQuiz}
        <PerguntaTexto
          id={perguntaAtual.id}
          pergunta={perguntaAtual.pergunta}
          placeholder={"placeholder" in perguntaAtual ? String(perguntaAtual.placeholder) : undefined}
          opcional={"opcional" in perguntaAtual ? Boolean(perguntaAtual.opcional) : false}
          progresso={progresso}
          onResponder={responderTexto}
        />
      </>
    )
  }

  // Perguntas que aceitam múltipla seleção
  const perguntasMultiplas = ["genero", "ocasiao", "prioridade"]
  const ehMultipla = perguntasMultiplas.includes(perguntaAtual.id)

  // key={passo} força remontagem a cada pergunta, resetando o estado interno de seleção
  return (
    <>
      {cabecalhoQuiz}
      <PerguntaOpcoes
        key={passo}
        pergunta={perguntaAtual.pergunta}
        opcoes={perguntaAtual.opcoes ?? []}
        progresso={progresso}
        multipla={ehMultipla}
        onResponder={responderOpcao}
      />
    </>
  )
}

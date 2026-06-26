"use client"

// ============================================
// ARQUIVO: components/consultor/ChatConsultor.tsx
// O QUE FAZ: chat aberto com a consultora de fragrâncias (Gemini)
// QUANDO MANDAR PRA IA: quando quiser mudar o visual do chat ou o fluxo de envio
// DEPENDE DE: app/api/consultor/chat/route.ts, styles/globals.css, lib/useSessao.ts
// ============================================

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { useSessao } from "@/lib/useSessao"

interface Mensagem {
  role: "user" | "assistant"
  content: string
}

const MENSAGEM_BOAS_VINDAS: Mensagem = {
  role: "assistant",
  content: "Olá! Sou sua consultora particular de fragrâncias. Me conta o que você procura, ou escolhe uma das sugestões abaixo.",
}

const SUGESTOES = [
  "Qual perfume combina comigo?",
  "Quero algo pra usar no trabalho",
  "Me explica as famílias olfativas",
  "Tenho pele seca, isso afeta o perfume?",
]

// Renderiza texto com links markdown [texto](/perfume/id) como <Link> do Next
function renderizarConteudo(texto: string) {
  const partes: React.ReactNode[] = []
  const regexLink = /\[([^\]]+)\]\((\/perfume\/[a-z0-9-]+)\)/gi
  let ultimoIndice = 0
  let match: RegExpExecArray | null

  while ((match = regexLink.exec(texto)) !== null) {
    if (match.index > ultimoIndice) {
      partes.push(texto.slice(ultimoIndice, match.index))
    }
    partes.push(
      <Link
        key={match.index}
        href={match[2]}
        style={{ color: "var(--cor-destaque)", textDecoration: "underline", textUnderlineOffset: "2px" }}
      >
        {match[1]}
      </Link>
    )
    ultimoIndice = match.index + match[0].length
  }
  if (ultimoIndice < texto.length) partes.push(texto.slice(ultimoIndice))

  return partes
}

function AvatarConsultora() {
  return (
    <div
      style={{
        width: "34px",
        height: "34px",
        borderRadius: "50%",
        backgroundColor: "var(--cor-card)",
        border: "1px solid var(--cor-borda)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        {/* topo do borrifador */}
        <rect x="10" y="13" width="4" height="7" rx="1" stroke="var(--cor-destaque)" strokeWidth="1.3" />
        <path d="M9 13 L11 9 H13 L15 13" stroke="var(--cor-destaque)" strokeWidth="1.3" strokeLinejoin="round" />
        <line x1="12" y1="9" x2="12" y2="6.5" stroke="var(--cor-destaque)" strokeWidth="1.3" />
        {/* nuvem de partículas em curva fibonacci */}
        <circle cx="15.5" cy="5.5" r="0.9" fill="var(--cor-dourado)" />
        <circle cx="18" cy="4.2" r="0.7" fill="var(--cor-dourado)" />
        <circle cx="20" cy="6.5" r="0.5" fill="var(--cor-dourado)" />
        <circle cx="13.5" cy="3" r="0.5" fill="var(--cor-dourado)" />
      </svg>
    </div>
  )
}

function IndicadorDigitando() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
      <AvatarConsultora />
      <div
        style={{
          display: "inline-flex",
          gap: "5px",
          padding: "13px 21px",
          backgroundColor: "var(--cor-card)",
          border: "1px solid var(--cor-borda)",
          borderRadius: "21px",
        }}
        aria-label="Consultora está digitando"
      >
        {[0, 1, 2].map(i => (
          <span
            key={i}
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "var(--cor-texto-suave)",
              animation: `nozze-pulsar 1.2s ${i * 0.15}s infinite ease-in-out`,
            }}
          />
        ))}
        <style>{`
          @keyframes nozze-pulsar {
            0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
            40% { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    </div>
  )
}

export default function ChatConsultor() {
  const { usuario, carregando: carregandoSessao } = useSessao()
  const [mensagens, setMensagens] = useState<Mensagem[]>([MENSAGEM_BOAS_VINDAS])
  const [input, setInput] = useState("")
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const fimDaListaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fimDaListaRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [mensagens, carregando])

  const enviarTexto = useCallback(async (texto: string) => {
    if (!texto.trim() || carregando) return

    const historico = mensagens.filter(m => m !== MENSAGEM_BOAS_VINDAS)
    const novaMensagemUsuario: Mensagem = { role: "user", content: texto }

    setMensagens(prev => [...prev, novaMensagemUsuario])
    setInput("")
    setErro(null)
    setCarregando(true)

    try {
      const res = await fetch("/api/consultor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensagem: texto,
          historico: historico.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      const dados = await res.json()

      if (!res.ok) {
        setErro(dados?.erro ?? "Não foi possível enviar sua mensagem. Tenta de novo?")
        return
      }

      setMensagens(prev => [...prev, { role: "assistant", content: dados.resposta }])
    } catch {
      setErro("Não foi possível conectar. Verifica sua internet e tenta de novo.")
    } finally {
      setCarregando(false)
      inputRef.current?.focus()
    }
  }, [carregando, mensagens])

  const enviar = useCallback(() => enviarTexto(input), [enviarTexto, input])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  const mostrarSugestoes = mensagens.length === 1

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 64px)",
        maxWidth: "680px",
        margin: "0 auto",
        backgroundColor: "var(--cor-base)",
      }}
    >
      {/* Cabeçalho */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "13px",
          padding: "21px 21px 13px",
          borderBottom: "1px solid var(--cor-borda)",
        }}
      >
        <AvatarConsultora />
        <div>
          <h1
            style={{
              fontFamily: "var(--fonte-titulo)",
              fontSize: "1.618rem",
              fontWeight: 300,
              color: "var(--cor-texto)",
              margin: 0,
            }}
          >
            Consultora de fragrâncias
          </h1>
          <p
            style={{
              fontFamily: "var(--fonte-corpo)",
              fontSize: "0.8rem",
              color: "var(--cor-texto-suave)",
              margin: "4px 0 0",
            }}
          >
            Converse livremente sobre perfumes
          </p>
        </div>
      </div>

      {/* Lista de mensagens */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "21px",
          display: "flex",
          flexDirection: "column",
          gap: "13px",
        }}
      >
        {mensagens.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "8px",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            {m.role === "assistant" && <AvatarConsultora />}
            <div
              style={{
                maxWidth: "85%",
                padding: "13px 21px",
                borderRadius: m.role === "user" ? "21px 21px 5px 21px" : "21px 21px 21px 5px",
                backgroundColor: m.role === "user" ? "var(--cor-destaque)" : "var(--cor-card)",
                color: m.role === "user" ? "#fff" : "var(--cor-texto)",
                border: m.role === "user" ? "none" : "1px solid var(--cor-borda)",
                fontFamily: "var(--fonte-corpo)",
                fontSize: "0.9375rem",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
              }}
            >
              {renderizarConteudo(m.content)}
            </div>
          </div>
        ))}

        {/* Chips de sugestão — só na tela de boas-vindas */}
        {mostrarSugestoes && !carregando && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              paddingLeft: "42px",
            }}
          >
            {SUGESTOES.map(sugestao => (
              <button
                key={sugestao}
                onClick={() => enviarTexto(sugestao)}
                style={{
                  fontFamily: "var(--fonte-corpo)",
                  fontSize: "0.8125rem",
                  color: "var(--cor-destaque)",
                  backgroundColor: "transparent",
                  border: "1px solid var(--cor-destaque)",
                  borderRadius: "55px",
                  padding: "8px 16px",
                  cursor: "pointer",
                  lineHeight: 1.3,
                }}
              >
                {sugestao}
              </button>
            ))}
          </div>
        )}

        {carregando && <IndicadorDigitando />}

        {erro && (
          <div
            style={{
              alignSelf: "center",
              fontFamily: "var(--fonte-corpo)",
              fontSize: "0.8125rem",
              color: "var(--cor-destaque)",
              textAlign: "center",
              padding: "8px 13px",
            }}
          >
            {erro}
          </div>
        )}

        <div ref={fimDaListaRef} />
      </div>

      {/* Memória / hint de login */}
      <div style={{ padding: "0 21px", display: "flex", justifyContent: "center" }}>
        {!carregandoSessao && (
          usuario ? (
            <span
              style={{
                fontFamily: "var(--fonte-corpo)",
                fontSize: "0.72rem",
                letterSpacing: "0.04em",
                color: "var(--cor-dourado)",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 0 8px",
              }}
            >
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--cor-dourado)" }} />
              Memória ativa
            </span>
          ) : (
            <span
              style={{
                fontFamily: "var(--fonte-corpo)",
                fontSize: "0.75rem",
                color: "var(--cor-texto-suave)",
                padding: "5px 0 8px",
                textAlign: "center",
              }}
            >
              <Link href="/entrar?redirect=/consultor/chat" style={{ color: "var(--cor-destaque)", fontWeight: 500 }}>
                Entre na sua conta
              </Link>
              {" "}pra eu lembrar suas preferências.
            </span>
          )
        )}
      </div>

      {/* Campo de input — fixo no fundo do chat */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          alignItems: "flex-end",
          padding: "13px 21px 21px",
          borderTop: "1px solid var(--cor-borda)",
          backgroundColor: "var(--cor-base)",
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pergunte sobre perfumes..."
          rows={1}
          disabled={carregando}
          style={{
            flex: 1,
            resize: "none",
            fontFamily: "var(--fonte-corpo)",
            fontSize: "0.9375rem",
            padding: "13px 16px",
            borderRadius: "21px",
            border: "1px solid var(--cor-borda)",
            backgroundColor: "var(--cor-card)",
            color: "var(--cor-texto)",
            outline: "none",
            minHeight: "44px",
            maxHeight: "120px",
          }}
        />
        <button
          onClick={enviar}
          disabled={carregando || !input.trim()}
          aria-label="Enviar mensagem"
          style={{
            minHeight: "44px",
            minWidth: "44px",
            width: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: carregando || !input.trim() ? "var(--cor-borda)" : "var(--cor-destaque)",
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            cursor: carregando || !input.trim() ? "default" : "pointer",
            transition: "background-color 0.2s",
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M4 12 L20 4 L13 12 L20 20 Z" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  )
}

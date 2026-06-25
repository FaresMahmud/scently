"use client"

// ============================================
// ARQUIVO: components/consultor/ChatConsultor.tsx
// O QUE FAZ: chat aberto com a consultora de fragrâncias (Gemini)
// QUANDO MANDAR PRA IA: quando quiser mudar o visual do chat ou o fluxo de envio
// DEPENDE DE: app/api/consultor/chat/route.ts, styles/globals.css
// ============================================

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"

interface Mensagem {
  role: "user" | "assistant"
  content: string
}

const MENSAGEM_BOAS_VINDAS: Mensagem = {
  role: "assistant",
  content: "Olá! Sou sua consultora de fragrâncias. Pergunte o que quiser sobre perfumes — estou aqui pra te guiar.",
}

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

function IndicadorDigitando() {
  return (
    <div
      style={{
        display: "inline-flex",
        gap: "4px",
        padding: "13px 21px",
        backgroundColor: "var(--cor-card)",
        border: "1px solid var(--cor-borda)",
        borderRadius: "var(--raio-borda-suave)",
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
  )
}

export default function ChatConsultor() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([MENSAGEM_BOAS_VINDAS])
  const [input, setInput] = useState("")
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const fimDaListaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fimDaListaRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensagens, carregando])

  const enviar = useCallback(async () => {
    const texto = input.trim()
    if (!texto || carregando) return

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
  }, [input, carregando, mensagens])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

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
          padding: "21px 21px 13px",
          borderBottom: "1px solid var(--cor-borda)",
        }}
      >
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
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "85%",
                padding: "13px 21px",
                borderRadius: "var(--raio-borda-suave)",
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

        {carregando && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <IndicadorDigitando />
          </div>
        )}

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

      {/* Campo de input */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          alignItems: "flex-end",
          padding: "13px 21px 21px",
          borderTop: "1px solid var(--cor-borda)",
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
            borderRadius: "var(--raio-borda-suave)",
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
          style={{
            minHeight: "44px",
            minWidth: "44px",
            padding: "0 21px",
            backgroundColor: carregando || !input.trim() ? "var(--cor-borda)" : "var(--cor-destaque)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--raio-borda-suave)",
            fontFamily: "var(--fonte-corpo)",
            fontSize: "0.8125rem",
            letterSpacing: "0.04em",
            cursor: carregando || !input.trim() ? "default" : "pointer",
          }}
        >
          Enviar
        </button>
      </div>
    </div>
  )
}

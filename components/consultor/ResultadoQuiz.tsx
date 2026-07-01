// ============================================
// ARQUIVO: components/consultor/ResultadoQuiz.tsx
// O QUE FAZ: exibe os cartões de recomendação do quiz
//   FREE:    1 card (ideal) — centrado, largura total
//   PREMIUM: 3 cards — ideal no topo, alternativa + ousado lado a lado
// QUANDO MANDAR PRA IA: quando quiser mudar o layout do resultado do quiz
// DEPENDE DE: lib/ai.ts (RecomendacaoQuiz), lib/afiliados.ts
// ============================================

"use client"

import Link from "next/link"
import type { RecomendacaoQuiz, RecomendacaoCard } from "@/lib/ai"
import { getAffiliateLinks } from "@/lib/afiliados"
import { track } from "@/lib/analytics-client"

// ── Metadata por slot ─────────────────────────────────────────────────────────

const SLOT_META: Record<
  "ideal" | "alternativa" | "ousado",
  { label: string; descricao: string; cor: string }
> = {
  ideal: {
    label: "Ideal para você",
    descricao: "Maior correspondência com o seu perfil",
    cor: "var(--cor-destaque)",
  },
  alternativa: {
    label: "Alternativa",
    descricao: "Mesmo perfil, caminho diferente",
    cor: "var(--cor-texto-suave)",
  },
  ousado: {
    label: "Para explorar",
    descricao: "Para quem quer ir além e descobrir algo novo",
    cor: "var(--cor-dourado)",
  },
}

// ── Chip de nota ───────────────────────────────────────────────────────────────

function ChipNota({ texto }: { texto: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0.3rem 0.75rem",
        fontFamily: "var(--fonte-corpo)",
        fontSize: "0.78rem",
        color: "var(--cor-texto)",
        border: "1px solid var(--cor-destaque)",
        borderRadius: "99px",
        backgroundColor: "transparent",
      }}
    >
      {texto}
    </span>
  )
}

// ── Badge de concentração ───────────────────────────────────────────────────────

function BadgeConcentracao({ texto }: { texto: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0.2rem 0.6rem",
        fontFamily: "var(--fonte-corpo)",
        fontSize: "0.65rem",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--cor-texto-suave)",
        border: "1px solid var(--cor-borda)",
        borderRadius: "99px",
      }}
    >
      {texto}
    </span>
  )
}

// ── Botão "Onde comprar" ────────────────────────────────────────────────────────

function BotaoOndeComprar({ nome, marca }: { nome: string; marca: string }) {
  const links = getAffiliateLinks(nome, marca)
  const link = links[0]

  if (link) {
    return (
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("quiz_result_click", { nome, marca })}
        style={{
          display: "inline-flex",
          alignItems: "center",
          minHeight: "44px",
          padding: "0 21px",
          fontFamily: "var(--fonte-corpo)",
          fontSize: "0.875rem",
          fontWeight: 500,
          letterSpacing: "0.04em",
          textDecoration: "none",
          borderRadius: "var(--raio-borda)",
          backgroundColor: "var(--cor-destaque)",
          color: "#fff",
          transition: "background-color 0.15s",
        }}
      >
        Onde comprar →
      </a>
    )
  }

  const query = encodeURIComponent(`${nome} ${marca} perfume comprar`)
  return (
    <a
      href={`https://www.google.com/search?q=${query}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("quiz_result_click", { nome, marca, fallback: true })}
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: "44px",
        padding: "0 21px",
        fontFamily: "var(--fonte-corpo)",
        fontSize: "0.875rem",
        fontWeight: 400,
        letterSpacing: "0.04em",
        textDecoration: "none",
        borderRadius: "var(--raio-borda)",
        backgroundColor: "transparent",
        color: "var(--cor-texto)",
        border: "1px solid var(--cor-borda)",
        transition: "border-color 0.15s, color 0.15s",
      }}
    >
      Buscar online →
    </a>
  )
}

// ── Card ─────────────────────────────────────────────────────────────────────

function CardRecomendacao({
  slot,
  card,
  destaque = false,
}: {
  slot: "ideal" | "alternativa" | "ousado"
  card: RecomendacaoCard
  destaque?: boolean
}) {
  const meta = SLOT_META[slot]
  const linkCatalogo = `/catalogo?busca=${encodeURIComponent(`${card.nome} ${card.marca}`)}`

  return (
    <div
      style={{
        padding: destaque ? "34px" : "28px",
        backgroundColor: "var(--cor-card)",
        border: destaque ? "1px solid rgba(196,113,74,0.25)" : "1px solid var(--cor-borda)",
        borderRadius: "var(--raio-borda-suave)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Slot label */}
      <div style={{ marginBottom: destaque ? "21px" : "13px" }}>
        <span
          style={{
            display: "inline-block",
            fontSize: "0.65rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: meta.cor,
            marginBottom: "4px",
          }}
        >
          {meta.label}
        </span>
        <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: destaque ? "0.72rem" : "0.68rem", color: "var(--cor-texto-suave)", margin: 0 }}>
          {meta.descricao}
        </p>
      </div>

      {/* Marca */}
      <p
        style={{
          fontFamily: "var(--fonte-corpo)",
          fontSize: "14px",
          letterSpacing: "0.04em",
          color: "var(--cor-destaque)",
          marginBottom: "6px",
        }}
      >
        {card.marca}
      </p>

      {/* Nome + badge de concentração */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "13px", flexWrap: "wrap", marginBottom: "13px" }}>
        <h2
          style={{
            fontFamily: "var(--fonte-titulo)",
            fontWeight: 300,
            fontSize: destaque ? "clamp(26px, 5vw, 34px)" : "26px",
            lineHeight: 1.1,
            color: "var(--cor-texto)",
            margin: 0,
          }}
        >
          {card.nome}
        </h2>
        <BadgeConcentracao texto={card.concentracao} />
      </div>

      {/* Explicação */}
      <p
        style={{
          fontFamily: "var(--fonte-corpo)",
          fontSize: "16px",
          color: "var(--cor-texto)",
          opacity: 0.9,
          lineHeight: 1.6,
          marginBottom: "21px",
        }}
      >
        {card.explicacao}
      </p>

      {/* Notas — chips */}
      {card.notas.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "21px" }}>
          {card.notas.map((nota) => (
            <ChipNota key={nota} texto={nota} />
          ))}
        </div>
      )}

      {/* Quando usar */}
      {card.quandoUsar && (
        <p
          style={{
            fontFamily: "var(--fonte-corpo)",
            fontSize: "14px",
            fontStyle: "italic",
            color: "var(--cor-texto-suave)",
            marginBottom: "21px",
          }}
        >
          {card.quandoUsar}
        </p>
      )}

      {/* Ações */}
      <div style={{ display: "flex", gap: "13px", flexWrap: "wrap", alignItems: "center", marginTop: "auto" }}>
        <BotaoOndeComprar nome={card.nome} marca={card.marca} />
        {card.slug && (
          <Link
            href={`/perfume/${card.slug}`}
            style={{
              fontFamily: "var(--fonte-corpo)",
              fontSize: "14px",
              color: "var(--cor-dourado)",
              background: "none",
              border: "none",
              minHeight: "44px",
              display: "inline-flex",
              alignItems: "center",
              textDecoration: "none",
            }}
          >
            Ver perfume →
          </Link>
        )}
        <Link
          href={linkCatalogo}
          style={{
            fontFamily: "var(--fonte-corpo)",
            fontSize: "0.82rem",
            color: "var(--cor-texto-suave)",
            minHeight: "44px",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          Buscar no catálogo
        </Link>
      </div>
    </div>
  )
}

// ── Ponte pro chat ───────────────────────────────────────────────────────────

function PonteParaChat() {
  return (
    <div style={{ textAlign: "center", padding: "21px 0" }}>
      <p
        style={{
          fontFamily: "var(--fonte-corpo)",
          fontSize: "0.9rem",
          color: "var(--cor-texto-suave)",
          marginBottom: "13px",
        }}
      >
        Quer explorar mais opções?
      </p>
      <Link
        href="/consultor/chat"
        onClick={() => track("quiz_to_chat", {})}
        style={{
          display: "inline-flex",
          alignItems: "center",
          minHeight: "44px",
          padding: "0 21px",
          fontFamily: "var(--fonte-corpo)",
          fontSize: "0.875rem",
          fontWeight: 500,
          letterSpacing: "0.04em",
          color: "var(--cor-destaque)",
          border: "1px solid var(--cor-destaque)",
          borderRadius: "var(--raio-borda)",
          textDecoration: "none",
        }}
      >
        Falar com a consultora →
      </Link>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

interface PropsResultadoQuiz {
  recomendacao: RecomendacaoQuiz
  onRecomecar: () => void
}

export default function ResultadoQuiz({ recomendacao, onRecomecar }: PropsResultadoQuiz) {
  const isPremium = Boolean(recomendacao.alternativa || recomendacao.ousado)

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto" }}>
      {/* Cabeçalho */}
      <p
        style={{
          fontSize: "0.6875rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#C4714A",
          marginBottom: "8px",
        }}
      >
        {isPremium ? "Suas recomendações" : "Sua recomendação"}
      </p>
      <p
        style={{
          fontFamily: "var(--fonte-corpo)",
          fontSize: "0.9375rem",
          color: "var(--cor-texto-suave)",
          marginBottom: "34px",
          lineHeight: 1.5,
        }}
      >
        {isPremium
          ? "Três caminhos para o perfume certo — do mais próximo ao mais ousado."
          : "O perfume mais alinhado com o seu perfil."}
      </p>

      {/* FREE — card ideal único, centrado, largura total */}
      {!isPremium && (
        <div style={{ marginBottom: "34px" }}>
          <CardRecomendacao slot="ideal" card={recomendacao.ideal} destaque />
        </div>
      )}

      {/* PREMIUM — ideal no topo + alternativa/ousado lado a lado */}
      {isPremium && (
        <div style={{ display: "flex", flexDirection: "column", gap: "13px", marginBottom: "34px" }}>
          <CardRecomendacao slot="ideal" card={recomendacao.ideal} destaque />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "13px",
            }}
          >
            {recomendacao.alternativa && <CardRecomendacao slot="alternativa" card={recomendacao.alternativa} />}
            {recomendacao.ousado && <CardRecomendacao slot="ousado" card={recomendacao.ousado} />}
          </div>
        </div>
      )}

      {/* Ponte pro chat */}
      <PonteParaChat />

      {/* Separador */}
      <div style={{ borderTop: "1px solid var(--cor-borda)", margin: "34px 0" }} />

      {/* Recomeçar */}
      <button
        type="button"
        onClick={onRecomecar}
        style={{
          display: "flex",
          width: "100%",
          maxWidth: "260px",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "var(--fonte-corpo)",
          fontWeight: 500,
          fontSize: "0.875rem",
          letterSpacing: "0.07em",
          padding: "0.875rem 2rem",
          minHeight: "44px",
          borderRadius: "var(--raio-borda)",
          cursor: "pointer",
          backgroundColor: "transparent",
          color: "var(--cor-texto)",
          border: "1px solid var(--cor-borda)",
          transition: "opacity 0.2s",
        }}
      >
        Fazer nova consulta
      </button>
    </div>
  )
}

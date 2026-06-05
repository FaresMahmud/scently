// ============================================
// ARQUIVO: components/consultor/ResultadoQuiz.tsx
// O QUE FAZ: exibe os cartões de recomendação do quiz
//   FREE:    1 card (ideal) — centrado, largura total
//   PREMIUM: 3 cards — ideal no topo, alternativo + ousado lado a lado
// QUANDO MANDAR PRA IA: quando quiser mudar o layout do resultado do quiz
// DEPENDE DE: lib/ai.ts (RecomendacaoQuiz), components/ui/
// ============================================

"use client"

import Link from "next/link"
import type { RecomendacaoQuiz, RecomendacaoCard } from "@/lib/ai"
import { SUPPLIER_URLS } from "@/lib/suppliers"

// ── Metadata por slot ─────────────────────────────────────────────────────────

const SLOT_META: Record<
  "ideal" | "alternativo" | "ousado",
  { label: string; descricao: string; cor: string; destaque?: boolean }
> = {
  ideal: {
    label: "Ideal para você",
    descricao: "Maior correspondência com o seu perfil",
    cor: "var(--cor-destaque)",
    destaque: true,
  },
  alternativo: {
    label: "Alternativo",
    descricao: "Mesma assinatura olfativa, caminho diferente",
    cor: "var(--cor-texto-suave)",
  },
  ousado: {
    label: "Para explorar",
    descricao: "Empurra o perfil além — para quem quer descobrir",
    cor: "var(--cor-dourado)",
  },
}

// ── Card individual ───────────────────────────────────────────────────────────

function CardRecomendacao({
  slot,
  card,
}: {
  slot: "ideal" | "alternativo" | "ousado"
  card: RecomendacaoCard | undefined
}) {
  if (!card) return null

  const meta          = SLOT_META[slot]
  const linkCatalogo  = `/catalogo?busca=${encodeURIComponent(`${card.nome} ${card.marca}`)}`
  const linkPerfume   = `/perfume/${card.codigo}`
  const linkFornecedor = SUPPLIER_URLS[card.marca] ?? null

  return (
    <div
      style={{
        padding: "21px",
        backgroundColor: "var(--cor-card)",
        border: meta.destaque
          ? "1.5px solid var(--cor-destaque)"
          : "1px solid var(--cor-borda)",
        borderRadius: "var(--raio-borda-suave)",
        display: "flex",
        flexDirection: "column",
        gap: "13px",
      }}
    >
      {/* Slot label */}
      <div>
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
        <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.72rem", color: "var(--cor-texto-suave)" }}>
          {meta.descricao}
        </p>
      </div>

      {/* Marca */}
      <p
        style={{
          fontFamily: "var(--fonte-corpo)",
          fontSize: "0.75rem",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--cor-texto-suave)",
        }}
      >
        {card.marca}
      </p>

      {/* Nome */}
      <h3
        style={{
          fontFamily: "var(--fonte-titulo)",
          fontWeight: 300,
          fontSize: "clamp(22px, 4vw, 32px)",
          lineHeight: 1.1,
          color: "var(--cor-texto)",
          margin: 0,
        }}
      >
        {card.nome}
      </h3>

      {/* Explicação */}
      <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.88rem", color: "var(--cor-texto-suave)", lineHeight: 1.65 }}>
        {card.explicacao}
      </p>

      {/* Quando usar */}
      {card.quando && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginTop: "13px" }}>
          {/* Calendar icon — thin stroke, terracota */}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginTop: "2px" }}>
            <rect x="1" y="2.5" width="12" height="10.5" rx="1.5" stroke="#C4714A" strokeWidth="1.2"/>
            <path d="M1 5.5h12" stroke="#C4714A" strokeWidth="1.2"/>
            <path d="M4.5 1v3M9.5 1v3" stroke="#C4714A" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.875rem", color: "rgba(26,26,24,0.7)", lineHeight: 1.5, margin: 0 }}>
            {card.quando}
          </p>
        </div>
      )}

      {/* Aplicação */}
      {card.aplicacao && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginTop: "13px" }}>
          {/* Spray bottle icon — thin stroke, text at 50% opacity */}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginTop: "2px" }}>
            <path d="M6 4.5V11a1.5 1.5 0 003 0V4.5" stroke="rgba(26,26,24,0.5)" strokeWidth="1.2" strokeLinecap="round"/>
            <rect x="5.5" y="2.5" width="4" height="2.5" rx="1" stroke="rgba(26,26,24,0.5)" strokeWidth="1.2"/>
            <path d="M9.5 3.5H11a1 1 0 011 1v0" stroke="rgba(26,26,24,0.5)" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M12 4.5h.5" stroke="rgba(26,26,24,0.5)" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.875rem", color: "rgba(26,26,24,0.7)", lineHeight: 1.5, margin: 0 }}>
            {card.aplicacao}
          </p>
        </div>
      )}

      {/* Ações */}
      <div style={{ display: "flex", gap: "13px", flexWrap: "wrap", alignItems: "center", marginTop: "auto" }}>
        <Link
          href={linkPerfume}
          style={{
            fontFamily: "var(--fonte-corpo)",
            fontSize: "0.82rem",
            color: meta.cor,
            fontWeight: 500,
            minHeight: "44px",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          Ver perfume →
        </Link>
        <Link
          href={linkCatalogo}
          style={{
            fontFamily: "var(--fonte-corpo)",
            fontSize: "0.78rem",
            color: "var(--cor-texto-suave)",
            minHeight: "44px",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          Buscar no catálogo
        </Link>
        {linkFornecedor && (
          <a
            href={linkFornecedor}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "var(--fonte-corpo)",
              fontSize: "0.82rem",
              color: "#C4714A",
              fontWeight: 500,
              minHeight: "44px",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            Comprar na {card.marca} →
          </a>
        )}
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

interface PropsResultadoQuiz {
  recomendacao: RecomendacaoQuiz
  onRecomecar: () => void
}

export default function ResultadoQuiz({ recomendacao, onRecomecar }: PropsResultadoQuiz) {
  const isPremium = Boolean(recomendacao.alternativo || recomendacao.ousado)

  return (
    <div style={{ maxWidth: "620px", margin: "0 auto" }}>
      {/* Cabeçalho */}
      <p
        style={{
          fontSize: "0.72rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--cor-destaque)",
          marginBottom: "8px",
        }}
      >
        {isPremium ? "Suas recomendações" : "Sua recomendação"}
      </p>
      <p
        style={{
          fontFamily: "var(--fonte-corpo)",
          fontSize: "0.85rem",
          color: "var(--cor-texto-suave)",
          marginBottom: "34px",
          lineHeight: 1.5,
        }}
      >
        {isPremium
          ? "Três caminhos para o perfume certo — do mais próximo ao mais ousado."
          : "O perfume mais alinhado com o seu perfil."}
      </p>

      {/* FREE — card ideal centrado, largura total */}
      {!isPremium && (
        <div style={{ marginBottom: "34px" }}>
          <CardRecomendacao slot="ideal" card={recomendacao.ideal} />
        </div>
      )}

      {/* PREMIUM — ideal no topo + alternativo/ousado em grid 2 colunas */}
      {isPremium && (
        <div style={{ display: "flex", flexDirection: "column", gap: "13px", marginBottom: "34px" }}>
          {/* Ideal — linha inteira */}
          <CardRecomendacao slot="ideal" card={recomendacao.ideal} />

          {/* Alternativo + Ousado — lado a lado em telas médias */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "13px",
            }}
          >
            <CardRecomendacao slot="alternativo" card={recomendacao.alternativo} />
            <CardRecomendacao slot="ousado"      card={recomendacao.ousado} />
          </div>
        </div>
      )}

      {/* Separador */}
      <div style={{ borderTop: "1px solid var(--cor-borda)", marginBottom: "34px" }} />

      {/* Recomeçar */}
      <button
        type="button"
        onClick={onRecomecar}
        style={{
          display: "inline-flex",
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

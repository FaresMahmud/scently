// ============================================
// ARQUIVO: components/consultor/ResultadoQuiz.tsx
// O QUE FAZ: exibe os 4 cartões de recomendação do novo quiz (ideal, alternativo, seguro, ousado)
// QUANDO MANDAR PRA IA: quando quiser mudar o layout do resultado do quiz
// DEPENDE DE: lib/ai.ts (tipo RecomendacaoQuiz), components/ui/
// ============================================

"use client"

import Link from "next/link"
import { slugify } from "@/lib/utils"
import type { RecomendacaoQuiz, RecomendacaoCard } from "@/lib/ai"

// ── Labels e cores de cada slot ───────────────────────────────────────────────

const SLOT_META: Record<
  keyof RecomendacaoQuiz,
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
  seguro: {
    label: "Escolha segura",
    descricao: "Alta aceitação, sem surpresas",
    cor: "var(--cor-texto-suave)",
  },
  ousado: {
    label: "Para explorar",
    descricao: "Expande o seu perfil — para quem quer descobrir",
    cor: "var(--cor-dourado)",
  },
}

// ── Card individual ───────────────────────────────────────────────────────────

function CardRecomendacao({
  slot,
  card,
}: {
  slot: keyof RecomendacaoQuiz
  card: RecomendacaoCard
}) {
  const meta = SLOT_META[slot]
  const linkCatalogo = `/catalogo?busca=${encodeURIComponent(`${card.nome} ${card.marca}`)}`
  const linkPerfume  = `/perfume/${card.codigo}`

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
        <p
          style={{
            fontFamily: "var(--fonte-corpo)",
            fontSize: "0.72rem",
            color: "var(--cor-texto-suave)",
          }}
        >
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

      {/* Explicação personalizada */}
      <p
        style={{
          fontFamily: "var(--fonte-corpo)",
          fontSize: "0.88rem",
          color: "var(--cor-texto-suave)",
          lineHeight: 1.65,
        }}
      >
        {card.explicacao}
      </p>

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
  const slots = (["ideal", "alternativo", "seguro", "ousado"] as const)

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
        Suas recomendações
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
        Quatro caminhos para o perfume certo — do mais próximo ao mais ousado.
      </p>

      {/* Grade de cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "13px", marginBottom: "34px" }}>
        {slots.map(slot => (
          <CardRecomendacao key={slot} slot={slot} card={recomendacao[slot]} />
        ))}
      </div>

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

// ============================================
// ARQUIVO: components/consultor/ResultadoQuiz.tsx
// O QUE FAZ: exibe os cartões de recomendação do quiz
//   FREE:    1 card (ideal) — centrado, largura total
//   PREMIUM: 3 cards — ideal no topo, alternativo + ousado lado a lado
// QUANDO MANDAR PRA IA: quando quiser mudar o layout do resultado do quiz
// DEPENDE DE: lib/ai.ts (RecomendacaoQuiz), lib/suppliers.ts
// ============================================

"use client"

import Link from "next/link"
import type { RecomendacaoQuiz, RecomendacaoCard } from "@/lib/ai"
import { SUPPLIER_URLS } from "@/lib/suppliers"

// ── SVG icons ────────────────────────────────────────────────────────────────

function IconCalendar({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginTop: "2px" }}>
      <rect x="1" y="2.5" width="12" height="10.5" rx="1.5" stroke="#C4714A" strokeWidth="1.2"/>
      <path d="M1 5.5h12" stroke="#C4714A" strokeWidth="1.2"/>
      <path d="M4.5 1v3M9.5 1v3" stroke="#C4714A" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

function IconSpray({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginTop: "2px" }}>
      <path d="M6 4.5V11a1.5 1.5 0 003 0V4.5" stroke="rgba(26,26,24,0.5)" strokeWidth="1.2" strokeLinecap="round"/>
      <rect x="5.5" y="2.5" width="4" height="2.5" rx="1" stroke="rgba(26,26,24,0.5)" strokeWidth="1.2"/>
      <path d="M9.5 3.5H11a1 1 0 011 1v0" stroke="rgba(26,26,24,0.5)" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M12 4.5h.5" stroke="rgba(26,26,24,0.5)" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

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

// ── Card ideal (full-width, rich) ─────────────────────────────────────────────

function CardIdeal({ card }: { card: RecomendacaoCard }) {
  const meta          = SLOT_META.ideal
  const linkCatalogo  = `/catalogo?busca=${encodeURIComponent(`${card.nome} ${card.marca}`)}`
  const linkPerfume   = `/perfume/${card.codigo}`
  const linkFornecedor = card.linkCompra ?? SUPPLIER_URLS[card.marca] ?? null

  return (
    <div
      style={{
        padding: "34px",
        backgroundColor: "var(--cor-card)",
        border: "1px solid rgba(26,26,24,0.12)",
        borderRadius: "var(--raio-borda-suave)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Slot label */}
      <div style={{ marginBottom: "21px" }}>
        <span style={{
          display: "inline-block",
          fontSize: "0.65rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: meta.cor,
          marginBottom: "4px",
        }}>
          {meta.label}
        </span>
        <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.72rem", color: "var(--cor-texto-suave)", margin: 0 }}>
          {meta.descricao}
        </p>
      </div>

      {/* Marca */}
      <p style={{
        fontFamily: "var(--fonte-corpo)",
        fontSize: "0.75rem",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--cor-texto-suave)",
        marginBottom: "8px",
      }}>
        {card.marca}
      </p>

      {/* Nome */}
      <h2 style={{
        fontFamily: "var(--fonte-titulo)",
        fontWeight: 300,
        fontSize: "clamp(34px, 6vw, 52px)",
        lineHeight: 1.05,
        color: "var(--cor-texto)",
        margin: "0 0 21px 0",
      }}>
        {card.nome}
      </h2>

      {/* Explicação */}
      <p style={{
        fontFamily: "var(--fonte-corpo)",
        fontSize: "1.0625rem",
        color: "rgba(26,26,24,0.85)",
        lineHeight: 1.6,
        marginBottom: "0",
      }}>
        {card.explicacao}
      </p>

      {/* Divisor + quando/aplicacao */}
      {(card.quando || card.aplicacao) && (
        <>
          <div style={{ borderTop: "1px solid rgba(26,26,24,0.1)", margin: "21px 0" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
            {card.quando && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <IconCalendar />
                <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.875rem", color: "rgba(26,26,24,0.7)", lineHeight: 1.5, margin: 0 }}>
                  {card.quando}
                </p>
              </div>
            )}
            {card.aplicacao && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <IconSpray />
                <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.875rem", color: "rgba(26,26,24,0.7)", lineHeight: 1.5, margin: 0 }}>
                  {card.aplicacao}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Ações */}
      <div style={{ display: "flex", gap: "21px", flexWrap: "wrap", alignItems: "center", marginTop: "21px" }}>
        <Link href={linkPerfume} style={{
          fontFamily: "var(--fonte-corpo)", fontSize: "0.875rem",
          color: "#C4714A", fontWeight: 500,
          minHeight: "44px", display: "inline-flex", alignItems: "center",
        }}>
          Ver perfume →
        </Link>
        <Link href={linkCatalogo} style={{
          fontFamily: "var(--fonte-corpo)", fontSize: "0.82rem",
          color: "var(--cor-texto-suave)",
          minHeight: "44px", display: "inline-flex", alignItems: "center",
        }}>
          Buscar no catálogo
        </Link>
        {linkFornecedor && (
          <a href={linkFornecedor} target="_blank" rel="noopener noreferrer" style={{
            fontFamily: "var(--fonte-corpo)", fontSize: "0.875rem",
            color: "#C4714A", fontWeight: 500,
            minHeight: "44px", display: "inline-flex", alignItems: "center",
          }}>
            Comprar na {card.marca} →
          </a>
        )}
      </div>
    </div>
  )
}

// ── Card secundário (alternativo / ousado) ────────────────────────────────────

function CardSecundario({
  slot,
  card,
}: {
  slot: "alternativo" | "ousado"
  card: RecomendacaoCard | undefined
}) {
  if (!card) return null

  const meta          = SLOT_META[slot]
  const linkCatalogo  = `/catalogo?busca=${encodeURIComponent(`${card.nome} ${card.marca}`)}`
  const linkPerfume   = `/perfume/${card.codigo}`
  const linkFornecedor = card.linkCompra ?? SUPPLIER_URLS[card.marca] ?? null

  return (
    <div style={{
      padding: "28px",
      backgroundColor: "var(--cor-card)",
      border: "1px solid var(--cor-borda)",
      borderRadius: "var(--raio-borda-suave)",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Slot label */}
      <div style={{ marginBottom: "13px" }}>
        <span style={{
          display: "inline-block",
          fontSize: "0.65rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: meta.cor,
          marginBottom: "4px",
        }}>
          {meta.label}
        </span>
        <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.68rem", color: "var(--cor-texto-suave)", margin: 0 }}>
          {meta.descricao}
        </p>
      </div>

      {/* Marca */}
      <p style={{
        fontFamily: "var(--fonte-corpo)", fontSize: "0.72rem",
        letterSpacing: "0.08em", textTransform: "uppercase",
        color: "var(--cor-texto-suave)", marginBottom: "6px",
      }}>
        {card.marca}
      </p>

      {/* Nome */}
      <h3 style={{
        fontFamily: "var(--fonte-titulo)",
        fontWeight: 300,
        fontSize: "clamp(26px, 4vw, 38px)",
        lineHeight: 1.05,
        color: "var(--cor-texto)",
        margin: "0 0 13px 0",
      }}>
        {card.nome}
      </h3>

      {/* Explicação */}
      <p style={{
        fontFamily: "var(--fonte-corpo)", fontSize: "0.9375rem",
        color: "var(--cor-texto-suave)", lineHeight: 1.6,
        marginBottom: "0",
      }}>
        {card.explicacao}
      </p>

      {/* quando / aplicacao */}
      {(card.quando || card.aplicacao) && (
        <>
          <div style={{ borderTop: "1px solid rgba(26,26,24,0.1)", margin: "13px 0" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {card.quando && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <IconCalendar size={13} />
                <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.8125rem", color: "rgba(26,26,24,0.7)", lineHeight: 1.5, margin: 0 }}>
                  {card.quando}
                </p>
              </div>
            )}
            {card.aplicacao && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <IconSpray size={13} />
                <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.8125rem", color: "rgba(26,26,24,0.7)", lineHeight: 1.5, margin: 0 }}>
                  {card.aplicacao}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Ações */}
      <div style={{ display: "flex", gap: "13px", flexWrap: "wrap", alignItems: "center", marginTop: "21px" }}>
        <Link href={linkPerfume} style={{
          fontFamily: "var(--fonte-corpo)", fontSize: "0.82rem",
          color: meta.cor, fontWeight: 500,
          minHeight: "44px", display: "inline-flex", alignItems: "center",
        }}>
          Ver perfume →
        </Link>
        <Link href={linkCatalogo} style={{
          fontFamily: "var(--fonte-corpo)", fontSize: "0.75rem",
          color: "var(--cor-texto-suave)",
          minHeight: "44px", display: "inline-flex", alignItems: "center",
        }}>
          Buscar no catálogo
        </Link>
        {linkFornecedor && (
          <a href={linkFornecedor} target="_blank" rel="noopener noreferrer" style={{
            fontFamily: "var(--fonte-corpo)", fontSize: "0.82rem",
            color: "#C4714A", fontWeight: 500,
            minHeight: "44px", display: "inline-flex", alignItems: "center",
          }}>
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
    <div style={{ maxWidth: "680px", margin: "0 auto" }}>
      {/* Cabeçalho */}
      <p style={{
        fontSize: "0.6875rem",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "#C4714A",
        marginBottom: "8px",
      }}>
        {isPremium ? "Suas recomendações" : "Sua recomendação"}
      </p>
      <p style={{
        fontFamily: "var(--fonte-corpo)",
        fontSize: "0.9375rem",
        color: "rgba(26,26,24,0.6)",
        marginBottom: "34px",
        lineHeight: 1.5,
      }}>
        {isPremium
          ? "Três caminhos para o perfume certo — do mais próximo ao mais ousado."
          : "O perfume mais alinhado com o seu perfil."}
      </p>

      {/* FREE — card ideal único */}
      {!isPremium && (
        <div style={{ marginBottom: "34px" }}>
          <CardIdeal card={recomendacao.ideal} />
        </div>
      )}

      {/* PREMIUM — ideal no topo + secundários em grid */}
      {isPremium && (
        <div style={{ display: "flex", flexDirection: "column", gap: "13px", marginBottom: "34px" }}>
          <CardIdeal card={recomendacao.ideal} />

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "13px",
          }}>
            <CardSecundario slot="alternativo" card={recomendacao.alternativo} />
            <CardSecundario slot="ousado"      card={recomendacao.ousado} />
          </div>
        </div>
      )}

      {/* Separador */}
      <div style={{ borderTop: "1px solid var(--cor-borda)", marginBottom: "34px" }} />

      {/* Recomeçar — full width on mobile, auto on desktop */}
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

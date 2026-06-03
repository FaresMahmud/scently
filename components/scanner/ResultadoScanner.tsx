"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import type { GeminiResult } from "@/app/api/scanner/route"
import OndeComprar from "@/components/perfume/OndeComprar"
import { slugify } from "@/lib/utils"

interface CatalogMatch {
  id: string
  nome: string
  marca: string
  concentracao?: string
  familia?: string
  imagem?: string
}

interface Props {
  perfume: GeminiResult
  catalogMatch: CatalogMatch | null
  onReiniciar: () => void
}

const CONFIANCA: Record<GeminiResult["confidence"], { label: string; cor: string; bg: string }> = {
  high:   { label: "Identificado com alta confiança",  cor: "#F5F2ED", bg: "#C4714A" },
  medium: { label: "Resultado provável",               cor: "#F5F2ED", bg: "#C9A84C" },
  low:    { label: "Identificação incerta",            cor: "#1A1A18", bg: "rgba(26,26,24,0.1)" },
}

function Chip({ text, cor }: { text: string; cor?: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      fontFamily: "var(--fonte-corpo)",
      fontSize: "0.78rem",
      padding: "6px 13px",
      borderRadius: "999px",
      border: `1px solid ${cor ? `rgba(${hexToRgb(cor)},0.4)` : "var(--cor-borda)"}`,
      backgroundColor: cor ? `rgba(${hexToRgb(cor)},0.08)` : "var(--cor-card)",
      color: cor ?? "var(--cor-texto-suave)",
    }}>{text}</span>
  )
}

function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "")
  const r = parseInt(clean.slice(0,2),16)
  const g = parseInt(clean.slice(2,4),16)
  const b = parseInt(clean.slice(4,6),16)
  return `${r},${g},${b}`
}

function BotaoSalvar({ nome, marca }: { nome: string; marca: string }) {
  const [estado, setEstado] = useState<"idle"|"saving"|"saved"|"error">("idle")

  async function salvar() {
    if (estado !== "idle") return
    setEstado("saving")
    const perfumeId = `${slugify(nome)}-${slugify(marca)}`
    try {
      const res = await fetch("/api/perfil/acervo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ perfumeId, perfumeName: nome, brand: marca, status: "QUERO_EXPERIMENTAR" }),
      })
      setEstado(res.ok ? "saved" : "error")
    } catch {
      setEstado("error")
    }
  }

  if (estado === "saved") return (
    <span style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.82rem", color: "#508C64", display: "inline-flex", alignItems: "center", minHeight: "44px" }}>
      Salvo no acervo ✓
    </span>
  )

  return (
    <button onClick={salvar} disabled={estado === "saving"} style={{
      display: "inline-flex", alignItems: "center",
      minHeight: "44px", padding: "0 21px",
      backgroundColor: "var(--cor-destaque)", color: "#fff",
      border: "none", borderRadius: "var(--raio-borda)",
      cursor: estado === "saving" ? "wait" : "pointer",
      fontFamily: "var(--fonte-corpo)", fontSize: "0.875rem", fontWeight: 500, letterSpacing: "0.07em",
      opacity: estado === "saving" ? 0.8 : 1,
    }}>
      {estado === "saving" ? "Salvando…" : estado === "error" ? "Erro — tentar de novo" : "Salvar no acervo"}
    </button>
  )
}

export default function ResultadoScanner({ perfume, catalogMatch, onReiniciar }: Props) {
  const [autenticado, setAutenticado] = useState<boolean | null>(null)
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    fetch("/api/auth/me").then(r => setAutenticado(r.ok)).catch(() => setAutenticado(false))
    // Trigger slide-up after mount
    const t = requestAnimationFrame(() => setVisivel(true))
    return () => cancelAnimationFrame(t)
  }, [])

  const cc = CONFIANCA[perfume.confidence]

  return (
    <div
      style={{
        transform: visivel ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.35s cubic-bezier(0.32,0.72,0,1)",
        backgroundColor: "#F5F2ED",
        borderRadius: "var(--raio-borda-suave) var(--raio-borda-suave) 0 0",
        padding: "34px 21px 55px",
        display: "flex",
        flexDirection: "column",
        gap: "21px",
        maxWidth: "600px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* Drag handle */}
      <div style={{ width: "40px", height: "4px", borderRadius: "2px", backgroundColor: "var(--cor-borda)", margin: "0 auto" }} />

      {/* Imagem do catálogo */}
      {catalogMatch?.imagem && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={catalogMatch.imagem}
          alt={catalogMatch.nome}
          style={{
            width: "100%",
            maxHeight: "200px",
            objectFit: "contain",
            backgroundColor: "#F5F2ED",
            marginBottom: "21px",
          }}
        />
      )}

      {/* Confidence badge */}
      <span style={{
        display: "inline-flex", alignItems: "center", alignSelf: "flex-start",
        fontFamily: "var(--fonte-corpo)", fontSize: "0.72rem", fontWeight: 500, letterSpacing: "0.08em",
        backgroundColor: cc.bg, color: cc.cor,
        padding: "4px 13px", borderRadius: "2px",
      }}>
        {cc.label}
      </span>

      {/* Brand + Name */}
      <div>
        <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cor-texto-suave)", marginBottom: "8px" }}>
          {perfume.brand}
        </p>
        <h2 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "clamp(26px, 6vw, 42px)", lineHeight: 1.08, color: "var(--cor-texto)" }}>
          {perfume.name}
        </h2>
      </div>

      {/* Olfactory family */}
      {perfume.family && (
        <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.78rem", color: "var(--cor-texto-suave)", letterSpacing: "0.06em" }}>
          {perfume.family}
        </p>
      )}

      {/* Notes */}
      {perfume.notes.length > 0 && (
        <div>
          <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cor-texto-suave)", marginBottom: "8px" }}>Notas</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {perfume.notes.map(n => <Chip key={n} text={n} cor="#C4714A" />)}
          </div>
        </div>
      )}

      {/* Occasions */}
      {perfume.occasions.length > 0 && (
        <div>
          <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cor-texto-suave)", marginBottom: "8px" }}>Ocasiões</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {perfume.occasions.map(o => <Chip key={o} text={o} />)}
          </div>
        </div>
      )}

      {/* Description */}
      {perfume.description && (
        <p style={{
          fontFamily: "var(--fonte-corpo)", fontSize: "16px", color: "var(--cor-texto-suave)",
          lineHeight: 1.7,
        }}>
          {perfume.description}
        </p>
      )}

      {/* Onde encontrar — only for high/medium confidence, after all details */}
      {(perfume.confidence === "high" || perfume.confidence === "medium") && (
        <div style={{ paddingTop: "21px", borderTop: "1px solid rgba(26,26,24,0.1)" }}>
          <OndeComprar perfumeName={perfume.name} brand={perfume.brand} />
        </div>
      )}

      {/* Divider */}
      <div style={{ height: "1px", backgroundColor: "var(--cor-borda)" }} />

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
        {catalogMatch && (
          <Link
            href={`/perfume/${catalogMatch.id}`}
            style={{
              display: "inline-flex", alignItems: "center",
              minHeight: "44px", padding: "0 21px",
              border: "1px solid var(--cor-destaque)", borderRadius: "var(--raio-borda)",
              fontFamily: "var(--fonte-corpo)", fontSize: "0.875rem", fontWeight: 500,
              color: "var(--cor-destaque)", letterSpacing: "0.07em", alignSelf: "flex-start",
            }}
          >
            Ver detalhes completos →
          </Link>
        )}

        {autenticado === true && (
          <BotaoSalvar nome={perfume.name} marca={perfume.brand} />
        )}

        <button
          onClick={onReiniciar}
          style={{
            display: "inline-flex", alignItems: "center",
            minHeight: "44px", padding: "0 21px",
            background: "none", border: "1px solid var(--cor-borda)", borderRadius: "var(--raio-borda)",
            cursor: "pointer",
            fontFamily: "var(--fonte-corpo)", fontSize: "0.875rem", color: "var(--cor-texto-suave)",
            alignSelf: "flex-start",
          }}
        >
          Escanear outro
        </button>
      </div>
    </div>
  )
}

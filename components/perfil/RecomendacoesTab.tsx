"use client"

import { useState } from "react"
import Link from "next/link"
import type { Preferencias } from "./PreferenciasTab"
import type { RecomendacaoIA } from "@/lib/ai"

interface Props {
  preferencias: Preferencias
}

function temPerfil(p: Preferencias): boolean {
  return (
    p.favoriteNotes.length > 0 ||
    p.favoriteFamilies.length > 0 ||
    p.favoriteOccasions.length > 0
  )
}

function Spinner() {
  return (
    <span
      style={{
        display: "inline-block",
        width: "16px",
        height: "16px",
        borderRadius: "50%",
        border: "2px solid var(--cor-destaque)",
        borderTopColor: "transparent",
        animation: "spin 0.6s linear infinite",
      }}
    />
  )
}

export default function RecomendacoesTab({ preferencias }: Props) {
  const [recomendacao, setRecomendacao] = useState<RecomendacaoIA | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro,    setErro]    = useState<string | null>(null)

  const hasPerfil = temPerfil(preferencias)

  async function buscarRecomendacao() {
    setLoading(true)
    setErro(null)
    try {
      // Map saved preferences to quiz answers
      const respostas = {
        notasAmadas:  preferencias.favoriteNotes,
        notasOdiadas: preferencias.avoidNotes,
        ocasiao:      preferencias.favoriteOccasions.join(", ") || undefined,
        sensacao:     preferencias.favoriteFamilies[0] ?? undefined,
        fixacaoProjecao: preferencias.intensity !== "QUALQUER" ? preferencias.intensity.toLowerCase() : undefined,
      }

      const res = await fetch("/api/consultor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respostas }),
      })
      if (!res.ok) throw new Error()
      setRecomendacao(await res.json())
    } catch {
      setErro("Não foi possível gerar recomendações agora. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (!hasPerfil) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "89px 21px",
          maxWidth: "420px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "21px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--fonte-titulo)",
            fontWeight: 300,
            fontSize: "26px",
            color: "var(--cor-texto-suave)",
            lineHeight: 1.3,
          }}
        >
          Complete seu perfil olfativo primeiro.
        </p>
        <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.85rem", color: "var(--cor-texto-suave)", lineHeight: 1.6 }}>
          Vá para a aba <strong>Minhas preferências</strong> e selecione as notas e famílias que você gosta. Assim as recomendações serão muito mais precisas.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "34px" }}>
      <div>
        <h2 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "26px", marginBottom: "8px" }}>
          Recomendações para você
        </h2>
        <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.82rem", color: "var(--cor-texto-suave)" }}>
          Baseadas nas suas preferências salvas: {[...preferencias.favoriteFamilies, ...preferencias.favoriteNotes].slice(0, 3).join(", ")}.
        </p>
      </div>

      {!recomendacao && !loading && (
        <button
          onClick={buscarRecomendacao}
          style={{
            alignSelf: "flex-start",
            minHeight: "44px",
            padding: "0 34px",
            fontFamily: "var(--fonte-corpo)",
            fontSize: "0.875rem",
            fontWeight: 500,
            letterSpacing: "0.07em",
            backgroundColor: "var(--cor-destaque)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--raio-borda)",
            cursor: "pointer",
          }}
        >
          Gerar recomendação
        </button>
      )}

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: "13px", padding: "34px 0" }}>
          <Spinner />
          <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.85rem", color: "var(--cor-texto-suave)" }}>
            Consultando o acervo…
          </p>
        </div>
      )}

      {erro && (
        <div>
          <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.85rem", color: "#C0392B", marginBottom: "13px" }}>{erro}</p>
          <button
            onClick={buscarRecomendacao}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cor-destaque)", fontFamily: "var(--fonte-corpo)", fontSize: "0.85rem", minHeight: "44px", padding: "0 8px" }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {recomendacao && (
        <div style={{ display: "flex", flexDirection: "column", gap: "21px" }}>
          {/* Principal */}
          <div
            style={{
              backgroundColor: "var(--cor-card)",
              border: "1px solid var(--cor-destaque)",
              borderRadius: "var(--raio-borda-suave)",
              padding: "34px",
            }}
          >
            <p style={{ fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cor-destaque)", marginBottom: "8px" }}>
              Perfume principal
            </p>
            <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.78rem", color: "var(--cor-texto-suave)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>
              {recomendacao.perfumePrincipal.marca}
            </p>
            <h3 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "26px", lineHeight: 1.1, marginBottom: "13px" }}>
              {recomendacao.perfumePrincipal.nome}
            </h3>
            <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.9rem", lineHeight: 1.7, color: "var(--cor-texto-suave)", marginBottom: "21px" }}>
              {recomendacao.perfumePrincipal.descricao}
            </p>
            {recomendacao.perfumePrincipal.notas?.length > 0 && (
              <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.78rem", color: "var(--cor-texto-suave)" }}>
                Notas: {recomendacao.perfumePrincipal.notas.join(", ")}
              </p>
            )}
          </div>

          {/* Conselho */}
          <div
            style={{
              backgroundColor: "var(--cor-card)",
              border: "1px solid var(--cor-borda)",
              borderRadius: "var(--raio-borda-suave)",
              padding: "21px",
            }}
          >
            <p style={{ fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#C9A84C", marginBottom: "8px" }}>
              Conselho do consultor
            </p>
            <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.9rem", lineHeight: 1.7 }}>{recomendacao.conselho}</p>
          </div>

          {/* Alternativa */}
          <div
            style={{
              backgroundColor: "var(--cor-card)",
              border: "1px solid var(--cor-borda)",
              borderRadius: "var(--raio-borda-suave)",
              padding: "21px",
            }}
          >
            <p style={{ fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cor-texto-suave)", marginBottom: "8px" }}>
              Alternativa
            </p>
            <p style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "26px", marginBottom: "4px" }}>
              {recomendacao.alternativa.nome}
            </p>
            <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.78rem", color: "var(--cor-texto-suave)", marginBottom: "8px" }}>
              {recomendacao.alternativa.marca}
            </p>
            <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.85rem", color: "var(--cor-texto-suave)", lineHeight: 1.65 }}>
              {recomendacao.alternativa.descricao}
            </p>
          </div>

          {/* Regenerate + full quiz */}
          <div style={{ display: "flex", gap: "13px", flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={buscarRecomendacao}
              disabled={loading}
              style={{
                minHeight: "44px",
                padding: "0 21px",
                background: "none",
                border: "1px solid var(--cor-borda)",
                borderRadius: "var(--raio-borda)",
                cursor: "pointer",
                fontFamily: "var(--fonte-corpo)",
                fontSize: "0.82rem",
                color: "var(--cor-texto-suave)",
              }}
            >
              Gerar outra sugestão
            </button>
            <Link
              href="/consultor"
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: "44px",
                fontFamily: "var(--fonte-corpo)",
                fontSize: "0.82rem",
                color: "var(--cor-destaque)",
              }}
            >
              Consulta completa →
            </Link>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

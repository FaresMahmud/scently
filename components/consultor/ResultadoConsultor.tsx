// ============================================
// ARQUIVO: components/consultor/ResultadoConsultor.tsx
// O QUE FAZ: exibe a recomendação da IA — perfume principal, conselho e alternativa
// QUANDO MANDAR PRA IA: quando quiser mudar o layout do resultado da consulta
// DEPENDE DE: lib/ai.ts (tipo RecomendacaoIA), components/ui/
// ============================================

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Card from "@/components/ui/Card"
import Tag from "@/components/ui/Tag"
import type { RecomendacaoIA } from "@/lib/ai"
import { textosConsultor } from "@/config/site"
import { corDaNota } from "@/lib/coresNotas"
import { traduzir, slugify } from "@/lib/utils"
import OndeComprar from "@/components/perfume/OndeComprar"

function TagNota({ nota }: { nota: string }) {
  const [active, setActive] = useState(false)
  const cor = corDaNota(nota)
  const rgb = cor.slice(1).match(/.{2}/g)!.map(h => parseInt(h, 16)).join(", ")

  return (
    <span
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onTouchStart={() => setActive(true)}
      onTouchEnd={() => setActive(false)}
      style={{
        fontSize: "0.78rem",
        padding: "0.25rem 0.65rem",
        borderRadius: "2rem",
        cursor: "default",
        transition: "all 0.15s ease",
        backgroundColor: active ? cor : `rgba(${rgb}, 0.12)`,
        border: `1.5px solid ${active ? cor : `rgba(${rgb}, 0.5)`}`,
        color: active ? "#fff" : cor,
      }}
    >
      {traduzir(nota)}
    </span>
  )
}

interface PropsResultado {
  recomendacao: RecomendacaoIA
  onRecomecar: () => void
}

function BotaoSalvar({ nome, marca }: { nome: string; marca: string }) {
  const [estado, setEstado] = useState<"idle" | "saving" | "saved" | "error">("idle")

  async function salvar() {
    if (estado !== "idle") return
    setEstado("saving")
    try {
      const res = await fetch("/api/perfil/acervo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          perfumeId:   `${slugify(nome)}-${slugify(marca)}`,
          perfumeName: nome,
          brand:       marca,
          status:      "QUERO_EXPERIMENTAR",
        }),
      })
      setEstado(res.ok ? "saved" : "error")
    } catch {
      setEstado("error")
    }
  }

  if (estado === "saved") {
    return (
      <span style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.82rem", color: "#508C64", display: "inline-flex", alignItems: "center", minHeight: "44px" }}>
        Salvo no acervo ✓
      </span>
    )
  }

  return (
    <button
      onClick={salvar}
      disabled={estado === "saving"}
      style={{
        background: "none",
        border: "1px solid var(--cor-borda)",
        borderRadius: "var(--raio-borda)",
        cursor: estado === "saving" ? "wait" : "pointer",
        fontFamily: "var(--fonte-corpo)",
        fontSize: "0.82rem",
        color: estado === "error" ? "#C0392B" : "var(--cor-texto-suave)",
        padding: "0 13px",
        minHeight: "44px",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        transition: "border-color 0.15s, color 0.15s",
      }}
    >
      {estado === "saving" ? "Salvando…" : estado === "error" ? "Erro — tentar de novo" : "Salvar no acervo"}
    </button>
  )
}

function AcoesAcervo({ nome, marca }: { nome: string; marca: string }) {
  const [autenticado, setAutenticado] = useState<boolean | null>(null)

  useEffect(() => {
    fetch("/api/auth/me").then(r => setAutenticado(r.ok)).catch(() => setAutenticado(false))
  }, [])

  if (autenticado === null) return null

  if (!autenticado) {
    return (
      <Link
        href="/cadastro"
        style={{
          display: "inline-flex",
          alignItems: "center",
          minHeight: "44px",
          fontFamily: "var(--fonte-corpo)",
          fontSize: "0.82rem",
          color: "var(--cor-destaque)",
        }}
      >
        Salvar recomendações → Criar conta
      </Link>
    )
  }

  return <BotaoSalvar nome={nome} marca={marca} />
}

export default function ResultadoConsultor({ recomendacao, onRecomecar }: PropsResultado) {
  const { perfumePrincipal, conselho, alternativa } = recomendacao

  // Link aponta para busca no catálogo (a maioria não tem página individual)
  const linkBusca = (nome: string, marca: string) =>
    `/catalogo?busca=${encodeURIComponent(`${nome} ${marca}`)}`

  return (
    <div style={{ maxWidth: "620px", margin: "0 auto", opacity: 1, animation: "none" }}>
      {/* Label de resultado */}
      <p style={{ fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cor-destaque)", marginBottom: "21px" }}>
        {textosConsultor.tituloPerfumePrincipal}
      </p>

      {/* Card do perfume principal */}
      <Card destaque style={{ marginBottom: "21px" }}>
        {/* Marca e concentração */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "13px", flexWrap: "wrap" }}>
          <Tag cor="destaque">{perfumePrincipal.marca}</Tag>
          {perfumePrincipal.concentracao && <Tag cor="dourado">{perfumePrincipal.concentracao}</Tag>}
        </div>

        {/* Nome do perfume */}
        <h2
          style={{
            fontFamily: "var(--fonte-titulo)",
            fontWeight: 300,
            fontSize: "clamp(26px, 5vw, 42px)",
            lineHeight: 1.1,
            marginBottom: "21px",
          }}
        >
          {perfumePrincipal.nome}
        </h2>

        {/* Descrição sensorial */}
        <p style={{ lineHeight: 1.75, marginBottom: "21px", fontSize: "0.95rem" }}>
          {perfumePrincipal.descricao}
        </p>

        {/* Link para busca no catálogo */}
        <Link
          href={linkBusca(perfumePrincipal.nome, perfumePrincipal.marca)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "44px",
            color: "var(--cor-destaque)",
            fontSize: "0.875rem",
            fontWeight: 500,
            marginBottom: "13px",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          Ver no catálogo →
        </Link>

        {/* Salvar no acervo / criar conta */}
        <div style={{ marginBottom: "21px" }}>
          <AcoesAcervo nome={perfumePrincipal.nome} marca={perfumePrincipal.marca} />
        </div>

        {/* Notas olfativas */}
        {perfumePrincipal.notas?.length > 0 && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {perfumePrincipal.notas.map(nota => (
              <TagNota key={nota} nota={nota} />
            ))}
          </div>
        )}
      </Card>

      {/* Card do conselho de especialista */}
      <Card style={{ marginBottom: "21px" }}>
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--cor-dourado)", marginBottom: "8px" }}>
          {textosConsultor.tituloDica}
        </p>
        <p style={{ fontSize: "0.9rem", lineHeight: 1.7 }}>{conselho}</p>
      </Card>

      {/* Card da alternativa */}
      <Card style={{ marginBottom: "34px" }}>
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--cor-texto-suave)", marginBottom: "13px" }}>
          {textosConsultor.tituloAlternativa}
        </p>
        <p style={{ fontFamily: "var(--fonte-titulo)", fontSize: "26px", fontWeight: 300, marginBottom: "8px" }}>
          {alternativa.nome}
        </p>
        <p style={{ fontSize: "0.78rem", color: "var(--cor-texto-suave)", marginBottom: "13px" }}>
          {alternativa.marca}
        </p>
        <p style={{ fontSize: "0.85rem", color: "var(--cor-texto-suave)", lineHeight: 1.65, marginBottom: "13px" }}>
          {alternativa.descricao}
        </p>

        {/* Link para busca no catálogo */}
        <Link
          href={linkBusca(alternativa.nome, alternativa.marca)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "44px",
            color: "var(--cor-destaque)",
            fontSize: "0.875rem",
            fontWeight: 500,
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          Ver no catálogo →
        </Link>
      </Card>

      {/* Onde encontrar — affiliate links, after all recommendation content */}
      <div
        style={{
          marginBottom: "34px",
          paddingTop: "34px",
          borderTop: "1px solid rgba(26,26,24,0.1)",
        }}
      >
        <OndeComprar perfumeName={perfumePrincipal.nome} brand={perfumePrincipal.marca} />
      </div>

      {/* Ações */}
      <div style={{ display: "flex", gap: "21px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => onRecomecar()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
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
          {textosConsultor.botaoRecomecar}
        </button>
      </div>
    </div>
  )
}

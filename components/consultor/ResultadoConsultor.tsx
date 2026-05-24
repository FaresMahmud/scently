// ============================================
// ARQUIVO: components/consultor/ResultadoConsultor.tsx
// O QUE FAZ: exibe a recomendação da IA — perfume principal, conselho e alternativa
// QUANDO MANDAR PRA IA: quando quiser mudar o layout do resultado da consulta
// DEPENDE DE: lib/ai.ts (tipo RecomendacaoIA), components/ui/
// ============================================

"use client"

import Link from "next/link"
import Card from "@/components/ui/Card"
import Tag from "@/components/ui/Tag"
import type { RecomendacaoIA } from "@/lib/ai"
import { textosConsultor } from "@/config/site"
import { corDaNota } from "@/lib/coresNotas"

function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function TagNota({ nota }: { nota: string }) {
  const cor = corDaNota(nota)
  return (
    <span
      style={{
        fontSize: "0.78rem",
        padding: "0.25rem 0.65rem",
        borderRadius: "2rem",
        cursor: "default",
        backgroundColor: `${cor}26`,
        border:          `1px solid ${cor}99`,
        color:           cor,
      }}
    >
      {nota}
    </span>
  )
}

interface PropsResultado {
  recomendacao: RecomendacaoIA
  onRecomecar: () => void
}

export default function ResultadoConsultor({ recomendacao, onRecomecar }: PropsResultado) {
  const { perfumePrincipal, conselho, alternativa } = recomendacao

  const linkPrincipal = `/perfume/${slugify(perfumePrincipal.nome)}-${slugify(perfumePrincipal.marca)}`
  const linkAlternativa = `/perfume/${slugify(alternativa.nome)}-${slugify(alternativa.marca)}`

  return (
    <div style={{ maxWidth: "620px", margin: "0 auto", opacity: 1, animation: "none" }}>
      {/* Label de resultado */}
      <p style={{ fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cor-destaque)", marginBottom: "1.5rem" }}>
        {textosConsultor.tituloPerfumePrincipal}
      </p>

      {/* Card do perfume principal */}
      <Card destaque style={{ marginBottom: "1.25rem" }}>
        {/* Marca e concentração */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <Tag cor="destaque">{perfumePrincipal.marca}</Tag>
          {perfumePrincipal.concentracao && <Tag cor="dourado">{perfumePrincipal.concentracao}</Tag>}
        </div>

        {/* Nome do perfume */}
        <h2
          style={{
            fontFamily: "var(--fonte-titulo)",
            fontWeight: 300,
            fontSize: "clamp(1.8rem, 5vw, 2.75rem)",
            lineHeight: 1.1,
            marginBottom: "1.25rem",
          }}
        >
          {perfumePrincipal.nome}
        </h2>

        {/* Descrição sensorial */}
        <p style={{ lineHeight: 1.75, marginBottom: "1.25rem", fontSize: "0.95rem" }}>
          {perfumePrincipal.descricao}
        </p>

        {/* Link para o catálogo */}
        <Link
          href={linkPrincipal}
          style={{
            display: "inline-block",
            color: "var(--cor-destaque)",
            fontSize: "0.875rem",
            fontWeight: 500,
            marginBottom: "1.25rem",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          Ver no catálogo →
        </Link>

        {/* Notas olfativas */}
        {perfumePrincipal.notas?.length > 0 && (
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {perfumePrincipal.notas.map((nota) => (
              <TagNota key={nota} nota={nota} />
            ))}
          </div>
        )}
      </Card>

      {/* Card do conselho de especialista */}
      <Card style={{ marginBottom: "1.25rem" }}>
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--cor-dourado)", marginBottom: "0.6rem" }}>
          {textosConsultor.tituloDica}
        </p>
        <p style={{ fontSize: "0.9rem", lineHeight: 1.7 }}>{conselho}</p>
      </Card>

      {/* Card da alternativa */}
      <Card style={{ marginBottom: "2.5rem" }}>
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--cor-texto-suave)", marginBottom: "0.75rem" }}>
          {textosConsultor.tituloAlternativa}
        </p>
        <p style={{ fontFamily: "var(--fonte-titulo)", fontSize: "1.35rem", fontWeight: 300, marginBottom: "0.25rem" }}>
          {alternativa.nome}
        </p>
        <p style={{ fontSize: "0.78rem", color: "var(--cor-texto-suave)", marginBottom: "0.75rem" }}>
          {alternativa.marca}
        </p>
        <p style={{ fontSize: "0.85rem", color: "var(--cor-texto-suave)", lineHeight: 1.65, marginBottom: "1rem" }}>
          {alternativa.descricao}
        </p>

        {/* Link para o catálogo */}
        <Link
          href={linkAlternativa}
          style={{
            display: "inline-block",
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

      {/* Ações */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
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

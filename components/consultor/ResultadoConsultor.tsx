// ============================================
// ARQUIVO: components/consultor/ResultadoConsultor.tsx
// O QUE FAZ: exibe a recomendação da IA — perfume principal, conselho e alternativa
// QUANDO MANDAR PRA IA: quando quiser mudar o layout do resultado da consulta
// DEPENDE DE: lib/ai.ts (tipo RecomendacaoIA), components/ui/
// ============================================

"use client"

import { useState } from "react"
import Link from "next/link"
import Card from "@/components/ui/Card"
import Tag from "@/components/ui/Tag"
import type { RecomendacaoIA } from "@/lib/ai"
import { textosConsultor } from "@/config/site"
import { corDaNota } from "@/lib/coresNotas"
import { traduzir } from "@/lib/utils"

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
            marginBottom: "21px",
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
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {perfumePrincipal.notas.map(nota => (
              <TagNota key={nota} nota={nota} />
            ))}
          </div>
        )}
      </Card>

      {/* CTA de compra */}
      <div style={{ marginBottom: "21px", padding: "21px", border: "1px solid var(--cor-borda)", borderRadius: "var(--raio-borda)" }}>
        <p style={{ fontSize: "0.8rem", color: "var(--cor-texto-suave)", marginBottom: "13px" }}>
          Encontrou seu perfume? Veja onde comprar:
        </p>
        <div style={{ display: "flex", gap: "21px", flexWrap: "wrap" }}>
          <a
            href={`https://www.sephora.com.br/search?q=${encodeURIComponent(perfumePrincipal.nome + " " + perfumePrincipal.marca)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: "0.82rem", color: "var(--cor-destaque)", textDecoration: "none", fontFamily: "var(--fonte-corpo)", display: "inline-flex", alignItems: "center", minHeight: "44px" }}
          >
            Buscar na Sephora →
          </a>
          <a
            href={`https://www.belezanaweb.com.br/busca?q=${encodeURIComponent(perfumePrincipal.nome + " " + perfumePrincipal.marca)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: "0.82rem", color: "var(--cor-destaque)", textDecoration: "none", fontFamily: "var(--fonte-corpo)", display: "inline-flex", alignItems: "center", minHeight: "44px" }}
          >
            Beleza na Web →
          </a>
          <a
            href={`https://www.amazon.com.br/s?k=${encodeURIComponent(perfumePrincipal.nome + " " + perfumePrincipal.marca)}&tag=nozze-20`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: "0.82rem", color: "var(--cor-destaque)", textDecoration: "none", fontFamily: "var(--fonte-corpo)", display: "inline-flex", alignItems: "center", minHeight: "44px" }}
          >
            Amazon →
          </a>
        </div>
      </div>

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

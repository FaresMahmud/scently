// ============================================
// ARQUIVO: components/consultor/ResultadoConsultor.tsx
// O QUE FAZ: exibe a recomendação da IA — perfume principal, conselho e alternativa
// QUANDO MANDAR PRA IA: quando quiser mudar o layout do resultado da consulta
// DEPENDE DE: lib/ai.ts (tipo RecomendacaoIA), components/ui/
// ============================================

"use client"

import Card from "@/components/ui/Card"
import Tag from "@/components/ui/Tag"
import Botao from "@/components/ui/Botao"
import type { RecomendacaoIA } from "@/lib/ai"
import { textosConsultor } from "@/config/site"

interface PropsResultado {
  recomendacao: RecomendacaoIA
  onRecomecar: () => void
}

export default function ResultadoConsultor({ recomendacao, onRecomecar }: PropsResultado) {
  const { perfumePrincipal, conselho, alternativa } = recomendacao

  return (
    <div style={{ maxWidth: "620px", margin: "0 auto" }} className="fade-in">
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

        {/* Notas olfativas */}
        {perfumePrincipal.notas?.length > 0 && (
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {perfumePrincipal.notas.map((nota) => (
              <span
                key={nota}
                style={{
                  fontSize: "0.78rem",
                  color: "var(--cor-texto-suave)",
                  backgroundColor: "var(--cor-base)",
                  border: "1px solid var(--cor-borda)",
                  padding: "0.25rem 0.65rem",
                  borderRadius: "2rem",
                }}
              >
                {nota}
              </span>
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
        <p style={{ fontSize: "0.85rem", color: "var(--cor-texto-suave)", lineHeight: 1.65 }}>
          {alternativa.descricao}
        </p>
      </Card>

      {/* Ações */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <Botao onClick={onRecomecar} variante="secundario">
          {textosConsultor.botaoRecomecar}
        </Botao>
      </div>
    </div>
  )
}

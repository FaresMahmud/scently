// ============================================
// ARQUIVO: components/perfume/NotasPerfume.tsx
// O QUE FAZ: pirâmide olfativa visual — topo/coração/fundo com chips interativos e linha lateral
// QUANDO MANDAR PRA IA: quando quiser mudar como as notas aparecem na página do perfume
// DEPENDE DE: lib/coresNotas.ts, lib/utils.ts
// ============================================

"use client"

import { useState } from "react"
import { corDaNota } from "@/lib/coresNotas"
import { traduzir } from "@/lib/utils"

interface Nota { name: string; imageUrl?: string }

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

// Cada camada tem tamanho de chip diferente para criar efeito de pirâmide
const CONFIG_CAMADA = {
  topo:    { label: "TOPO",    sub: "primeira impressão", fontSize: "0.72rem", padding: "0.2rem 0.6rem",  corLabel: "var(--cor-destaque)"    },
  coracao: { label: "CORAÇÃO", sub: "a essência",          fontSize: "0.8rem",  padding: "0.3rem 0.75rem", corLabel: "var(--cor-dourado)"     },
  fundo:   { label: "FUNDO",   sub: "o que fica",          fontSize: "0.88rem", padding: "0.35rem 0.9rem", corLabel: "var(--cor-texto-suave)" },
}

function ChipNota({
  nota,
  selecionada,
  onToggle,
  fontSize,
  padding,
}: {
  nota: Nota
  selecionada: boolean
  onToggle: () => void
  fontSize: string
  padding: string
}) {
  const [hover, setHover] = useState(false)
  const cor = corDaNota(nota.name)
  const rgb = hexToRgb(cor)
  const nome = traduzir(nota.name)

  const style = selecionada
    ? { backgroundColor: cor, color: "#fff", border: `2px solid ${cor}` }
    : hover
    ? { backgroundColor: cor, color: "#fff", border: `1.5px solid ${cor}` }
    : { backgroundColor: `rgba(${rgb}, 0.12)`, color: cor, border: `1.5px solid rgba(${rgb}, 0.5)` }

  return (
    <span
      onClick={onToggle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...style,
        fontFamily: "var(--fonte-corpo)",
        fontSize,
        padding,
        borderRadius: "999px",
        cursor: "pointer",
        userSelect: "none",
        transition: "all 0.15s ease",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
      }}
    >
      {selecionada && <span style={{ fontSize: "0.7em" }}>✓</span>}
      {nome}
    </span>
  )
}

export function NotasPerfume({
  topo,
  coracao,
  fundo,
}: {
  topo: Nota[]
  coracao: Nota[]
  fundo: Nota[]
}) {
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set())

  const toggle = (nome: string) =>
    setSelecionadas(prev => {
      const next = new Set(prev)
      next.has(nome) ? next.delete(nome) : next.add(nome)
      return next
    })

  const camadas: [keyof typeof CONFIG_CAMADA, Nota[]][] = [
    ["topo",    topo],
    ["coracao", coracao],
    ["fundo",   fundo],
  ]

  const temAlguma = topo.length > 0 || coracao.length > 0 || fundo.length > 0
  if (!temAlguma) return null

  return (
    // Linha vertical terracota à esquerda conectando as camadas
    <div style={{
      borderLeft: "2px solid var(--cor-destaque)",
      paddingLeft: "1.25rem",
      display: "flex",
      flexDirection: "column",
      gap: "1.5rem",
    }}>
      {camadas.map(([chave, notas]) => {
        if (!notas.length) return null
        const cfg = CONFIG_CAMADA[chave]

        return (
          <div key={chave}>
            {/* Label da camada */}
            <div style={{ marginBottom: "0.6rem" }}>
              <span style={{
                fontSize: "0.65rem",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: cfg.corLabel,
                fontFamily: "var(--fonte-corpo)",
              }}>
                {cfg.label}
              </span>
              <span style={{
                fontSize: "0.62rem",
                color: "var(--cor-texto-suave)",
                marginLeft: "0.5rem",
                fontFamily: "var(--fonte-corpo)",
              }}>
                {cfg.sub}
              </span>
            </div>

            {/* Chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {notas.map(n => (
                <ChipNota
                  key={n.name}
                  nota={n}
                  selecionada={selecionadas.has(n.name)}
                  onToggle={() => toggle(n.name)}
                  fontSize={cfg.fontSize}
                  padding={cfg.padding}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

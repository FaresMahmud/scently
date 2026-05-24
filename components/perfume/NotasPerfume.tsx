// ============================================
// ARQUIVO: components/perfume/NotasPerfume.tsx
// O QUE FAZ: exibe a pirâmide olfativa — notas de topo, coração e fundo
// QUANDO MANDAR PRA IA: quando quiser mudar como as notas aparecem na página do perfume
// DEPENDE DE: lib/coresNotas.ts, lib/utils.ts
// ============================================

"use client"

import { useState } from "react"
import { corDaNota } from "@/lib/coresNotas"
import { traduzir } from "@/lib/utils"

interface PropsNotasPerfume {
  notasTopo?: string[]
  notasCoracao?: string[]
  notasFundo?: string[]
}

const camadas = [
  { chave: "topo"    as const, rotulo: "Topo",    descricao: "primeira impressão", cor: "var(--cor-destaque)" },
  { chave: "coracao" as const, rotulo: "Coração", descricao: "a essência",         cor: "var(--cor-dourado)"  },
  { chave: "fundo"   as const, rotulo: "Fundo",   descricao: "o que fica",         cor: "var(--cor-texto-suave)" },
]

function ChipNota({ nota, selecionada, onToggle }: {
  nota: string
  selecionada: boolean
  onToggle: () => void
}) {
  const [hover, setHover] = useState(false)
  const cor = corDaNota(nota)
  const nome = traduzir(nota)

  // Hover: fundo sólido, texto branco
  // Selecionada: borda 2px, ícone ✓
  // Default: fundo 15%, borda 60%, texto na cor
  const bg     = hover ? cor : `${cor}26`
  const border = selecionada
    ? `2px solid ${cor}`
    : hover
    ? `1px solid ${cor}`
    : `1px solid ${cor}99`
  const color  = hover ? "#fff" : cor

  return (
    <span
      role="button"
      tabIndex={0}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onToggle}
      onKeyDown={e => e.key === "Enter" && onToggle()}
      style={{
        fontFamily: "var(--fonte-corpo)",
        fontSize: "0.8rem",
        padding: selecionada ? "0.3rem 0.75rem" : "0.3rem 0.75rem",
        borderRadius: "2rem",
        cursor: "pointer",
        userSelect: "none",
        transition: "background-color 0.15s, color 0.15s, border-color 0.15s",
        backgroundColor: bg,
        border,
        color,
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
      }}
    >
      {selecionada && <span style={{ fontSize: "0.7rem", lineHeight: 1 }}>✓</span>}
      {nome}
    </span>
  )
}

export default function NotasPerfume({ notasTopo, notasCoracao, notasFundo }: PropsNotasPerfume) {
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set())

  const notas = {
    topo:    notasTopo    ?? [],
    coracao: notasCoracao ?? [],
    fundo:   notasFundo   ?? [],
  }

  if (!notasTopo?.length && !notasCoracao?.length && !notasFundo?.length) return null

  function toggleNota(nota: string) {
    setSelecionadas(prev => {
      const next = new Set(prev)
      next.has(nota) ? next.delete(nota) : next.add(nota)
      return next
    })
  }

  return (
    <section>
      <h3 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "1.3rem", marginBottom: "1.5rem" }}>
        Pirâmide olfativa
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {camadas.map(camada => {
          const notasDaCamada = notas[camada.chave]
          if (!notasDaCamada.length) return null

          return (
            <div key={camada.chave} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              {/* Rótulo da camada */}
              <div style={{ minWidth: "80px" }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: camada.cor }}>
                  {camada.rotulo}
                </p>
                <p style={{ fontSize: "0.65rem", color: "var(--cor-texto-suave)", marginTop: "0.1rem" }}>
                  {camada.descricao}
                </p>
              </div>

              {/* Chips interativos */}
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {notasDaCamada.map(nota => (
                  <ChipNota
                    key={nota}
                    nota={nota}
                    selecionada={selecionadas.has(nota)}
                    onToggle={() => toggleNota(nota)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

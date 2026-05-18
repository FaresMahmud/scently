// ============================================
// ARQUIVO: components/perfume/NotasPerfume.tsx
// O QUE FAZ: exibe a pirâmide olfativa — notas de topo, coração e fundo
// QUANDO MANDAR PRA IA: quando quiser mudar como as notas aparecem na página do perfume
// DEPENDE DE: lib/coresNotas.ts, styles/globals.css
// ============================================

"use client"

import { useState } from "react"
import { corDaNota } from "@/lib/coresNotas"

interface PropsNotasPerfume {
  notasTopo?: string[]
  notasCoracao?: string[]
  notasFundo?: string[]
}

// Cada camada da pirâmide tem um rótulo e uma cor diferente
const camadas = [
  { chave: "topo" as const,    rotulo: "Topo",    descricao: "primeira impressão", cor: "var(--cor-destaque)" },
  { chave: "coracao" as const, rotulo: "Coração", descricao: "a essência",         cor: "var(--cor-dourado)" },
  { chave: "fundo" as const,   rotulo: "Fundo",   descricao: "o que fica",         cor: "var(--cor-texto-suave)" },
]

export default function NotasPerfume({ notasTopo, notasCoracao, notasFundo }: PropsNotasPerfume) {
  const [notaHover, setNotaHover] = useState<string | null>(null)

  const notas = {
    topo:    notasTopo    ?? [],
    coracao: notasCoracao ?? [],
    fundo:   notasFundo   ?? [],
  }

  if (!notasTopo?.length && !notasCoracao?.length && !notasFundo?.length) return null

  return (
    <section>
      <h3 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "1.3rem", marginBottom: "1.5rem" }}>
        Pirâmide olfativa
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {camadas.map((camada) => {
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

              {/* Notas da camada */}
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {notasDaCamada.map((nota) => {
                  const cor = corDaNota(nota)
                  const ativo = notaHover === nota
                  return (
                    <span
                      key={nota}
                      onMouseEnter={() => setNotaHover(nota)}
                      onMouseLeave={() => setNotaHover(null)}
                      style={{
                        fontFamily: "var(--fonte-corpo)",
                        fontSize: "0.8rem",
                        padding: "0.3rem 0.75rem",
                        borderRadius: "2rem",
                        cursor: "default",
                        transition: "background-color 0.2s, color 0.2s, border-color 0.2s",
                        backgroundColor: ativo ? cor.bg   : "var(--cor-base)",
                        color:           ativo ? cor.text : "var(--cor-texto)",
                        border:          ativo ? `1px solid ${cor.bg}` : "1px solid var(--cor-borda)",
                      }}
                    >
                      {nota}
                    </span>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ============================================
// ARQUIVO: components/perfume/AcordesPerfume.tsx
// O QUE FAZ: exibe barras horizontais com os acordes (características) principais do perfume
// QUANDO MANDAR PRA IA: quando quiser mudar o visual das barras de acordes
// DEPENDE DE: lib/coresNotas.ts, lib/utils.ts
// ============================================

"use client"

import { useState } from "react"
import { corDaNota } from "@/lib/coresNotas"
import { traduzir } from "@/lib/utils"
import type { Acorde } from "@/lib/types"

export type { Acorde }

interface PropsAcordes {
  acordes: Acorde[]
}

export default function AcordesPerfume({ acordes }: PropsAcordes) {
  const [acordeAtivo, setAcordeAtivo] = useState<string | null>(null)

  if (!acordes?.length) return null

  const ordenados = [...acordes].sort((a, b) => b.porcentagem - a.porcentagem)

  return (
    <section>
      <h3 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "26px", marginBottom: "21px" }}>
        Acordes principais
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
        {ordenados.map(acorde => {
          const cor    = corDaNota(acorde.nome)
          const ativo  = acordeAtivo === acorde.nome
          const corBarra = ativo ? cor : acorde.porcentagem > 70 ? "var(--cor-destaque)" : "var(--cor-dourado)"

          return (
            <div
              key={acorde.nome}
              onMouseEnter={() => setAcordeAtivo(acorde.nome)}
              onMouseLeave={() => setAcordeAtivo(null)}
              onTouchStart={() => setAcordeAtivo(acorde.nome)}
              onTouchEnd={() => setAcordeAtivo(null)}
              style={{ cursor: "default" }}
            >
              {/* Nome traduzido + porcentagem */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                <span style={{
                  fontFamily: "var(--fonte-corpo)",
                  fontSize: "0.82rem",
                  fontWeight: 400,
                  transition: "color 0.2s",
                  color: ativo ? cor : "var(--cor-texto)",
                }}>
                  {traduzir(acorde.nome)}
                </span>
                <span style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.72rem", color: "var(--cor-texto-suave)" }}>
                  {acorde.porcentagem}%
                </span>
              </div>

              {/* Trilho + barra preenchida */}
              <div style={{ height: "3px", backgroundColor: "var(--cor-borda)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${acorde.porcentagem}%`,
                  backgroundColor: corBarra,
                  borderRadius: "2px",
                  transition: "width 0.6s ease, background-color 0.2s",
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

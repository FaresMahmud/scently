// ============================================
// ARQUIVO: components/perfume/AcordesPerfume.tsx
// O QUE FAZ: exibe barras horizontais com os acordes (características) principais do perfume
// QUANDO MANDAR PRA IA: quando quiser mudar o visual das barras de acordes
// DEPENDE DE: lib/coresNotas.ts, styles/globals.css
// ============================================

"use client"

import { useState } from "react"
import { corDaNota } from "@/lib/coresNotas"
import type { Acorde } from "@/lib/types"

// Re-exporta para compatibilidade com imports existentes
export type { Acorde }

interface PropsAcordes {
  acordes: Acorde[]
}

export default function AcordesPerfume({ acordes }: PropsAcordes) {
  const [acordeHover, setAcordeHover] = useState<string | null>(null)

  if (!acordes?.length) return null

  const ordenados = [...acordes].sort((a, b) => b.porcentagem - a.porcentagem)

  return (
    <section>
      <h3 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "1.3rem", marginBottom: "1.5rem" }}>
        Acordes principais
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        {ordenados.map((acorde) => {
          const cor = corDaNota(acorde.nome)
          const ativo = acordeHover === acorde.nome
          const corBarra = ativo ? cor.bg : acorde.porcentagem > 70 ? "var(--cor-destaque)" : "var(--cor-dourado)"
          const corNome  = ativo ? cor.text : "var(--cor-texto)"

          return (
            <div
              key={acorde.nome}
              onMouseEnter={() => setAcordeHover(acorde.nome)}
              onMouseLeave={() => setAcordeHover(null)}
              style={{ cursor: "default" }}
            >
              {/* Nome + porcentagem */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                <span style={{
                  fontFamily: "var(--fonte-corpo)",
                  fontSize: "0.82rem",
                  fontWeight: 400,
                  transition: "color 0.2s",
                  color: corNome,
                }}>
                  {acorde.nome}
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

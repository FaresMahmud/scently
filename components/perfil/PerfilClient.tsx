"use client"

import { useState } from "react"
import AcervoTab from "./AcervoTab"
import PreferenciasTab, { type Preferencias } from "./PreferenciasTab"
import RecomendacoesTab from "./RecomendacoesTab"
import type { ItemAcervo } from "./CartaoPerfumeAcervo"

interface Acervo {
  tenho:             ItemAcervo[]
  jaSentiGostei:     ItemAcervo[]
  queroExperimentar: ItemAcervo[]
}

interface Props {
  userName:    string
  acervo:      Acervo
  preferencias: Preferencias
}

type Aba = "acervo" | "preferencias" | "recomendacoes"

const ABAS: { id: Aba; rotulo: string }[] = [
  { id: "acervo",          rotulo: "Meu acervo" },
  { id: "preferencias",    rotulo: "Minhas preferências" },
  { id: "recomendacoes",   rotulo: "Recomendações para mim" },
]

export default function PerfilClient({ userName, acervo, preferencias }: Props) {
  const [aba, setAba] = useState<Aba>("acervo")

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      {/* Page header */}
      <div style={{ marginBottom: "55px" }}>
        <p style={{ fontFamily: "var(--fonte-titulo)", fontSize: "0.78rem", letterSpacing: "0.22em", color: "var(--cor-destaque)", marginBottom: "8px" }}>
          perfil olfativo
        </p>
        <h1 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "42px", lineHeight: 1.1 }}>
          {userName}
        </h1>
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--cor-borda)",
          marginBottom: "55px",
          gap: "0",
          overflowX: "auto",
        }}
      >
        {ABAS.map(a => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            style={{
              background: "none",
              border: "none",
              borderBottom: aba === a.id ? "2px solid var(--cor-destaque)" : "2px solid transparent",
              cursor: "pointer",
              fontFamily: "var(--fonte-corpo)",
              fontSize: "0.82rem",
              fontWeight: aba === a.id ? 500 : 400,
              letterSpacing: "0.04em",
              color: aba === a.id ? "var(--cor-destaque)" : "var(--cor-texto-suave)",
              padding: "13px 21px",
              minHeight: "44px",
              whiteSpace: "nowrap",
              transition: "color 0.15s, border-color 0.15s",
              marginBottom: "-1px",
            }}
          >
            {a.rotulo}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {aba === "acervo"        && <AcervoTab        inicial={acervo} />}
      {aba === "preferencias"  && <PreferenciasTab  inicial={preferencias} />}
      {aba === "recomendacoes" && <RecomendacoesTab preferencias={preferencias} />}
    </div>
  )
}

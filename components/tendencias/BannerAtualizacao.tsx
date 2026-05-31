"use client"

import { useState, useEffect } from "react"

interface Props {
  ultimaAtualizacao: string // ISO string
}

const LIMITE_HORAS = 24

export default function BannerAtualizacao({ ultimaAtualizacao }: Props) {
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    const dt = new Date(ultimaAtualizacao)
    if (isNaN(dt.getTime()) || dt.getFullYear() < 2000) return

    const idadeHoras = (Date.now() - dt.getTime()) / (1000 * 60 * 60)
    if (idadeHoras > LIMITE_HORAS) {
      setVisivel(true)
    }
  }, [ultimaAtualizacao])

  if (!visivel) return null

  return (
    <div
      style={{
        backgroundColor: "var(--cor-card)",
        borderBottom: "1px solid var(--cor-borda)",
        padding: "13px 0",
      }}
    >
      <div className="container-site">
        <p
          style={{
            fontFamily: "var(--fonte-corpo)",
            fontSize: "0.78rem",
            color: "var(--cor-texto-suave)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#C4714A",
              animation: "pulsar 1.5s ease-in-out infinite",
            }}
          />
          Atualizando tendências…
        </p>
      </div>
      <style>{`@keyframes pulsar { 0%,100% { opacity:1; } 50% { opacity:0.3; } }`}</style>
    </div>
  )
}

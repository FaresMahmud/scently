// ============================================
// ARQUIVO: components/ui/BannerCookies.tsx
// O QUE FAZ: banner de consentimento de cookies — aparece uma vez, salva no localStorage
// ============================================

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export default function BannerCookies() {
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    const aceito = localStorage.getItem("cookies-aceitos")
    if (!aceito) setVisivel(true)
  }, [])

  function aceitar() {
    localStorage.setItem("cookies-aceitos", "true")
    setVisivel(false)
  }

  if (!visivel) return null

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 45,
        backgroundColor: "var(--cor-card)",
        borderTop: "1px solid var(--cor-borda)",
        padding: "1rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "13px",
        flexWrap: "wrap",
      }}
    >
      <p style={{ fontSize: "0.82rem", color: "var(--cor-texto-suave)", lineHeight: 1.5, margin: 0, flex: 1, minWidth: "200px" }}>
        Usamos cookies essenciais para o funcionamento do site. Ao continuar, você concorda com nossa{" "}
        <Link href="/privacidade" style={{ color: "var(--cor-destaque)" }}>
          política de privacidade
        </Link>
        .
      </p>
      <button
        onClick={aceitar}
        style={{
          fontFamily: "var(--fonte-corpo)",
          fontSize: "0.8rem",
          fontWeight: 500,
          letterSpacing: "0.06em",
          padding: "0.5rem 1.25rem",
          minHeight: "44px",
          minWidth: "44px",
          borderRadius: "var(--raio-borda)",
          border: "1px solid var(--cor-destaque)",
          backgroundColor: "transparent",
          color: "var(--cor-destaque)",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        Entendi
      </button>
    </div>
  )
}

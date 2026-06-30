"use client"

import { useState } from "react"
import { getAffiliateLinks } from "@/lib/afiliados"
import { track } from "@/lib/analytics-client"

// External link icon (inline SVG — no extra dep)
function IconExterno() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={{ flexShrink: 0 }}
    >
      <path
        d="M10 7v3H2V2h3M7 2h3v3M5.5 6.5L10 2"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BotaoLoja({ loja, url, perfumeName, brand }: { loja: string; url: string; perfumeName: string; brand: string }) {
  const [hovered, setHovered] = useState(false)

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("affiliate_click", { loja, perfumeName, brand })}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        minHeight: "44px",
        padding: "0 21px",
        fontFamily: "var(--fonte-corpo)",
        fontSize: "0.82rem",
        fontWeight: 400,
        letterSpacing: "0.04em",
        textDecoration: "none",
        borderRadius: "var(--raio-borda)",
        border: "1px solid var(--cor-texto)",
        backgroundColor: hovered ? "var(--cor-texto)" : "var(--cor-base)",
        color: hovered ? "var(--cor-base)" : "var(--cor-texto)",
        transition: "background-color 0.15s, color 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {loja}
      <IconExterno />
    </a>
  )
}

interface Props {
  perfumeName: string
  brand: string
}

export default function OndeComprar({ perfumeName, brand }: Props) {
  const links = getAffiliateLinks(perfumeName, brand)

  if (links.length === 0) return null

  return (
    <div>
      {/* Section title — deliberately "Onde encontrar", not "onde comprar" */}
      <h3
        style={{
          fontFamily: "var(--fonte-titulo)",
          fontWeight: 300,
          fontSize: "26px",
          marginBottom: "8px",
        }}
      >
        Onde encontrar
      </h3>

      {/* Ethical disclaimer — always visible */}
      <p
        style={{
          fontFamily: "var(--fonte-corpo)",
          fontSize: "14px",
          color: "var(--cor-texto-suave)",
          marginBottom: "21px",
          lineHeight: 1.5,
        }}
      >
        Links de conveniência. A recomendação é sempre sua.
      </p>

      {/* Buttons */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "13px" }}>
        {links.map(link => (
          <BotaoLoja key={link.loja} loja={link.loja} url={link.url} perfumeName={perfumeName} brand={brand} />
        ))}
      </div>
    </div>
  )
}

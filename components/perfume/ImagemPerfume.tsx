"use client"

import { useState } from "react"

/** Silhueta de flacon em traço fino — placeholder deliberado, não erro */
function FlaconPlaceholder({ marca }: { marca: string }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "21px",
    }}>
      <svg
        viewBox="0 0 89 144"
        width="89"
        height="144"
        fill="none"
        stroke="var(--cor-destaque)"
        strokeWidth="1"
        opacity="0.3"
        aria-hidden
      >
        <rect x="34" y="8" width="21" height="18" rx="1" />
        <path d="M38 26 h13 v10 h-13 z" />
        <path d="M27 36 h35 c4 6 6 13 6 21 v68 a8 8 0 0 1 -8 8 H29 a8 8 0 0 1 -8 -8 V57 c0 -8 2 -15 6 -21 z" />
        <path d="M23 76 h43" strokeDasharray="2 3" />
      </svg>
      <span style={{
        fontSize: "13px",
        fontFamily: "var(--fonte-corpo)",
        color: "var(--cor-texto-suave)",
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        opacity: 0.6,
      }}>
        {marca}
      </span>
    </div>
  )
}

export default function ImagemPerfume({ src, alt, marca }: {
  src?: string, alt: string, nome?: string, marca: string
}) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const showPlaceholder = failed || !src

  return (
    <div className="imagem-perfume-wrap">
      {/* Palco da imagem — moldura clara sobre o fundo bege da página */}
      <div style={{
        aspectRatio: "3 / 4",
        backgroundColor: "var(--cor-card)",
        border: "1px solid var(--cor-borda)",
        borderRadius: "var(--raio-borda-suave)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "34px",
        overflow: "hidden",
      }}>
        {!showPlaceholder ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            referrerPolicy="no-referrer"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              opacity: loaded ? 1 : 0,
              transition: "opacity 0.45s ease",
            }}
          />
        ) : (
          <FlaconPlaceholder marca={marca} />
        )}
      </div>
    </div>
  )
}

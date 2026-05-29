// ============================================
// ARQUIVO: components/perfume/ImagemPerfume.tsx
// O QUE FAZ: imagem do perfume com fallback de iniciais quando quebra
// ============================================

"use client"

import { useState } from "react"

interface Props {
  src: string
  alt: string
  marca: string
}

export default function ImagemPerfume({ src, alt, marca }: Props) {
  const [imgError, setImgError] = useState(false)

  if (!src || imgError) {
    return (
      <div style={{ textAlign: "center" }}>
        <p style={{
          fontFamily: "var(--fonte-titulo)",
          fontSize: "6rem",
          fontWeight: 300,
          color: "var(--cor-texto-suave)",
          opacity: 0.25,
          lineHeight: 1,
          marginBottom: "0.5rem",
        }}>
          {marca.slice(0, 2).toUpperCase()}
        </p>
        <p style={{
          fontSize: "0.7rem",
          letterSpacing: "0.15em",
          textTransform: "uppercase" as const,
          color: "var(--cor-texto-suave)",
          opacity: 0.5,
        }}>
          {marca}
        </p>
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setImgError(true)}
      style={{ width: "100%", height: "100%", objectFit: "contain", padding: "1.5rem" }}
    />
  )
}

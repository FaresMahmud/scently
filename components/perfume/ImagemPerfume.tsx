// ============================================
// ARQUIVO: components/perfume/ImagemPerfume.tsx
// O QUE FAZ: container + imagem do perfume com sticky só em desktop (≥768px)
//            e fallback de iniciais quando a imagem quebra
// ============================================

"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

interface Props {
  src: string
  alt: string
  marca: string
}

export default function ImagemPerfume({ src, alt, marca }: Props) {
  const [imgError, setImgError] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const conteudo = (!src || imgError) ? (
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
  ) : (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 500px"
        style={{ objectFit: "contain" }}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
      />
    </div>
  )

  return (
    <div style={{
      backgroundColor: "var(--cor-borda)",
      aspectRatio: "3/4",
      borderRadius: "var(--raio-borda-suave)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      position: isMobile ? "relative" : "sticky",
      top: isMobile ? undefined : "84px",
    }}>
      {conteudo}
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"

export default function ImagemPerfume({ src, alt, nome, marca }: {
  src?: string, alt: string, nome: string, marca: string
}) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  return (
    <div style={{
      position: isMobile ? "relative" : "sticky",
      top: isMobile ? undefined : "84px",
      alignSelf: "flex-start",
    }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          style={{
            width: "100%",
            aspectRatio: "3/4",
            objectFit: "contain",
            background: "#F5F2ED",
          }}
        />
      ) : (
        <div style={{
          width: "100%",
          aspectRatio: "3/4",
          background: "#F0EDE8",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}>
          <span style={{ fontSize: "68px", fontFamily: "Cormorant Garamond, serif", color: "#C4C0BA", fontWeight: 300 }}>
            {nome?.substring(0, 2).toUpperCase()}
          </span>
          <span style={{ fontSize: "13px", fontFamily: "DM Sans, sans-serif", color: "#C4C0BA", letterSpacing: "0.1em" }}>
            {marca?.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  )
}

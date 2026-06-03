"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"

export default function MenuMobileToggle() {
  const [aberto, setAberto] = useState(false)
  const pathname = usePathname()

  const fechar = () => setAberto(false)

  useEffect(() => { fechar() }, [pathname])

  useEffect(() => {
    document.body.style.overflow = aberto ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [aberto])

  return (
    <>
      {/* Botão hambúrguer */}
      <button
        onClick={() => setAberto(v => !v)}
        aria-label={aberto ? "Fechar menu" : "Abrir menu"}
        className="menu-mobile-btn"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0.5rem",
          minHeight: "44px",
          minWidth: "44px",
          color: "var(--cor-texto)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "5px",
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              display: "block",
              width: "22px",
              height: "1.5px",
              backgroundColor: "currentColor",
              transition: "transform 0.2s, opacity 0.2s",
              transform:
                aberto && i === 0 ? "translateY(6.5px) rotate(45deg)"
                : aberto && i === 1 ? "scaleX(0)"
                : aberto && i === 2 ? "translateY(-6.5px) rotate(-45deg)"
                : "none",
              opacity: aberto && i === 1 ? 0 : 1,
            }}
          />
        ))}
      </button>

      {/* Overlay */}
      {aberto && (
        <div
          onClick={fechar}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 9998,
          }}
        />
      )}

      {/* Drawer — sempre no DOM, visibilidade via transform */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "min(300px, 80vw)",
          height: "100dvh",
          backgroundColor: "#F5F2ED",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          padding: "21px",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.1)",
          transform: aberto ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s cubic-bezier(0.32,0.72,0,1)",
          pointerEvents: aberto ? "auto" : "none",
        }}
      >
        {/* Botão fechar */}
        <button
          onClick={fechar}
          aria-label="Fechar menu"
          style={{
            alignSelf: "flex-end",
            background: "none",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
            color: "#1A1A18",
            minWidth: "44px",
            minHeight: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "34px",
          }}
        >✕</button>

        {/* Links */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
          {[
            { href: "/catalogo",   label: "Catálogo" },
            { href: "/tendencias", label: "Tendências" },
            { href: "/scanner",    label: "Scanner" },
            { href: "/consultor",  label: "Consultor" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={fechar}
              style={{
                fontSize: "26px",
                fontFamily: "Cormorant Garamond, serif",
                fontWeight: 300,
                color: "#1A1A18",
                textDecoration: "none",
                padding: "13px 0",
                borderBottom: "1px solid rgba(26,26,24,0.1)",
                display: "block",
                minHeight: "44px",
              }}
            >{label}</Link>
          ))}
        </nav>

        {/* CTA */}
        <Link
          href="/consultor"
          onClick={fechar}
          style={{
            display: "block",
            backgroundColor: "#C4714A",
            color: "#F5F2ED",
            textAlign: "center",
            padding: "13px 21px",
            fontFamily: "DM Sans, sans-serif",
            fontSize: "16px",
            textDecoration: "none",
            minHeight: "44px",
            marginTop: "34px",
          }}
        >Iniciar consulta</Link>
      </div>
    </>
  )
}

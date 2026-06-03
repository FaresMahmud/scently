'use client'
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"

export default function MenuMobileToggle() {
  const [aberto, setAberto] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setAberto(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = aberto ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [aberto])

  const links = [
    { href: "/catalogo", label: "Catálogo" },
    { href: "/tendencias", label: "Tendências" },
    { href: "/scanner", label: "Scanner" },
    { href: "/consultor", label: "Consultor" },
  ]

  return (
    <>
      {/* Hamburger button — stays top RIGHT */}
      <button
        onClick={() => setAberto(true)}
        aria-label="Abrir menu"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "8px",
          minWidth: "44px",
          minHeight: "44px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "5px",
        }}
      >
        <span style={{ display: "block", width: "22px", height: "2px", backgroundColor: "#1A1A18" }} />
        <span style={{ display: "block", width: "22px", height: "2px", backgroundColor: "#1A1A18" }} />
        <span style={{ display: "block", width: "22px", height: "2px", backgroundColor: "#1A1A18" }} />
      </button>

      {/* Portal-like overlay + drawer, only rendered when open */}
      {aberto && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999 }}>
          {/* Dark overlay on the LEFT */}
          <div
            onClick={() => setAberto(false)}
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          />

          {/* Drawer panel slides from RIGHT */}
          <div style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "min(300px, 80vw)",
            height: "100%",
            backgroundColor: "#F5F2ED",
            display: "flex",
            flexDirection: "column",
            padding: "21px",
            boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
            overflowY: "auto",
          }}>
            {/* Close button top right */}
            <button
              onClick={() => setAberto(false)}
              style={{
                alignSelf: "flex-end",
                background: "none",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
                color: "#1A1A18",
                minWidth: "44px",
                minHeight: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "21px",
              }}
            >✕</button>

            {/* Nav links */}
            <nav style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              {links.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setAberto(false)}
                  style={{
                    fontSize: "26px",
                    fontFamily: "Cormorant Garamond, serif",
                    fontWeight: 300,
                    color: "#1A1A18",
                    textDecoration: "none",
                    padding: "16px 0",
                    borderBottom: "1px solid rgba(26,26,24,0.1)",
                    display: "block",
                    minHeight: "44px",
                  }}
                >{label}</Link>
              ))}
            </nav>

            {/* CTA at bottom */}
            <Link
              href="/consultor"
              onClick={() => setAberto(false)}
              style={{
                display: "block",
                backgroundColor: "#C4714A",
                color: "#F5F2ED",
                textAlign: "center",
                padding: "14px 21px",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "16px",
                textDecoration: "none",
                minHeight: "44px",
                marginTop: "34px",
                borderRadius: "2px",
              }}
            >Iniciar consulta</Link>
          </div>
        </div>
      )}
    </>
  )
}

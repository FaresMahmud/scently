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
      <button
        onClick={() => setAberto(true)}
        aria-label="Menu"
        style={{
          background: "none", border: "none", cursor: "pointer",
          padding: "10px", minWidth: "44px", minHeight: "44px",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: "5px",
        }}
      >
        <span style={{ width: "22px", height: "2px", background: "#1A1A18", display: "block" }} />
        <span style={{ width: "22px", height: "2px", background: "#1A1A18", display: "block" }} />
        <span style={{ width: "22px", height: "2px", background: "#1A1A18", display: "block" }} />
      </button>

      {aberto && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setAberto(false)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.6)",
              zIndex: 9998,
            }}
          />

          {/* Drawer */}
          <div style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: "75vw",
            maxWidth: "320px",
            height: "100dvh",
            backgroundColor: "#F5F2ED",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            padding: 0,
            boxShadow: "-8px 0 40px rgba(0,0,0,0.2)",
          }}>

            {/* Header row — X button */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              padding: "0 21px",
              height: "64px",
              borderBottom: "1px solid rgba(26,26,24,0.08)",
            }}>
              <button
                onClick={() => setAberto(false)}
                style={{
                  background: "none", border: "none",
                  cursor: "pointer", fontSize: "22px", color: "#1A1A18",
                  minWidth: "44px", minHeight: "44px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >✕</button>
            </div>

            {/* Nav */}
            <nav style={{
              padding: "13px 34px",
              flex: 1,
              display: "flex",
              flexDirection: "column",
            }}>
              {links.map(({ href, label }) => (
                <Link key={href} href={href} onClick={() => setAberto(false)} style={{
                  fontSize: "34px",
                  fontFamily: "Cormorant Garamond, serif",
                  fontWeight: 300,
                  color: "#1A1A18",
                  textDecoration: "none",
                  padding: "21px 0",
                  borderBottom: "1px solid rgba(26,26,24,0.08)",
                  display: "block",
                  letterSpacing: "-0.01em",
                }}>{label}</Link>
              ))}
            </nav>

            {/* CTA */}
            <div style={{ padding: "21px 34px 34px" }}>
              <Link href="/consultor" onClick={() => setAberto(false)} style={{
                display: "block",
                backgroundColor: "#C4714A",
                color: "#F5F2ED",
                textAlign: "center",
                padding: "16px",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "14px",
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                textDecoration: "none",
              }}>Iniciar consulta</Link>
            </div>

          </div>
        </>
      )}
    </>
  )
}

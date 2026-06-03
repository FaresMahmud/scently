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
          <div
            onClick={() => setAberto(false)}
            style={{
              position: "fixed", inset: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: 9998,
            }}
          />
          <div style={{
            position: "fixed", top: 0, right: 0,
            width: "280px", height: "100dvh",
            backgroundColor: "#F5F2ED",
            zIndex: 9999,
            display: "flex", flexDirection: "column",
            padding: "21px",
            boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
          }}>
            <button
              onClick={() => setAberto(false)}
              style={{
                alignSelf: "flex-end", background: "none", border: "none",
                cursor: "pointer", fontSize: "22px", color: "#1A1A18",
                minWidth: "44px", minHeight: "44px",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "34px",
              }}
            >✕</button>

            <nav style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              {links.map(({ href, label }) => (
                <Link key={href} href={href} onClick={() => setAberto(false)} style={{
                  fontSize: "26px",
                  fontFamily: "Cormorant Garamond, serif",
                  fontWeight: 300,
                  color: "#1A1A18",
                  textDecoration: "none",
                  padding: "16px 0",
                  borderBottom: "1px solid rgba(26,26,24,0.1)",
                  display: "block",
                }}>{label}</Link>
              ))}
            </nav>

            <Link href="/consultor" onClick={() => setAberto(false)} style={{
              display: "block",
              backgroundColor: "#C4714A",
              color: "#F5F2ED",
              textAlign: "center",
              padding: "14px",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "16px",
              textDecoration: "none",
              marginTop: "34px",
            }}>Iniciar consulta</Link>
          </div>
        </>
      )}
    </>
  )
}

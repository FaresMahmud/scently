'use client'
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useSessao } from "@/lib/useSessao"

export default function MenuMobileToggle() {
  const [aberto, setAberto] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()
  const { usuario, carregando, sair } = useSessao()

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => { setAberto(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = aberto ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [aberto])

  if (!isMobile) return null

  const fechar = () => setAberto(false)

  const links = [
    { href: "/tendencias", label: "Tendências" },
    { href: "/catalogo",   label: "Catálogo" },
    { href: "/scanner",    label: "Scanner" },
    { href: "/consultor/chat", label: "Consultor" },
  ]

  return (
    <>
      {/* Hamburger */}
      <button
        onClick={() => setAberto(true)}
        aria-label="Menu"
        className="menu-mobile-btn"
        style={{
          background: "none", border: "none", cursor: "pointer",
          padding: "10px", minWidth: "44px", minHeight: "44px",
          flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: "5px",
        }}
      >
        <span style={{ width: "22px", height: "1.5px", background: "#1A1A18", display: "block" }} />
        <span style={{ width: "22px", height: "1.5px", background: "#1A1A18", display: "block" }} />
        <span style={{ width: "22px", height: "1.5px", background: "#1A1A18", display: "block" }} />
      </button>

      {aberto && (
        <>
          {/* Overlay */}
          <div
            onClick={fechar}
            style={{
              position: "fixed", inset: 0,
              backgroundColor: "rgba(0,0,0,0.6)",
              zIndex: 9998,
            }}
          />

          {/* Drawer */}
          <div style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: "min(320px, 80vw)",
            height: "100dvh",
            backgroundColor: "#F5F2ED",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
          }}>
            {/* Header row */}
            <div style={{
              height: "64px",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              padding: "0 16px",
              borderBottom: "1px solid rgba(26,26,24,0.08)",
              flexShrink: 0,
            }}>
              <button
                onClick={fechar}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#1A1A18", fontSize: "20px",
                  minWidth: "44px", minHeight: "44px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >✕</button>
            </div>

            {/* Nav links */}
            <nav style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              padding: "8px 34px",
              overflowY: "auto",
            }}>
              {links.map(({ href, label }) => (
                <Link key={href} href={href} onClick={fechar} style={{
                  fontSize: "34px",
                  fontFamily: "Cormorant Garamond, serif",
                  fontWeight: 300,
                  color: "#1A1A18",
                  textDecoration: "none",
                  padding: "20px 0",
                  borderBottom: "1px solid rgba(26,26,24,0.08)",
                  display: "block",
                  letterSpacing: "-0.01em",
                }}>{label}</Link>
              ))}
            </nav>

            {/* Auth */}
            <div style={{
              padding: "20px 34px",
              borderTop: "1px solid rgba(26,26,24,0.08)",
              fontFamily: "DM Sans, sans-serif",
            }}>
              {carregando ? null : usuario ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "13px" }}>
                  <span style={{ fontSize: "14px", color: "#1A1A18" }}>
                    {usuario.name ?? usuario.email}
                  </span>
                  <button
                    onClick={() => { sair(); fechar() }}
                    style={{
                      background: "none",
                      border: "1px solid rgba(26,26,24,0.2)",
                      borderRadius: "8px",
                      padding: "8px 16px",
                      fontSize: "13px",
                      letterSpacing: "0.05em",
                      color: "#1A1A18",
                      cursor: "pointer",
                    }}
                  >
                    Sair
                  </button>
                </div>
              ) : (
                <Link href="/entrar" onClick={fechar} style={{
                  display: "block",
                  textAlign: "center",
                  padding: "12px",
                  fontSize: "14px",
                  fontWeight: 500,
                  letterSpacing: "0.05em",
                  color: "#C4714A",
                  border: "1px solid #C4714A",
                  borderRadius: "8px",
                  textDecoration: "none",
                }}>Entrar</Link>
              )}
            </div>

            {/* CTA */}
            <div style={{ padding: "0 34px 34px" }}>
              <Link href="/consultor" onClick={fechar} style={{
                display: "block",
                backgroundColor: "#C4714A",
                color: "#F5F2ED",
                textAlign: "center",
                padding: "16px",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "13px",
                letterSpacing: "0.1em",
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

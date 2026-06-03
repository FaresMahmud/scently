'use client'
import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"

export default function MenuMobileToggle() {
  const [aberto, setAberto] = useState(false)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)
  const pathname = usePathname()

  useEffect(() => { setAberto(false) }, [pathname])
  useEffect(() => {
    document.body.style.overflow = aberto ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [aberto])

  const fechar = () => {
    setAberto(false)
    setDragX(0)
  }

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    setDragging(true)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging) return
    const diff = e.touches[0].clientX - startX.current
    if (diff > 0) setDragX(diff)
  }

  const onTouchEnd = () => {
    setDragging(false)
    if (dragX > 80) {
      fechar()
    } else {
      setDragX(0)
    }
  }

  const links = [
    { href: "/catalogo", label: "Catálogo" },
    { href: "/tendencias", label: "Tendências" },
    { href: "/scanner", label: "Scanner" },
    { href: "/consultor", label: "Consultor" },
  ]

  const drawerWidth = "min(320px, 80vw)"

  return (
    <>
      {/* Hamburger */}
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
        <span style={{ width: "22px", height: "1.5px", background: "#1A1A18", display: "block" }} />
        <span style={{ width: "22px", height: "1.5px", background: "#1A1A18", display: "block" }} />
        <span style={{ width: "22px", height: "1.5px", background: "#1A1A18", display: "block" }} />
      </button>

      {/* Overlay */}
      {aberto && (
        <div
          onClick={fechar}
          style={{
            position: "fixed", inset: 0,
            backgroundColor: `rgba(0,0,0,${Math.max(0, 0.55 - (dragX / 400))})`,
            zIndex: 9998,
            transition: dragging ? "none" : "background-color 0.3s",
          }}
        />
      )}

      {/* Drawer */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: drawerWidth,
          height: "100dvh",
          backgroundColor: "#F5F2ED",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          transform: aberto ? `translateX(${dragX}px)` : "translateX(100%)",
          transition: dragging ? "none" : "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
          boxShadow: aberto ? "-8px 0 40px rgba(0,0,0,0.15)" : "none",
          willChange: "transform",
        }}
      >
        {/* Header row — same height as site header */}
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

        {/* Swipe hint */}
        <p style={{
          textAlign: "center",
          fontSize: "12px",
          color: "rgba(26,26,24,0.3)",
          fontFamily: "DM Sans, sans-serif",
          margin: "0 0 8px",
        }}>← arraste para fechar</p>

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
  )
}

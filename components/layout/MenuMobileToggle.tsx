// ============================================
// ARQUIVO: components/layout/MenuMobileToggle.tsx
// O QUE FAZ: botão hambúrguer e menu deslizante para navegação no celular
// QUANDO MANDAR PRA IA: quando quiser adicionar links ao menu mobile ou mudar o comportamento
// DEPENDE DE: styles/globals.css
// ============================================

"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"

// Links do menu mobile — adicione aqui quando tiver mais páginas
const links = [
  { href: "/catalogo",   texto: "Catálogo" },
  { href: "/tendencias", texto: "Tendências" },
  { href: "/scanner",    texto: "Scanner" },
  { href: "/consultor",  texto: "Consultor" },
]

export default function MenuMobileToggle() {
  const [aberto, setAberto] = useState(false)
  const pathname = usePathname()

  // Fecha o menu sempre que a rota mudar
  useEffect(() => {
    setAberto(false)
  }, [pathname])

  // Bloqueia scroll do body quando o menu está aberto
  useEffect(() => {
    document.body.style.overflow = aberto ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [aberto])

  return (
    <>
      {/* Botão hambúrguer — só visível no mobile */}
      <button
        onClick={() => setAberto(!aberto)}
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

      {/* Overlay — cobre toda a tela, fecha o menu ao clicar */}
      {aberto && (
        <div
          onClick={() => setAberto(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 9998,
          }}
        />
      )}

      {/* Gaveta do menu */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "280px",
          height: "100dvh",
          backgroundColor: "#F5F2ED",
          zIndex: 9999,
          overflowY: "auto",
          transform: aberto ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s cubic-bezier(0.32,0.72,0,1)",
          pointerEvents: aberto ? "auto" : "none",
          display: "flex",
          flexDirection: "column",
          padding: "89px 34px 55px",
          gap: "34px",
        }}
      >
        {/* Botão fechar (X) */}
        <button
          onClick={() => setAberto(false)}
          aria-label="Fechar menu"
          style={{
            position: "absolute",
            top: "21px",
            right: "21px",
            background: "none",
            border: "none",
            cursor: "pointer",
            minHeight: "44px",
            minWidth: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#1A1A18",
            fontSize: "1.25rem",
          }}
        >
          ✕
        </button>

        {/* Links de navegação */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setAberto(false)}
              style={{
                fontFamily: "Cormorant Garamond, serif",
                fontSize: "42px",
                fontWeight: 300,
                color: "#1A1A18",
                textDecoration: "none",
                display: "block",
                lineHeight: 1.1,
              }}
            >
              {link.texto}
            </Link>
          ))}
        </div>

        {/* CTA no fundo do menu mobile */}
        <div style={{ marginTop: "auto" }}>
          <Link
            href="/consultor"
            onClick={() => setAberto(false)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              backgroundColor: "var(--cor-destaque)",
              color: "#fff",
              fontFamily: "var(--fonte-corpo)",
              fontSize: "0.875rem",
              fontWeight: 500,
              letterSpacing: "0.07em",
              padding: "0.9rem",
              minHeight: "44px",
              borderRadius: "var(--raio-borda)",
              textDecoration: "none",
            }}
          >
            Iniciar consulta
          </Link>
        </div>
      </nav>
    </>
  )
}

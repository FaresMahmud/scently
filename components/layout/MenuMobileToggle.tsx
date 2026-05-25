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
  { href: "/catalogo", texto: "Catálogo" },
  { href: "/consultor", texto: "Consultor" },
]

export default function MenuMobileToggle() {
  const [aberto, setAberto] = useState(false)
  const pathname = usePathname()

  // Fecha o menu sempre que a rota mudar
  useEffect(() => {
    setAberto(false)
  }, [pathname])

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
          color: "var(--cor-texto)",
          flexDirection: "column",
          gap: "5px",
        }}
      >
        {/* Três barras do hambúrguer — transformam em X quando aberto */}
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

      {/* Overlay escuro quando menu está aberto — só existe no mobile */}
      {aberto && (
        <div
          className="menu-mobile-overlay"
          onClick={() => setAberto(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(26,26,24,0.4)",
            zIndex: 40,
          }}
        />
      )}

      {/* Gaveta do menu */}
      <nav
        className="menu-mobile-drawer"
        style={{
          position: "fixed",
          top: "72px",
          right: 0,
          bottom: 0,
          width: "260px",
          backgroundColor: "var(--cor-base)",
          borderLeft: "1px solid var(--cor-borda)",
          zIndex: 50,
          transform: aberto ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s ease",
          pointerEvents: aberto ? "auto" : "none",
          flexDirection: "column",
          padding: "2rem 1.5rem",
          gap: "0.25rem",
        }}
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setAberto(false)}
            style={{
              fontFamily: "var(--fonte-titulo)",
              fontSize: "1.5rem",
              fontWeight: 300,
              color: "var(--cor-texto)",
              padding: "0.75rem 0",
              borderBottom: "1px solid var(--cor-borda)",
            }}
          >
            {link.texto}
          </Link>
        ))}

        {/* CTA no fundo do menu mobile */}
        <div style={{ marginTop: "auto" }}>
          <Link
            href="/consultor"
            onClick={() => setAberto(false)}
            style={{
              display: "block",
              textAlign: "center",
              backgroundColor: "var(--cor-destaque)",
              color: "#fff",
              fontFamily: "var(--fonte-corpo)",
              fontSize: "0.875rem",
              fontWeight: 500,
              letterSpacing: "0.07em",
              padding: "0.9rem",
              borderRadius: "var(--raio-borda)",
            }}
          >
            Iniciar consulta
          </Link>
        </div>
      </nav>
    </>
  )
}

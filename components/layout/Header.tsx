// ============================================
// ARQUIVO: components/layout/Header.tsx
// O QUE FAZ: cabeçalho fixo com logo, navegação desktop e menu hambúrguer no mobile
// QUANDO MANDAR PRA IA: quando quiser adicionar itens ao menu ou mudar o header
// DEPENDE DE: components/layout/MenuMobile.tsx, config/site.ts
// ============================================

"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { siteMeta } from "@/config/site"
import MenuMobileToggle from "./MenuMobileToggle"
import Logo from "@/components/ui/Logo"
import { useSessao } from "@/lib/useSessao"

function AuthArea() {
  const { usuario, carregando, sair } = useSessao()

  const linkStyle: React.CSSProperties = {
    fontFamily: "var(--fonte-corpo)",
    fontSize: "0.8rem",
    fontWeight: 500,
    letterSpacing: "0.08em",
    display: "inline-flex",
    alignItems: "center",
    minHeight: "44px",
    padding: "0 8px",
  }

  if (carregando) return <span style={{ minHeight: "44px", width: "1px", display: "inline-block" }} />

  if (!usuario) {
    return (
      <Link href="/entrar" style={{ ...linkStyle, color: "var(--cor-destaque)" }}>
        Entrar
      </Link>
    )
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "13px" }}>
      <span style={{ ...linkStyle, color: "var(--cor-texto-suave)", padding: 0 }}>
        {usuario.name ?? usuario.email}
      </span>
      <button
        onClick={sair}
        style={{
          ...linkStyle,
          padding: "0 13px",
          color: "var(--cor-texto)",
          background: "none",
          border: "1px solid var(--cor-borda)",
          borderRadius: "var(--raio-borda)",
          cursor: "pointer",
        }}
      >
        Sair
      </button>
    </div>
  )
}

function LinkConsultor({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const router = useRouter()
  const pathname = usePathname()

  function handleClick(e: React.MouseEvent) {
    if (pathname === "/consultor") {
      e.preventDefault()
      window.dispatchEvent(new CustomEvent("resetar-quiz"))
    }
  }

  return (
    <Link href="/consultor" onClick={handleClick} style={style}>
      {children}
    </Link>
  )
}

export default function Header() {
  const [logoWidth, setLogoWidth] = useState(200)

  useEffect(() => {
    const update = () => setLogoWidth(window.innerWidth <= 640 ? 160 : 200)
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundColor: "var(--cor-base)",
        borderBottom: "1px solid var(--cor-borda)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div
        className="container-site"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}
      >
        {/* Logo */}
        <Link href="/" aria-label={siteMeta.nome} style={{ display: "flex", alignItems: "center" }}>
          <Logo width={logoWidth} />
        </Link>

        {/* Navegação desktop — esconde no mobile via CSS */}
        <nav className="nav-desktop">
          <Link
            href="/tendencias"
            style={{
              fontFamily: "var(--fonte-corpo)",
              fontSize: "0.8rem",
              fontWeight: 400,
              letterSpacing: "0.08em",
              color: "var(--cor-texto-suave)",
              display: "inline-flex",
              alignItems: "center",
              minHeight: "44px",
              padding: "0 8px",
            }}
          >
            tendências
          </Link>

          <Link
            href="/catalogo"
            style={{
              fontFamily: "var(--fonte-corpo)",
              fontSize: "0.8rem",
              fontWeight: 400,
              letterSpacing: "0.08em",
              color: "var(--cor-texto-suave)",
              display: "inline-flex",
              alignItems: "center",
              minHeight: "44px",
              padding: "0 8px",
            }}
          >
            catálogo
          </Link>

          <Link
            href="/scanner"
            style={{
              fontFamily: "var(--fonte-corpo)",
              fontSize: "0.8rem",
              fontWeight: 400,
              letterSpacing: "0.08em",
              color: "var(--cor-texto-suave)",
              display: "inline-flex",
              alignItems: "center",
              minHeight: "44px",
              padding: "0 8px",
            }}
          >
            scanner
          </Link>

          <Link
            href="/consultor/chat"
            style={{
              fontFamily: "var(--fonte-corpo)",
              fontSize: "0.8rem",
              fontWeight: 400,
              letterSpacing: "0.08em",
              color: "var(--cor-texto-suave)",
              display: "inline-flex",
              alignItems: "center",
              minHeight: "44px",
              padding: "0 8px",
            }}
          >
            consultor
          </Link>

          <LinkConsultor
            style={{
              fontFamily: "var(--fonte-corpo)",
              fontSize: "0.78rem",
              fontWeight: 500,
              letterSpacing: "0.08em",
              color: "var(--cor-destaque)",
              border: "1px solid var(--cor-destaque)",
              padding: "0 21px",
              borderRadius: "var(--raio-borda)",
              display: "inline-flex",
              alignItems: "center",
              minHeight: "44px",
            }}
          >
            iniciar consulta
          </LinkConsultor>

          <AuthArea />
        </nav>

        {/* Ícone hambúrguer — só aparece no mobile */}
        <MenuMobileToggle />
      </div>
    </header>
  )
}

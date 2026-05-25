// ============================================
// ARQUIVO: components/layout/Header.tsx
// O QUE FAZ: cabeçalho fixo com logo, navegação desktop e menu hambúrguer no mobile
// QUANDO MANDAR PRA IA: quando quiser adicionar itens ao menu ou mudar o header
// DEPENDE DE: components/layout/MenuMobile.tsx, config/site.ts
// ============================================

"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { siteMeta } from "@/config/site"
import MenuMobileToggle from "./MenuMobileToggle"

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
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundColor: "#F0EBE0",
        borderBottom: "1px solid var(--cor-borda)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <style>{`
        .logo-scently { width: 160px !important; height: 44px !important; }
        @media (max-width: 640px) { .logo-scently { width: 110px !important; height: 30px !important; } }
      `}</style>
      <div
        className="container-site"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            padding: "21px 0",
          }}
          aria-label={siteMeta.nome}
        >
          <Image
            src="/logo-scently.png"
            alt={siteMeta.nome}
            width={160}
            height={44}
            className="logo-scently"
            style={{
              objectFit: "contain",
              mixBlendMode: "multiply",
              border: "none",
              boxShadow: "none",
              borderRadius: 0,
            }}
            priority
          />
        </Link>

        {/* Navegação desktop — esconde no mobile via CSS */}
        <nav className="nav-desktop">
          <Link
            href="/catalogo"
            style={{
              fontFamily: "var(--fonte-corpo)",
              fontSize: "0.8rem",
              fontWeight: 400,
              letterSpacing: "0.08em",
              color: "var(--cor-texto-suave)",
            }}
          >
            catálogo
          </Link>

          <LinkConsultor
            style={{
              fontFamily: "var(--fonte-corpo)",
              fontSize: "0.8rem",
              fontWeight: 400,
              letterSpacing: "0.08em",
              color: "var(--cor-texto-suave)",
            }}
          >
            consultor
          </LinkConsultor>

          <LinkConsultor
            style={{
              fontFamily: "var(--fonte-corpo)",
              fontSize: "0.78rem",
              fontWeight: 500,
              letterSpacing: "0.08em",
              color: "var(--cor-destaque)",
              border: "1px solid var(--cor-destaque)",
              padding: "0.45rem 1.1rem",
              borderRadius: "var(--raio-borda)",
            }}
          >
            iniciar consulta
          </LinkConsultor>
        </nav>

        {/* Ícone hambúrguer — só aparece no mobile */}
        <MenuMobileToggle />
      </div>
    </header>
  )
}

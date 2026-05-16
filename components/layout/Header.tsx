// ============================================
// ARQUIVO: components/layout/Header.tsx
// O QUE FAZ: cabeçalho fixo com logo, navegação desktop e menu hambúrguer no mobile
// QUANDO MANDAR PRA IA: quando quiser adicionar itens ao menu ou mudar o header
// DEPENDE DE: components/layout/MenuMobile.tsx, config/site.ts
// ============================================

import Link from "next/link"
import { siteMeta } from "@/config/site"
import MenuMobileToggle from "./MenuMobileToggle"

export default function Header() {
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
        <Link
          href="/"
          style={{
            fontFamily: "var(--fonte-titulo)",
            fontSize: "1.5rem",
            fontWeight: 300,
            letterSpacing: "0.08em",
            color: "var(--cor-texto)",
          }}
        >
          {siteMeta.nome}
        </Link>

        {/* Navegação desktop — esconde no mobile via CSS */}
        <nav
          className="nav-desktop"
        >
          <Link
            href="/consultor"
            style={{
              fontFamily: "var(--fonte-corpo)",
              fontSize: "0.8rem",
              fontWeight: 400,
              letterSpacing: "0.08em",
              color: "var(--cor-texto-suave)",
            }}
          >
            consultor
          </Link>

          <Link
            href="/consultor"
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
          </Link>
        </nav>

        {/* Ícone hambúrguer — só aparece no mobile */}
        <MenuMobileToggle />
      </div>
    </header>
  )
}

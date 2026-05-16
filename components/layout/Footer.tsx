// ============================================
// ARQUIVO: components/layout/Footer.tsx
// O QUE FAZ: rodapé simples com nome do site e texto de crédito
// QUANDO MANDAR PRA IA: quando quiser adicionar links ou mudar o rodapé
// DEPENDE DE: config/site.ts, styles/globals.css
// ============================================

import Link from "next/link"
import { siteMeta, textosHome } from "@/config/site"

export default function Footer() {
  return (
    <footer
      style={{
        marginTop: "auto",
        borderTop: "1px solid var(--cor-borda)",
        backgroundColor: "var(--cor-base)",
      }}
    >
      <div
        className="container-site"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem",
          padding: "3rem 1.25rem",
          textAlign: "center",
        }}
      >
        {/* Logo no rodapé */}
        <Link
          href="/"
          style={{
            fontFamily: "var(--fonte-titulo)",
            fontSize: "1.25rem",
            fontWeight: 300,
            letterSpacing: "0.1em",
            color: "var(--cor-texto)",
          }}
        >
          {siteMeta.nome}
        </Link>

        {/* Linha dourada decorativa */}
        <div className="separador" style={{ margin: "0 auto" }} />

        {/* Texto de rodapé */}
        <p
          style={{
            fontFamily: "var(--fonte-corpo)",
            fontSize: "0.75rem",
            color: "var(--cor-texto-suave)",
            letterSpacing: "0.05em",
          }}
        >
          {textosHome.rodapeTexto}
        </p>

        {/* Links de navegação do rodapé */}
        <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem" }}>
          {[
            { href: "/consultor", texto: "consultor" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontFamily: "var(--fonte-corpo)",
                fontSize: "0.75rem",
                color: "var(--cor-texto-suave)",
                letterSpacing: "0.08em",
              }}
            >
              {link.texto}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}

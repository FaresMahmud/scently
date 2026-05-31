// ============================================
// ARQUIVO: components/layout/Footer.tsx
// O QUE FAZ: rodapé com navegação, contato e copyright
// QUANDO MANDAR PRA IA: quando quiser adicionar links ou mudar o rodapé
// DEPENDE DE: config/site.ts, styles/globals.css
// ============================================

import Link from "next/link"
import { siteMeta } from "@/config/site"

export default function Footer() {
  const ano = new Date().getFullYear()

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
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "34px",
          padding: "55px 21px 34px",
        }}
      >
        {/* Coluna 1 — marca */}
        <div>
          <Link
            href="/"
            style={{
              fontFamily: "var(--fonte-titulo)",
              fontSize: "1.25rem",
              fontWeight: 300,
              letterSpacing: "0.1em",
              color: "var(--cor-texto)",
              display: "block",
              marginBottom: "0.75rem",
            }}
          >
            {siteMeta.nome}
          </Link>
          <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.78rem", color: "var(--cor-texto-suave)", lineHeight: 1.6, maxWidth: "220px" }}>
            Consultoria de perfumaria guiada por IA. Grátis, sem cadastro.
          </p>
        </div>

        {/* Coluna 2 — navegação */}
        <div>
          <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cor-texto-suave)", marginBottom: "1rem" }}>
            Navegação
          </p>
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {[
              { href: "/catalogo",   texto: "Catálogo" },
              { href: "/consultor",  texto: "Consultor" },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.82rem", color: "var(--cor-texto-suave)", letterSpacing: "0.04em", display: "inline-flex", alignItems: "center", minHeight: "44px" }}
              >
                {link.texto}
              </Link>
            ))}
          </nav>
        </div>

        {/* Coluna 3 — institucional */}
        <div>
          <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cor-texto-suave)", marginBottom: "1rem" }}>
            Institucional
          </p>
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {[
              { href: "/privacidade", texto: "Política de Privacidade" },
              { href: "/termos",      texto: "Termos de Uso" },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.82rem", color: "var(--cor-texto-suave)", letterSpacing: "0.04em", display: "inline-flex", alignItems: "center", minHeight: "44px" }}
              >
                {link.texto}
              </Link>
            ))}
          </nav>
        </div>

        {/* Coluna 4 — contato */}
        <div>
          <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cor-texto-suave)", marginBottom: "1rem" }}>
            Contato
          </p>
          <a
            href="mailto:contato@nozze.app"
            style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.82rem", color: "var(--cor-destaque)", letterSpacing: "0.04em", display: "inline-flex", alignItems: "center", minHeight: "44px" }}
          >
            contato@nozze.app
          </a>
        </div>
      </div>

      {/* Linha inferior — copyright */}
      <div
        className="container-site"
        style={{
          borderTop: "1px solid var(--cor-borda)",
          padding: "21px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.72rem", color: "var(--cor-texto-suave)", letterSpacing: "0.05em" }}>
          © {ano} Nozze. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}

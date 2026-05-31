// ============================================
// ARQUIVO: app/not-found.tsx
// O QUE FAZ: página exibida quando o usuário acessa uma URL que não existe
// QUANDO MANDAR PRA IA: quando quiser mudar o visual da página de erro 404
// DEPENDE DE: config/site.ts, styles/globals.css
// ============================================

import Link from "next/link"
import { siteMeta } from "@/config/site"

export default function NaoEncontrado() {
  return (
    <main
      className="container-site"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minHeight: "60vh",
        paddingTop: "55px",
        paddingBottom: "55px",
      }}
    >
      {/* Número do erro — decorativo */}
      <p
        style={{
          fontFamily: "var(--fonte-titulo)",
          fontSize: "clamp(5rem, 15vw, 10rem)",
          fontWeight: 300,
          color: "var(--cor-borda)",
          lineHeight: 1,
          marginBottom: "1rem",
          userSelect: "none",
        }}
      >
        404
      </p>

      {/* Mensagem */}
      <h1
        style={{
          fontFamily: "var(--fonte-titulo)",
          fontWeight: 300,
          fontSize: "clamp(26px, 4vw, 42px)",
          marginBottom: "13px",
        }}
      >
        Página não encontrada
      </h1>

      <p style={{ maxWidth: "380px", marginBottom: "34px" }}>
        O endereço que você acessou não existe no {siteMeta.nome}.
      </p>

      <div className="separador" />

      {/* Links de retorno */}
      <div style={{ display: "flex", gap: "21px", marginTop: "21px", flexWrap: "wrap" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            backgroundColor: "var(--cor-destaque)",
            color: "#fff",
            fontFamily: "var(--fonte-corpo)",
            fontSize: "0.875rem",
            fontWeight: 500,
            letterSpacing: "0.07em",
            padding: "0 34px",
            minHeight: "44px",
            borderRadius: "var(--raio-borda)",
          }}
        >
          Ir para o início
        </Link>

        <Link
          href="/consultor"
          style={{
            display: "inline-flex",
            alignItems: "center",
            color: "var(--cor-texto-suave)",
            fontFamily: "var(--fonte-corpo)",
            fontSize: "0.875rem",
            fontWeight: 400,
            letterSpacing: "0.05em",
            minHeight: "44px",
          }}
        >
          Iniciar consulta →
        </Link>
      </div>
    </main>
  )
}

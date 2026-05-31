"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"
import Link from "next/link"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          backgroundColor: "#F5F2ED",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          padding: "34px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <p
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "68px",
              fontWeight: 300,
              color: "#C4714A",
              lineHeight: 1,
              marginBottom: "21px",
            }}
          >
            Oops.
          </p>
          <p style={{ fontSize: "16px", color: "#4A4A47", marginBottom: "34px", lineHeight: 1.6 }}>
            Algo inesperado aconteceu. Já fomos notificados.
          </p>
          <div style={{ display: "flex", gap: "13px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={reset}
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: "44px",
                padding: "0 21px",
                backgroundColor: "#C4714A",
                color: "#fff",
                border: "none",
                borderRadius: "2px",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 500,
                letterSpacing: "0.07em",
              }}
            >
              Tentar novamente
            </button>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: "44px",
                padding: "0 21px",
                border: "1px solid #1A1A18",
                borderRadius: "2px",
                color: "#1A1A18",
                textDecoration: "none",
                fontSize: "0.875rem",
              }}
            >
              Início
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}

import type { Metadata } from "next"
import ScannerWrapper from "@/components/scanner/ScannerWrapper"

export const metadata: Metadata = {
  title: "Scanner — Nozze",
  description: "Aponte para qualquer frasco de perfume e descubra o que está no ar.",
}

export default function PaginaScanner() {
  return (
    <main
      style={{
        minHeight: "calc(100vh - 64px)",
        backgroundColor: "#1A1A18",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header text */}
      <div style={{ textAlign: "center", padding: "55px 21px 34px" }}>
        <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.72rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#C4714A", marginBottom: "13px" }}>
          scanner
        </p>
        <h1
          style={{
            fontFamily: "var(--fonte-titulo)",
            fontWeight: 300,
            fontSize: "clamp(42px, 8vw, 68px)",
            lineHeight: 1.05,
            color: "#F5F2ED",
            marginBottom: "13px",
          }}
        >
          Aponte para o frasco.
        </h1>
        <p
          style={{
            fontFamily: "var(--fonte-corpo)",
            fontSize: "clamp(14px, 2.5vw, 18px)",
            fontWeight: 300,
            color: "rgba(245,242,237,0.5)",
            marginBottom: "8px",
          }}
        >
          Descubra o que está no ar.
        </p>
        <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "14px", color: "rgba(245,242,237,0.35)", letterSpacing: "0.04em" }}>
          Funciona com importados, contratipos, nacionais e árabes.
        </p>
      </div>

      {/* Scanner — client component handles camera/desktop detection */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <ScannerWrapper />
      </div>
    </main>
  )
}

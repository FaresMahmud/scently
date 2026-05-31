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
            fontSize: "26px",
            fontWeight: 300,
            color: "rgba(245,242,237,0.5)",
          }}
        >
          Descubra o que está no ar.
        </p>
      </div>

      {/* Scanner — client component handles camera/desktop detection */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <ScannerWrapper />
      </div>
    </main>
  )
}

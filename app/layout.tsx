// ============================================
// ARQUIVO: app/layout.tsx
// O QUE FAZ: layout raiz — envolve todas as páginas com header, footer e metadados globais
// QUANDO MANDAR PRA IA: quando quiser adicionar algo que aparece em todas as páginas
// DEPENDE DE: styles/globals.css, config/site.ts, components/layout/Header.tsx, Footer.tsx
// ============================================

import type { Metadata } from "next"
import { siteMeta } from "@/config/site"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import BannerCookies from "@/components/ui/BannerCookies"
import "@/styles/globals.css"

// Metadados padrão para SEO
export const metadata: Metadata = {
  title: {
    default: `${siteMeta.nome} — ${siteMeta.tagline}`,
    template: `%s — ${siteMeta.nome}`,
  },
  description: siteMeta.descricao,
  metadataBase: new URL(siteMeta.url),
  openGraph: {
    siteName: siteMeta.nome,
    locale: siteMeta.idioma,
    type: "website",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body
        suppressHydrationWarning
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--cor-base)",
          color: "var(--cor-texto)",
        }}
      >
        {/* Cabeçalho fixo em todas as páginas */}
        <Header />

        {/* Conteúdo principal de cada página */}
        <div style={{ flex: 1 }}>
          {children}
        </div>

        {/* Rodapé em todas as páginas */}
        <Footer />

        {/* Banner de cookies — aparece na primeira visita */}
        <BannerCookies />
      </body>
    </html>
  )
}

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
import { Cormorant_Garamond, DM_Sans } from "next/font/google"

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-dm-sans",
  display: "swap",
})

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
    <html lang="pt-BR" className={`h-full ${cormorant.variable} ${dmSans.variable}`}>
      <head>
        {/* Script para evitar "flicker" de tema claro/escuro no Next.js (SSR) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  const theme = savedTheme || systemTheme;
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {
                  console.error(e);
                }
              })();
            `
          }}
        />
        {/* Viewport */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* PWA */}
        <meta name="application-name" content="nozze" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="nozze" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#C4714A" />
        {/* Apple touch icons */}
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
      </head>
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

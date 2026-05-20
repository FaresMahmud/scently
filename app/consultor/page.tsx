// ============================================
// ARQUIVO: app/consultor/page.tsx
// O QUE FAZ: página do consultor — carrega o quiz interativo
// QUANDO MANDAR PRA IA: quando quiser mudar o layout da página ou o SEO
// DEPENDE DE: components/consultor/QuizConsultor.tsx, config/site.ts
// ============================================

import type { Metadata } from "next"
import { siteMeta } from "@/config/site"
import QuizConsultor from "@/components/consultor/QuizConsultor"

export const metadata: Metadata = {
  title: "Consultor",
  description: `Descubra seu perfume ideal com ${siteMeta.nome}. Consultoria personalizada em 4 perguntas.`,
}

// Página do consultor — o QuizConsultor é um Client Component com toda a interatividade
export default function PaginaConsultor() {
  return (
    <main
      style={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="container-site" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
        <QuizConsultor />
      </div>
    </main>
  )
}

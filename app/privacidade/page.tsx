// ============================================
// ARQUIVO: app/privacidade/page.tsx
// O QUE FAZ: página de política de privacidade — LGPD
// ============================================

import type { Metadata } from "next"
import { siteMeta } from "@/config/site"

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: `Política de privacidade e uso de dados do ${siteMeta.nome}.`,
}

export default function PaginaPrivacidade() {
  return (
    <main style={{ maxWidth: "680px", margin: "0 auto", padding: "4rem 2rem" }}>
      <p style={{ fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cor-destaque)", marginBottom: "1rem" }}>
        privacidade
      </p>
      <h1 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "clamp(2rem, 5vw, 3rem)", marginBottom: "2.5rem", lineHeight: 1.1 }}>
        Política de Privacidade
      </h1>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "1.4rem", marginBottom: "0.75rem" }}>
          O que coletamos
        </h2>
        <p>
          Coletamos apenas as respostas que você fornece no quiz de consultoria: preferências de fragrância, estilo e faixa de preço. Não coletamos nome, e-mail, CPF ou qualquer dado que permita identificar você pessoalmente.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "1.4rem", marginBottom: "0.75rem" }}>
          Como usamos seus dados
        </h2>
        <p>
          As respostas do quiz são enviadas anonimamente para um modelo de inteligência artificial que gera recomendações de perfumes. Não armazenamos essas respostas após a geração da recomendação.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "1.4rem", marginBottom: "0.75rem" }}>
          Cookies
        </h2>
        <p>
          Usamos apenas cookies essenciais para o funcionamento do site, como a confirmação de que você leu este aviso. Não usamos cookies de rastreamento, publicidade ou análise comportamental.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "1.4rem", marginBottom: "0.75rem" }}>
          Compartilhamento de dados
        </h2>
        <p>
          Não vendemos, alugamos nem compartilhamos seus dados com terceiros para fins comerciais. As respostas do quiz são processadas exclusivamente para gerar sua recomendação.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "1.4rem", marginBottom: "0.75rem" }}>
          Seus direitos (LGPD)
        </h2>
        <p>
          Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem o direito de solicitar informações sobre seus dados, corrigi-los ou solicitar sua exclusão. Como não armazenamos dados pessoais identificáveis, não há dados vinculados a você para excluir.
        </p>
      </section>

      <section>
        <h2 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "1.4rem", marginBottom: "0.75rem" }}>
          Contato
        </h2>
        <p>
          Para dúvidas sobre privacidade, entre em contato: <a href="mailto:contato@nozze.app" style={{ color: "var(--cor-destaque)" }}>contato@nozze.app</a>
        </p>
      </section>
    </main>
  )
}

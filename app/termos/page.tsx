// ============================================
// ARQUIVO: app/termos/page.tsx
// O QUE FAZ: página de Termos de Uso — obrigatório para afiliados e LGPD
// ============================================

import type { Metadata } from "next"
import { siteMeta } from "@/config/site"

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: `Termos de uso e condições do ${siteMeta.nome}.`,
}

export default function PaginaTermos() {
  return (
    <main style={{ maxWidth: "680px", margin: "0 auto", padding: "55px 34px" }}>
      <p style={{ fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cor-destaque)", marginBottom: "1rem" }}>
        legal
      </p>
      <h1 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "clamp(42px, 5vw, 68px)", marginBottom: "34px", lineHeight: 1.1 }}>
        Termos de Uso
      </h1>

      <p style={{ fontSize: "0.82rem", color: "var(--cor-texto-suave)", marginBottom: "34px" }}>
        Última atualização: janeiro de 2025
      </p>

      <section style={{ marginBottom: "34px" }}>
        <h2 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "26px", marginBottom: "13px" }}>
          1. Aceitação dos termos
        </h2>
        <p>
          Ao acessar e utilizar o Nozze, você concorda com estes Termos de Uso. Se não concordar com qualquer parte destes termos, não utilize o serviço.
        </p>
      </section>

      <section style={{ marginBottom: "34px" }}>
        <h2 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "26px", marginBottom: "13px" }}>
          2. Uso do serviço
        </h2>
        <p>
          O Nozze é uma plataforma gratuita de consultoria de perfumaria baseada em inteligência artificial. As recomendações geradas são personalizadas com base nas preferências informadas pelo usuário e têm caráter exclusivamente informativo. Não nos responsabilizamos por decisões de compra tomadas com base nas recomendações.
        </p>
      </section>

      <section style={{ marginBottom: "34px" }}>
        <h2 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "26px", marginBottom: "13px" }}>
          3. Propriedade intelectual
        </h2>
        <p>
          Todo o conteúdo do Nozze, incluindo textos, design, logotipos e código-fonte, é de propriedade do Nozze ou de seus licenciadores. É proibida a reprodução, distribuição ou modificação sem autorização expressa. Os nomes e marcas de perfumes mencionados são propriedade de seus respectivos fabricantes.
        </p>
      </section>

      <section style={{ marginBottom: "34px" }}>
        <h2 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "26px", marginBottom: "13px" }}>
          4. Divulgação de links de afiliados
        </h2>
        <p>
          O Nozze participa de programas de afiliados, incluindo o Programa de Afiliados da Amazon.com.br, Sephora e Beleza na Web. Isso significa que podemos receber uma comissão sobre compras realizadas por meio de links presentes neste site, sem custo adicional para você. Essa comissão nos permite manter o serviço gratuito para todos os usuários. Os links de afiliados são identificados pelo sufixo <code style={{ fontFamily: "monospace", fontSize: "0.85em" }}>&tag=nozze-20</code> (Amazon) ou redirecionamentos similares.
        </p>
      </section>

      <section style={{ marginBottom: "34px" }}>
        <h2 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "26px", marginBottom: "13px" }}>
          5. Limitação de responsabilidade
        </h2>
        <p>
          O Nozze é fornecido no estado em que se encontra, sem garantias de qualquer tipo. Não garantimos que as recomendações de IA sejam adequadas para todos os usuários ou que os produtos indicados estejam disponíveis. Não somos responsáveis por eventuais danos decorrentes do uso do serviço ou de compras realizadas por meio de links externos.
        </p>
      </section>

      <section style={{ marginBottom: "34px" }}>
        <h2 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "26px", marginBottom: "13px" }}>
          6. Links externos
        </h2>
        <p>
          Este site contém links para sites de terceiros (lojas de perfumes, marketplaces). Esses links são fornecidos para sua conveniência e não implicam endosso do conteúdo ou das práticas desses sites. Não temos controle sobre o conteúdo de sites externos.
        </p>
      </section>

      <section style={{ marginBottom: "34px" }}>
        <h2 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "26px", marginBottom: "13px" }}>
          7. Modificações
        </h2>
        <p>
          Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entram em vigor imediatamente após publicação. O uso continuado do serviço após modificações constitui aceitação dos novos termos.
        </p>
      </section>

      <section>
        <h2 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "26px", marginBottom: "13px" }}>
          8. Contato
        </h2>
        <p>
          Para dúvidas sobre estes termos, entre em contato: <a href="mailto:contato@nozze.app" style={{ color: "var(--cor-destaque)" }}>contato@nozze.app</a>
        </p>
      </section>
    </main>
  )
}

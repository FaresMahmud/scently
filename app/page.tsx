// ============================================
// ARQUIVO: app/page.tsx
// O QUE FAZ: página inicial — hero, em alta, como funciona, CTA e catálogo em destaque
// QUANDO MANDAR PRA IA: quando quiser mudar o layout ou o conteúdo da home
// DEPENDE DE: config/site.ts, lib/mockData.ts, lib/fragella.ts, components/perfume/CardPerfume.tsx, components/home/EmAltaAgora.tsx
// ============================================

import Link from "next/link"
import { siteMeta, textosHome } from "@/config/site"
import CardPerfume from "@/components/perfume/CardPerfume"
import EmAltaAgora from "@/components/home/EmAltaAgora"
import { perfumesPopulares } from "@/lib/catalogoFragella"

// Os três passos da seção "como funciona"
const passos = [
  { numero: "01", titulo: "Responda", descricao: "Algumas perguntas rápidas sobre o que você busca num perfume." },
  { numero: "02", titulo: "Analise",  descricao: "Seu consultor cruza seu perfil com milhares de fragrâncias." },
  { numero: "03", titulo: "Descubra", descricao: "Receba uma recomendação personalizada com explicação sensorial." },
]

export default function PaginaInicial() {
  const perfumes = perfumesPopulares(8)

  return (
    <main>
      {/* ── Hero ──────────────────────────────────────────── */}
      <section style={{ minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", borderBottom: "1px solid var(--cor-borda)" }}>
        <div className="container-site" style={{ paddingTop: "5rem", paddingBottom: "5rem", width: "100%" }}>
          <div className="hero-grid">

            {/* Coluna esquerda — texto */}
            <div className="hero-texto">
              <p style={{ fontFamily: "var(--fonte-titulo)", fontSize: "0.78rem", letterSpacing: "0.22em", color: "var(--cor-destaque)", marginBottom: "1.75rem" }}>
                {siteMeta.nome}
              </p>

              <h1 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, marginBottom: "1.75rem", lineHeight: 1.08, maxWidth: "560px" }}>
                {textosHome.heroTitulo}
              </h1>

              <div className="separador" />

              <p style={{ maxWidth: "400px", marginBottom: "3rem", fontSize: "1.05rem", marginTop: "1.5rem" }}>
                {textosHome.heroSubtitulo}
              </p>

              {/* Lei de Hick — único CTA primário no hero */}
              <div className="hero-botoes">
                <Link
                  href="/consultor"
                  style={{
                    display: "inline-flex", alignItems: "center",
                    backgroundColor: "var(--cor-destaque)", color: "#fff",
                    fontFamily: "var(--fonte-corpo)", fontSize: "0.875rem", fontWeight: 500,
                    letterSpacing: "0.07em", padding: "0.9rem 2.25rem", borderRadius: "var(--raio-borda)",
                  }}
                >
                  {textosHome.heroBotao}
                </Link>
              </div>
            </div>

            {/* Coluna direita — partículas flutuantes */}
            <div className="hero-frascos" style={{ position: "relative", height: "400px" }} aria-hidden>
              {[
                { left: "15%", top: "10%", size: 3, dur: "7s" },
                { left: "45%", top: "20%", size: 2, dur: "5s" },
                { left: "70%", top: "8%",  size: 4, dur: "9s" },
                { left: "25%", top: "45%", size: 2, dur: "6s" },
                { left: "60%", top: "35%", size: 3, dur: "8s" },
                { left: "80%", top: "55%", size: 2, dur: "5s" },
                { left: "35%", top: "65%", size: 4, dur: "7s" },
                { left: "55%", top: "75%", size: 2, dur: "6s" },
                { left: "20%", top: "80%", size: 3, dur: "9s" },
                { left: "75%", top: "70%", size: 2, dur: "5s" },
                { left: "10%", top: "55%", size: 4, dur: "8s" },
                { left: "90%", top: "30%", size: 2, dur: "6s" },
              ].map((p, i) => (
                <div key={i} className="hero-particula" style={{
                  left: p.left, top: p.top,
                  width: `${p.size}px`, height: `${p.size}px`,
                  animationDuration: p.dur,
                } as React.CSSProperties} />
              ))}
              {/* Linha de chão */}
              <div style={{ position: "absolute", bottom: "8%", left: "8%", right: "8%", height: "1px", backgroundColor: "var(--cor-borda)", opacity: 0.5 }} />
            </div>

          </div>
        </div>
      </section>

      {/* ── Em alta agora ─────────────────────────────────── */}
      <EmAltaAgora />

      {/* ── Como funciona ─────────────────────────────────── */}
      <section style={{ backgroundColor: "var(--cor-card)", borderTop: "1px solid var(--cor-borda)", borderBottom: "1px solid var(--cor-borda)" }}>
        <div className="container-site" style={{ paddingTop: "var(--fib-6)", paddingBottom: "var(--fib-6)" }}>
          <p style={{ fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--cor-texto-suave)", marginBottom: "0.75rem" }}>
            {textosHome.secaoConsultor}
          </p>
          <h2 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, maxWidth: "520px" }}>
            {textosHome.secaoConsultorDescricao}
          </h2>

          <div className="separador" />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "3rem",
              marginTop: "3rem",
            }}
          >
            {passos.map((passo) => (
              <div key={passo.numero}>
                <p
                  style={{
                    fontFamily: "var(--fonte-titulo)",
                    fontSize: "3rem",
                    fontWeight: 300,
                    color: "var(--cor-destaque)",
                    opacity: 0.35,
                    marginBottom: "0.75rem",
                    lineHeight: 1,
                    userSelect: "none",
                  }}
                >
                  {passo.numero}
                </p>
                <h3 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "1.4rem", marginBottom: "0.5rem" }}>
                  {passo.titulo}
                </h3>
                <p style={{ fontSize: "0.9rem" }}>{passo.descricao}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA central ───────────────────────────────────── */}
      <section style={{ borderBottom: "1px solid var(--cor-borda)" }}>
        <div className="container-site" style={{ paddingTop: "var(--fib-6)", paddingBottom: "var(--fib-6)", textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, maxWidth: "520px", margin: "0 auto 1.25rem" }}>
            Pronto para encontrar o seu perfume?
          </h2>
          <p style={{ maxWidth: "380px", margin: "0 auto 2rem" }}>
            Sem cadastro. Sem compromisso. Resultado em menos de 2 minutos.
          </p>
          {/* Prova social — reduz fricção */}
          <p style={{ fontSize: "0.75rem", color: "var(--cor-texto-suave)", marginBottom: "2rem", letterSpacing: "0.05em" }}>
            Mais de 12.000 fragrâncias no catálogo · Sem cadastro · Resultado em 2 minutos
          </p>
          <Link
            href="/consultor"
            className="btn-cta"
            style={{
              display: "inline-flex",
              alignItems: "center",
              backgroundColor: "var(--cor-destaque)",
              color: "#fff",
              fontFamily: "var(--fonte-corpo)",
              fontSize: "0.875rem",
              fontWeight: 500,
              letterSpacing: "0.07em",
              padding: "0.9rem 2.25rem",
              borderRadius: "var(--raio-borda)",
            }}
          >
            Iniciar consulta gratuita
          </Link>
        </div>
      </section>

      {/* ── Destaques ─────────────────────────────────────── */}
      <section id="destaques" style={{ backgroundColor: "var(--cor-card)" }}>
        <div className="container-site" style={{ paddingTop: "var(--fib-6)", paddingBottom: "var(--fib-6)" }}>
          <p style={{ fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--cor-texto-suave)", marginBottom: "0.75rem" }}>
            do nosso catálogo
          </p>
          <h2 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, marginBottom: "0.5rem" }}>
            {textosHome.secaoCatalogo}
          </h2>

          <div className="separador" />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "1.25rem",
              marginTop: "2.5rem",
            }}
          >
            {perfumes.map((perfume) => (
              <CardPerfume key={perfume.id} perfume={perfume} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA mobile fixo ─────────────────────────────── */}
      <div className="cta-mobile-fixo" aria-hidden="false">
        <Link href="/consultor" style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          backgroundColor: "var(--cor-destaque)", color: "#fff",
          fontFamily: "var(--fonte-corpo)", fontSize: "0.875rem", fontWeight: 500,
          letterSpacing: "0.07em", padding: "1rem",
          width: "100%", textAlign: "center",
        }}>
          Encontrar meu perfume →
        </Link>
      </div>
    </main>
  )
}

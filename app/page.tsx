// ============================================
// ARQUIVO: app/page.tsx
// O QUE FAZ: página inicial — hero, em alta, como funciona, CTA e catálogo em destaque
// QUANDO MANDAR PRA IA: quando quiser mudar o layout ou o conteúdo da home
// DEPENDE DE: config/site.ts, lib/mockData.ts, lib/fragella.ts, components/perfume/CardPerfume.tsx, components/home/EmAltaAgora.tsx
// ============================================

import type { Metadata } from "next"
import Link from "next/link"
import { siteMeta, textosHome } from "@/config/site"
import CardPerfume from "@/components/perfume/CardPerfume"
import EmAltaAgora from "@/components/home/EmAltaAgora"
import { perfumesPopulares } from "@/lib/catalogoFragella"
import { safeJsonLd } from "@/lib/jsonld"

export const metadata: Metadata = {
  title: { absolute: "Nozze — Encontre o perfume certo para você" },
  description: "Consultor de perfumaria com IA. Responda algumas perguntas e descubra fragrâncias perfeitas para o seu estilo, clima e ocasião. Mais de 12.000 perfumes.",
  keywords: ["perfume", "fragrância", "consultor de perfume", "recomendação de perfume", "perfume masculino", "perfume feminino", "perfume unissex"],
  openGraph: {
    title: "Nozze — Encontre o perfume certo para você",
    description: "Consultor de perfumaria com IA. Sem cadastro. Resultado em 2 minutos.",
    type: "website",
    url: "https://nozze.app",
  },
  twitter: {
    card: "summary",
    title: "Nozze — Encontre o perfume certo para você",
    description: "Consultor de perfumaria com IA. Sem cadastro. Resultado em 2 minutos.",
  },
}

const jsonLdWebSite = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Nozze",
  url: "https://nozze.app",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://nozze.app/catalogo?busca={search_term_string}",
    "query-input": "required name=search_term_string",
  },
}

// Os três passos da seção "como funciona"
const passos = [
  { numero: "01", titulo: "Responda", descricao: "Conte o que você busca. O clima onde você vive, a ocasião, o que sente." },
  { numero: "02", titulo: "Analise",  descricao: "Seu perfil é cruzado com mais de 12.000 fragrâncias do mundo todo." },
  { numero: "03", titulo: "Descubra", descricao: "Você recebe uma recomendação feita para você — com o cheiro descrito em palavras." },
]

export default function PaginaInicial() {
  const perfumes = perfumesPopulares(8)

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdWebSite) }}
      />
      {/* ── Hero ──────────────────────────────────────────── */}
      <section style={{ minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", borderBottom: "1px solid var(--cor-borda)" }}>
        <div className="container-site" style={{ paddingTop: "var(--fib-6)", paddingBottom: "var(--fib-6)", width: "100%" }}>
          <div className="hero-grid">

            {/* Coluna esquerda — texto */}
            <div className="hero-texto">
              <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.72rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--cor-destaque)", marginBottom: "21px" }}>
                {siteMeta.nome}
              </p>

              <h1 style={{
                fontFamily: "var(--fonte-titulo)",
                fontWeight: 300,
                fontSize: "clamp(48px, 7vw, 68px)",
                color: "#1A1A18",
                lineHeight: 1.1,
                maxWidth: "720px",
                marginBottom: "21px",
              }}>
                O perfume que você ainda não conhece está aqui.
              </h1>

              <div style={{ width: "55px", height: "2px", backgroundColor: "var(--cor-destaque)", marginBottom: "21px" }} />

              <h2 style={{
                fontFamily: "var(--fonte-titulo)",
                fontWeight: 300,
                fontSize: "clamp(26px, 3vw, 34px)",
                color: "var(--cor-texto-suave)",
                lineHeight: 1.2,
                maxWidth: "560px",
                marginBottom: "21px",
              }}>
                Você tem um perfume. Mas ainda não encontrou o seu.
              </h2>

              <p style={{ maxWidth: "400px", marginBottom: "34px", fontSize: "16px", fontWeight: 400, lineHeight: 1.6, color: "var(--cor-texto-suave)", marginTop: "21px" }}>
                {textosHome.heroSubtitulo}
              </p>

              {/* Lei de Hick — único CTA primário no hero */}
              <div className="hero-botoes">
                <Link
                  href="/consultor"
                  className="btn-primario"
                  style={{
                    display: "inline-flex", alignItems: "center",
                    backgroundColor: "var(--cor-destaque)", color: "#fff",
                    fontFamily: "var(--fonte-corpo)", fontSize: "0.875rem", fontWeight: 500,
                    letterSpacing: "0.07em", padding: "0 34px", minHeight: "44px", borderRadius: "var(--raio-borda)",
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
          <p style={{ fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--cor-texto-suave)", marginBottom: "13px" }}>
            {textosHome.secaoConsultor}
          </p>
          <h2 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, maxWidth: "520px" }}>
            {textosHome.secaoConsultorDescricao}
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "34px",
              marginTop: "55px",
            }}
          >
            {passos.map((passo) => (
              <div key={passo.numero}>
                <p
                  style={{
                    fontFamily: "var(--fonte-titulo)",
                    fontSize: "42px",
                    fontWeight: 300,
                    color: "var(--cor-destaque)",
                    opacity: 0.35,
                    marginBottom: "13px",
                    lineHeight: 1,
                    userSelect: "none",
                  }}
                >
                  {passo.numero}
                </p>
                <h3 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "26px", marginBottom: "8px" }}>
                  {passo.titulo}
                </h3>
                <p style={{ fontSize: "1rem" }}>{passo.descricao}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA central ───────────────────────────────────── */}
      <section style={{ borderBottom: "1px solid var(--cor-borda)" }}>
        <div className="container-site" style={{ paddingTop: "var(--fib-6)", paddingBottom: "var(--fib-6)", textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, maxWidth: "520px", margin: "0 auto 21px" }}>
            Pronto para encontrar o seu perfume?
          </h2>
          <p style={{ maxWidth: "380px", margin: "0 auto 34px" }}>
            Sem cadastro. Sem compromisso. Resultado em menos de 2 minutos.
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--cor-texto-suave)", marginBottom: "34px", letterSpacing: "0.05em" }}>
            Mais de 12.000 fragrâncias analisadas — do Boticário ao Parfums de Marly.
          </p>
          <Link
            href="/consultor"
            className="btn-cta btn-primario"
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
            Encontrar meu perfume
          </Link>
        </div>
      </section>

      {/* ── Destaques ─────────────────────────────────────── */}
      <section id="destaques" style={{ backgroundColor: "var(--cor-card)" }}>
        <div className="container-site" style={{ paddingTop: "var(--fib-6)", paddingBottom: "var(--fib-6)" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "21px", marginBottom: "34px" }}>
            <div>
              <p style={{ fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--cor-texto-suave)", marginBottom: "13px" }}>
                catálogo
              </p>
              <h2 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300 }}>
                {textosHome.secaoCatalogo}
              </h2>
            </div>
            <Link href="/catalogo" style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.875rem", color: "var(--cor-destaque)", textDecoration: "none", whiteSpace: "nowrap", letterSpacing: "0.05em" }}>
              Ver catálogo →
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "21px",
              marginTop: "34px",
            }}
          >
            {perfumes.map((perfume) => (
              <CardPerfume key={perfume.id} perfume={perfume} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Tendências teaser ───────────────────────────── */}
      <section style={{ backgroundColor: "#1A1A18" }}>
        <div className="container-site" style={{ paddingTop: "89px", paddingBottom: "89px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "34px" }}>
            <div style={{ maxWidth: "520px" }}>
              <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.72rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#C4714A", marginBottom: "21px" }}>
                tendências
              </p>
              <h2 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "clamp(26px, 5vw, 42px)", color: "#F5F2ED", lineHeight: 1.1, marginBottom: "21px" }}>
                O que o mundo está usando agora.
              </h2>
              <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "16px", color: "rgba(245,242,237,0.55)", lineHeight: 1.6 }}>
                Perfumes mais procurados, tendências da estação e marcas em destaque — atualizado toda semana.
              </p>
            </div>
            <Link
              href="/tendencias"
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: "44px",
                padding: "0 34px",
                border: "1px solid rgba(245,242,237,0.4)",
                borderRadius: "var(--raio-borda)",
                fontFamily: "var(--fonte-corpo)",
                fontSize: "0.875rem",
                fontWeight: 500,
                letterSpacing: "0.07em",
                color: "#F5F2ED",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
              className="link-seta"
            >
              Ver tendências<span className="link-seta-arrow" aria-hidden> →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Scanner teaser ──────────────────────────────── */}
      <section style={{ borderBottom: "1px solid var(--cor-borda)", backgroundColor: "var(--cor-card)" }}>
        <div className="container-site" style={{ paddingTop: "89px", paddingBottom: "89px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "55px", alignItems: "center" }}>
            <div>
              <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.72rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--cor-destaque)", marginBottom: "21px" }}>
                scanner de perfume
              </p>
              <h2 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "clamp(26px, 5vw, 42px)", lineHeight: 1.1, marginBottom: "21px" }}>
                Escaneie qualquer frasco. Reconheça qualquer fragrância.
              </h2>
              <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "16px", color: "var(--cor-texto-suave)", lineHeight: 1.6, marginBottom: "34px", maxWidth: "420px" }}>
                Tire uma foto de qualquer frasco de perfume e nossa IA identifica a fragrância, as notas olfativas e muito mais.
              </p>
              <Link
                href="/scanner"
                className="link-seta"
                style={{
                  display: "inline-flex", alignItems: "center",
                  minHeight: "44px", padding: "0 34px",
                  backgroundColor: "#1A1A18", color: "#F5F2ED",
                  fontFamily: "var(--fonte-corpo)", fontSize: "0.875rem", fontWeight: 500,
                  letterSpacing: "0.07em", borderRadius: "var(--raio-borda)", textDecoration: "none",
                }}
              >
                Abrir scanner<span className="link-seta-arrow" aria-hidden> →</span>
              </Link>
            </div>
            {/* Visual placeholder */}
            <div style={{
              aspectRatio: "3/4",
              backgroundColor: "#1A1A18",
              borderRadius: "var(--raio-borda-suave)",
              border: "1px solid rgba(196,113,74,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "13px" }}>
                {/* Corner marks */}
                <div style={{ position: "relative", width: "80px", height: "80px" }}>
                  {[["0","0","auto","auto"],["0","auto","auto","0"],["auto","0","0","auto"],["auto","auto","0","0"]].map((pos,i) => (
                    <div key={i} style={{
                      position: "absolute",
                      top: pos[0] !== "auto" ? pos[0] : undefined,
                      right: pos[1] !== "auto" ? pos[1] : undefined,
                      bottom: pos[2] !== "auto" ? pos[2] : undefined,
                      left: pos[3] !== "auto" ? pos[3] : undefined,
                      width: "16px", height: "16px",
                      borderTop: i < 2 ? "1.5px solid #C4714A" : "none",
                      borderBottom: i >= 2 ? "1.5px solid #C4714A" : "none",
                      borderLeft: i % 2 !== 0 ? "1.5px solid #C4714A" : "none",
                      borderRight: i % 2 === 0 ? "1.5px solid #C4714A" : "none",
                    }} />
                  ))}
                  <div style={{ position: "absolute", inset: "50%", transform: "translate(-50%,-50%)", width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "#C4714A", opacity: 0.6 }} />
                </div>
              </div>
            </div>
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

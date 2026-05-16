// ============================================
// ARQUIVO: app/page.tsx
// O QUE FAZ: página inicial — hero, como funciona, e catálogo em destaque
// QUANDO MANDAR PRA IA: quando quiser mudar o layout ou o conteúdo da home
// DEPENDE DE: config/site.ts, lib/mockData.ts, lib/fragella.ts, components/perfume/CardPerfume.tsx
// ============================================

import Link from "next/link"
import { siteMeta, textosHome } from "@/config/site"
import CardPerfume from "@/components/perfume/CardPerfume"
import { buscarDestaques } from "@/lib/fragella"
import { buscarMockDestaques } from "@/lib/mockData"

// Os três passos da seção "como funciona"
const passos = [
  { numero: "01", titulo: "Responda", descricao: "4 perguntas rápidas sobre o que você busca num perfume." },
  { numero: "02", titulo: "Analise",  descricao: "Seu consultor cruza seu perfil com milhares de fragrâncias." },
  { numero: "03", titulo: "Descubra", descricao: "Receba uma recomendação personalizada com explicação sensorial." },
]

export default async function PaginaInicial() {
  // Tenta buscar destaques da API; usa dados mock se a API não estiver configurada
  let perfumes = await buscarDestaques().catch(() => [])
  if (!perfumes.length) perfumes = buscarMockDestaques(4)

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

              <h1 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, marginBottom: "1.75rem", whiteSpace: "pre-line", lineHeight: 1.08 }}>
                {textosHome.heroTitulo}
              </h1>

              <div className="separador" />

              <p style={{ maxWidth: "400px", marginBottom: "3rem", fontSize: "1.05rem", marginTop: "1.5rem" }}>
                {textosHome.heroSubtitulo}
              </p>

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
                <Link
                  href="#destaques"
                  style={{
                    display: "inline-flex", alignItems: "center",
                    backgroundColor: "transparent", color: "var(--cor-texto)",
                    fontFamily: "var(--fonte-corpo)", fontSize: "0.875rem", fontWeight: 400,
                    letterSpacing: "0.07em", padding: "0.9rem 2.25rem",
                    borderRadius: "var(--raio-borda)", border: "1px solid var(--cor-borda)",
                  }}
                >
                  {textosHome.heroBotaoSecundario}
                </Link>
              </div>
            </div>

            {/* Coluna direita — frascos abstratos (oculta no mobile via CSS) */}
            <div className="hero-frascos" aria-hidden>
              {/* Frasco 1 — alto e estreito */}
              <div style={{ position: "absolute", left: "12%", top: "8%", width: "68px", height: "290px", backgroundColor: "var(--cor-card)", border: "1px solid var(--cor-borda)", borderRadius: "2px" }}>
                <div style={{ position: "absolute", top: "-18px", left: "50%", transform: "translateX(-50%)", width: "26px", height: "18px", backgroundColor: "var(--cor-borda)", borderRadius: "1px 1px 0 0" }} />
                <div style={{ position: "absolute", bottom: "44px", left: "12px", right: "12px", height: "1px", backgroundColor: "var(--cor-borda)" }} />
              </div>

              {/* Frasco 2 — mais largo, levemente deslocado */}
              <div style={{ position: "absolute", left: "34%", top: "24%", width: "96px", height: "210px", backgroundColor: "var(--cor-borda)", border: "1px solid #d4cfc8", borderRadius: "2px", opacity: 0.75 }}>
                <div style={{ position: "absolute", top: "-13px", left: "50%", transform: "translateX(-50%)", width: "34px", height: "13px", backgroundColor: "var(--cor-destaque)", opacity: 0.45, borderRadius: "1px 1px 0 0" }} />
                <div style={{ position: "absolute", top: "28px", left: "14px", right: "14px", height: "1px", backgroundColor: "#c8c3bc" }} />
                <div style={{ position: "absolute", top: "34px", left: "14px", right: "14px", height: "1px", backgroundColor: "#c8c3bc" }} />
              </div>

              {/* Frasco 3 — fino, com tampa dourada */}
              <div style={{ position: "absolute", right: "12%", top: "14%", width: "50px", height: "252px", backgroundColor: "var(--cor-card)", border: "1px solid var(--cor-destaque)", borderRadius: "2px", opacity: 0.65 }}>
                <div style={{ position: "absolute", top: "-15px", left: "50%", transform: "translateX(-50%)", width: "18px", height: "15px", backgroundColor: "var(--cor-dourado)", opacity: 0.75, borderRadius: "1px 1px 0 0" }} />
              </div>

              {/* Linha de chão */}
              <div style={{ position: "absolute", bottom: "8%", left: "8%", right: "8%", height: "1px", backgroundColor: "var(--cor-borda)", opacity: 0.5 }} />
            </div>

          </div>
        </div>
      </section>

      {/* ── Como funciona ─────────────────────────────────── */}
      <section style={{ borderBottom: "1px solid var(--cor-borda)" }}>
        <div className="container-site" style={{ paddingTop: "5rem", paddingBottom: "5rem" }}>
          <p style={{ fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--cor-texto-suave)", marginBottom: "0.75rem" }}>
            {textosHome.secaoConsultor}
          </p>
          <h2 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, maxWidth: "480px" }}>
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
        <div className="container-site" style={{ paddingTop: "5rem", paddingBottom: "5rem", textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, maxWidth: "520px", margin: "0 auto 1.25rem" }}>
            Pronto para encontrar o seu perfume?
          </h2>
          <p style={{ maxWidth: "380px", margin: "0 auto 2.5rem" }}>
            Sem cadastro. Sem compromisso. Resultado em menos de 2 minutos.
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
      <section id="destaques">
        <div className="container-site" style={{ paddingTop: "5rem", paddingBottom: "5rem" }}>
          <p style={{ fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--cor-texto-suave)", marginBottom: "0.75rem" }}>
            curadoria
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
    </main>
  )
}

import type { Metadata } from "next"
import { getTendencias, getUltimaAtualizacao, estacaoAtual } from "@/lib/tendencias"
import HeroTendencias from "@/components/tendencias/HeroTendencias"
import SecaoTendencias from "@/components/tendencias/SecaoTendencias"
import CardTendencia from "@/components/tendencias/CardTendencia"
import CardMarca from "@/components/tendencias/CardMarca"
import CardEstacao from "@/components/tendencias/CardEstacao"
import BannerAtualizacao from "@/components/tendencias/BannerAtualizacao"
import type { PerfumeTendencia } from "@/lib/tendencias"

export const revalidate = 21600 // 6 hours

export const metadata: Metadata = {
  title: "Tendências — Nozze",
  description: "Os perfumes mais procurados agora. Tendências semanais do mundo da perfumaria — importados, contratipos e nacionais.",
  openGraph: {
    title: "Tendências em perfumaria — Nozze",
    description: "Os perfumes mais procurados agora. Atualizado toda semana.",
    type: "website",
    url: "https://nozze.app/tendencias",
  },
}

// Editorial season context sentences
const CONTEXTO_ESTACAO: Record<string, (p: PerfumeTendencia) => string> = {
  Verão:     p => `No calor brasileiro, ${p.nome} projeta melhor quando aplicado em pontos de pulso. Uma borrifada é suficiente.`,
  Outono:    p => `Com a queda das temperaturas, ${p.nome} ganha profundidade e se desenvolve de forma mais lenta e envolvente.`,
  Inverno:   p => `O frio intensifica cada acorde de ${p.nome}. Em ambientes fechados, a presença é marcante e duradoura.`,
  Primavera: p => `A primavera equilibra as notas de ${p.nome} — nem quente demais para sobrecarregar, nem frio demais para apagar.`,
}

export default async function PaginaTendencias() {
  const [tendencias, ultimaAtualizacaoDate] = await Promise.all([
    getTendencias(),
    getUltimaAtualizacao(),
  ])
  const ultimaAtualizacao = ultimaAtualizacaoDate.toISOString()
  const estacao = estacaoAtual()

  // Group by marca for the brand spotlight
  const porMarca = tendencias.reduce<Record<string, PerfumeTendencia[]>>((acc, p) => {
    if (!acc[p.marca]) acc[p.marca] = []
    acc[p.marca].push(p)
    return acc
  }, {})
  const marcasDestaque = Object.entries(porMarca)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 6)

  // "Mais procurados" — top 6 (or all if fewer)
  const maisProcurados = tendencias.slice(0, 6)

  // "Tendências da estação" — show up to 3 in dark cards
  const tendenciasEstacao = tendencias.slice(0, 3)
  const contextoFn = CONTEXTO_ESTACAO[estacao.nome] ?? ((p: PerfumeTendencia) => p.descricaoSensorial)

  return (
    <main>
      <BannerAtualizacao ultimaAtualizacao={ultimaAtualizacao} />

      {/* ── Hero ─────────────────────────────────────────── */}
      <HeroTendencias ultimaAtualizacao={ultimaAtualizacao} />

      {/* ── Mais procurados esta semana ───────────────────── */}
      <SecaoTendencias
        titulo="Mais procurados esta semana"
        subtitulo="Os perfumes que o Brasil está buscando, sentindo e comprando agora."
        scrollHorizontal
      >
        {maisProcurados.map((p, i) => (
          <div
            key={p.id}
            style={{
              scrollSnapAlign: "start",
              flex: "0 0 280px",
            }}
          >
            <CardTendencia perfume={p} destaque={i === 0} />
          </div>
        ))}
      </SecaoTendencias>

      {/* ── Tendências da estação ─────────────────────────── */}
      <SecaoTendencias
        titulo={`Tendências do ${estacao.nome} ${estacao.emoji}`}
        subtitulo={`Como usar perfume no ${estacao.nome} brasileiro — seleção de fragrâncias que funcionam agora.`}
        fundoAlternativo
      >
        {tendenciasEstacao.map(p => (
          <CardEstacao
            key={p.id}
            perfume={p}
            estacao={estacao}
            contexto={contextoFn(p)}
          />
        ))}
      </SecaoTendencias>

      {/* ── Marcas em destaque ───────────────────────────── */}
      {marcasDestaque.length > 0 && (
        <SecaoTendencias
          titulo="Marcas em destaque"
          subtitulo="Casas de perfumaria cujas fragrâncias dominam as buscas desta semana."
        >
          {marcasDestaque.map(([marca, perfumes]) => (
            <CardMarca key={marca} marca={marca} perfumes={perfumes} />
          ))}
        </SecaoTendencias>
      )}

      {/* ── CTA footer ───────────────────────────────────── */}
      <section style={{ backgroundColor: "#1A1A18", borderTop: "1px solid rgba(245,242,237,0.08)" }}>
        <div
          className="container-site"
          style={{
            paddingTop: "89px",
            paddingBottom: "89px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "21px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--fonte-titulo)",
              fontWeight: 300,
              fontSize: "clamp(26px, 4vw, 42px)",
              color: "#F5F2ED",
              maxWidth: "520px",
              lineHeight: 1.2,
            }}
          >
            Não sabe qual perfume é o seu?
          </p>
          <p
            style={{
              fontFamily: "var(--fonte-corpo)",
              fontSize: "16px",
              color: "rgba(245,242,237,0.55)",
              maxWidth: "380px",
              lineHeight: 1.6,
            }}
          >
            Responda algumas perguntas e descubra a fragrância certa para você.
          </p>
          <a
            href="/consultor"
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: "44px",
              padding: "0 34px",
              backgroundColor: "#C4714A",
              color: "#F5F2ED",
              fontFamily: "var(--fonte-corpo)",
              fontSize: "0.875rem",
              fontWeight: 500,
              letterSpacing: "0.07em",
              borderRadius: "var(--raio-borda)",
              textDecoration: "none",
              marginTop: "13px",
            }}
          >
            Iniciar consulta gratuita
          </a>
        </div>
      </section>
    </main>
  )
}

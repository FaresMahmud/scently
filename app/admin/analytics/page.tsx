// Proteção simples: defina ADMIN_SECRET no .env e acesse /admin/analytics?secret=XXX
// ou via cookie "admin_secret" (ex: document.cookie = "admin_secret=XXX")
import { cookies, headers } from "next/headers"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"

async function checkAuth(secret: string | null | undefined): Promise<boolean> {
  const adminSecret = process.env.ADMIN_SECRET
  if (!adminSecret) return true // sem env = sem proteção (dev)
  return secret === adminSecret
}

// ── Queries ────────────────────────────────────────────────────────────────────

type Row = Record<string, unknown>

async function quizFunil() {
  const rows = await db.$queryRaw<Row[]>`
    SELECT
      dados->>'modo' AS modo,
      COUNT(*) FILTER (WHERE tipo = 'quiz_start')     AS starts,
      COUNT(*) FILTER (WHERE tipo = 'quiz_completed') AS completions
    FROM analytics_events
    WHERE tipo IN ('quiz_start', 'quiz_completed')
    GROUP BY dados->>'modo'
  `
  return rows
}

async function quizDropoff() {
  const rows = await db.$queryRaw<Row[]>`
    SELECT
      (dados->>'pergunta')::int AS pergunta,
      dados->>'modo'            AS modo,
      COUNT(*)                  AS respostas
    FROM analytics_events
    WHERE tipo = 'quiz_question_answered'
      AND dados->>'pergunta' IS NOT NULL
    GROUP BY dados->>'pergunta', dados->>'modo'
    ORDER BY modo, pergunta
  `
  return rows
}

async function topPerfumesVistos() {
  const rows = await db.$queryRaw<Row[]>`
    SELECT
      dados->>'nome'      AS nome,
      dados->>'marca'     AS marca,
      dados->>'perfumeId' AS perfume_id,
      COUNT(*)            AS views
    FROM analytics_events
    WHERE tipo = 'perfume_viewed'
    GROUP BY dados->>'nome', dados->>'marca', dados->>'perfumeId'
    ORDER BY views DESC
    LIMIT 10
  `
  return rows
}

async function topBuscas() {
  const rows = await db.$queryRaw<Row[]>`
    SELECT
      dados->>'termo' AS termo,
      COUNT(*)        AS buscas
    FROM analytics_events
    WHERE tipo = 'catalog_search'
      AND dados->>'termo' IS NOT NULL
      AND dados->>'termo' != ''
    GROUP BY dados->>'termo'
    ORDER BY buscas DESC
    LIMIT 10
  `
  return rows
}

async function afiliadosCliques() {
  const rows = await db.$queryRaw<Row[]>`
    SELECT
      dados->>'perfumeName' AS perfume,
      dados->>'brand'       AS marca,
      dados->>'loja'        AS loja,
      COUNT(*)              AS cliques
    FROM analytics_events
    WHERE tipo = 'affiliate_click'
    GROUP BY dados->>'perfumeName', dados->>'brand', dados->>'loja'
    ORDER BY cliques DESC
    LIMIT 20
  `
  return rows
}

async function scannerStats() {
  const rows = await db.$queryRaw<Row[]>`
    SELECT
      COUNT(*)                                                     AS total,
      COUNT(*) FILTER (WHERE (dados->>'encontrado')::boolean)      AS encontrados,
      COUNT(*) FILTER (WHERE dados->>'confianca' = 'high')         AS alta_confianca
    FROM analytics_events
    WHERE tipo = 'scanner_used'
  `
  return rows
}

async function retencao7dias() {
  const rows = await db.$queryRaw<Row[]>`
    SELECT COUNT(DISTINCT session_id) AS retornaram
    FROM analytics_events
    WHERE criado_em >= NOW() - INTERVAL '7 days'
      AND session_id IN (
        SELECT DISTINCT session_id
        FROM analytics_events
        WHERE criado_em < NOW() - INTERVAL '7 days'
      )
  `
  return rows
}

async function premiumCliques() {
  const rows = await db.$queryRaw<Row[]>`
    SELECT COUNT(*) AS cliques
    FROM analytics_events
    WHERE tipo = 'premium_click'
      AND criado_em >= NOW() - INTERVAL '30 days'
  `
  return rows
}

async function totalEventos30d() {
  const rows = await db.$queryRaw<Row[]>`
    SELECT tipo, COUNT(*) AS total
    FROM analytics_events
    WHERE criado_em >= NOW() - INTERVAL '30 days'
    GROUP BY tipo
    ORDER BY total DESC
  `
  return rows
}

// ── Componentes de exibição ────────────────────────────────────────────────────

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "48px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", borderBottom: "1px solid #ddd", paddingBottom: "8px" }}>
        {titulo}
      </h2>
      {children}
    </section>
  )
}

function Tabela({ colunas, linhas }: { colunas: string[]; linhas: Row[] }) {
  if (linhas.length === 0) return <p style={{ color: "#888", fontSize: "13px" }}>Sem dados ainda.</p>
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
      <thead>
        <tr>
          {colunas.map(c => (
            <th key={c} style={{ textAlign: "left", padding: "6px 12px", background: "#f5f5f5", borderBottom: "1px solid #ddd" }}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {linhas.map((row, i) => (
          <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
            {colunas.map(c => {
              const key = c.toLowerCase().replace(/\s+/g, "_")
              const val = row[key] ?? row[c] ?? "—"
              return (
                <td key={c} style={{ padding: "6px 12px" }}>
                  {String(val)}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function num(v: unknown): number { return Number(v ?? 0) }
function pct(a: number, b: number): string {
  if (b === 0) return "—"
  return `${Math.round((a / b) * 100)}%`
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminAnalytics({
  searchParams,
}: {
  searchParams: Promise<{ secret?: string }>
}) {
  const sp        = await searchParams
  const cookieJar = await cookies()
  const secret    = sp.secret ?? cookieJar.get("admin_secret")?.value
  const ok        = await checkAuth(secret)
  if (!ok) notFound()

  const [funil, dropoff, vistos, buscas, afiliados, scanner, retencao, premiumCta, resumo] =
    await Promise.all([
      quizFunil(),
      quizDropoff(),
      topPerfumesVistos(),
      topBuscas(),
      afiliadosCliques(),
      scannerStats(),
      retencao7dias(),
      premiumCliques(),
      totalEventos30d(),
    ])

  const freeRow    = funil.find(r => r["modo"] === "free")
  const premiumRow = funil.find(r => r["modo"] === "premium")
  const freeStarts = num(freeRow?.["starts"])
  const freeComps  = num(freeRow?.["completions"])
  const premStarts = num(premiumRow?.["starts"])
  const premComps  = num(premiumRow?.["completions"])
  const scanRow    = scanner[0] ?? {}
  const retRow     = retencao[0] ?? {}
  const premCtaRow = premiumCta[0] ?? {}

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: "960px", margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>Analytics — nozze</h1>
      <p style={{ color: "#888", fontSize: "13px", marginBottom: "40px" }}>
        Últimos 30 dias salvo indicação contrária.
      </p>

      {/* Resumo de eventos */}
      <Secao titulo="Volume de eventos (30 dias)">
        <Tabela colunas={["tipo", "total"]} linhas={resumo} />
      </Secao>

      {/* Quiz funnel */}
      <Secao titulo="Funil do quiz">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
          {[
            { label: "Free — inícios",      v: freeStarts },
            { label: "Free — conclusões",   v: freeComps },
            { label: "Free — taxa",         v: pct(freeComps, freeStarts) },
            { label: "Premium — inícios",   v: premStarts },
            { label: "Premium — conclusões",v: premComps },
            { label: "Premium — taxa",      v: pct(premComps, premStarts) },
          ].map(({ label, v }) => (
            <div key={label} style={{ background: "#f9f9f9", border: "1px solid #eee", borderRadius: "8px", padding: "16px" }}>
              <p style={{ fontSize: "11px", color: "#888", margin: "0 0 4px" }}>{label}</p>
              <p style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>{String(v)}</p>
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>Drop-off por pergunta</h3>
        <Tabela
          colunas={["modo", "pergunta", "respostas"]}
          linhas={dropoff.map(r => ({
            modo:      r["modo"] ?? "—",
            pergunta:  r["pergunta"] ?? "—",
            respostas: r["respostas"] ?? "—",
          }))}
        />
      </Secao>

      {/* Conversão premium */}
      <Secao titulo="Conversão premium">
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "12px" }}>
          <div style={{ background: "#f9f9f9", border: "1px solid #eee", borderRadius: "8px", padding: "16px", minWidth: "160px" }}>
            <p style={{ fontSize: "11px", color: "#888", margin: "0 0 4px" }}>Cliques em Nozze+ (30d)</p>
            <p style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>{String(num(premCtaRow["cliques"]))}</p>
          </div>
          <div style={{ background: "#f9f9f9", border: "1px solid #eee", borderRadius: "8px", padding: "16px", minWidth: "160px" }}>
            <p style={{ fontSize: "11px", color: "#888", margin: "0 0 4px" }}>Quiz free completado → Premium</p>
            <p style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>{pct(premStarts, freeComps)}</p>
          </div>
        </div>
        <p style={{ fontSize: "12px", color: "#aaa" }}>
          Conclusão de assinatura: implementar quando gateway de pagamento estiver ativo.
        </p>
      </Secao>

      {/* Afiliados */}
      <Secao titulo="Cliques em afiliados">
        <Tabela
          colunas={["perfume", "marca", "loja", "cliques"]}
          linhas={afiliados.map(r => ({
            perfume: r["perfume"] ?? "—",
            marca:   r["marca"] ?? "—",
            loja:    r["loja"] ?? "—",
            cliques: r["cliques"] ?? "—",
          }))}
        />
      </Secao>

      {/* Top perfumes vistos */}
      <Secao titulo="Top 10 perfumes mais vistos">
        <Tabela
          colunas={["nome", "marca", "views"]}
          linhas={vistos.map(r => ({
            nome:  r["nome"] ?? "—",
            marca: r["marca"] ?? "—",
            views: r["views"] ?? "—",
          }))}
        />
      </Secao>

      {/* Top buscas */}
      <Secao titulo="Top 10 buscas no catálogo">
        <Tabela
          colunas={["termo", "buscas"]}
          linhas={buscas.map(r => ({
            termo:  r["termo"] ?? "—",
            buscas: r["buscas"] ?? "—",
          }))}
        />
      </Secao>

      {/* Scanner */}
      <Secao titulo="Scanner">
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          {[
            { label: "Total de scans",       v: num(scanRow["total"]) },
            { label: "Encontrados",          v: num(scanRow["encontrados"]) },
            { label: "Taxa de identificação",v: pct(num(scanRow["encontrados"]), num(scanRow["total"])) },
            { label: "Alta confiança",       v: num(scanRow["alta_confianca"]) },
          ].map(({ label, v }) => (
            <div key={label} style={{ background: "#f9f9f9", border: "1px solid #eee", borderRadius: "8px", padding: "16px", minWidth: "160px" }}>
              <p style={{ fontSize: "11px", color: "#888", margin: "0 0 4px" }}>{label}</p>
              <p style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>{String(v)}</p>
            </div>
          ))}
        </div>
      </Secao>

      {/* Retenção */}
      <Secao titulo="Retenção (7 dias)">
        <div style={{ background: "#f9f9f9", border: "1px solid #eee", borderRadius: "8px", padding: "16px", display: "inline-block" }}>
          <p style={{ fontSize: "11px", color: "#888", margin: "0 0 4px" }}>
            Sessões que retornaram nos últimos 7 dias (já haviam visitado antes)
          </p>
          <p style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>
            {String(num(retRow["retornaram"]))}
          </p>
        </div>
      </Secao>
    </main>
  )
}

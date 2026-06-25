// ============================================
// SCRIPT: scripts/step1-editorial-selection.js
// O QUE FAZ: identifica os ~100 perfumes para enriquecimento editorial
//   Fontes:
//     1. Tendencia table (DB) — perfumes em alta atualmente
//     2. TendenciaEditorialSugestao (DB) — sugestoes curatoriais
//     3. Top populares do catalogo-fragella.json (popularidade desc, tipo importado)
//   Saída: lista de IDs + contagem por fonte/marca
// COMO RODAR: node scripts/step1-editorial-selection.js
// ============================================

const fs   = require("fs")
const path = require("path")
const { Client } = require("pg")

// ── Env loader ────────────────────────────────────────────────────────────────
const envPath = path.join(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([^#\s][^=]*)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "")
  }
}

// ── Catalog loader ────────────────────────────────────────────────────────────
function loadCatalog() {
  const p = path.join(process.cwd(), "data", "catalogo-fragella.json")
  const raw = JSON.parse(fs.readFileSync(p, "utf-8"))
  return raw.perfumes
}

function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
}

function perfumeId(nome, marca) {
  return `${slugify(nome)}-${slugify(marca)}`
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const db = new Client({ connectionString: process.env.DATABASE_URL })
  await db.connect()

  // ── Source 1: Tendencia table ─────────────────────────────────────────────
  const tendRes = await db.query(
    `SELECT nome, marca, perfume_id FROM tendencias ORDER BY posicao ASC NULLS LAST, "scrapedAt" DESC`
  )
  const tendencias = tendRes.rows.map(r => ({
    source: "tendencia",
    nome:   r.nome,
    marca:  r.marca,
    id:     r.perfume_id || perfumeId(r.nome, r.marca),
  }))

  // ── Source 2: TendenciaEditorialSugestao ──────────────────────────────────
  const editRes = await db.query(
    `SELECT s.nome, s.marca, s.perfume_id, e.categoria
     FROM tendencias_editorial_sugestoes s
     JOIN tendencias_editorial e ON e.id = s.editorial_id
     ORDER BY e.categoria, s.id`
  )
  const editorial = editRes.rows.map(r => ({
    source: `editorial:${r.categoria}`,
    nome:   r.nome,
    marca:  r.marca,
    id:     r.perfume_id || perfumeId(r.nome, r.marca),
  }))

  await db.end()

  // ── Source 3: Top catalog by rating (preco >= $50 USD, rating >= 4.0) ──────
  // Fragella catalog has no tipo/popularidade. Use rating + preco as proxy for
  // "well-known designer/niche perfume worth enriching".
  const catalog = loadCatalog()
  const topCatalog = catalog
    .filter(p =>
      typeof p.rating === "number" && p.rating >= 4.0 &&
      typeof p.preco  === "number" && p.preco  >= 50
    )
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 80)
    .map(p => ({
      source: "catalog-top",
      nome:   p.nome,
      marca:  p.marca,
      id:     p.id || perfumeId(p.nome, p.marca),
      rating: p.rating,
    }))

  // ── Deduplicate (id is primary key) ───────────────────────────────────────
  const seen    = new Map() // id → entry (first source wins for display)
  const ordered = [...tendencias, ...editorial, ...topCatalog]

  for (const e of ordered) {
    if (!seen.has(e.id)) seen.set(e.id, e)
    else {
      // Track all sources for deduped entries
      const existing = seen.get(e.id)
      if (!existing.sources) existing.sources = [existing.source]
      existing.sources.push(e.source)
    }
  }

  const final = Array.from(seen.values())

  // ── Reports ───────────────────────────────────────────────────────────────

  // By source
  const bySrc = {}
  for (const e of final) {
    const src = e.sources ? e.sources[0] : e.source
    bySrc[src] = (bySrc[src] ?? 0) + 1
  }
  // Multi-source entries
  const multiSource = final.filter(e => e.sources && e.sources.length > 1)

  // By brand (top 20)
  const byBrand = {}
  for (const e of final) {
    byBrand[e.marca] = (byBrand[e.marca] ?? 0) + 1
  }
  const topBrands = Object.entries(byBrand)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)

  // ── Print ─────────────────────────────────────────────────────────────────
  console.log("═══════════════════════════════════════════")
  console.log(`TOTAL: ${final.length} perfumes selecionados`)
  console.log("═══════════════════════════════════════════\n")

  console.log("── Por fonte ──────────────────────────────")
  console.log(`  tendencia (DB)              : ${tendencias.length} entradas → ${bySrc["tendencia"] ?? 0} únicas`)
  const editKeys = Object.keys(bySrc).filter(k => k.startsWith("editorial:"))
  for (const k of editKeys) console.log(`  ${k.padEnd(30)}: ${bySrc[k]}`)
  console.log(`  catalog-top (pop > 0, imp.) : ${bySrc["catalog-top"] ?? 0} únicas`)
  console.log(`  deduplicados entre fontes   : ${multiSource.length}\n`)

  console.log("── Top 25 marcas ──────────────────────────")
  for (const [brand, count] of topBrands) {
    console.log(`  ${String(count).padStart(3)}  ${brand}`)
  }

  console.log("\n── Lista completa ─────────────────────────")
  console.log("  #    ID                                                  FONTE              MARCA")
  console.log("  " + "─".repeat(100))
  final.forEach((e, i) => {
    const src = e.sources ? e.sources.join("+") : e.source
    const num = String(i + 1).padStart(3)
    const id  = e.id.padEnd(52)
    const s   = src.padEnd(18)
    console.log(`  ${num}  ${id}  ${s}  ${e.marca}`)
  })

  console.log(`\n═══════════════════════════════════════════`)
  console.log(`TOTAL: ${final.length} perfumes`)
  console.log(`  - ${tendencias.length} da tabela Tendencia`)
  console.log(`  - ${editorial.length} da tabela TendenciaEditorialSugestao`)
  console.log(`  - ${topCatalog.length} do topo do catálogo (pop, importado)`)
  console.log(`  - ${final.length - (seen.size - multiSource.length)} deduplicados`)
  console.log("═══════════════════════════════════════════")
}

main().catch(e => { console.error(e); process.exit(1) })

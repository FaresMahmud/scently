import { readFileSync } from "fs"
import pg from "pg"
const { Client } = pg

// Load env
const env = readFileSync(".env.local", "utf8")
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "")
}

function normalizar(s) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s]/g, "").trim()
}
function similaridade(a, b) {
  const wa = new Set(a.split(/\s+/).filter(w => w.length > 2))
  const wb = new Set(b.split(/\s+/).filter(w => w.length > 2))
  if (wa.size === 0 || wb.size === 0) return 0
  let matches = 0
  for (const w of wa) {
    if (wb.has(w) || [...wb].some(bw => bw.includes(w) || w.includes(bw))) matches++
  }
  return matches / Math.max(wa.size, wb.size)
}

const expandido = JSON.parse(readFileSync("data/perfumes-expandido.json", "utf8"))

function buscarExpandido(nome, marca) {
  const n = normalizar(nome)
  const m = normalizar(marca)
  let best = null
  for (const p of expandido) {
    const pn = normalizar(p.nome)
    const pm = normalizar(p.marca)
    let score = 0
    if (pn === n) score += 5
    else if (pn.includes(n) || n.includes(pn)) score += 3
    else { const sim = similaridade(n, pn); if (sim >= 0.6) score += Math.round(sim * 3) }
    if (pm === m) score += 4
    else if (pm.includes(m) || m.includes(pm)) score += 2
    else { const sim = similaridade(m, pm); if (sim >= 0.5) score += 1 }
    if (score >= 3 && (!best || score > best.score)) best = { item: p, score }
  }
  return best?.item ?? null
}

// Test cases: what Gemini typically returns for these perfumes
const tests = [
  { name: "Sauvage",           brand: "Dior" },
  { name: "Sauvage",           brand: "Christian Dior" },   // Gemini might say this
  { name: "Dior Sauvage",      brand: "Dior" },             // Gemini might say this
  { name: "Bleu de Chanel",    brand: "Chanel" },
  { name: "1 Million",         brand: "Paco Rabanne" },
  { name: "Black Opium",       brand: "Yves Saint Laurent" },
]

console.log("=== buscarExpandido results ===")
for (const t of tests) {
  const r = buscarExpandido(t.name, t.brand)
  console.log(`  "${t.name}" / "${t.brand}" → id: ${r?.id ?? "null"} | notas: ${JSON.stringify(r?.notas?.slice(0,3) ?? [])}`)
}

// Verify editorial lookup against DB
const client = new Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

console.log("\n=== Editorial DB lookup for resolved IDs ===")
for (const t of tests.slice(0, 4)) {
  const r = buscarExpandido(t.name, t.brand)
  if (r) {
    const row = await client.query(`SELECT perfume_id, LEFT("comoCheira", 60) as preview FROM perfume_editorial WHERE perfume_id = $1`, [r.id])
    const found = row.rows[0]
    console.log(`  ${r.id} → ${found ? `"${found.preview}..."` : "NULL (not in editorial table)"}`)
  }
}

await client.end()

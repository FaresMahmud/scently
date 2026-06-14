// One-off script to enrich a specific list of perfume IDs.
// Run: npx ts-node -r tsconfig-paths/register --project tsconfig.scripts.json scripts/enrich-specific-ids.ts

import * as fs   from "fs"
import * as path from "path"
import { Client } from "pg"
import { GoogleGenerativeAI } from "@google/generative-ai"

// ── Env ───────────────────────────────────────────────────────────────────────
const envPath = path.join(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([^#\s][^=]*)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "")
  }
}

// ── Target IDs ────────────────────────────────────────────────────────────────
const TARGET_IDS = [
  "dior-sauvage",
  "dior-sauvage-elixir-christian-dior",
  "paco-rabanne-lady-million-paco-rabanne",
  "la-vie-est-belle-lancome",
  "ch-good-girl-carolina-herrera",
  "emporio-armani-stronger-with-you-giorgio-armani",
  "polo-red-ralph-lauren",
  "black-opium-yves-saint-laurent",
  "212-vip-carolina-herrera",
  "versace-eros-gianni-versace",
  "invictus-paco-rabanne",
]

const DELAY_MS = 1500

// ── Types ─────────────────────────────────────────────────────────────────────
interface CatalogEntry {
  id:            string
  nome:          string
  marca:         string
  familia?:      string
  notas?:        string[]
  notasTopo?:    string[]
  notasCoracao?: string[]
  notasFundo?:   string[]
  preco?:        number
  genero?:       string
  concentracao?: string
}

interface EditorialResult {
  comoCheira:     string
  paraQuem:       string
  quandoUsar:     string
  comoSeComporta: string
}

// ── Catalog ───────────────────────────────────────────────────────────────────
function loadAll(): Map<string, CatalogEntry> {
  const map = new Map<string, CatalogEntry>()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addAll = (arr: any[]) => {
    for (const p of arr) {
      if (!map.has(p.id)) map.set(p.id, {
        id:           p.id,
        nome:         p.nome,
        marca:        p.marca,
        familia:      p.familia,
        notas:        [...(p.notasTopo ?? p.notas ?? []), ...(p.notasCoracao ?? []), ...(p.notasFundo ?? [])].slice(0, 8),
        preco:        p.preco,
        genero:       p.genero,
        concentracao: p.concentracao,
      })
    }
  }

  const fragella = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "catalogo-fragella.json"), "utf-8"))
  addAll(fragella.perfumes)
  addAll(JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "perfumes-expandido.json"), "utf-8")))
  addAll(JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "contratipos.json"), "utf-8")))

  return map
}

// ── Gemini ────────────────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "")
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  tools: [{ googleSearch: {} } as any],
})

async function gerarEditorial(entry: CatalogEntry): Promise<EditorialResult | null> {
  const notasStr   = entry.notas && entry.notas.length > 0 ? `Notas: ${entry.notas.join(", ")}.` : ""
  const familiaStr = entry.familia      ? `Família olfativa: ${entry.familia}.` : ""
  const generoStr  = entry.genero       ? `Gênero: ${entry.genero}.`            : ""
  const precoStr   = entry.preco && entry.preco > 0 ? `Preço aprox: USD ${entry.preco}.` : ""

  const contexto = [`Perfume: ${entry.nome} (${entry.marca})`, generoStr, familiaStr, notasStr, precoStr]
    .filter(Boolean).join("\n")

  const prompt = `Você escreve conteúdo editorial sobre perfumes para o app Nozze.
O público é o consumidor brasileiro comum, não especialista em perfumaria.
Tom: elegante, direto, sensorial. Sem jargão técnico. Sem listas de notas soltas.
Frases curtas. Máximo 18 palavras por frase.
Idioma: Português brasileiro.
Sem travessões. Sem markdown.

${contexto}

Pesquise este perfume e responda APENAS com um JSON válido neste formato exato:
{
  "comoCheira": "2-3 frases descrevendo o cheiro em linguagem cotidiana. Sem listar notas diretamente. Use comparações sensoriais.",
  "paraQuem": "1-2 frases descrevendo o perfil de pessoa ou personalidade que combina com este perfume.",
  "quandoUsar": "1-2 frases sobre estação, ocasião e hora do dia ideais. Mencione quando NÃO usar se relevante.",
  "comoSeComporta": "1-2 frases sobre duração, projeção e sillage em termos práticos."
}
Sem campos extras. Sem markdown. JSON puro.`

  try {
    const result = await model.generateContent(prompt)
    const text   = result.response.text().trim()
    const match  = text.match(/\{[\s\S]*\}/)
    if (!match) { console.error(`  [!] sem JSON para ${entry.id}`); return null }
    const parsed = JSON.parse(match[0]) as EditorialResult
    const fields = ["comoCheira", "paraQuem", "quandoUsar", "comoSeComporta"] as const
    for (const f of fields) {
      if (!parsed[f] || parsed[f].trim().length < 10) { console.error(`  [!] campo "${f}" inválido`); return null }
    }
    return parsed
  } catch (err: unknown) {
    console.error(`  [!] Gemini error:`, (err as { message?: string })?.message ?? err)
    return null
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const catalog = loadAll()
  const db = new Client({ connectionString: process.env.DATABASE_URL })
  await db.connect()

  // Skip already enriched
  const existing = await db.query<{ perfume_id: string }>(`SELECT perfume_id FROM perfume_editorial`)
  const enrichedIds = new Set(existing.rows.map(r => r.perfume_id))

  const pending = TARGET_IDS.filter(id => !enrichedIds.has(id))
  const alreadyDone = TARGET_IDS.filter(id => enrichedIds.has(id))

  if (alreadyDone.length > 0) console.log(`Já enriquecidos (skip): ${alreadyDone.join(", ")}`)
  console.log(`Pendentes: ${pending.length}/${TARGET_IDS.length}\n`)

  let ok = 0, failed = 0
  for (let i = 0; i < pending.length; i++) {
    const id    = pending[i]
    const entry = catalog.get(id)
    if (!entry) { console.log(`  [${i+1}/${pending.length}] MISS — ${id} não encontrado no catálogo`); failed++; continue }

    console.log(`  [${i+1}/${pending.length}] ${entry.marca} — ${entry.nome}`)
    const editorial = await gerarEditorial(entry)

    if (!editorial) { failed++; continue }

    await db.query(
      `INSERT INTO perfume_editorial (perfume_id, "comoCheira", "paraQuem", "quandoUsar", "comoSeComporta", gerado_em, atualizado_em)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (perfume_id) DO UPDATE SET
         "comoCheira"     = EXCLUDED."comoCheira",
         "paraQuem"       = EXCLUDED."paraQuem",
         "quandoUsar"     = EXCLUDED."quandoUsar",
         "comoSeComporta" = EXCLUDED."comoSeComporta",
         atualizado_em    = NOW()`,
      [id, editorial.comoCheira, editorial.paraQuem, editorial.quandoUsar, editorial.comoSeComporta]
    )
    ok++

    if (i < pending.length - 1) await new Promise(r => setTimeout(r, DELAY_MS))
  }

  await db.end()

  console.log(`\n${"═".repeat(50)}`)
  console.log(`Escritos : ${ok}`)
  console.log(`Failed   : ${failed}`)
  console.log(`Já havia : ${alreadyDone.length}`)
  console.log("═".repeat(50))
}

main().catch(e => { console.error(e); process.exit(1) })

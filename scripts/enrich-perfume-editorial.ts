// ============================================
// SCRIPT: scripts/enrich-perfume-editorial.ts
// O QUE FAZ: gera conteúdo editorial em PT para ~110 perfumes selecionados
//   Campos: comoCheira, paraQuem, quandoUsar, comoSeComporta
//   Fonte de dados: catalogo-fragella.json + contratipos.json + perfumes-expandido.json
//   Destino: tabela perfume_editorial (Postgres via Prisma)
// COMO RODAR:
//   DRY_RUN_LIMIT=5 npm run editorial:enrich   (dry run — 5 entradas, sem writes)
//   npm run editorial:enrich                    (todas as entradas)
// ============================================

import * as fs   from "fs"
import * as path from "path"
import { Client } from "pg"
import { GoogleGenerativeAI } from "@google/generative-ai"

// ── Env loader ────────────────────────────────────────────────────────────────
const envPath = path.join(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([^#\s][^=]*)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "")
  }
}

// ── Config ────────────────────────────────────────────────────────────────────
const GEMINI_KEY = process.env.GEMINI_API_KEY ?? ""
const DRY_RUN    = process.env.DRY_RUN_LIMIT ? parseInt(process.env.DRY_RUN_LIMIT) : 0
const DELAY_MS   = 1500

if (!GEMINI_KEY) { console.error("GEMINI_API_KEY não encontrada"); process.exit(1) }

// ── Types ─────────────────────────────────────────────────────────────────────
interface EditorialResult {
  comoCheira:     string
  paraQuem:       string
  quandoUsar:     string
  comoSeComporta: string
}

interface CatalogEntry {
  id:            string
  nome:          string
  marca:         string
  familia?:      string
  notas?:        string[]
  notasTopo?:    string[]
  notasCoracao?: string[]
  notasFundo?:   string[]
  inspiradoEm?:  string
  marcaOriginal?: string
  preco?:        number
  genero?:       string
  concentracao?: string
}

// ID + DB-sourced nome/marca for fallback lookup
interface SelectionEntry {
  id:    string
  nome?: string
  marca?: string
}

// ── Slugify (same logic as lib/utils.ts) ──────────────────────────────────────
function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
}

// ── Catalog loaders ───────────────────────────────────────────────────────────
function loadFragella(): CatalogEntry[] {
  const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "catalogo-fragella.json"), "utf-8"))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return raw.perfumes.map((p: any) => ({
    id:           p.id,
    nome:         p.nome,
    marca:        p.marca,
    familia:      p.familia,
    notas:        [...(p.notasTopo ?? []), ...(p.notasCoracao ?? []), ...(p.notasFundo ?? [])].slice(0, 8),
    notasTopo:    p.notasTopo,
    notasCoracao: p.notasCoracao,
    notasFundo:   p.notasFundo,
    preco:        p.preco,
    genero:       p.genero,
    concentracao: p.concentracao,
  }))
}

function loadContratipos(): CatalogEntry[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "contratipos.json"), "utf-8")) as any[])
    .map(p => ({
      id:           p.id,
      nome:         p.nome,
      marca:        p.marca,
      familia:      p.familia,
      notas:        p.notas ?? [],
      inspiradoEm:  p.inspiradoEm,
      marcaOriginal: p.marcaOriginal,
    }))
}

function loadExpandido(): CatalogEntry[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "perfumes-expandido.json"), "utf-8")) as any[])
    .map(p => ({
      id:           p.id,
      nome:         p.nome,
      marca:        p.marca,
      familia:      p.familia,
      notas:        p.notas ?? [],
      inspiradoEm:  p.inspiradoEm,
      marcaOriginal: p.marcaOriginal,
    }))
}

function buildIndex(entries: CatalogEntry[]): Map<string, CatalogEntry> {
  const m = new Map<string, CatalogEntry>()
  for (const e of entries) m.set(e.id, e)
  return m
}

// ── Fuzzy fallback — ported from buscarPerfumePorSlug in lib/catalogoFragella.ts ──
// When exact-ID lookup fails, generate a slug from nome+marca and run the same
// 4-step algorithm (step 1 is done before calling this; steps 2-4 here).
function buscarPorNomeMarca(nome: string, marca: string, allEntries: CatalogEntry[]): CatalogEntry | null {
  const candidateSlug = `${slugify(nome)}-${slugify(marca)}`
  const slugLimpo     = candidateSlug.replace(/-(ebay|contratipo|fragella)$/, "")

  // Step 2: exact nome-marca or marca-nome slug match
  const porNomeMarca = allEntries.find(p => {
    const s1 = `${slugify(p.nome)}-${slugify(p.marca)}`
    const s2 = `${slugify(p.marca)}-${slugify(p.nome)}`
    return s1 === slugLimpo || s2 === slugLimpo
  })
  if (porNomeMarca) return porNomeMarca

  // Step 3: prefix match — slugLimpo is a prefix of slugify(p.nome + " " + p.marca)
  const porPrefixo = allEntries.find(p => {
    const textoP = slugify(p.nome + " " + p.marca)
    return textoP === slugLimpo || textoP.startsWith(slugLimpo + "-")
  })
  if (porPrefixo) return porPrefixo

  // Step 4: all words in slugLimpo (length > 2) must appear in catalog entry's combined slug
  const palavras = slugLimpo.split("-").filter(w => w.length > 2)
  if (palavras.length > 0) {
    const candidatos = allEntries.filter(p => {
      const textoP = slugify(p.nome + " " + p.marca)
      return palavras.every(w => textoP.includes(w))
    })
    if (candidatos.length > 0) {
      candidatos.sort((a, b) =>
        slugify(a.nome + " " + a.marca).length - slugify(b.nome + " " + b.marca).length
      )
      return candidatos[0]
    }
  }

  return null
}

// ── DB selection ──────────────────────────────────────────────────────────────
async function loadSelection(db: Client): Promise<SelectionEntry[]> {
  const tendRes = await db.query<{ nome: string; marca: string; perfume_id: string | null }>(
    `SELECT nome, marca, perfume_id FROM tendencias ORDER BY posicao ASC NULLS LAST, "scrapedAt" DESC`
  )
  const editRes = await db.query<{ nome: string; marca: string; perfume_id: string | null }>(
    `SELECT s.nome, s.marca, s.perfume_id FROM tendencias_editorial_sugestoes s`
  )

  const fragella   = loadFragella()
  const topCatalog = fragella
    .filter(p => typeof p.preco === "number" && p.preco >= 50 && p.notas && p.notas.length > 0)
    .slice(0, 80)

  const seen = new Set<string>()
  const entries: SelectionEntry[] = []

  const add = (id: string, nome?: string, marca?: string) => {
    if (!seen.has(id)) {
      seen.add(id)
      entries.push({ id, nome, marca })
    }
  }

  for (const r of tendRes.rows)
    add(r.perfume_id || `${slugify(r.nome)}-${slugify(r.marca)}`, r.nome, r.marca)

  for (const r of editRes.rows)
    add(r.perfume_id || `${slugify(r.nome)}-${slugify(r.marca)}`, r.nome, r.marca)

  for (const p of topCatalog)
    add(p.id || `${slugify(p.nome)}-${slugify(p.marca)}`, p.nome, p.marca)

  return entries
}

async function loadEnrichedIds(db: Client): Promise<Set<string>> {
  const res = await db.query<{ perfume_id: string }>(`SELECT perfume_id FROM perfume_editorial`)
  return new Set(res.rows.map(r => r.perfume_id))
}

// ── Gemini ────────────────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(GEMINI_KEY)
const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  tools: [{ googleSearch: {} } as any],
})

const PROMPT_SISTEMA = `Você escreve conteúdo editorial sobre perfumes para o app Nozze.
O público é o consumidor brasileiro comum, não especialista em perfumaria.
Tom: elegante, direto, sensorial. Sem jargão técnico. Sem listas de notas soltas.
Frases curtas. Máximo 18 palavras por frase.
Idioma: Português brasileiro.
Sem travessões. Sem markdown.`

async function gerarEditorial(entry: CatalogEntry): Promise<EditorialResult | null> {
  const isContratipo = !!(entry.inspiradoEm && entry.marcaOriginal)
  const referencia   = isContratipo
    ? `${entry.inspiradoEm} (${entry.marcaOriginal})`
    : `${entry.nome} (${entry.marca})`

  const notasStr   = entry.notas && entry.notas.length > 0 ? `Notas: ${entry.notas.join(", ")}.` : ""
  const familiaStr = entry.familia      ? `Família olfativa: ${entry.familia}.` : ""
  const generoStr  = entry.genero       ? `Gênero: ${entry.genero}.`            : ""
  const precoStr   = entry.preco && entry.preco > 0 ? `Preço aprox: USD ${entry.preco}.` : ""

  const contexto = [`Perfume: ${referencia}`, generoStr, familiaStr, notasStr, precoStr]
    .filter(Boolean).join("\n")

  const prompt = `${PROMPT_SISTEMA}

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
    const result = await geminiModel.generateContent(prompt)
    const text   = result.response.text().trim()
    const match  = text.match(/\{[\s\S]*\}/)
    if (!match) {
      console.error(`    [!] Sem JSON na resposta para ${entry.id}:`, text.slice(0, 200))
      return null
    }
    const parsed = JSON.parse(match[0]) as EditorialResult
    const fields = ["comoCheira", "paraQuem", "quandoUsar", "comoSeComporta"] as const
    for (const f of fields) {
      if (!parsed[f] || typeof parsed[f] !== "string" || parsed[f].trim().length < 10) {
        console.error(`    [!] Campo "${f}" inválido para ${entry.id}`)
        return null
      }
    }
    return parsed
  } catch (err: unknown) {
    console.error(`    [!] Gemini error para ${entry.id}:`, (err as { message?: string })?.message ?? err)
    return null
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const db = new Client({ connectionString: process.env.DATABASE_URL })
  await db.connect()

  const allEntries  = await loadSelection(db)
  const enrichedIds = await loadEnrichedIds(db)
  const pending     = allEntries.filter(e => !enrichedIds.has(e.id))

  console.log(`Total selecionados : ${allEntries.length}`)
  console.log(`Já enriquecidos    : ${enrichedIds.size}`)
  console.log(`Pendentes          : ${pending.length}`)

  const toProcess = DRY_RUN > 0 ? pending.slice(0, DRY_RUN) : pending
  if (DRY_RUN > 0) console.log(`\nDRY RUN — processando ${toProcess.length} entradas (sem escrita no DB)\n`)
  else              console.log(`\nProcessando ${toProcess.length} entradas...\n`)

  // Build unified catalog: fragella first (primary source), then contratipos, then expandido
  const fragEntries = loadFragella()
  const ctEntries   = loadContratipos()
  const exEntries   = loadExpandido()
  const allCatalog  = [...fragEntries, ...ctEntries, ...exEntries]

  const fragIdx = buildIndex(fragEntries)
  const ctIdx   = buildIndex(ctEntries)
  const exIdx   = buildIndex(exEntries)

  function exactLookup(id: string): CatalogEntry | null {
    return fragIdx.get(id) ?? ctIdx.get(id) ?? exIdx.get(id) ?? null
  }

  // Tracking
  let okWritten   = 0
  let okFallback  = 0   // recovered via nome+marca fuzzy
  const skippedEntries: { id: string; nome?: string; marca?: string }[] = []
  const failedEntries:  { id: string; nome?: string; marca?: string }[] = []

  for (let i = 0; i < toProcess.length; i++) {
    const sel = toProcess[i]

    // Progress milestone
    if (!DRY_RUN && i > 0 && i % 20 === 0) {
      console.log(`\n── Progresso: ${i}/${toProcess.length} (ok ${okWritten}, skip ${skippedEntries.length}, falha ${failedEntries.length}) ──\n`)
    }

    // Step 1: exact ID lookup
    let entry = exactLookup(sel.id)
    let usedFallback = false

    // Step 2: fuzzy fallback by nome+marca
    if (!entry && sel.nome && sel.marca) {
      entry = buscarPorNomeMarca(sel.nome, sel.marca, allCatalog)
      if (entry) {
        usedFallback = true
        console.log(`  [${i+1}/${toProcess.length}] FALLBACK "${sel.nome}" / "${sel.marca}" → ${entry.nome} (${entry.marca})`)
      }
    }

    if (!entry) {
      console.log(`  [${i+1}/${toProcess.length}] SKIP — não encontrado: id=${sel.id} | nome=${sel.nome ?? "?"} | marca=${sel.marca ?? "?"}`)
      skippedEntries.push(sel)
      continue
    }

    const label = `${entry.marca} — ${entry.nome}`
    if (!usedFallback) console.log(`  [${i+1}/${toProcess.length}] ${label}`)

    const editorial = await gerarEditorial(entry)

    if (!editorial) {
      console.log(`    FALHOU — ${label}`)
      failedEntries.push(sel)
    } else if (DRY_RUN > 0) {
      console.log(`  comoCheira    : ${editorial.comoCheira}`)
      console.log(`  paraQuem      : ${editorial.paraQuem}`)
      console.log(`  quandoUsar    : ${editorial.quandoUsar}`)
      console.log(`  comoSeComporta: ${editorial.comoSeComporta}`)
      console.log()
      okWritten++
    } else {
      // Upsert — column names are camelCase (no @map in schema); atualizado_em is
      // Prisma @updatedAt so raw SQL must supply it explicitly
      await db.query(
        `INSERT INTO perfume_editorial (perfume_id, "comoCheira", "paraQuem", "quandoUsar", "comoSeComporta", gerado_em, atualizado_em)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (perfume_id) DO UPDATE SET
           "comoCheira"      = EXCLUDED."comoCheira",
           "paraQuem"        = EXCLUDED."paraQuem",
           "quandoUsar"      = EXCLUDED."quandoUsar",
           "comoSeComporta"  = EXCLUDED."comoSeComporta",
           atualizado_em     = NOW()`,
        [usedFallback ? entry.id : sel.id,
         editorial.comoCheira, editorial.paraQuem, editorial.quandoUsar, editorial.comoSeComporta]
      )
      if (usedFallback) okFallback++
      else okWritten++
    }

    if (i < toProcess.length - 1) await new Promise(r => setTimeout(r, DELAY_MS))
  }

  await db.end()

  // ── Summary ──────────────────────────────────────────────────────────────
  const totalOk = okWritten + okFallback
  console.log(`\n${"═".repeat(50)}`)
  console.log(`Escritos (exact ID)    : ${okWritten}`)
  console.log(`Escritos (via fallback): ${okFallback}`)
  console.log(`Total OK               : ${totalOk}`)
  console.log(`Skipped (não achados)  : ${skippedEntries.length}`)
  if (skippedEntries.length > 0) {
    skippedEntries.forEach(e => console.log(`  - id=${e.id} | nome=${e.nome ?? "?"} | marca=${e.marca ?? "?"}`))
  }
  console.log(`Failed (erro Gemini)   : ${failedEntries.length}`)
  if (failedEntries.length > 0) {
    failedEntries.forEach(e => console.log(`  - id=${e.id} | nome=${e.nome ?? "?"} | marca=${e.marca ?? "?"}`))
  }
  if (DRY_RUN > 0) console.log(`(dry run — nada foi escrito no DB)`)
  console.log("═".repeat(50))
}

main().catch(e => { console.error(e); process.exit(1) })

// ============================================
// SCRIPT: scripts/enrich-catalog-notes.ts
// O QUE FAZ: enriquece entradas sem notas/familia em contratipos.json
//            e perfumes-expandido.json usando Gemini com web grounding
// COMO RODAR:
//   npm run catalog:enrich              (todas as 186 entradas)
//   DRY_RUN_LIMIT=5 npm run catalog:enrich   (dry run — 5 entradas, sem writes)
// SAÍDA: atualiza data/contratipos.json + data/perfumes-expandido.json in-place
// ============================================

import * as fs   from "fs"
import * as path from "path"

// ── Env loader ────────────────────────────────────────────────────────────────

const envPath = path.join(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([^#\s][^=]*)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "")
  }
}

import { GoogleGenerativeAI } from "@google/generative-ai"

// ── Config ────────────────────────────────────────────────────────────────────

const GEMINI_KEY   = process.env.GEMINI_API_KEY ?? ""
const DRY_RUN      = process.env.DRY_RUN_LIMIT ? parseInt(process.env.DRY_RUN_LIMIT) : 0
const DELAY_MS     = 1000

const CT_PATH      = path.join(process.cwd(), "data", "contratipos.json")
const EX_PATH      = path.join(process.cwd(), "data", "perfumes-expandido.json")

if (!GEMINI_KEY) {
  console.error("GEMINI_API_KEY não configurado em .env.local")
  process.exit(1)
}

// ── Gemini setup — grounding enabled ─────────────────────────────────────────

const genAI = new GoogleGenerativeAI(GEMINI_KEY)
const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tools: [{ googleSearch: {} } as any],
})

// ── Types ─────────────────────────────────────────────────────────────────────

interface EnrichEntry {
  id:           string
  nome:         string
  marca:        string
  genero?:      string
  inspiradoEm?: string | null
  marcaOriginal?: string | null
  familia:      string
  notas:        string[]
  categoria?:   string
  source:       "contratipos" | "expandido"
}

interface GeminiNotas {
  familia: string
  notas: {
    topo:    string[]
    coracao: string[]
    fundo:   string[]
  }
}

// ── Filter logic ──────────────────────────────────────────────────────────────

function needsEnrichment(p: Record<string, unknown>): boolean {
  if (p.disponivel === false) return false
  const semNotas   = !p.notas || (p.notas as unknown[]).length === 0
  const semFamilia = !p.familia || p.familia === "Indefinida" || p.familia === ""
  return semNotas || semFamilia
}

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildPrompt(entry: EnrichEntry): string {
  const isContratipo = !!(entry.inspiradoEm && entry.inspiradoEm.trim())
  const referencia   = isContratipo ? entry.inspiradoEm!.trim() : entry.nome.trim()
  const marcaRef     = isContratipo ? (entry.marcaOriginal && entry.marcaOriginal !== "Desconhecida" ? entry.marcaOriginal : "") : entry.marca

  const alvo = marcaRef ? `"${referencia}" de ${marcaRef}` : `"${referencia}"`

  return `Pesquise nas bases de dados de perfumaria (Fragrantica, Parfumo, Basenotes) as notas olfativas e família olfativa do perfume ${alvo}.

Retorne APENAS JSON válido, sem markdown, sem explicações:
{
  "familia": "família em português (Amadeirado|Floral|Oriental|Cítrico|Aquático|Gourmand|Frutal|Almiscarado|Especiado|Verde|Chipre|Fougère|Aromático|Couro|Tabaco) — compostos como 'Amadeirado Especiado' são aceitos",
  "notas": {
    "topo":    ["nota1", "nota2"],
    "coracao": ["nota1", "nota2"],
    "fundo":   ["nota1", "nota2"]
  }
}

Regras:
- Todos os nomes de notas em português (Bergamota, Sândalo, Almíscar, Patchouli, Vetiver, Âmbar, Baunilha, Rosa, Jasmim, etc.)
- Se não encontrar dados confiáveis sobre este perfume, retorne: {"familia":"DESCONHECIDO","notas":{"topo":[],"coracao":[],"fundo":[]}}
- Não invente notas — use apenas dados encontrados em bases de perfumaria`
}

// ── Response parser ───────────────────────────────────────────────────────────

function parseResponse(raw: string): GeminiNotas | null {
  try {
    const clean = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim()
    // Extract first JSON object if there's extra text
    const match = clean.match(/\{[\s\S]*\}/)
    if (!match) return null
    const parsed = JSON.parse(match[0]) as GeminiNotas
    if (
      typeof parsed.familia !== "string" ||
      !parsed.notas ||
      !Array.isArray(parsed.notas.topo) ||
      !Array.isArray(parsed.notas.coracao) ||
      !Array.isArray(parsed.notas.fundo)
    ) return null
    return parsed
  } catch {
    return null
  }
}

// ── Flatten notas: topo → coracao → fundo ────────────────────────────────────

function flattenNotas(notas: GeminiNotas["notas"]): string[] {
  return [...notas.topo, ...notas.coracao, ...notas.fundo].filter(n => typeof n === "string" && n.trim())
}

// ── Sleep ─────────────────────────────────────────────────────────────────────

function sleep(ms: number) { return new Promise<void>(r => setTimeout(r, ms)) }

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Load sources
  const ct = JSON.parse(fs.readFileSync(CT_PATH, "utf-8")) as Record<string, unknown>[]
  const ex = JSON.parse(fs.readFileSync(EX_PATH, "utf-8")) as Record<string, unknown>[]

  // Build enrichment queue, tagging source
  const ctNeeds: EnrichEntry[] = ct
    .filter(needsEnrichment)
    .map(p => ({ ...(p as unknown as EnrichEntry), source: "contratipos" as const }))

  const exNeeds: EnrichEntry[] = ex
    .filter(needsEnrichment)
    .map(p => ({ ...(p as unknown as EnrichEntry), source: "expandido" as const }))

  let queue: EnrichEntry[] = [...ctNeeds, ...exNeeds]

  console.log(`\n📦 Entradas para enriquecer: ${queue.length}`)
  console.log(`   Contratipos: ${ctNeeds.length}`)
  console.log(`   Expandido:   ${exNeeds.length}`)

  // Dry run: pick a representative mix
  if (DRY_RUN > 0) {
    // Grab entries to cover all lookup branches:
    // - contratipos with inspiradoEm (Thera / Paris Elysees)
    // - JA Essence (inspiradoEm, corrupted nome)
    // - Azza Parfums (no inspiradoEm)
    const pickJa        = ctNeeds.filter(p => p.marca === "JA Essence").slice(0, 2)
    const pickContratipo = ctNeeds.filter(p => p.marca !== "JA Essence" && p.inspiradoEm).slice(0, 2)
    const pickAzza      = exNeeds.filter(p => p.marca === "Azza Parfums").slice(0, 1)
    // Fill remaining slots from general queue if needed
    const chosen = new Set([...pickJa, ...pickContratipo, ...pickAzza])
    while (chosen.size < DRY_RUN && queue.length > 0) {
      const next = queue.find(e => !chosen.has(e))
      if (next) chosen.add(next); else break
    }
    queue = Array.from(chosen).slice(0, DRY_RUN)

    console.log(`\n🔍 DRY RUN — processando ${queue.length} entradas (sem writes)\n`)
    queue.forEach((e, i) => {
      const branch = e.inspiradoEm ? `inspiradoEm: "${e.inspiradoEm}"` : `nome: "${e.nome}"`
      console.log(`  ${i + 1}. [${e.marca}] ${e.nome.slice(0, 50)} — ${branch}`)
    })
    console.log()
  } else {
    // Full run — backup first
    const ts = Date.now()
    const ctBak = CT_PATH.replace(".json", `.backup-${ts}.json`)
    const exBak = EX_PATH.replace(".json", `.backup-${ts}.json`)
    fs.copyFileSync(CT_PATH, ctBak)
    fs.copyFileSync(EX_PATH, exBak)
    console.log(`\n💾 Backups salvos: contratipos.backup-${ts}.json + perfumes-expandido.backup-${ts}.json\n`)
  }

  // Index source arrays by id for fast update
  const ctById = new Map(ct.map(p => [p.id as string, p]))
  const exById = new Map(ex.map(p => [p.id as string, p]))

  // Stats
  let enriched = 0
  let skipped  = 0
  const failures: string[] = []

  // Process queue
  for (let i = 0; i < queue.length; i++) {
    const entry  = queue[i]
    const label  = `[${i + 1}/${queue.length}]`
    const isContratipo = !!(entry.inspiradoEm && entry.inspiradoEm.trim())
    const searchTarget = isContratipo ? entry.inspiradoEm! : entry.nome

    const prompt = buildPrompt(entry)

    if (DRY_RUN > 0) {
      console.log(`─────────────────────────────────────────────`)
      console.log(`${label} ${entry.marca} — "${entry.nome.slice(0, 60)}"`)
      console.log(`  Branch: ${isContratipo ? "inspiradoEm" : "nome+marca"}`)
      console.log(`  Searching: "${searchTarget}"`)
      console.log(`\n  PROMPT:\n${prompt}\n`)
    }

    let rawText = ""
    let parsed: GeminiNotas | null = null

    try {
      const result = await geminiModel.generateContent(prompt)
      rawText = result.response.text().trim()

      if (DRY_RUN > 0) {
        console.log(`  RAW RESPONSE:\n${rawText}\n`)
      }

      parsed = parseResponse(rawText)

      if (!parsed) {
        console.log(`${label} [PARSE ERROR] ${entry.nome.slice(0, 50)}`)
        failures.push(`${entry.id}: parse error`)
        skipped++
      } else if (parsed.familia === "DESCONHECIDO") {
        console.log(`${label} [DESCONHECIDO] ${entry.nome.slice(0, 50)}`)
        skipped++
      } else {
        const flatNotas = flattenNotas(parsed.notas)
        const notasSummary = `${parsed.notas.topo.length}+${parsed.notas.coracao.length}+${parsed.notas.fundo.length}`

        if (DRY_RUN > 0) {
          console.log(`  PARSED:`)
          console.log(`    familia:  ${parsed.familia}`)
          console.log(`    topo:     ${parsed.notas.topo.join(", ") || "(vazio)"}`)
          console.log(`    coracao:  ${parsed.notas.coracao.join(", ") || "(vazio)"}`)
          console.log(`    fundo:    ${parsed.notas.fundo.join(", ") || "(vazio)"}`)
          console.log(`  → WOULD UPDATE: familia="${parsed.familia}", notas=[${notasSummary}] = ${flatNotas.length} notas\n`)
        } else {
          // Apply update to in-memory entry
          const record = entry.source === "contratipos" ? ctById.get(entry.id) : exById.get(entry.id)
          if (record) {
            if (!record.familia || record.familia === "Indefinida" || record.familia === "") {
              record.familia = parsed.familia
            }
            if (!record.notas || (record.notas as string[]).length === 0) {
              record.notas = flatNotas
            }
          }
          console.log(`${label} ✓ ${entry.marca} "${searchTarget.slice(0, 40)}" → ${parsed.familia} (${notasSummary} notas)`)
        }

        enriched++
      }
    } catch (err) {
      const msg = (err as Error).message ?? String(err)
      console.log(`${label} [ERROR] ${entry.nome.slice(0, 50)}: ${msg}`)
      failures.push(`${entry.id}: ${msg}`)
      skipped++
    }

    if (i < queue.length - 1) await sleep(DELAY_MS)
  }

  // Write files (full run only)
  if (DRY_RUN === 0) {
    fs.writeFileSync(CT_PATH, JSON.stringify(ct, null, 2), "utf-8")
    fs.writeFileSync(EX_PATH, JSON.stringify(ex, null, 2), "utf-8")
    console.log(`\n✅ Arquivos salvos.`)
  }

  // Summary
  console.log(`\n═══════════════════════════════════════`)
  console.log(`  Total processado:  ${queue.length}`)
  console.log(`  Enriquecido:       ${enriched}`)
  console.log(`  Skipped/falhou:    ${skipped}`)
  if (failures.length > 0) {
    console.log(`\n  Falhas:`)
    failures.forEach(f => console.log(`    - ${f}`))
  }
  if (DRY_RUN > 0) console.log(`\n  (DRY RUN — nenhum arquivo foi alterado)`)
  console.log(`═══════════════════════════════════════\n`)
}

main().catch(err => {
  console.error("Fatal:", err)
  process.exit(1)
})

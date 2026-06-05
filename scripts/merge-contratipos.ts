// ============================================
// SCRIPT: scripts/merge-contratipos.ts
// O QUE FAZ: merge de contratipos-novos.json → contratipos.json
//   - Novos produtos: adiciona
//   - Preço diferente: atualiza preco_brl
//   - Nome diferente: atualiza nome
//   - Produto não encontrado no scrape: marca disponivel: false
//   - Nunca deleta entradas
// COMO RODAR:
//   npx ts-node -r tsconfig-paths/register --project tsconfig.scripts.json scripts/merge-contratipos.ts
// ============================================

import * as fs   from "fs"
import * as path from "path"

// ── Interfaces ────────────────────────────────────────────────────────────────

interface ContratipoExistente {
  id:           string
  nome:         string
  marca:        string
  tipo:         string
  genero:       string
  inspiradoEm:  string
  marcaOriginal:string
  familia:      string
  notas:        string[]
  preco_brl:    number
  categoria:    "contratipo"
  disponivel?:  boolean
  [key: string]: unknown
}

interface ContratipoNovo {
  id:           string
  nome:         string
  marca:        string
  tipo:         string
  genero:       string
  inspiradoEm:  string
  marcaOriginal:string
  familia:      string
  notas:        string[]
  preco_brl:    number
  url?:         string
  categoria:    "contratipo"
}

interface ContratiposNovosFile {
  timestamp:   string
  total:       number
  por_marca:   Record<string, number>
  contratipos: ContratipoNovo[]
}

// ── Paths ─────────────────────────────────────────────────────────────────────

const ORIGEM  = path.join(process.cwd(), "data", "contratipos-novos.json")
const DESTINO = path.join(process.cwd(), "data", "contratipos.json")
const BACKUP  = path.join(process.cwd(), "data", `contratipos-backup-${new Date().toISOString().slice(0,10)}.json`)

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function chave(nome: string, marca: string): string {
  return `${slugify(nome)}|${slugify(marca)}`
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  // 1. Load files
  if (!fs.existsSync(ORIGEM)) {
    console.error(`✗ ${ORIGEM} nao encontrado. Rode primeiro: npm run contratipos:scrape`)
    process.exit(1)
  }
  if (!fs.existsSync(DESTINO)) {
    console.error(`✗ ${DESTINO} nao encontrado.`)
    process.exit(1)
  }

  const novosRaw   = JSON.parse(fs.readFileSync(ORIGEM,  "utf-8")) as ContratiposNovosFile
  const existentes = JSON.parse(fs.readFileSync(DESTINO, "utf-8")) as ContratipoExistente[]
  const novos: ContratipoNovo[] = novosRaw.contratipos ?? []

  if (novos.length === 0) {
    console.error("✗ contratipos-novos.json esta vazio.")
    process.exit(1)
  }

  // 2. Backup
  fs.copyFileSync(DESTINO, BACKUP)
  console.log(`Backup: ${BACKUP}`)

  // 3. Build lookup maps
  const existentesPorId    = new Map<string, ContratipoExistente>()
  const existentesPorChave = new Map<string, ContratipoExistente>()
  for (const e of existentes) {
    existentesPorId.set(e.id, e)
    existentesPorChave.set(chave(e.nome, e.marca), e)
  }

  const novosPorId    = new Map<string, ContratipoNovo>()
  const novosPorChave = new Map<string, ContratipoNovo>()
  for (const n of novos) {
    novosPorId.set(n.id, n)
    novosPorChave.set(chave(n.nome, n.marca), n)
  }

  // 4. Diff & merge
  let countNovos         = 0
  let countPrecos        = 0
  let countNomes         = 0
  let countIndisponiveis = 0
  let countReativados    = 0

  const resultado: ContratipoExistente[] = []

  // Pass 1: update or mark-unavailable existing entries
  for (const e of existentes) {
    const novo = novosPorId.get(e.id) ?? novosPorChave.get(chave(e.nome, e.marca))

    if (!novo) {
      if (e.disponivel !== false) {
        countIndisponiveis++
        console.log(`  INDISPONIVEL: "${e.nome}" (${e.marca})`)
      }
      resultado.push({ ...e, disponivel: false })
      continue
    }

    const updated: ContratipoExistente = { ...e }

    // Never reactivate zero-price entries — they can't be sold
    if (!novo.preco_brl || novo.preco_brl <= 0) {
      if (e.disponivel !== false) {
        countIndisponiveis++
        console.log(`  INDISPONIVEL (preco=0): "${e.nome}" (${e.marca})`)
      }
      resultado.push({ ...updated, disponivel: false })
      continue
    }

    if (e.disponivel === false) {
      updated.disponivel = true
      countReativados++
      console.log(`  REATIVADO: "${e.nome}" (${e.marca})`)
    } else {
      updated.disponivel = true
    }

    if (Math.abs(round2(novo.preco_brl) - round2(e.preco_brl)) >= 0.01) {
      console.log(`  PRECO: "${e.nome}" R$${e.preco_brl} -> R$${novo.preco_brl}`)
      updated.preco_brl = novo.preco_brl
      countPrecos++
    }

    if (novo.nome !== e.nome) {
      console.log(`  NOME: "${e.nome}" -> "${novo.nome}"`)
      updated.nome = novo.nome
      countNomes++
    }

    resultado.push(updated)
  }

  // Pass 2: add brand-new entries
  const idsExistentes    = new Set(existentes.map(e => e.id))
  const chavesExistentes = new Set(existentes.map(e => chave(e.nome, e.marca)))

  for (const novo of novos) {
    if (idsExistentes.has(novo.id)) continue
    if (chavesExistentes.has(chave(novo.nome, novo.marca))) continue

    const { url: _url, ...semUrl } = novo
    resultado.push({ ...semUrl, disponivel: true })
    countNovos++
    console.log(`  NOVO: "${novo.nome}" (${novo.marca}) R$${novo.preco_brl}`)
  }

  // 5. Write result
  fs.writeFileSync(DESTINO, JSON.stringify(resultado, null, 2), "utf-8")

  // 6. Summary
  console.log("\n" + "=".repeat(50))
  console.log("MERGE CONCLUIDO")
  console.log("=".repeat(50))
  console.log(`  Novos adicionados:       ${String(countNovos).padStart(4)}`)
  console.log(`  Precos atualizados:      ${String(countPrecos).padStart(4)}`)
  console.log(`  Nomes atualizados:       ${String(countNomes).padStart(4)}`)
  console.log(`  Marcados indisponiveis:  ${String(countIndisponiveis).padStart(4)}`)
  console.log(`  Reativados:              ${String(countReativados).padStart(4)}`)
  console.log(`  Total final:             ${String(resultado.length).padStart(4)}`)
  console.log(`\n  Salvo em:  ${DESTINO}`)
  console.log(`  Backup em: ${BACKUP}`)
  console.log("=".repeat(50))
}

main()

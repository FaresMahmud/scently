// ============================================
// SCRIPT: scripts/merge-contratipos.ts
// O QUE FAZ: mescla dados do JSON scrapeado com lib/contratiposData.ts
// COMO RODAR: npx ts-node scripts/merge-contratipos.ts
// ============================================

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs") as typeof import("fs")
const path = require("path") as typeof import("path")

interface PerfumeJson {
  nome: string
  marca: string
  familia: string
  notasTopo: string[]
  notasCoracao: string[]
  notasFundo: string[]
  genero: string
  preco: number
  urlOrigem: string
}

// ── Limpeza de notas MV (HTML entities + texto de fixação/projeção) ──────────

const LIXO_NOTAS = [
  /^&/, /FIXA/, /PROJE/, /INFORMA/, /^pulsos$/, /^bíceps?$/, /^antebraços/,
  /^região/, /^Para melhor/, /^ES IMPORT/, /^bíce$/, /^pu$/, /^anteb/,
  /^[A-Z]{3,}$/, /^O:\s/, /FAM[ÍI]LIA/, /^[a-z]{1,2}$/, /^mbar$/,
  /^ris$/, /^O:\s*[A-Z]/, /Estilo/, /^Para /, /^pulso$/, /^bícep$/,
]

function limparNotas(notas: string[]): string[] {
  return notas
    .map(n => n.replace(/\.$/, "").trim())
    .filter(n => {
      if (n.length < 2 || n.length > 80) return false
      if (LIXO_NOTAS.some(r => r.test(n))) return false
      return true
    })
}

function limparFamilia(familia: string): string {
  return familia
    .replace(/&[A-Za-z]+;/g, "")
    .replace(/\s*[•&,]\s*&[A-Za-z]+;/g, "")
    .replace(/\s*&bull;\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/^[,\s]+|[,\s]+$/g, "")
    .trim()
}

function limparNome(nome: string): string {
  // Remove sufixos "- Inspirado em X", "- Contratipo X", "Inspirado em X - Y"
  let n = nome
    .replace(/\s*[-–]\s*[Ii]nspirado\s+(em\s+)?[\s\S]*/i, "")
    .replace(/\s*[-–]\s*[Cc]ontratipo\s+[\s\S]*/i, "")
    .replace(/\s+[Ii]nspirado\s+em\s+[\s\S]*/i, "")
    .trim()
  // Normaliza ALL CAPS (ex: "SPARTAN" → "Spartan")
  if (n === n.toUpperCase() && n.length > 3) {
    n = n.charAt(0).toUpperCase() + n.slice(1).toLowerCase()
  }
  return n
}

function toSlug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function gerarId(marca: string, nome: string): string {
  const marcaSlug = toSlug(marca.split(" ")[0])
  return `${marcaSlug}-${toSlug(nome).slice(0, 40)}`
}

// ── Dados atuais do contratiposData.ts (para preserve IDs + JA + Azza) ──────

// Importação dinâmica inline do array atual
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { CONTRATIPOS: CONTRATIPOS_ATUAL } = require("../lib/contratiposData") as {
  CONTRATIPOS: Array<{
    id: string
    nome: string
    marca: string
    tipo: "EDP" | "EDT" | "EDC" | "Extrait"
    genero: "Masculino" | "Feminino" | "Unissex"
    inspiradoEm: string
    marcaOriginal: string
    familia: string
    notas: string[]
    preco_brl: number
    categoria: "contratipo"
  }>
}

// ── Lê o JSON scrapeado ───────────────────────────────────────────────────────

const jsonPath = path.join(__dirname, "output", "perfumes-verificados.json")
const jsonData: PerfumeJson[] = JSON.parse(fs.readFileSync(jsonPath, "utf-8"))

// ── Merge ─────────────────────────────────────────────────────────────────────

const resultado = [...CONTRATIPOS_ATUAL]
const atualizados: string[] = []
const adicionados: string[] = []

for (const item of jsonData) {
  const nomeOriginal = item.nome
  const nomeLimpo = limparNome(nomeOriginal)
  const marcaKey = item.marca.toLowerCase()
  const nomeKey = nomeLimpo.toLowerCase()

  // Notas combinadas e limpas
  const notasCombinadas = limparNotas([
    ...item.notasTopo,
    ...item.notasCoracao,
    ...item.notasFundo,
  ])

  const familiaLimpa = limparFamilia(item.familia)

  // Tenta match no array atual (nome + marca, case-insensitive)
  const idx = resultado.findIndex(
    c => c.marca.toLowerCase() === marcaKey && c.nome.toLowerCase() === nomeKey
  )

  if (idx >= 0) {
    // ATUALIZA entrada existente
    const anterior = resultado[idx]
    resultado[idx] = {
      ...anterior,
      familia: familiaLimpa || anterior.familia,
      notas: notasCombinadas.length > 0 ? notasCombinadas : anterior.notas,
      preco_brl: item.preco > 0 ? item.preco : anterior.preco_brl,
    }
    atualizados.push(`${item.marca} — ${nomeLimpo}`)
  } else {
    // ADICIONA nova entrada
    const genero = (() => {
      const g = item.genero.toLowerCase()
      if (g.includes("feminino") || g.includes("female")) return "Feminino"
      if (g.includes("masculino") || g.includes("male")) return "Masculino"
      return "Unissex"
    })() as "Masculino" | "Feminino" | "Unissex"

    resultado.push({
      id: gerarId(item.marca, nomeLimpo),
      nome: nomeLimpo,
      marca: item.marca,
      tipo: "EDP",
      genero,
      inspiradoEm: "",
      marcaOriginal: "",
      familia: familiaLimpa || "Floral Amadeirado",
      notas: notasCombinadas,
      preco_brl: item.preco,
      categoria: "contratipo",
    })
    adicionados.push(`${item.marca} — ${nomeLimpo}`)
  }
}

// ── Gera o arquivo TypeScript ─────────────────────────────────────────────────

function formatArray(arr: string[]): string {
  if (!arr.length) return "[]"
  return `[${arr.map(s => `"${s.replace(/"/g, '\\"')}"`).join(", ")}]`
}

function formatEntry(p: typeof resultado[0]): string {
  return `  { id: "${p.id}", nome: "${p.nome.replace(/"/g, '\\"')}", marca: "${p.marca}", tipo: "${p.tipo}", genero: "${p.genero}", inspiradoEm: "${p.inspiradoEm.replace(/"/g, '\\"')}", marcaOriginal: "${p.marcaOriginal.replace(/"/g, '\\"')}", familia: "${p.familia.replace(/"/g, '\\"')}", notas: ${formatArray(p.notas)}, preco_brl: ${p.preco_brl}, categoria: "contratipo" },`
}

// Agrupa por marca para comentários de seção
const porMarca: Record<string, typeof resultado> = {}
for (const p of resultado) {
  if (!porMarca[p.marca]) porMarca[p.marca] = []
  porMarca[p.marca].push(p)
}

const linhas: string[] = [
  `// ============================================`,
  `// ARQUIVO: lib/contratiposData.ts`,
  `// O QUE FAZ: dados dos contratipos brasileiros — In The Box, JA Essence, Maison Viegas, Azza Parfum`,
  `// QUANDO MANDAR PRA IA: quando quiser adicionar marcas ou perfumes`,
  `// DEPENDE DE: nada`,
  `// GERADO AUTOMATICAMENTE por scripts/merge-contratipos.ts`,
  `// Total: ${resultado.length} perfumes`,
  `// ============================================`,
  ``,
  `export interface PerfumeContratipo {`,
  `  id: string`,
  `  nome: string`,
  `  marca: string`,
  `  tipo: "EDP" | "EDT" | "EDC" | "Extrait"`,
  `  genero: "Masculino" | "Feminino" | "Unissex"`,
  `  inspiradoEm: string`,
  `  marcaOriginal: string`,
  `  familia: string`,
  `  notas: string[]`,
  `  preco_brl: number`,
  `  categoria: "contratipo"`,
  `}`,
  ``,
  `export const CONTRATIPOS: PerfumeContratipo[] = [`,
]

const ORDEM_MARCAS = ["In The Box", "JA Essence", "Maison Viegas", "Azza Parfum"]

for (const marca of ORDEM_MARCAS) {
  const entries = porMarca[marca] ?? []
  if (!entries.length) continue
  const sep = "─".repeat(55 - marca.length)
  linhas.push(``)
  linhas.push(`  // ─── ${marca} ${sep}`)
  for (const p of entries) {
    linhas.push(formatEntry(p))
  }
}

linhas.push(`]`)
linhas.push(``)
linhas.push(`// ── Funções auxiliares ───────────────────────────────────────────────────────`)
linhas.push(``)
linhas.push(`export function buscarTodosContratipos(): PerfumeContratipo[] {`)
linhas.push(`  return CONTRATIPOS`)
linhas.push(`}`)
linhas.push(``)
linhas.push(`export function buscarContratiposPorMarca(marca: string): PerfumeContratipo[] {`)
linhas.push(`  return CONTRATIPOS.filter((p) => p.marca.toLowerCase() === marca.toLowerCase())`)
linhas.push(`}`)
linhas.push(``)
linhas.push(`export function buscarContratiposPorGenero(`)
linhas.push(`  genero: "Masculino" | "Feminino" | "Unissex"`)
linhas.push(`): PerfumeContratipo[] {`)
linhas.push(`  return CONTRATIPOS.filter((p) => p.genero === genero)`)
linhas.push(`}`)
linhas.push(``)
linhas.push(`export function buscarContratiposPorInspiracao(nome: string): PerfumeContratipo[] {`)
linhas.push(`  const q = nome.toLowerCase()`)
linhas.push(`  return CONTRATIPOS.filter(`)
linhas.push(`    (p) =>`)
linhas.push(`      p.inspiradoEm.toLowerCase().includes(q) ||`)
linhas.push(`      p.marcaOriginal.toLowerCase().includes(q)`)
linhas.push(`  )`)
linhas.push(`}`)

const conteudo = linhas.join("\n") + "\n"

const outputPath = path.join(__dirname, "..", "lib", "contratiposData.ts")
fs.writeFileSync(outputPath, conteudo, "utf-8")

// ── Relatório ─────────────────────────────────────────────────────────────────

console.log("✅ lib/contratiposData.ts atualizado")
console.log(`\n📊 RESULTADO:`)
console.log(`   Total final:     ${resultado.length} perfumes`)
console.log(`   Atualizados:     ${atualizados.length}`)
console.log(`   Adicionados:     ${adicionados.length}`)

const porMarcaFinal: Record<string, number> = {}
resultado.forEach(p => { porMarcaFinal[p.marca] = (porMarcaFinal[p.marca] ?? 0) + 1 })
console.log(`\n   Por marca:`)
Object.entries(porMarcaFinal).forEach(([m, n]) => console.log(`     ${m}: ${n}`))

if (atualizados.length) {
  console.log(`\n   ✏️  Atualizados:`)
  atualizados.forEach(n => console.log(`     - ${n}`))
}
console.log(`\n   ➕ Adicionados (${adicionados.length}):`)
adicionados.slice(0, 10).forEach(n => console.log(`     - ${n}`))
if (adicionados.length > 10) console.log(`     ... e mais ${adicionados.length - 10}`)

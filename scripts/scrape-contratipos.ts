// ============================================
// SCRIPT: scripts/scrape-contratipos.ts
// O QUE FAZ: raspa produtos reais de sites brasileiros de contratipos
//   - In The Box (VNDA)      → dataLayer no HTML estático (render_js=false)
//   - Maison Viegas (Nuvem)  → blocos data-product-id no HTML renderizado (render_js=true)
//   - JA Essence, Azza       → pulados (offline)
// COMO RODAR: npm run contratipos:scrape
// SALVA EM:  data/contratipos-novos.json
// ============================================

import * as path from "path"
import * as fs from "fs"

const envPath = path.join(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([^#\s][^=]*)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "")
  }
}

import Groq from "groq-sdk"

const SBEE_KEY = process.env.SCRAPINGBEE_API_KEY ?? ""
const GROQ_KEY = process.env.GROQ_API_KEY ?? ""
const SAIDA    = path.join(process.cwd(), "data", "contratipos-novos.json")

// ── Interfaces ────────────────────────────────────────────────────────────────

interface ProdutoBruto {
  nome: string
  marca: string
  preco_brl: number
  descricao: string
  url: string
}

export interface ContratipoNovo {
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
  url: string
  categoria: "contratipo"
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number) { return new Promise<void>(r => setTimeout(r, ms)) }

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD")
    .replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

async function sbFetch(targetUrl: string, renderJs: boolean, wait = 2000): Promise<string> {
  const url = new URL("https://app.scrapingbee.com/api/v1/")
  url.searchParams.set("api_key",   SBEE_KEY)
  url.searchParams.set("url",       targetUrl)
  url.searchParams.set("render_js", renderJs ? "true" : "false")
  if (renderJs) url.searchParams.set("wait", String(wait))
  const r = await fetch(url.toString())
  if (!r.ok) throw new Error(`ScrapingBee HTTP ${r.status} para ${targetUrl}`)
  return r.text()
}

// ── In The Box — VNDA (dataLayer, render_js=false) ───────────────────────────

async function scrapeInTheBox(): Promise<ProdutoBruto[]> {
  const MARCA = "In The Box"
  const BASE  = "https://intheboxperfumes.com.br"
  const CATEG = "/perfumes"
  const produtos: ProdutoBruto[] = []

  console.log(`\n[In The Box] Iniciando scrape via VNDA dataLayer…`)

  for (let page = 1; page <= 20; page++) {
    const url = `${BASE}${CATEG}?page=${page}`
    let html: string
    try {
      html = await sbFetch(url, false)
    } catch (e) {
      console.error(`  ✗ Página ${page}: ${(e as Error).message}`)
      break
    }

    // Extrai o array dataLayer do script inline
    const dlMatch = html.match(/dataLayer\s*=\s*(\[[\s\S]*?\]);\s*(?:<\/script>|window\.)/)
    if (!dlMatch) { console.log(`  Página ${page}: sem dataLayer — fim`); break }

    type DLItem = { item_name: string; price: number; item_category?: string }
    let items: DLItem[] = []
    try {
      const dl = JSON.parse(dlMatch[1]) as Array<Record<string, unknown>>
      const evt = dl.find(e => e.ecommerce && (e.ecommerce as Record<string, unknown>).items) as
        { ecommerce: { items: DLItem[] } } | undefined
      items = evt?.ecommerce?.items ?? []
    } catch { console.warn(`  ⚠ Página ${page}: falha ao parsear dataLayer`); break }

    if (items.length === 0) { console.log(`  Página ${page}: vazia — fim`); break }

    for (const item of items) {
      const categoriaSlug = item.item_category ?? CATEG.replace("/", "")
      const nomeSlug      = slugify(item.item_name)
      produtos.push({
        nome:      item.item_name,
        marca:     MARCA,
        preco_brl: item.price,
        descricao: "",
        url:       `${BASE}/${categoriaSlug}/${nomeSlug}`,
      })
    }

    console.log(`  Página ${page}: ${items.length} produtos (total: ${produtos.length})`)
    await sleep(1500)
  }

  return produtos
}

// ── Maison Viegas — Nuvemshop (render_js=true) ───────────────────────────────

async function scrapeMaisonViegas(): Promise<ProdutoBruto[]> {
  const MARCA   = "Maison Viegas"
  const BASE    = "https://maisonviegas.com.br"
  const produtos: ProdutoBruto[] = []
  const vistos  = new Set<string>()

  console.log(`\n[Maison Viegas] Iniciando scrape via Nuvemshop render_js=true…`)

  for (let page = 1; page <= 10; page++) {
    const url = `${BASE}/produtos/?page=${page}`
    let html: string
    try {
      html = await sbFetch(url, true, 3000)
    } catch (e) {
      console.error(`  ✗ Página ${page}: ${(e as Error).message}`)
      break
    }

    const blocos = [...html.matchAll(/data-product-id="(\d+)"([\s\S]*?)(?=data-product-id="\d+"|<\/ul>|<\/section>)/g)]
    if (blocos.length === 0) { console.log(`  Página ${page}: sem produtos — fim`); break }

    let novos = 0
    for (const bloco of blocos) {
      const id = bloco[1]
      if (vistos.has(id)) continue
      vistos.add(id)

      const corpo = bloco[2]

      // Nome: alt da imagem (já contém "inspirado em X — Marca")
      const nome = corpo.match(/alt="([^"]+?)(?:\s*-\s*comprar[^"]*)?"/)?.[1]?.trim() ?? ""
      if (!nome) continue

      // Preço: price_number no JSON HTML-escaped de data-variants
      const precoM = corpo.match(/price_number&quot;:(\d+)/)
      const preco  = precoM ? parseInt(precoM[1]) : 0

      // URL absoluta do produto
      const hrefM = corpo.match(/href="(https:\/\/maisonviegas\.com\.br\/produtos\/[^"]+)"/)
      const prodUrl = hrefM?.[1] ?? `${BASE}/produtos/`

      produtos.push({ nome, marca: MARCA, preco_brl: preco, descricao: nome, url: prodUrl })
      novos++
    }

    console.log(`  Página ${page}: ${novos} produtos novos (total: ${produtos.length})`)
    if (novos === 0) break
    await sleep(2000)
  }

  return produtos
}

// ── Groq enriquecimento ───────────────────────────────────────────────────────

const groq = new Groq({ apiKey: GROQ_KEY })

interface GroqResposta {
  inspiradoEm: string; marcaOriginal: string
  tipo: "EDP"|"EDT"|"EDC"|"Extrait"; genero: "Masculino"|"Feminino"|"Unissex"
  familia: string; notas: string[]
}

async function enriquecer(p: ProdutoBruto): Promise<GroqResposta> {
  const prompt = `Você é especialista em perfumaria. Analise este contratipo brasileiro e responda SOMENTE com JSON válido, sem markdown.

Nome: "${p.nome}"
Descrição: "${p.descricao}"
Marca: "${p.marca}"

Retorne exatamente:
{
  "inspiradoEm": "nome do perfume original (sem a marca)",
  "marcaOriginal": "marca do original",
  "tipo": "EDP" | "EDT" | "EDC" | "Extrait",
  "genero": "Masculino" | "Feminino" | "Unissex",
  "familia": "família olfativa em português (Amadeirado, Floral, Oriental, Cítrico, Aquático, Gourmand, Frutal, Almiscarado, etc.)",
  "notas": ["nota1","nota2","nota3"]
}`

  const r = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 300,
  })
  const txt = r.choices[0]?.message?.content?.trim() ?? "{}"
  try {
    return JSON.parse(txt.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim()) as GroqResposta
  } catch {
    console.warn(`  ⚠ JSON inválido do Groq para "${p.nome}"`)
    return { inspiradoEm: p.nome, marcaOriginal: "Desconhecida", tipo: "EDP", genero: "Unissex", familia: "Indefinida", notas: [] }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗")
  console.log("║       SCRAPE CONTRATIPOS — Scently                       ║")
  console.log("╚══════════════════════════════════════════════════════════╝")

  if (!SBEE_KEY) { console.error("✗ SCRAPINGBEE_API_KEY não configurada"); process.exit(1) }
  if (!GROQ_KEY) { console.error("✗ GROQ_API_KEY não configurada");        process.exit(1) }

  // 1. Coleta por site
  const brutos: ProdutoBruto[] = []
  brutos.push(...await scrapeInTheBox())
  brutos.push(...await scrapeMaisonViegas())
  console.log("\n⚠ JA Essence (jaessence.com.br) — offline, pulado")
  console.log("⚠ Azza Parfum (azzaperfum.com.br) — offline, pulado")

  console.log(`\nTotal bruto: ${brutos.length} produtos`)
  if (brutos.length === 0) { console.error("✗ Nenhum produto coletado — abortando"); process.exit(1) }

  // 2. Enriquece com Groq
  console.log("\nEnriquecendo com Groq…\n")
  const resultado: ContratipoNovo[] = []

  for (let i = 0; i < brutos.length; i++) {
    const p = brutos[i]
    const pfx = `[${String(i + 1).padStart(String(brutos.length).length, " ")}/${brutos.length}]`
    try {
      const info = await enriquecer(p)
      resultado.push({
        id:            `${slugify(p.marca)}-${slugify(p.nome)}`,
        nome:          p.nome,
        marca:         p.marca,
        tipo:          info.tipo          ?? "EDP",
        genero:        info.genero        ?? "Unissex",
        inspiradoEm:   info.inspiradoEm   ?? p.nome,
        marcaOriginal: info.marcaOriginal ?? "Desconhecida",
        familia:       info.familia       ?? "Indefinida",
        notas:         Array.isArray(info.notas) ? info.notas : [],
        preco_brl:     p.preco_brl,
        url:           p.url,
        categoria:     "contratipo",
      })
      console.log(`${pfx} "${p.nome}" → ${info.inspiradoEm} (${info.marcaOriginal})`)
    } catch (e) {
      console.error(`${pfx} ✗ "${p.nome}": ${(e as Error).message}`)
    }
    if (i < brutos.length - 1) await sleep(200)
  }

  // 3. Salva
  const marcas = ["In The Box", "Maison Viegas"]
  const saida = {
    timestamp:   new Date().toISOString(),
    total:       resultado.length,
    por_marca:   Object.fromEntries(marcas.map(m => [m, resultado.filter(p => p.marca === m).length])),
    contratipos: resultado,
  }
  fs.writeFileSync(SAIDA, JSON.stringify(saida, null, 2), "utf-8")

  console.log("\n" + "━".repeat(60))
  console.log("CONCLUÍDO")
  marcas.forEach(m => console.log(`  ${m}: ${saida.por_marca[m]} produtos`))
  console.log(`\n  ✓ Total: ${resultado.length} contratipos`)
  console.log(`  ✓ Salvo em: ${SAIDA}`)
  console.log("  ⚠ Revise antes de fazer merge com contratipos.json")
}

main().catch(e => { console.error(`✗ Erro fatal: ${(e as Error).message}`); process.exit(1) })

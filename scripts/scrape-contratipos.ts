// ============================================
// SCRIPT: scripts/scrape-contratipos.ts
// O QUE FAZ: raspa produtos reais de sites brasileiros de contratipos
//   - In The Box (VNDA)        → dataLayer no HTML estático (render_js=false)
//   - Maison Viegas (Nuvemshop)→ blocos data-product-id (render_js=true)
//   - JA Essence (wBuy)        → blocos data-id em /lancamentos/ (render_js=true)
//   - Azza Parfums (Nuvemshop) → blocos data-product-id (render_js=true)
// COMO RODAR:
//   npm run contratipos:scrape                          (todos)
//   npm run contratipos:scrape -- --marca="JA Essence" (só um)
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
import { GoogleGenerativeAI } from "@google/generative-ai"

const SBEE_KEY     = process.env.SCRAPINGBEE_API_KEY ?? ""
const GROQ_KEY     = process.env.GROQ_API_KEY ?? ""
const GEMINI_KEY   = process.env.GEMINI_API_KEY ?? ""
const SAIDA        = path.join(process.cwd(), "data", "contratipos-novos.json")
const MARCA_FILTER = process.argv.find(a => a.startsWith("--marca="))?.split("=")?.[1]?.toLowerCase()
const APPEND_MODE  = process.argv.includes("--append")

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
    try { html = await sbFetch(url, false) }
    catch (e) { console.error(`  ✗ Página ${page}: ${(e as Error).message}`); break }

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
  const MARCA  = "Maison Viegas"
  const BASE   = "https://maisonviegas.com.br"
  const vistos = new Set<string>()
  const produtos: ProdutoBruto[] = []

  console.log(`\n[Maison Viegas] Iniciando scrape via Nuvemshop render_js=true…`)

  for (let page = 1; page <= 10; page++) {
    let html: string
    try { html = await sbFetch(`${BASE}/produtos/?page=${page}`, true, 3000) }
    catch (e) { console.error(`  ✗ Página ${page}: ${(e as Error).message}`); break }

    const blocos = [...html.matchAll(/data-product-id="(\d+)"([\s\S]*?)(?=data-product-id="\d+"|<\/ul>|<\/section>)/g)]
    if (blocos.length === 0) { console.log(`  Página ${page}: sem produtos — fim`); break }

    let novos = 0
    for (const bloco of blocos) {
      const id = bloco[1]
      if (vistos.has(id)) continue
      vistos.add(id)
      const corpo   = bloco[2]
      const nome    = corpo.match(/alt="([^"]+?)(?:\s*-\s*comprar[^"]*)?"/)?.[1]?.trim() ?? ""
      if (!nome) continue
      const precoM  = corpo.match(/price_number&quot;:([\d.]+)/)
      const preco   = precoM ? parseFloat(precoM[1]) : 0
      const hrefM   = corpo.match(/href="(https:\/\/maisonviegas\.com\.br\/produtos\/[^"]+)"/)
      produtos.push({ nome, marca: MARCA, preco_brl: preco, descricao: nome, url: hrefM?.[1] ?? `${BASE}/produtos/` })
      novos++
    }

    console.log(`  Página ${page}: ${novos} produtos novos (total: ${produtos.length})`)
    if (novos === 0) break
    await sleep(2000)
  }

  return produtos
}

// ── JA Essence — wBuy (render_js=true) ───────────────────────────────────────

async function scrapeJAEssence(): Promise<ProdutoBruto[]> {
  const MARCA  = "JA Essence"
  const BASE   = "https://www.jaessencedelavie.com.br"
  const vistos = new Set<string>()
  const produtos: ProdutoBruto[] = []

  console.log(`\n[JA Essence] Iniciando scrape via wBuy render_js=true…`)

  for (let page = 1; page <= 5; page++) {
    const url  = page === 1 ? `${BASE}/lancamentos/` : `${BASE}/lancamentos/?pg=${page}`
    let html: string
    try { html = await sbFetch(url, true, 3000) }
    catch (e) { console.error(`  ✗ Página ${page}: ${(e as Error).message}`); break }

    const blocos = [...html.matchAll(/data-id="(\d+)"([\s\S]*?)(?=data-id="\d+"|<\/section>|class="mais-produtos")/g)]
    if (blocos.length === 0) { console.log(`  Página ${page}: sem produtos — fim`); break }

    let novos = 0
    for (const bloco of blocos) {
      const id = bloco[1]
      if (vistos.has(id)) continue
      vistos.add(id)
      const corpo = bloco[2]

      // Nome: h3.produto title (já contém "inspirado em X")
      const nome = corpo.match(/class="produto"[^>]*title="([^"]+)"/)?.[1]?.trim()
                ?? corpo.match(/alt="([^"]+)"/)?.[1]?.trim()
                ?? ""
      if (!nome) continue

      // Preço: span dentro de .valor_final
      const precoM = corpo.match(/valor_final[\s\S]*?<span>R\$([\d.,]+)/)
      const preco  = precoM ? parseFloat(precoM[1].replace(/\./g, "").replace(",", ".")) : 0

      // URL: href relativo → absoluto
      const hrefM  = corpo.match(/href="([^"]+)"/)
      const prodUrl = hrefM
        ? (hrefM[1].startsWith("http") ? hrefM[1] : `${BASE}/${hrefM[1].replace(/^\//, "")}`)
        : BASE

      produtos.push({ nome, marca: MARCA, preco_brl: preco, descricao: nome, url: prodUrl })
      novos++
    }

    console.log(`  Página ${page}: ${novos} produtos novos (total: ${produtos.length})`)
    if (novos === 0) break
    await sleep(2000)
  }

  return produtos
}

// ── Azza Parfums — Nuvemshop (render_js=true) ────────────────────────────────

async function scrapeAzzaParfums(): Promise<ProdutoBruto[]> {
  const MARCA  = "Azza Parfums"
  const BASE   = "https://www.azzaparfums.com.br"
  const vistos = new Set<string>()
  const produtos: ProdutoBruto[] = []

  console.log(`\n[Azza Parfums] Iniciando scrape via Nuvemshop render_js=true…`)

  for (let page = 1; page <= 10; page++) {
    let html: string
    try { html = await sbFetch(`${BASE}/produtos/?page=${page}`, true, 3000) }
    catch (e) { console.error(`  ✗ Página ${page}: ${(e as Error).message}`); break }

    const blocos = [...html.matchAll(/data-product-id="(\d+)"([\s\S]*?)(?=data-product-id="\d+"|<\/ul>|<\/section>)/g)]
    if (blocos.length === 0) { console.log(`  Página ${page}: sem produtos — fim`); break }

    let novos = 0
    for (const bloco of blocos) {
      const id = bloco[1]
      if (vistos.has(id)) continue
      vistos.add(id)
      const corpo   = bloco[2]
      const nome    = corpo.match(/alt="([^"]+?)(?:\s*-\s*comprar[^"]*)?"/)?.[1]?.trim() ?? ""
      if (!nome) continue
      const precoM  = corpo.match(/price_number&quot;:([\d.]+)/)
      const preco   = precoM ? parseFloat(precoM[1]) : 0
      const hrefM   = corpo.match(/href="(https:\/\/www\.azzaparfums\.com\.br\/[^"]+)"/)
      produtos.push({ nome, marca: MARCA, preco_brl: preco, descricao: nome, url: hrefM?.[1] ?? `${BASE}/produtos/` })
      novos++
    }

    console.log(`  Página ${page}: ${novos} produtos novos (total: ${produtos.length})`)
    if (novos === 0) break
    await sleep(2000)
  }

  return produtos
}

// ── Catálogo lookup ───────────────────────────────────────────────────────────

interface CatalogoEntry { nome: string; marca: string; familia: string; acordesPrincipais: string[]; genero?: string }

const familiaPT: Record<string, string> = {
  "citrus":"Cítrico","citric":"Cítrico",
  "floral":"Floral","white floral":"Floral","rose":"Floral","flower":"Floral",
  "woody":"Amadeirado","wood":"Amadeirado","cedar":"Amadeirado","sandalwood":"Amadeirado",
  "oriental":"Oriental","amber":"Oriental","ambery":"Oriental","balsamic":"Oriental",
  "aquatic":"Aquático","marine":"Aquático","water":"Aquático","fresh":"Aquático","ozonic":"Aquático",
  "spicy":"Especiado","spice":"Especiado","fresh spicy":"Especiado",
  "gourmand":"Gourmand","sweet":"Gourmand","vanilla":"Gourmand","caramel":"Gourmand",
  "musky":"Almiscarado","musk":"Almiscarado","powdery":"Almiscarado",
  "green":"Verde","aromatic":"Verde","herbal":"Verde","fougere":"Verde","fougère":"Verde",
  "fruity":"Frutal","fruit":"Frutal",
}

let _catalogo: CatalogoEntry[] | null = null
function getCatalogo(): CatalogoEntry[] {
  if (_catalogo) return _catalogo
  const fp = path.join(process.cwd(), "data", "catalogo-fragella.json")
  if (fs.existsSync(fp)) {
    const raw = JSON.parse(fs.readFileSync(fp, "utf-8"))
    _catalogo = (Array.isArray(raw) ? raw : (raw.perfumes ?? [])) as CatalogoEntry[]
  } else {
    _catalogo = []
  }
  return _catalogo
}

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").trim()

function buscarNoCatalogo(ref: string): { inspiradoEm: string; marcaOriginal: string; familia: string; notas: string[] } | null {
  const cat = getCatalogo()
  const r   = norm(ref)
  const hit = cat.find(c => {
    const n = norm(c.nome); const m = norm(c.marca)
    return (r.includes(n) && n.length > 3) && (r.includes(m) || m.length <= 3)
  }) ?? cat.find(c => { const n = norm(c.nome); return r.includes(n) && n.length > 4 })
  if (!hit) return null
  const familiaEN = (hit.familia ?? "").toLowerCase()
  return {
    inspiradoEm:   hit.nome,
    marcaOriginal: hit.marca,
    familia:       familiaPT[familiaEN] ?? "Indefinida",
    notas:         (hit.acordesPrincipais ?? []).slice(0, 5),
  }
}

// ── Extração via regex do nome ────────────────────────────────────────────────

function extrairDoNome(nome: string): { referencia: string | null; genero: ContratipoNovo["genero"]; tipo: ContratipoNovo["tipo"] } {
  const genero: ContratipoNovo["genero"] =
    /\bMasculino\b/i.test(nome)                         ? "Masculino" :
    /\bFeminino\b/i.test(nome)                          ? "Feminino"  :
    /\b(Compartilh[aá]vel|Unissex)\b/i.test(nome)      ? "Unissex"   : "Unissex"

  const tipo: ContratipoNovo["tipo"] =
    /\bExtrait\b/i.test(nome)  ? "Extrait" :
    /\bEDT\b/i.test(nome)      ? "EDT"     :
    /\bEDC\b/i.test(nome)      ? "EDC"     : "EDP"

  // "Inspiração Olfativa: X" (Azza)
  const azzaM = nome.match(/Inspira[çc][aã]o Olfativa\s*:?\s*(.+?)(?:\s*-\s*(?:Masculino|Feminino|Unissex|Compartilh[aá]vel)|\s*$)/i)
  if (azzaM) return { referencia: azzaM[1].trim(), genero, tipo }

  // "inspirado em X" / "inspirado n[ao] X" (JA Essence, Maison Viegas, In The Box)
  const inspM = nome.match(/inspirad[ao]s?\s+(?:em\s+|n[ao]\s+)?(.+)/i)
  if (inspM) {
    const ref = inspM[1]
      .replace(/\s*[-–]\s*(Masculino|Feminino|Unissex|EDP|EDT|EDC|Extrait)\s*$/i, "")
      .replace(/\s+(Masculino|Feminino|Unissex)\s*$/i, "")
      .replace(/\s+Compartilh\S*\s*$/i, "") // "Compartilhável" (any encoding)
      .trim()
    return { referencia: ref, genero, tipo }
  }

  return { referencia: null, genero, tipo }
}

// ── Groq enriquecimento ───────────────────────────────────────────────────────

const groq   = new Groq({ apiKey: GROQ_KEY })
const gemini = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY).getGenerativeModel({ model: "gemini-2.0-flash" }) : null
let groqEsgotado = false

interface GroqResposta {
  inspiradoEm: string; marcaOriginal: string
  tipo: "EDP"|"EDT"|"EDC"|"Extrait"; genero: "Masculino"|"Feminino"|"Unissex"
  familia: string; notas: string[]
}

async function enriquecer(p: ProdutoBruto): Promise<GroqResposta> {
  // 1. Extração via regex
  const { referencia, genero, tipo } = extrairDoNome(p.nome)

  // 2. Lookup no catálogo
  if (referencia) {
    const cat = buscarNoCatalogo(referencia)
    if (cat) {
      return { inspiradoEm: cat.inspiradoEm, marcaOriginal: cat.marcaOriginal, tipo, genero, familia: cat.familia, notas: cat.notas }
    }
    // Referência extraída mas não encontrada no catálogo — tenta Groq só para split nome/marca
    try {
      return await chamarGroq(p, genero, tipo)
    } catch (e) {
      const msg = (e as Error).message
      if (msg.includes("429")) {
        groqEsgotado = true
        console.warn("  ⚠ Groq: limite atingido — tentando Gemini")
        try { if (gemini) return await chamarGemini(p, genero, tipo) } catch { /* Gemini também falhou */ }
      }
    }
    // Sem IA disponível: usa referência extraída pelo regex
    return { inspiradoEm: referencia, marcaOriginal: "Desconhecida", tipo, genero, familia: "Indefinida", notas: [] }
  }

  // 3. Sem padrão no nome — usa IA
  try {
    return await chamarGroq(p, genero, tipo)
  } catch (e) {
    const msg = (e as Error).message
    if (msg.includes("429")) {
      groqEsgotado = true
      console.warn("  ⚠ Groq: limite atingido — tentando Gemini")
      try { if (gemini) return await chamarGemini(p, genero, tipo) } catch { /* Gemini também falhou */ }
    }
  }
  return { inspiradoEm: p.nome, marcaOriginal: "Desconhecida", tipo, genero, familia: "Indefinida", notas: [] }
}

function buildPrompt(nome: string, marca: string, genero: string, tipo: string): string {
  return `Você é especialista em perfumaria.
Responda somente com JSON válido, sem markdown e sem explicações.

Nome: "${nome}"
Marca: "${marca}"

JSON esperado:
{
  "inspiradoEm": "nome do perfume original (sem a marca)",
  "marcaOriginal": "marca do original",
  "tipo": "${tipo}",
  "genero": "${genero}",
  "familia": "família olfativa em português (Amadeirado, Floral, Oriental, Cítrico, Aquático, Gourmand, Frutal, Almiscarado, etc.)",
  "notas": ["nota1","nota2","nota3"]
}`
}

function parseJsonResposta(txt: string, tipo: string, genero: string): GroqResposta {
  try {
    return JSON.parse(txt.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim()) as GroqResposta
  } catch {
    console.warn(`  ⚠ JSON inválido`)
    return { inspiradoEm: "", marcaOriginal: "Desconhecida", tipo: tipo as GroqResposta["tipo"], genero: genero as GroqResposta["genero"], familia: "Indefinida", notas: [] }
  }
}

async function chamarGroq(p: ProdutoBruto, genero: string, tipo: string): Promise<GroqResposta> {
  if (groqEsgotado && gemini) return chamarGemini(p, genero, tipo)

  const prompt = buildPrompt(p.nome, p.marca, genero, tipo)
  const r = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 200,
  })
  const txt = r.choices[0]?.message?.content?.trim() ?? "{}"
  if (txt.includes('"error"')) throw new Error("429 " + txt)
  return parseJsonResposta(txt, tipo, genero)
}

async function chamarGemini(p: ProdutoBruto, genero: string, tipo: string): Promise<GroqResposta> {
  if (!gemini) throw new Error("Gemini não configurado")
  const prompt = buildPrompt(p.nome, p.marca, genero, tipo)
  const result = await gemini.generateContent(prompt)
  const txt    = result.response.text().trim()
  return parseJsonResposta(txt, tipo, genero)
}

// ── Main ──────────────────────────────────────────────────────────────────────

const TODOS_SCRAPERS = [
  { nome: "In The Box",    fn: scrapeInTheBox    },
  { nome: "Maison Viegas", fn: scrapeMaisonViegas },
  { nome: "JA Essence",    fn: scrapeJAEssence   },
  { nome: "Azza Parfums",  fn: scrapeAzzaParfums  },
]

async function main() {
  const scrapers = MARCA_FILTER
    ? TODOS_SCRAPERS.filter(s => s.nome.toLowerCase().includes(MARCA_FILTER))
    : TODOS_SCRAPERS

  console.log("╔══════════════════════════════════════════════════════════╗")
  console.log("║       SCRAPE CONTRATIPOS — Nozze                         ║")
  console.log(`║  Sites: ${scrapers.map(s => s.nome).join(", ").padEnd(49)}║`)
  console.log("╚══════════════════════════════════════════════════════════╝")

  if (!SBEE_KEY) { console.error("✗ SCRAPINGBEE_API_KEY não configurada"); process.exit(1) }
  if (!GROQ_KEY) { console.error("✗ GROQ_API_KEY não configurada");        process.exit(1) }

  if (scrapers.length === 0) {
    console.error(`✗ Nenhum site corresponde ao filtro "--marca=${MARCA_FILTER}"`)
    console.error(`  Disponíveis: ${TODOS_SCRAPERS.map(s => s.nome).join(", ")}`)
    process.exit(1)
  }

  // 1. Coleta
  const brutos: ProdutoBruto[] = []
  for (const { fn } of scrapers) {
    brutos.push(...await fn())
  }

  console.log(`\nTotal bruto: ${brutos.length} produtos`)
  if (brutos.length === 0) { console.error("✗ Nenhum produto coletado — abortando"); process.exit(1) }

  // 2. Enriquece com Groq
  console.log("\nEnriquecendo com Groq…\n")
  const resultado: ContratipoNovo[] = []

  for (let i = 0; i < brutos.length; i++) {
    const p   = brutos[i]
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

  // 3. Salva (com suporte a --append)
  let contratiposAcumulados = resultado
  if (APPEND_MODE && fs.existsSync(SAIDA)) {
    try {
      const existente = JSON.parse(fs.readFileSync(SAIDA, "utf-8"))
      const existentes: ContratipoNovo[] = existente.contratipos ?? []
      const ids = new Set(resultado.map(p => p.id))
      contratiposAcumulados = [...existentes.filter(p => !ids.has(p.id)), ...resultado]
      console.log(`  → Modo --append: ${existentes.length} existentes + ${resultado.length} novos = ${contratiposAcumulados.length} total`)
    } catch { /* ignora arquivo corrompido */ }
  }
  const saida = {
    timestamp:   new Date().toISOString(),
    total:       contratiposAcumulados.length,
    por_marca:   Object.fromEntries(
      [...new Set(contratiposAcumulados.map(p => p.marca))].map(m => [m, contratiposAcumulados.filter(p => p.marca === m).length])
    ),
    contratipos: contratiposAcumulados,
  }
  fs.writeFileSync(SAIDA, JSON.stringify(saida, null, 2), "utf-8")

  console.log("\n" + "━".repeat(60))
  console.log("CONCLUÍDO")
  scrapers.forEach(s => console.log(`  ${s.nome}: ${saida.por_marca[s.nome]} produtos`))
  console.log(`\n  ✓ Total: ${resultado.length} contratipos`)
  console.log(`  ✓ Salvo em: ${SAIDA}`)
  console.log("  ⚠ Revise antes de fazer merge com contratipos.json")
}

main().catch(e => { console.error(`✗ Erro fatal: ${(e as Error).message}`); process.exit(1) })

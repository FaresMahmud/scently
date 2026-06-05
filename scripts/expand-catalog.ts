// ============================================
// SCRIPT: scripts/expand-catalog.ts
// O QUE FAZ: expande catálogo Nozze com 4 categorias de perfumes
//   Phase 1: novos contratipos BR (Nuancielo, Thera, Vívere, Paris Elysees, La Rive + re-scrape ITB/JA)
//   Phase 2: nacionais (Boticário, Natura, Eudora, Granado, Mahogany, Phebo)
//   Phase 3: importados designer via DeepSeek (Dior, Chanel, Givenchy…)
//   Phase 4: árabes via DeepSeek (Lattafa, Maison Alhambra…)
// COMO RODAR:
//   npm run catalog:expand               (todas as fases)
//   npm run catalog:expand -- --phase=1  (só fase 1)
// SALVA EM:  data/perfumes-expandido.json
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

import Groq from "groq-sdk"
import { GoogleGenerativeAI } from "@google/generative-ai"

const SBEE_KEY    = process.env.SCRAPINGBEE_API_KEY ?? ""
const GROQ_KEY    = process.env.GROQ_API_KEY        ?? ""
const GEMINI_KEY  = process.env.GEMINI_API_KEY      ?? ""
const DEEPSEEK_KEY= process.env.DEEPSEEK_API_KEY    ?? ""
const SAIDA       = path.join(process.cwd(), "data", "perfumes-expandido.json")

const PHASE_ARG  = process.argv.find(a => a.startsWith("--phase="))?.split("=")?.[1]
const BRANDS_ARG = process.argv.find(a => a.startsWith("--brands="))?.split("=")?.[1]
const RUN_PHASES = PHASE_ARG ? [parseInt(PHASE_ARG)] : [1, 2, 3, 4]
const BRAND_FILTER = BRANDS_ARG ? BRANDS_ARG.toLowerCase().split(",").map(s => s.trim()) : null

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface PerfumeExpandido {
  id:            string
  nome:          string
  marca:         string
  tipo:          "EDP" | "EDT" | "EDC" | "Parfum"
  genero:        "Masculino" | "Feminino" | "Unissex"
  inspiradoEm:   string | null
  marcaOriginal: string | null
  familia:       string
  notas:         string[]
  preco_brl:     number
  categoria:     "contratipo" | "arabe" | "nacional" | "importado-designer" | "nicho"
  disponivel:    true
  linkCompra:    string
}

interface ProdutoBruto {
  nome:      string
  marca:     string
  preco_brl: number
  descricao: string
  url:       string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number) { return new Promise<void>(r => setTimeout(r, ms)) }

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD")
    .replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

async function sbFetch(targetUrl: string, renderJs: boolean, wait = 2500): Promise<string> {
  const url = new URL("https://app.scrapingbee.com/api/v1/")
  url.searchParams.set("api_key",   SBEE_KEY)
  url.searchParams.set("url",       targetUrl)
  url.searchParams.set("render_js", renderJs ? "true" : "false")
  if (renderJs) url.searchParams.set("wait", String(wait))
  const r = await fetch(url.toString())
  if (!r.ok) throw new Error(`ScrapingBee HTTP ${r.status} para ${targetUrl}`)
  return r.text()
}

// ── Catalog lookup (Fragella) ─────────────────────────────────────────────────

const familiaPT: Record<string, string> = {
  "citrus":"Cítrico","citric":"Cítrico",
  "floral":"Floral","white floral":"Floral","rose":"Floral",
  "woody":"Amadeirado","wood":"Amadeirado","cedar":"Amadeirado","sandalwood":"Amadeirado",
  "oriental":"Oriental","amber":"Oriental","ambery":"Oriental","balsamic":"Oriental",
  "aquatic":"Aquático","marine":"Aquático","fresh":"Aquático","ozonic":"Aquático",
  "spicy":"Especiado","spice":"Especiado",
  "gourmand":"Gourmand","sweet":"Gourmand","vanilla":"Gourmand",
  "musky":"Almiscarado","musk":"Almiscarado","powdery":"Almiscarado",
  "green":"Verde","aromatic":"Verde","herbal":"Verde","fougere":"Verde","fougère":"Verde",
  "fruty":"Frutal","fruity":"Frutal","fruit":"Frutal",
}

interface CatalogoEntry { nome: string; marca: string; familia: string; acordesPrincipais: string[]; genero?: string }

let _catalogo: CatalogoEntry[] | null = null
function getCatalogo(): CatalogoEntry[] {
  if (_catalogo) return _catalogo
  const fp = path.join(process.cwd(), "data", "catalogo-fragella.json")
  if (fs.existsSync(fp)) {
    const raw = JSON.parse(fs.readFileSync(fp, "utf-8"))
    _catalogo = (Array.isArray(raw) ? raw : (raw.perfumes ?? [])) as CatalogoEntry[]
  } else { _catalogo = [] }
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

// ── Name extraction helpers ───────────────────────────────────────────────────

function extrairDoNome(nome: string): { referencia: string | null; genero: PerfumeExpandido["genero"]; tipo: PerfumeExpandido["tipo"] } {
  const genero: PerfumeExpandido["genero"] =
    /\bMasculino\b/i.test(nome)                         ? "Masculino" :
    /\bFeminino\b/i.test(nome)                          ? "Feminino"  :
    /\b(Compartilh[aá]vel|Unissex)\b/i.test(nome)      ? "Unissex"   : "Unissex"

  const tipo: PerfumeExpandido["tipo"] =
    /\bParfum\b/i.test(nome)   ? "Parfum" :
    /\bExtrait\b/i.test(nome)  ? "Parfum" :
    /\bEDT\b/i.test(nome)      ? "EDT"    :
    /\bEDC\b/i.test(nome)      ? "EDC"    : "EDP"

  const azzaM = nome.match(/Inspira[çc][aã]o Olfativa\s*:?\s*(.+?)(?:\s*-\s*(?:Masculino|Feminino|Unissex|Compartilh[aá]vel)|\s*$)/i)
  if (azzaM) return { referencia: azzaM[1].trim(), genero, tipo }

  const inspM = nome.match(/inspirad[ao]s?\s+(?:em\s+|n[ao]\s+)?(.+)/i)
  if (inspM) {
    const ref = inspM[1]
      .replace(/\s*[-–]\s*(Masculino|Feminino|Unissex|EDP|EDT|EDC|Parfum|Extrait)\s*$/i, "")
      .replace(/\s+(Masculino|Feminino|Unissex)\s*$/i, "")
      .replace(/\s+Compartilh\S*\s*$/i, "")
      .trim()
    return { referencia: ref, genero, tipo }
  }

  return { referencia: null, genero, tipo }
}

// ── Groq / Gemini enrichment ──────────────────────────────────────────────────

const groqClient   = GROQ_KEY    ? new Groq({ apiKey: GROQ_KEY }) : null
const geminiModel  = GEMINI_KEY  ? new GoogleGenerativeAI(GEMINI_KEY).getGenerativeModel({ model: "gemini-2.0-flash" }) : null
let groqEsgotado   = false

interface EnriquecimentoResposta {
  inspiradoEm: string | null; marcaOriginal: string | null
  tipo: PerfumeExpandido["tipo"]; genero: PerfumeExpandido["genero"]
  familia: string; notas: string[]
}

function buildPrompt(nome: string, marca: string, genero: string, tipo: string, isContratipo: boolean): string {
  return `Você é especialista em perfumaria.
Responda somente com JSON válido, sem markdown e sem explicações.

Nome: "${nome}"
Marca: "${marca}"
${isContratipo ? 'Este produto é um contratipo (versão inspirada num perfume original).' : ''}

JSON esperado:
{
  "inspiradoEm": ${isContratipo ? '"nome do perfume original (sem a marca)"' : 'null'},
  "marcaOriginal": ${isContratipo ? '"marca do original"' : 'null'},
  "tipo": "${tipo}",
  "genero": "${genero}",
  "familia": "família olfativa em português (Amadeirado, Floral, Oriental, Cítrico, Aquático, Gourmand, Frutal, Almiscarado, Especiado, Verde, etc.)",
  "notas": ["nota1","nota2","nota3"]
}`
}

function parseEnriquecimento(txt: string, tipo: string, genero: string): EnriquecimentoResposta {
  try {
    return JSON.parse(txt.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim()) as EnriquecimentoResposta
  } catch {
    return { inspiradoEm: null, marcaOriginal: null, tipo: tipo as PerfumeExpandido["tipo"], genero: genero as PerfumeExpandido["genero"], familia: "Indefinida", notas: [] }
  }
}

async function chamarGroq(nome: string, marca: string, genero: string, tipo: string, isContratipo: boolean): Promise<EnriquecimentoResposta> {
  if (!groqClient || groqEsgotado) {
    if (geminiModel) return chamarGemini(nome, marca, genero, tipo, isContratipo)
    throw new Error("Sem IA disponível")
  }
  const prompt = buildPrompt(nome, marca, genero, tipo, isContratipo)
  const r = await groqClient.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 200,
  })
  const txt = r.choices[0]?.message?.content?.trim() ?? "{}"
  if (txt.includes('"error"')) throw new Error("429 " + txt)
  return parseEnriquecimento(txt, tipo, genero)
}

async function chamarGemini(nome: string, marca: string, genero: string, tipo: string, isContratipo: boolean): Promise<EnriquecimentoResposta> {
  if (!geminiModel) throw new Error("Gemini não configurado")
  const prompt = buildPrompt(nome, marca, genero, tipo, isContratipo)
  const result = await geminiModel.generateContent(prompt)
  return parseEnriquecimento(result.response.text().trim(), tipo, genero)
}

async function enriquecerContratipo(p: ProdutoBruto): Promise<EnriquecimentoResposta> {
  const { referencia, genero, tipo } = extrairDoNome(p.nome)

  if (referencia) {
    const cat = buscarNoCatalogo(referencia)
    if (cat) return { inspiradoEm: cat.inspiradoEm, marcaOriginal: cat.marcaOriginal, tipo, genero, familia: cat.familia, notas: cat.notas }
    try { return await chamarGroq(p.nome, p.marca, genero, tipo, true) }
    catch (e) {
      if ((e as Error).message.includes("429")) {
        groqEsgotado = true
        try { if (geminiModel) return await chamarGemini(p.nome, p.marca, genero, tipo, true) } catch { /* */ }
      }
    }
    return { inspiradoEm: referencia, marcaOriginal: "Desconhecida", tipo, genero, familia: "Indefinida", notas: [] }
  }

  try { return await chamarGroq(p.nome, p.marca, genero, tipo, true) }
  catch (e) {
    if ((e as Error).message.includes("429")) {
      groqEsgotado = true
      try { if (geminiModel) return await chamarGemini(p.nome, p.marca, genero, tipo, true) } catch { /* */ }
    }
  }
  return { inspiradoEm: null, marcaOriginal: null, tipo, genero, familia: "Indefinida", notas: [] }
}

async function enriquecerNacional(p: ProdutoBruto): Promise<EnriquecimentoResposta> {
  const { genero, tipo } = extrairDoNome(p.nome)
  try { return await chamarGroq(p.nome, p.marca, genero, tipo, false) }
  catch (e) {
    if ((e as Error).message.includes("429")) {
      groqEsgotado = true
      try { if (geminiModel) return await chamarGemini(p.nome, p.marca, genero, tipo, false) } catch { /* */ }
    }
  }
  return { inspiradoEm: null, marcaOriginal: null, tipo, genero, familia: "Indefinida", notas: [] }
}

// ── Incremental save ──────────────────────────────────────────────────────────

function carregarExpandido(): PerfumeExpandido[] {
  if (!fs.existsSync(SAIDA)) return []
  try { return JSON.parse(fs.readFileSync(SAIDA, "utf-8")) as PerfumeExpandido[] }
  catch { return [] }
}

function salvarExpandido(todos: PerfumeExpandido[]) {
  fs.writeFileSync(SAIDA, JSON.stringify(todos, null, 2), "utf-8")
  console.log(`  ✓ Salvo: ${todos.length} perfumes em ${SAIDA}`)
}

function appendPhase(novos: PerfumeExpandido[]) {
  const existentes = carregarExpandido()
  const ids = new Set(existentes.map(p => p.id))
  const semDup = novos.filter(p => !ids.has(p.id))
  const merged = [...existentes, ...semDup]
  salvarExpandido(merged)
  console.log(`  → ${semDup.length} adicionados (${novos.length - semDup.length} duplicatas ignoradas), total: ${merged.length}`)
  return merged
}

// ── Generic scraper helpers ───────────────────────────────────────────────────

/** Extrai produtos de JSON-LD @type Product ou ItemList */
function extrairJsonLd(html: string): { nome: string; preco: number; url: string }[] {
  const resultados: { nome: string; preco: number; url: string }[] = []
  const scripts = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
  for (const s of scripts) {
    try {
      const data = JSON.parse(s[1])
      const items: unknown[] = data["@type"] === "ItemList"
        ? (data.itemListElement ?? []).map((e: Record<string, unknown>) => e.item ?? e)
        : data["@type"] === "Product" ? [data] : Array.isArray(data) ? data : []
      for (const item of items) {
        const i = item as Record<string, unknown>
        if (i["@type"] !== "Product") continue
        const nome  = String(i.name ?? "").trim()
        const offer = (Array.isArray(i.offers) ? i.offers[0] : i.offers) as Record<string, unknown> | undefined
        const preco = parseFloat(String(offer?.price ?? "0").replace(",", ".")) || 0
        const url   = String(offer?.url ?? i.url ?? "").trim()
        if (nome) resultados.push({ nome, preco, url })
      }
    } catch { /* */ }
  }
  return resultados
}

/** Nuvemshop pattern (data-product-id) — genérico */
function extrairNuvemshop(html: string, base: string): { nome: string; preco: number; url: string }[] {
  const resultados: { nome: string; preco: number; url: string }[] = []
  const blocos = [...html.matchAll(/data-product-id="(\d+)"([\s\S]*?)(?=data-product-id="\d+"|<\/ul>|<\/section>|$)/g)]
  for (const bloco of blocos) {
    const corpo  = bloco[2]
    // Prefer heading text over alt (alt may be a URL slug on some Nuvemshop stores)
    const nomeH  = corpo.match(/<h[23][^>]*>\s*<a[^>]*>([^<]{3,120})<\/a>/i)?.[1]?.trim()
                ?? corpo.match(/<h[23][^>]*>([^<]{3,120})<\/h[23]>/i)?.[1]?.trim()
                ?? corpo.match(/class="[^"]*product[^"]*name[^"]*"[^>]*>([^<]{3,120})</i)?.[1]?.trim()
    const nomeAlt= corpo.match(/alt="([^"_]{3,}?)(?:\s*-\s*comprar[^"]*)?"/)?.[1]?.trim()
    const nome   = nomeH ?? nomeAlt ?? ""
    if (!nome || nome.includes("_")) continue   // skip URL-slug-style alt values
    const precoM = corpo.match(/price_number&quot;:([\d.]+)/)
    const preco  = precoM ? parseFloat(precoM[1]) : 0
    const hrefM  = corpo.match(/href="(https?:\/\/[^"]+)"/)
    resultados.push({ nome, preco, url: hrefM?.[1] ?? base })
  }
  return resultados
}

/** VTEX / Shopify / generic meta og + price pattern */
function extrairGenerico(html: string, base: string): { nome: string; preco: number; url: string }[] {
  // Try meta og
  const nome  = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.[1]?.trim()
  const url   = html.match(/<meta[^>]+property="og:url"[^>]+content="([^"]+)"/i)?.[1]?.trim() ?? base
  const precoM = html.match(/["']price["']\s*:\s*["']?([\d.,]+)["']?/)
  const preco  = precoM ? parseFloat(precoM[1].replace(/\./g, "").replace(",", ".")) : 0
  if (nome && preco > 0) return [{ nome, preco, url }]
  return []
}

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 1 — Novos Contratipos BR
// ══════════════════════════════════════════════════════════════════════════════

// ── In The Box (VNDA dataLayer) ───────────────────────────────────────────────

async function scrapeInTheBox(): Promise<ProdutoBruto[]> {
  const MARCA = "In The Box"
  const BASE  = "https://intheboxperfumes.com.br"
  const produtos: ProdutoBruto[] = []
  console.log(`\n[In The Box] VNDA dataLayer scrape…`)
  for (let page = 1; page <= 20; page++) {
    let html: string
    try { html = await sbFetch(`${BASE}/perfumes?page=${page}`, false) }
    catch (e) { console.error(`  ✗ p${page}: ${(e as Error).message}`); break }
    const dlM = html.match(/dataLayer\s*=\s*(\[[\s\S]*?\]);\s*(?:<\/script>|window\.)/)
    if (!dlM) { console.log(`  p${page}: sem dataLayer — fim`); break }
    type DL = { item_name: string; price: number; item_category?: string }
    let items: DL[] = []
    try {
      const dl = JSON.parse(dlM[1]) as Array<Record<string, unknown>>
      const evt = dl.find(e => e.ecommerce && (e.ecommerce as Record<string, unknown>).items) as { ecommerce: { items: DL[] } } | undefined
      items = evt?.ecommerce?.items ?? []
    } catch { break }
    if (items.length === 0) { console.log(`  p${page}: vazia — fim`); break }
    for (const item of items) {
      const cat  = item.item_category ?? "perfumes"
      produtos.push({ nome: item.item_name, marca: MARCA, preco_brl: item.price, descricao: "", url: `${BASE}/${cat}/${slugify(item.item_name)}` })
    }
    console.log(`  p${page}: ${items.length} (total: ${produtos.length})`)
    await sleep(1500)
  }
  return produtos
}

// ── JA Essence (wBuy) ─────────────────────────────────────────────────────────

async function scrapeJAEssence(): Promise<ProdutoBruto[]> {
  const MARCA  = "JA Essence"
  const BASE   = "https://www.jaessencedelavie.com.br"
  const vistos = new Set<string>()
  const produtos: ProdutoBruto[] = []
  console.log(`\n[JA Essence] wBuy scrape…`)
  for (let page = 1; page <= 8; page++) {
    const url = page === 1 ? `${BASE}/lancamentos/` : `${BASE}/lancamentos/?pg=${page}`
    let html: string
    try { html = await sbFetch(url, true, 3000) }
    catch (e) { console.error(`  ✗ p${page}: ${(e as Error).message}`); break }
    const blocos = [...html.matchAll(/data-id="(\d+)"([\s\S]*?)(?=data-id="\d+"|<\/section>|class="mais-produtos")/g)]
    if (blocos.length === 0) { console.log(`  p${page}: sem produtos — fim`); break }
    let novos = 0
    for (const b of blocos) {
      if (vistos.has(b[1])) continue; vistos.add(b[1])
      const corpo = b[2]
      const nome  = corpo.match(/class="produto"[^>]*title="([^"]+)"/)?.[1]?.trim()
                 ?? corpo.match(/alt="([^"]+)"/)?.[1]?.trim() ?? ""
      if (!nome) continue
      const precoM = corpo.match(/valor_final[\s\S]*?<span>R\$([\d.,]+)/)
      const preco  = precoM ? parseFloat(precoM[1].replace(/\./g, "").replace(",", ".")) : 0
      const hrefM  = corpo.match(/href="([^"]+)"/)
      const prodUrl = hrefM ? (hrefM[1].startsWith("http") ? hrefM[1] : `${BASE}/${hrefM[1].replace(/^\//, "")}`) : BASE
      produtos.push({ nome, marca: MARCA, preco_brl: preco, descricao: nome, url: prodUrl })
      novos++
    }
    console.log(`  p${page}: ${novos} novos (total: ${produtos.length})`)
    if (novos === 0) break
    await sleep(2000)
  }
  return produtos
}

// ── Nuancielo (Nuvemshop) ─────────────────────────────────────────────────────

async function scrapeNuancielo(): Promise<ProdutoBruto[]> {
  const MARCA  = "Nuancielo"
  const BASE   = "https://www.nuancielo.com.br"
  const vistos = new Set<string>()
  const produtos: ProdutoBruto[] = []
  console.log(`\n[Nuancielo] Nuvemshop scrape…`)
  for (let page = 1; page <= 10; page++) {
    // No trailing slash — Nuancielo returns 404 with trailing slash
    const pageUrl = page === 1 ? `${BASE}/produtos` : `${BASE}/produtos?page=${page}`
    let html: string
    try { html = await sbFetch(pageUrl, true, 3000) }
    catch (e) { console.error(`  ✗ p${page}: ${(e as Error).message}`); break }
    const fromNuvem = extrairNuvemshop(html, BASE)
    const fromLd    = extrairJsonLd(html)
    const todos = fromNuvem.length > 0 ? fromNuvem : fromLd
    if (todos.length === 0) { console.log(`  p${page}: sem produtos — fim`); break }
    let novos = 0
    for (const p of todos) {
      const key = slugify(p.nome)
      if (vistos.has(key)) continue; vistos.add(key)
      produtos.push({ nome: p.nome, marca: MARCA, preco_brl: p.preco, descricao: p.nome, url: p.url || BASE })
      novos++
    }
    console.log(`  p${page}: ${novos} novos (total: ${produtos.length})`)
    if (novos === 0) break
    await sleep(2000)
  }
  return produtos
}

// ── Thera Cosméticos ──────────────────────────────────────────────────────────

async function scrapeThera(): Promise<ProdutoBruto[]> {
  const MARCA  = "Thera Cosméticos"
  const BASE   = "https://www.theracosmeticos.com.br"
  const PAGES  = [
    `${BASE}/perfumes`,
    `${BASE}/perfumaria`,
    `${BASE}/deo-colonia`,
  ]
  const vistos  = new Set<string>()
  const produtos: ProdutoBruto[] = []
  console.log(`\n[Thera Cosméticos] scrape…`)
  for (const pageUrl of PAGES) {
    for (let page = 1; page <= 5; page++) {
      const url = page === 1 ? pageUrl : `${pageUrl}?page=${page}`
      let html: string
      try { html = await sbFetch(url, true, 3000) }
      catch (e) { console.error(`  ✗ ${url}: ${(e as Error).message}`); break }
      const fromNuvem = extrairNuvemshop(html, BASE)
      const fromLd    = extrairJsonLd(html)
      const todos = fromNuvem.length > 0 ? fromNuvem : fromLd
      if (todos.length === 0) { break }
      let novos = 0
      for (const p of todos) {
        const key = slugify(p.nome)
        if (vistos.has(key)) continue; vistos.add(key)
        // Only keep fragrance products — filter by name keywords
        const nLow = p.nome.toLowerCase()
        if (!nLow.includes("perfum") && !nLow.includes("deo") && !nLow.includes("colônia") && !nLow.includes("colonia") && !nLow.includes("eau de") && !nLow.includes("edp") && !nLow.includes("edt") && !nLow.includes("fragr") && !nLow.includes("arôm")) continue
        produtos.push({ nome: p.nome, marca: MARCA, preco_brl: p.preco, descricao: p.nome, url: p.url || BASE })
        novos++
      }
      console.log(`  ${pageUrl} p${page}: ${novos} novos (total: ${produtos.length})`)
      if (novos === 0) break
      await sleep(2000)
    }
  }
  return produtos
}

// ── Vívere Perfumes ───────────────────────────────────────────────────────────

async function scrapeVivere(): Promise<ProdutoBruto[]> {
  const MARCA  = "Vívere Perfumes"
  const BASE   = "https://www.vivereperfumes.com.br"
  const vistos = new Set<string>()
  const produtos: ProdutoBruto[] = []
  console.log(`\n[Vívere Perfumes] scrape…`)
  for (let page = 1; page <= 10; page++) {
    const url = page === 1 ? `${BASE}/perfumes` : `${BASE}/perfumes?page=${page}`
    let html: string
    try { html = await sbFetch(url, true, 3000) }
    catch (e) { console.error(`  ✗ p${page}: ${(e as Error).message}`); break }
    const fromNuvem = extrairNuvemshop(html, BASE)
    const fromLd    = extrairJsonLd(html)
    const todos = fromNuvem.length > 0 ? fromNuvem : fromLd
    if (todos.length === 0) { console.log(`  p${page}: sem produtos — fim`); break }
    let novos = 0
    for (const p of todos) {
      const key = slugify(p.nome)
      if (vistos.has(key)) continue; vistos.add(key)
      produtos.push({ nome: p.nome, marca: MARCA, preco_brl: p.preco, descricao: p.nome, url: p.url || BASE })
      novos++
    }
    console.log(`  p${page}: ${novos} novos (total: ${produtos.length})`)
    if (novos === 0) break
    await sleep(2000)
  }
  return produtos
}

// ── Paris Elysees (Shopify) ───────────────────────────────────────────────────

async function scrapeParisElysees(): Promise<ProdutoBruto[]> {
  const MARCA  = "Paris Elysees"
  const BASE   = "https://paris-elysees.com"
  const vistos = new Set<string>()
  const produtos: ProdutoBruto[] = []
  console.log(`\n[Paris Elysees] Shopify /products.json scrape…`)

  for (let page = 1; page <= 10; page++) {
    const apiUrl = `${BASE}/products.json?limit=250&page=${page}`
    let html: string
    try { html = await sbFetch(apiUrl, false) }
    catch (e) { console.error(`  ✗ p${page}: ${(e as Error).message}`); break }

    let prods: Record<string, unknown>[] = []
    try {
      const data = JSON.parse(html)
      prods = data.products ?? []
    } catch { console.warn(`  ⚠ p${page}: JSON inválido`); break }

    if (prods.length === 0) { console.log(`  p${page}: vazia — fim`); break }

    let novos = 0
    for (const p of prods) {
      const nome  = String(p.title ?? "").trim()
      if (!nome) continue
      const key = slugify(nome)
      if (vistos.has(key)) continue; vistos.add(key)
      const variants = (p.variants as Array<{ price: string }>) ?? []
      const preco = parseFloat(variants[0]?.price ?? "0") || 0
      const url   = `${BASE}/products/${p.handle}`
      // Paris Elysees is a perfume-only brand — no keyword filter needed
      produtos.push({ nome, marca: MARCA, preco_brl: preco, descricao: nome, url })
      novos++
    }
    console.log(`  p${page}: ${novos} perfumes (total: ${produtos.length})`)
    if (prods.length < 250) { console.log(`  → última página`); break }
    await sleep(1000)
  }
  return produtos
}

// ── La Rive (WordPress/WooCommerce) ──────────────────────────────────────────

async function scrapeLaRive(): Promise<ProdutoBruto[]> {
  const MARCA  = "La Rive"
  const BASE   = "https://www.larive-parfums.com"
  const vistos = new Set<string>()
  const produtos: ProdutoBruto[] = []
  console.log(`\n[La Rive] WooCommerce scrape…`)

  // Strategy 1: WooCommerce REST API (no auth needed for public products)
  for (let page = 1; page <= 20; page++) {
    const apiUrl = `${BASE}/wp-json/wc/v3/products?per_page=100&page=${page}&status=publish`
    let html: string
    try { html = await sbFetch(apiUrl, false) }
    catch (e) { console.error(`  ✗ WC API p${page}: ${(e as Error).message}`); break }
    let prods: Record<string, unknown>[] = []
    try { prods = JSON.parse(html) } catch { break }
    if (!Array.isArray(prods) || prods.length === 0) { console.log(`  WC API p${page}: fim`); break }
    let novos = 0
    for (const p of prods) {
      const nome  = String(p.name ?? "").trim()
      if (!nome) continue
      const key = slugify(nome)
      if (vistos.has(key)) continue; vistos.add(key)
      const preco = parseFloat(String(p.price ?? p.regular_price ?? "0")) || 0
      const url   = String(p.permalink ?? `${BASE}/product/${p.slug}`)
      produtos.push({ nome, marca: MARCA, preco_brl: preco, descricao: String(p.short_description ?? nome), url })
      novos++
    }
    console.log(`  WC API p${page}: ${novos} novos (total: ${produtos.length})`)
    if (prods.length < 100) { console.log(`  → última página`); break }
    await sleep(1000)
  }

  if (produtos.length > 0) return produtos

  // Strategy 2: Scrape root page — extract /product/ links and follow them
  console.log(`  → WC API falhou, tentando scrape de links /product/…`)
  try {
    const html = await sbFetch(BASE, true, 3000)
    const links = [...html.matchAll(/href="(https?:\/\/www\.larive-parfums\.com\/product\/[^"]+)"/g)]
      .map(m => m[1]).filter(u => u.endsWith("-en/") || !u.includes("-pl/") && !u.includes("-de/") && !u.includes("-fr/"))
    const unique = [...new Set(links)]
    console.log(`  Found ${unique.length} product links on root`)
    for (const prodUrl of unique.slice(0, 100)) {
      const key = slugify(prodUrl)
      if (vistos.has(key)) continue; vistos.add(key)
      try {
        const pHtml = await sbFetch(prodUrl, false)
        const ld    = extrairJsonLd(pHtml)
        if (ld.length > 0) {
          const p = ld[0]
          if (p.nome) produtos.push({ nome: p.nome, marca: MARCA, preco_brl: p.preco, descricao: p.nome, url: prodUrl })
        } else {
          const nome = (pHtml.match(/<h1[^>]*class="[^"]*product[^"]*"[^>]*>([^<]+)/i) ?? pHtml.match(/<h1[^>]*>([^<]{3,60})<\/h1>/i))?.[1]?.trim()
          if (nome) produtos.push({ nome, marca: MARCA, preco_brl: 0, descricao: nome, url: prodUrl })
        }
        await sleep(500)
      } catch { /* */ }
    }
    console.log(`  Total via link scrape: ${produtos.length}`)
  } catch (e) { console.error(`  ✗ Root scrape: ${(e as Error).message}`) }

  return produtos
}

// ── Phase 1 orchestrator ──────────────────────────────────────────────────────

async function runPhase1(): Promise<PerfumeExpandido[]> {
  console.log("\n" + "═".repeat(60))
  console.log("FASE 1 — Novos Contratipos BR")
  console.log("═".repeat(60))

  const ALL_SCRAPERS = [
    { fn: scrapeInTheBox,    marca: "In The Box"       },
    { fn: scrapeJAEssence,   marca: "JA Essence"       },
    { fn: scrapeNuancielo,   marca: "Nuancielo"        },
    { fn: scrapeThera,       marca: "Thera Cosméticos" },
    { fn: scrapeVivere,      marca: "Vívere Perfumes"  },
    { fn: scrapeParisElysees,marca: "Paris Elysees"    },
    { fn: scrapeLaRive,      marca: "La Rive"          },
  ]
  const SCRAPERS = BRAND_FILTER
    ? ALL_SCRAPERS.filter(s => BRAND_FILTER.some(f => s.marca.toLowerCase().includes(f)))
    : ALL_SCRAPERS

  const brutos: ProdutoBruto[] = []
  for (const { fn } of SCRAPERS) {
    try { brutos.push(...await fn()) }
    catch (e) { console.error(`  ✗ Scraper falhou: ${(e as Error).message}`) }
  }

  console.log(`\nTotal bruto: ${brutos.length} produtos`)
  if (brutos.length === 0) { console.warn("  ⚠ Nenhum produto — fase 1 vazia"); return [] }

  console.log("\nEnriquecendo contratipos…")
  const resultado: PerfumeExpandido[] = []

  for (let i = 0; i < brutos.length; i++) {
    const p   = brutos[i]
    const pfx = `[${String(i+1).padStart(String(brutos.length).length)}/${brutos.length}]`
    try {
      const info = await enriquecerContratipo(p)
      resultado.push({
        id:            `${slugify(p.marca)}-${slugify(p.nome)}`,
        nome:          p.nome,
        marca:         p.marca,
        tipo:          info.tipo          ?? "EDP",
        genero:        info.genero        ?? "Unissex",
        inspiradoEm:   info.inspiradoEm   ?? null,
        marcaOriginal: info.marcaOriginal ?? null,
        familia:       info.familia       ?? "Indefinida",
        notas:         Array.isArray(info.notas) ? info.notas : [],
        preco_brl:     p.preco_brl,
        categoria:     "contratipo",
        disponivel:    true,
        linkCompra:    p.url,
      })
      console.log(`${pfx} "${p.nome}" → ${info.inspiradoEm ?? "—"} (${info.marcaOriginal ?? "—"})`)
    } catch (e) {
      console.error(`${pfx} ✗ "${p.nome}": ${(e as Error).message}`)
    }
    if (i < brutos.length - 1) await sleep(300)
  }

  return resultado
}

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 2 — Nacionais
// ══════════════════════════════════════════════════════════════════════════════

// ── Generic national scraper ──────────────────────────────────────────────────

interface NationalSite {
  marca:    string
  base:     string
  urls:     string[]
  renderJs: boolean
  maxPages: number
}

const NATIONAL_SITES: NationalSite[] = [
  {
    marca:    "O Boticário",
    base:     "https://www.boticario.com.br",
    urls:     ["https://www.boticario.com.br/perfumes"],
    renderJs: true,
    maxPages: 8,
  },
  {
    marca:    "Natura",
    base:     "https://www.natura.com.br",
    urls:     ["https://www.natura.com.br/perfumes"],
    renderJs: true,
    maxPages: 8,
  },
  {
    marca:    "Eudora",
    base:     "https://www.eudora.com.br",
    urls:     ["https://www.eudora.com.br/perfumes", "https://www.eudora.com.br/fragrancias"],
    renderJs: true,
    maxPages: 5,
  },
  {
    marca:    "Granado",
    base:     "https://www.granado.com.br",
    urls:     ["https://www.granado.com.br/aromas", "https://www.granado.com.br/perfumaria"],
    renderJs: true,
    maxPages: 5,
  },
  {
    marca:    "Mahogany",
    base:     "https://www.mahogany.com.br",
    urls:     ["https://www.mahogany.com.br/perfumes"],
    renderJs: true,
    maxPages: 5,
  },
  {
    marca:    "Phebo",
    base:     "https://www.phebo.com.br",
    urls:     ["https://www.phebo.com.br/perfumes", "https://www.phebo.com.br/fragrâncias", "https://www.phebo.com.br"],
    renderJs: true,
    maxPages: 5,
  },
]

async function scrapeNacional(site: NationalSite): Promise<ProdutoBruto[]> {
  const vistos  = new Set<string>()
  const produtos: ProdutoBruto[] = []
  console.log(`\n[${site.marca}] scrape…`)

  for (const catUrl of site.urls) {
    for (let page = 1; page <= site.maxPages; page++) {
      // VTEX uses "?page=N&O=OrderByTopSaleDesc" pattern
      const pageParam = catUrl.includes("?") ? `&page=${page}` : `?page=${page}`
      const url = page === 1 ? catUrl : `${catUrl}${pageParam}`
      let html: string
      try { html = await sbFetch(url, site.renderJs, 4000) }
      catch (e) { console.error(`  ✗ ${url}: ${(e as Error).message}`); break }

      const fromLd    = extrairJsonLd(html)
      const fromNuvem = extrairNuvemshop(html, site.base)

      // VTEX pattern — products in __STATE__ or window.__PRELOADED_STATE__
      let fromVtex: { nome: string; preco: number; url: string }[] = []
      try {
        const stateM = html.match(/__STATE__\s*=\s*(\{[\s\S]{100,200000}\})/)
          ?? html.match(/window\.__PRELOADED_STATE__\s*=\s*(\{[\s\S]{100,200000}\})/)
        if (stateM) {
          const state = JSON.parse(stateM[1])
          // VTEX stores products under keys like "Product:sp-xxx"
          for (const [key, val] of Object.entries(state)) {
            if (!key.startsWith("Product:") && !key.startsWith("product:")) continue
            const v = val as Record<string, unknown>
            const nome = String(v.productName ?? v.name ?? "").trim()
            if (!nome) continue
            const slug = String(v.linkText ?? v.link ?? slugify(nome))
            const url  = slug.startsWith("http") ? slug : `${site.base}/${slug}/p`
            // Price lives in sibling keys like "Offer:xxx"
            fromVtex.push({ nome, preco: 0, url })
          }
        }
      } catch { /* */ }

      // VTEX / Next.js hydration JSON (__NEXT_DATA__)
      let fromNext: { nome: string; preco: number; url: string }[] = []
      try {
        const nextM = html.match(/<script[^>]+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
        if (nextM) {
          const data = JSON.parse(nextM[1])
          const pageProps = data?.props?.pageProps
          const rawProducts: unknown[] =
            pageProps?.products ??
            pageProps?.data?.products ??
            pageProps?.initialState?.products ??
            pageProps?.catalog?.products ??
            []
          for (const p of rawProducts) {
            const prod = p as Record<string, unknown>
            const nome = String(prod.name ?? prod.productName ?? prod.title ?? "").trim()
            if (!nome) continue
            const priceRange = prod.priceRange as Record<string, Record<string, number>> | undefined
            const preco = parseFloat(String(prod.price ?? priceRange?.sellingPrice?.highEnd ?? 0))
            const url   = String(prod.link ?? prod.url ?? site.base)
            fromNext.push({ nome, preco, url })
          }
        }
      } catch { /* */ }

      const todos = fromLd.length > 0 ? fromLd
        : fromNext.length > 0 ? fromNext
        : fromVtex.length > 0 ? fromVtex
        : fromNuvem

      if (todos.length === 0) { console.log(`  p${page}: sem estrutura detectada — fim`); break }

      let novos = 0
      for (const p of todos) {
        if (!p.nome) continue
        const key = slugify(p.nome)
        if (vistos.has(key)) continue; vistos.add(key)
        const nLow = p.nome.toLowerCase()
        // Filter only fragrance products for nacional sites
        if (!nLow.includes("perfum") && !nLow.includes("deo") && !nLow.includes("colônia") && !nLow.includes("colonia") && !nLow.includes("eau de") && !nLow.includes("edp") && !nLow.includes("edt") && !nLow.includes("fragr") && !nLow.includes("arôm") && !nLow.includes("essência") && !nLow.includes("essencia")) continue
        produtos.push({ nome: p.nome, marca: site.marca, preco_brl: p.preco, descricao: p.nome, url: p.url || site.base })
        novos++
      }
      console.log(`  p${page}: ${novos} novos (total: ${produtos.length})`)
      if (novos === 0 && page > 1) break
      await sleep(2500)
    }
    if (produtos.length > 0) break // stop at first successful URL for this brand
  }

  return produtos
}

async function runPhase2(): Promise<PerfumeExpandido[]> {
  console.log("\n" + "═".repeat(60))
  console.log("FASE 2 — Nacionais")
  console.log("═".repeat(60))

  const brutos: ProdutoBruto[] = []
  for (const site of NATIONAL_SITES) {
    try { brutos.push(...await scrapeNacional(site)) }
    catch (e) { console.error(`  ✗ ${site.marca} falhou: ${(e as Error).message}`) }
  }

  console.log(`\nTotal bruto: ${brutos.length} produtos nacionais`)
  if (brutos.length === 0) { console.warn("  ⚠ Nenhum produto — fase 2 vazia"); return [] }

  console.log("\nEnriquecendo nacionais…")
  const resultado: PerfumeExpandido[] = []

  for (let i = 0; i < brutos.length; i++) {
    const p   = brutos[i]
    const pfx = `[${String(i+1).padStart(String(brutos.length).length)}/${brutos.length}]`
    try {
      const info = await enriquecerNacional(p)
      resultado.push({
        id:            `${slugify(p.marca)}-${slugify(p.nome)}`,
        nome:          p.nome,
        marca:         p.marca,
        tipo:          info.tipo   ?? "EDP",
        genero:        info.genero ?? "Unissex",
        inspiradoEm:   null,
        marcaOriginal: null,
        familia:       info.familia ?? "Indefinida",
        notas:         Array.isArray(info.notas) ? info.notas : [],
        preco_brl:     p.preco_brl,
        categoria:     "nacional",
        disponivel:    true,
        linkCompra:    p.url,
      })
      console.log(`${pfx} "${p.nome}" (${p.marca}) — ${info.familia}`)
    } catch (e) {
      console.error(`${pfx} ✗ "${p.nome}": ${(e as Error).message}`)
    }
    if (i < brutos.length - 1) await sleep(300)
  }

  return resultado
}

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 3 — Importados Designer (DeepSeek generation)
// ══════════════════════════════════════════════════════════════════════════════

interface BrandConfig {
  nome:      string
  preco_brl: number
  count:     number
}

const DESIGNER_BRANDS: BrandConfig[] = [
  { nome: "Dior",               preco_brl: 800,  count: 10 },
  { nome: "Chanel",             preco_brl: 800,  count: 10 },
  { nome: "Givenchy",           preco_brl: 650,  count: 10 },
  { nome: "Prada",              preco_brl: 650,  count: 10 },
  { nome: "Valentino",          preco_brl: 650,  count: 10 },
  { nome: "Montblanc",          preco_brl: 320,  count: 10 },
  { nome: "Mugler",             preco_brl: 450,  count: 10 },
  { nome: "Issey Miyake",       preco_brl: 450,  count: 10 },
  { nome: "Narciso Rodriguez",  preco_brl: 450,  count: 10 },
  { nome: "Bvlgari",            preco_brl: 450,  count: 10 },
  { nome: "Coach",              preco_brl: 320,  count: 10 },
  { nome: "Ferragamo",          preco_brl: 320,  count: 10 },
  { nome: "Jimmy Choo",         preco_brl: 320,  count: 10 },
]

const ARABIC_BRANDS: BrandConfig[] = [
  { nome: "Lattafa",            preco_brl: 180,  count: 8 },
  { nome: "Maison Alhambra",    preco_brl: 180,  count: 8 },
  { nome: "Afnan",              preco_brl: 180,  count: 8 },
  { nome: "Armaf",              preco_brl: 180,  count: 8 },
  { nome: "Rasasi",             preco_brl: 220,  count: 8 },
  { nome: "Ajmal",              preco_brl: 220,  count: 8 },
  { nome: "Swiss Arabian",      preco_brl: 220,  count: 8 },
  { nome: "Al Haramain",        preco_brl: 220,  count: 8 },
  { nome: "Fragrance World",    preco_brl: 150,  count: 8 },
  { nome: "Paris Corner",       preco_brl: 150,  count: 8 },
  { nome: "Zimaya",             preco_brl: 150,  count: 8 },
  { nome: "Orientica",          preco_brl: 150,  count: 8 },
]

interface DeepSeekPerfume {
  nome:          string
  tipo:          string
  genero:        string
  familia:       string
  notas:         string[]
  inspiradoEm?:  string | null
}

async function deepseekGenerateBrand(
  brand: BrandConfig,
  categoria: "importado-designer" | "arabe",
): Promise<DeepSeekPerfume[]> {
  const isArabe = categoria === "arabe"
  const prompt = isArabe
    ? `Você é especialista em perfumaria árabe.
Liste os ${brand.count} perfumes mais famosos e populares da marca "${brand.nome}".
Para cada perfume, inclua:
- "nome": nome exato do perfume (sem a marca)
- "tipo": "EDP", "EDT", "EDC" ou "Parfum"
- "genero": "Masculino", "Feminino" ou "Unissex"
- "familia": família olfativa em português (Amadeirado, Floral, Oriental, Cítrico, Aquático, Gourmand, Frutal, Almiscarado, Especiado, etc.)
- "notas": array com 3-5 notas olfativas principais em português
- "inspiradoEm": nome do perfume ocidental que este árabe é inspirado/similar (ex: "Bleu de Chanel"), ou null se for original

Responda SOMENTE com um array JSON válido. Sem texto extra. Sem markdown.`
    : `Você é especialista em perfumaria de luxo.
Liste os ${brand.count} perfumes mais populares e vendidos da marca "${brand.nome}" no Brasil.
Para cada perfume, inclua:
- "nome": nome exato do perfume (sem a marca)
- "tipo": "EDP", "EDT", "EDC" ou "Parfum"
- "genero": "Masculino", "Feminino" ou "Unissex"
- "familia": família olfativa em português (Amadeirado, Floral, Oriental, Cítrico, Aquático, Gourmand, Frutal, Almiscarado, Especiado, etc.)
- "notas": array com 3-5 notas olfativas principais em português

Responda SOMENTE com um array JSON válido. Sem texto extra. Sem markdown.`

  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${DEEPSEEK_KEY}`,
    },
    body: JSON.stringify({
      model:           "deepseek-chat",
      messages:        [{ role: "user", content: prompt }],
      temperature:     0.3,
      max_tokens:      2000,
      response_format: { type: "json_object" },
    }),
  })

  if (!res.ok) throw new Error(`DeepSeek HTTP ${res.status}`)
  const data  = await res.json() as { choices: Array<{ message: { content: string } }> }
  const txt   = data.choices[0]?.message?.content?.trim() ?? "[]"

  // DeepSeek with json_object returns {"perfumes": [...]} or {"items": [...]} or plain array
  try {
    const parsed = JSON.parse(txt)
    if (Array.isArray(parsed)) return parsed as DeepSeekPerfume[]
    // Find the first array value in the object
    for (const v of Object.values(parsed)) {
      if (Array.isArray(v)) return v as DeepSeekPerfume[]
    }
  } catch { /* */ }
  console.warn(`  ⚠ Resposta não parseável para ${brand.nome}: ${txt.slice(0, 100)}`)
  return []
}

function makeDeepSeekEntry(
  p:          DeepSeekPerfume,
  brand:      BrandConfig,
  categoria:  "importado-designer" | "arabe",
  linkCompra: string,
): PerfumeExpandido {
  const nome   = String(p.nome ?? "").trim()
  const tipo   = (["EDP","EDT","EDC","Parfum"].includes(p.tipo) ? p.tipo : "EDP") as PerfumeExpandido["tipo"]
  const genero = (["Masculino","Feminino","Unissex"].includes(p.genero) ? p.genero : "Unissex") as PerfumeExpandido["genero"]
  return {
    id:            `${slugify(brand.nome)}-${slugify(nome)}`,
    nome,
    marca:         brand.nome,
    tipo,
    genero,
    inspiradoEm:   p.inspiradoEm ?? null,
    marcaOriginal: null,
    familia:       p.familia ?? "Indefinida",
    notas:         Array.isArray(p.notas) ? p.notas : [],
    preco_brl:     brand.preco_brl,
    categoria,
    disponivel:    true,
    linkCompra,
  }
}

// Nacional brands that couldn't be scraped — generate via DeepSeek
const NACIONAL_BRANDS_DEEPSEEK = [
  { nome: "O Boticário",  preco_brl: 120, count: 12, site: "https://www.boticario.com.br" },
  { nome: "Natura",       preco_brl: 100, count: 12, site: "https://www.natura.com.br"    },
  { nome: "Eudora",       preco_brl: 90,  count: 10, site: "https://www.eudora.com.br"    },
  { nome: "Granado",      preco_brl: 80,  count: 8,  site: "https://www.granado.com.br"   },
  { nome: "Phebo",        preco_brl: 95,  count: 8,  site: "https://www.phebo.com.br"     },
]

async function deepseekGenerateNacional(
  brand: { nome: string; preco_brl: number; count: number; site: string }
): Promise<(DeepSeekPerfume & { preco_sugerido?: number })[]> {
  const prompt = `Você é especialista em perfumaria brasileira.
Liste os ${brand.count} perfumes mais populares e vendidos da marca brasileira "${brand.nome}".
Para cada perfume, inclua:
- "nome": nome exato do perfume (sem a marca)
- "tipo": "EDP", "EDT", "EDC" ou "Parfum"
- "genero": "Masculino", "Feminino" ou "Unissex"
- "familia": família olfativa em português (Amadeirado, Floral, Oriental, Cítrico, Aquático, Gourmand, Frutal, Almiscarado, Especiado, Verde, etc.)
- "notas": array com 3-5 notas olfativas principais em português
- "preco_sugerido": preço aproximado em reais (número inteiro)

Responda SOMENTE com um array JSON válido. Sem texto extra. Sem markdown.`

  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${DEEPSEEK_KEY}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    }),
  })
  if (!res.ok) throw new Error(`DeepSeek HTTP ${res.status}`)
  const data = await res.json() as { choices: Array<{ message: { content: string } }> }
  const txt  = data.choices[0]?.message?.content?.trim() ?? "[]"
  try {
    const parsed = JSON.parse(txt)
    if (Array.isArray(parsed)) return parsed
    for (const v of Object.values(parsed)) { if (Array.isArray(v)) return v as (DeepSeekPerfume & { preco_sugerido?: number })[] }
  } catch { /* */ }
  return []
}

async function runPhase3(): Promise<PerfumeExpandido[]> {
  console.log("\n" + "═".repeat(60))
  console.log("FASE 3 — Nacionais (DeepSeek) + Importados Designer (DeepSeek)")
  console.log("═".repeat(60))

  if (!DEEPSEEK_KEY) { console.error("✗ DEEPSEEK_API_KEY não configurada — pulando fase 3"); return [] }

  const resultado: PerfumeExpandido[] = []

  // ── 3a: Nacionais via DeepSeek ────────────────────────────────────────────
  console.log("\n── 3a: Nacionais via DeepSeek ──")
  for (const brand of NACIONAL_BRANDS_DEEPSEEK) {
    console.log(`\n[${brand.nome}] Gerando ${brand.count} perfumes nacionais…`)
    try {
      const perfumes = await deepseekGenerateNacional(brand)
      for (const p of perfumes) {
        const nome = String(p.nome ?? "").trim()
        if (!nome) continue
        const tipo   = (["EDP","EDT","EDC","Parfum"].includes(p.tipo) ? p.tipo : "EDP") as PerfumeExpandido["tipo"]
        const genero = (["Masculino","Feminino","Unissex"].includes(p.genero) ? p.genero : "Unissex") as PerfumeExpandido["genero"]
        const preco  = (p as unknown as { preco_sugerido?: number }).preco_sugerido ?? brand.preco_brl
        resultado.push({
          id:            `${slugify(brand.nome)}-${slugify(nome)}`,
          nome,
          marca:         brand.nome,
          tipo,
          genero,
          inspiradoEm:   null,
          marcaOriginal: null,
          familia:       p.familia ?? "Indefinida",
          notas:         Array.isArray(p.notas) ? p.notas : [],
          preco_brl:     preco,
          categoria:     "nacional",
          disponivel:    true,
          linkCompra:    brand.site,
        })
        console.log(`  + ${nome} (${tipo}, ${genero}) R$${preco}`)
      }
    } catch (e) {
      console.error(`  ✗ ${brand.nome}: ${(e as Error).message}`)
    }
    await sleep(1000)
  }

  console.log(`\n  → ${resultado.length} nacionais gerados`)

  // ── 3b: Designer Importados ───────────────────────────────────────────────
  console.log("\n── 3b: Importados Designer ──")
  for (const brand of DESIGNER_BRANDS) {
    console.log(`\n[${brand.nome}] Gerando ${brand.count} perfumes…`)
    try {
      const perfumes = await deepseekGenerateBrand(brand, "importado-designer")
      for (const p of perfumes) {
        const nome  = String(p.nome ?? "").trim()
        if (!nome) continue
        const link = `https://www.sephora.com.br/busca?q=${encodeURIComponent(nome + " " + brand.nome)}`
        resultado.push(makeDeepSeekEntry(p, brand, "importado-designer", link))
        console.log(`  + ${nome} (${p.tipo}, ${p.genero})`)
      }
    } catch (e) {
      console.error(`  ✗ ${brand.nome}: ${(e as Error).message}`)
    }
    await sleep(1000)
  }

  console.log(`\nFase 3: ${resultado.length} perfumes gerados (nacionais + designer)`)
  return resultado
}

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 4 — Árabes (DeepSeek generation)
// ══════════════════════════════════════════════════════════════════════════════

async function runPhase4(): Promise<PerfumeExpandido[]> {
  console.log("\n" + "═".repeat(60))
  console.log("FASE 4 — Árabes (DeepSeek)")
  console.log("═".repeat(60))

  if (!DEEPSEEK_KEY) { console.error("✗ DEEPSEEK_API_KEY não configurada — pulando fase 4"); return [] }

  const resultado: PerfumeExpandido[] = []

  for (const brand of ARABIC_BRANDS) {
    console.log(`\n[${brand.nome}] Gerando ${brand.count} perfumes…`)
    try {
      const perfumes = await deepseekGenerateBrand(brand, "arabe")
      for (const p of perfumes) {
        const nome = String(p.nome ?? "").trim()
        if (!nome) continue
        const link = `https://casadosperfumesimportados.com.br/?s=${encodeURIComponent(nome)}`
        resultado.push(makeDeepSeekEntry(p, brand, "arabe", link))
        console.log(`  + ${nome} → inspirado em: ${p.inspiradoEm ?? "—"}`)
      }
    } catch (e) {
      console.error(`  ✗ ${brand.nome}: ${(e as Error).message}`)
    }
    await sleep(1000)
  }

  console.log(`\nFase 4: ${resultado.length} perfumes árabes gerados`)
  return resultado
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗")
  console.log("║     EXPAND CATALOG — Nozze                               ║")
  console.log(`║  Fases: ${RUN_PHASES.join(", ").padEnd(49)}║`)
  console.log("╚══════════════════════════════════════════════════════════╝")

  if (!SBEE_KEY && (RUN_PHASES.includes(1) || RUN_PHASES.includes(2))) {
    console.error("✗ SCRAPINGBEE_API_KEY não configurada"); process.exit(1)
  }

  if (RUN_PHASES.includes(1)) {
    const phase1 = await runPhase1()
    appendPhase(phase1)
    console.log("\n✓ Fase 1 concluída e salva.")
  }

  if (RUN_PHASES.includes(2)) {
    const phase2 = await runPhase2()
    appendPhase(phase2)
    console.log("\n✓ Fase 2 concluída e salva.")
  }

  if (RUN_PHASES.includes(3)) {
    const phase3 = await runPhase3()
    appendPhase(phase3)
    console.log("\n✓ Fase 3 concluída e salva.")
  }

  if (RUN_PHASES.includes(4)) {
    const phase4 = await runPhase4()
    appendPhase(phase4)
    console.log("\n✓ Fase 4 concluída e salva.")
  }

  // Final summary
  const final = carregarExpandido()
  const byCat  = final.reduce<Record<string, number>>((acc, p) => {
    acc[p.categoria] = (acc[p.categoria] ?? 0) + 1; return acc
  }, {})
  const byMarca = final.reduce<Record<string, number>>((acc, p) => {
    acc[p.marca] = (acc[p.marca] ?? 0) + 1; return acc
  }, {})

  console.log("\n" + "═".repeat(60))
  console.log("EXPAND CATALOG — RESUMO FINAL")
  console.log("═".repeat(60))
  console.log(`  Total: ${final.length} perfumes`)
  for (const [cat, n] of Object.entries(byCat)) console.log(`    ${cat}: ${n}`)
  console.log("\n  Por marca:")
  for (const [marca, n] of Object.entries(byMarca).sort((a,b) => b[1]-a[1])) console.log(`    ${marca}: ${n}`)
  console.log("═".repeat(60))
}

main().catch(e => { console.error(`✗ Erro fatal: ${(e as Error).message}`); process.exit(1) })

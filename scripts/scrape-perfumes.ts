// ============================================
// SCRIPT: scripts/scrape-perfumes.ts
// O QUE FAZ: scrapa In The Box e Maison Viegas, extrai dados de perfumes
// COMO RODAR: npm run scrape
// SAÍDA: scripts/output/perfumes-verificados.json
// ============================================

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs") as typeof import("fs")
const path = require("path") as typeof import("path")

interface PerfumeExtraido {
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

// ── Helpers ──────────────────────────────────────────────────────────────────

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&agrave;/g, "à").replace(/&aacute;/g, "á").replace(/&acirc;/g, "â").replace(/&atilde;/g, "ã")
    .replace(/&eacute;/g, "é").replace(/&ecirc;/g, "ê")
    .replace(/&iacute;/g, "í")
    .replace(/&oacute;/g, "ó").replace(/&ocirc;/g, "ô").replace(/&otilde;/g, "õ")
    .replace(/&uacute;/g, "ú").replace(/&ucirc;/g, "û")
    .replace(/&ccedil;/g, "ç")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/<[^>]+>/g, "")
    .trim()
}

function delay(ms: number): Promise<void> {
  return new Promise(res => setTimeout(res, ms))
}

async function fetchHtml(url: string, tentativas = 3): Promise<string> {
  for (let i = 0; i < tentativas; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,*/*;q=0.9",
          "Accept-Language": "pt-BR,pt;q=0.9",
        },
        signal: AbortSignal.timeout(20000),
      } as RequestInit)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.text() || ""
    } catch (e) {
      const msg = (e as Error).message
      if (msg.includes("404") || msg.includes("410")) return ""
      console.warn(`  ↩ tentativa ${i + 1} (${msg})`)
      if (i < tentativas - 1) await delay(2000 * (i + 1))
    }
  }
  return ""
}

function inferirFamilia(notas: string, nome: string): string {
  const t = (notas + " " + nome).toLowerCase()
  if (t.includes("oud") || t.includes("ud ")) return "Oriental Amadeirado"
  if (t.includes("tabaco") || t.includes("tobacco") || t.includes("tonka")) return "Oriental Especiado"
  if (t.includes("baunilha") || t.includes("pralinê") || t.includes("caramelo") || t.includes("cacau")) return "Oriental Gourmand"
  if (t.includes("café") || t.includes("coffee")) return "Gourmand"
  if (t.includes("couro") || t.includes("leather")) return "Couro"
  if (t.includes("sândalo") || t.includes("sandalo") || t.includes("cedro") || t.includes("vetiver")) return "Amadeirado"
  if (t.includes("calone") || t.includes("aquático") || t.includes("algas") || t.includes("marinho")) return "Aquático"
  if (t.includes("bergamota") || t.includes("toranja") || t.includes("limão") || t.includes("cítrico")) return "Cítrico Aromático"
  if (t.includes("abacaxi") || t.includes("framboesa") || t.includes("pêssego") || t.includes("lichia")) return "Frutal"
  if (t.includes("lavanda") || t.includes("fougère")) return "Aromático Fougère"
  if (t.includes("rosa") || t.includes("jasmim") || t.includes("floral")) return "Floral"
  return "Floral Amadeirado"
}

// ── IN THE BOX ────────────────────────────────────────────────────────────────
// Plataforma custom — produto em /produto/slug, preço em JSON embedded

function parsarNotasTexto(texto: string, label: RegExp): string[] {
  const m = texto.match(label)
  if (!m) return []
  // captura até o próximo "Notas de" ou fim
  const inicio = m.index! + m[0].length
  const resto = texto.slice(inicio, inicio + 300)
  const fim = resto.search(/Notas de|Família|Fixação|Projeção|Atenção/i)
  const bloco = fim > -1 ? resto.slice(0, fim) : resto
  return bloco.split(/,|;|\n/).map(s => s.replace(/<[^>]+>/g, "").trim()).filter(s => s.length > 1 && s.length < 60)
}

function parseProdutoITB(html: string, url: string): PerfumeExtraido | null {
  if (!html || html.length < 500) return null

  // Nome
  const nomeM = html.match(/<h1[^>]*>([\s\S]{1,200}?)<\/h1>/i)
  let nome = nomeM ? decodeHtmlEntities(nomeM[1]) : ""
  // Remove sufixo " - 100ml" etc
  nome = nome.replace(/\s*[-–]\s*\d+ml.*$/i, "").trim()
  if (!nome) return null

  // Preço — embedded JSON: "sale_price":189.9 ou "price":199.9
  let preco = 0
  const salePriceM = html.match(/"sale_price":([\d.]+)/)
  const priceM = html.match(/"price":([\d.]+)/)
  if (salePriceM) preco = parseFloat(salePriceM[1])
  else if (priceM) preco = parseFloat(priceM[1])

  // Notas — plain text no HTML: "Notas de Saída: X, Y\nNotas de Corpo: A, B\nNotas de Fundo: C, D"
  const textoVisivel = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "")
  const notasTopo = parsarNotasTexto(textoVisivel, /Notas de Sa[íi]da\s*:\s*/i)
  const notasCoracao = parsarNotasTexto(textoVisivel, /Notas de Corpo\s*:\s*/i)
  const notasFundo = parsarNotasTexto(textoVisivel, /Notas de Fundo\s*:\s*/i)

  // Família
  let familia = ""
  const famM = textoVisivel.match(/Família\s*Olfativa\s*:\s*([^\n<]{3,60})/i)
  if (famM) familia = famM[1].trim()
  else familia = inferirFamilia([...notasTopo, ...notasCoracao, ...notasFundo].join(", "), nome)

  // Gênero pela URL e título
  const t = (url + " " + nome).toLowerCase()
  let genero = "Unissex"
  if (t.includes("feminino") || t.includes("women")) genero = "Feminino"
  else if (t.includes("masculino") || t.includes(" men")) genero = "Masculino"

  return { nome, marca: "In The Box", familia, notasTopo, notasCoracao, notasFundo, genero, preco, urlOrigem: url }
}

async function scrapeInTheBox(): Promise<PerfumeExtraido[]> {
  const BASE = "https://www.intheboxperfumes.com.br"
  const listingUrl = `${BASE}/perfumes`
  console.log(`\n📦 In The Box — ${listingUrl}`)

  // Coleta todos os slugs de todas as páginas do listing
  const produtoSlugs = new Set<string>()
  for (let page = 1; page <= 10; page++) {
    const url = page === 1 ? listingUrl : `${listingUrl}/page/${page}`
    const html = await fetchHtml(url)
    if (!html) break
    const matches = Array.from(html.matchAll(/href="(\/produto\/[^"]+)"/g))
    if (!matches.length) break
    matches.forEach(m => produtoSlugs.add(m[1]))
    if (matches.length < 5) break // provavelmente última página
    await delay(800)
  }
  console.log(`  → ${produtoSlugs.size} URLs encontradas`)

  const resultados: PerfumeExtraido[] = []
  for (const slug of produtoSlugs) {
    const url = `${BASE}${slug}`
    await delay(600)
    const slugName = slug.split("/").pop() ?? slug
    process.stdout.write(`  · ${slugName.slice(0, 45)}...`)
    const html = await fetchHtml(url)
    if (!html) { process.stdout.write(" ✗\n"); continue }
    const p = parseProdutoITB(html, url)
    if (p) { resultados.push(p); process.stdout.write(` ✓ "${p.nome}" R$${p.preco}\n`) }
    else process.stdout.write(" – (sem dados)\n")
  }
  return resultados
}

// ── MAISON VIEGAS ────────────────────────────────────────────────────────────
// NuvemShop — produto em /produtos/slug, notas em texto HTML, família explícita

function parseProdutoMV(html: string, url: string, generoDefault: string): PerfumeExtraido | null {
  if (!html || html.length < 500) return null

  // Nome do <h1>
  const nomeM = html.match(/<h1[^>]*>([\s\S]{1,200}?)<\/h1>/i)
  let nome = nomeM ? decodeHtmlEntities(nomeM[1]) : ""
  // Remove " - Inspirado em X" e variações
  nome = nome.replace(/\s*[-–]\s*[Ii]nspirado em[\s\S]*$/i, "").trim()
  nome = nome.replace(/\s*[-–]\s*[Ii]nspired by[\s\S]*$/i, "").trim()
  if (!nome || nome.length < 2) return null

  // Preço via R$
  let preco = 0
  const precoM = html.match(/R\$\s*(?:&nbsp;)?\s*([\d]+[,.][\d]{2})/)
  if (precoM) preco = parseFloat(precoM[1].replace(",", "."))

  // Conteúdo de texto (decodificado)
  const textoLimpo = decodeHtmlEntities(
    html.replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
  )

  // Notas
  const notasTopo = parsarNotasTexto(textoLimpo, /Notas de Topo\s*:\s*/i)
  const notasCoracao = parsarNotasTexto(textoLimpo, /Notas de Cora[çc][aã]o\s*:\s*/i)
  const notasFundo = parsarNotasTexto(textoLimpo, /Notas de Fundo\s*:\s*/i)

  // Família
  let familia = ""
  const famM = textoLimpo.match(/Fam[íi]lia\s*Olfativa\s*:\s*([^\n]{3,60})/i)
  if (famM) familia = famM[1].trim()
  else familia = inferirFamilia([...notasTopo, ...notasCoracao, ...notasFundo].join(", "), nome)

  return {
    nome,
    marca: "Maison Viegas",
    familia,
    notasTopo,
    notasCoracao,
    notasFundo,
    genero: generoDefault,
    preco,
    urlOrigem: url,
  }
}

async function scrapeMaisonViegas(): Promise<PerfumeExtraido[]> {
  const BASE = "https://maisonviegas.com.br"
  const paginas = [
    { path: "/perfumes-masculinos/", genero: "Masculino" },
    { path: "/perfumes-femininos/", genero: "Feminino" },
    { path: "/perfumes-compartilhaveis/", genero: "Unissex" },
  ]
  const resultados: PerfumeExtraido[] = []

  for (const { path: listPath, genero } of paginas) {
    const listingUrl = `${BASE}${listPath}`
    console.log(`\n🏠 Maison Viegas ${genero} — ${listingUrl}`)

    // Coleta URLs de produto /produtos/slug
    const produtoUrls = new Set<string>()
    for (let page = 1; page <= 5; page++) {
      const url = page === 1 ? listingUrl : `${listingUrl}?page=${page}`
      const html = await fetchHtml(url)
      if (!html) break
      const matches = Array.from(html.matchAll(/href="(https:\/\/maisonviegas\.com\.br\/produtos\/[^"]+)"/g))
      if (!matches.length) break
      const prev = produtoUrls.size
      matches.forEach(m => produtoUrls.add(m[1]))
      if (produtoUrls.size === prev) break // nenhum novo
      await delay(800)
    }
    console.log(`  → ${produtoUrls.size} URLs encontradas`)

    for (const url of produtoUrls) {
      await delay(600)
      const slug = url.split("/produtos/")[1]?.replace(/\/$/, "") ?? url
      process.stdout.write(`  · ${slug.slice(0, 45)}...`)
      const html = await fetchHtml(url)
      if (!html) { process.stdout.write(" ✗\n"); continue }
      const p = parseProdutoMV(html, url, genero)
      if (p) { resultados.push(p); process.stdout.write(` ✓ "${p.nome}" R$${p.preco}\n`) }
      else process.stdout.write(" – (sem dados)\n")
    }
    await delay(1500)
  }
  return resultados
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🔍 Nozze — scraper de perfumes verificados")
  console.log("=".repeat(60))

  const outputDir = path.join(__dirname, "output")
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

  const todos: PerfumeExtraido[] = []

  try {
    const itb = await scrapeInTheBox()
    todos.push(...itb)
    console.log(`\n✅ In The Box: ${itb.length} perfumes`)
  } catch (e) { console.error("❌ In The Box:", e) }

  await delay(2000)

  try {
    const mv = await scrapeMaisonViegas()
    todos.push(...mv)
    console.log(`\n✅ Maison Viegas: ${mv.length} perfumes`)
  } catch (e) { console.error("❌ Maison Viegas:", e) }

  // Deduplicação
  const vistos = new Set<string>()
  const unicos = todos.filter(p => {
    const k = `${p.marca}::${p.nome}`.toLowerCase()
    if (vistos.has(k)) return false
    vistos.add(k)
    return true
  })

  console.log("\n" + "=".repeat(60))
  console.log(`📊 TOTAL: ${unicos.length} perfumes únicos`)
  console.log(`   In The Box:    ${unicos.filter(p => p.marca === "In The Box").length}`)
  console.log(`   Maison Viegas: ${unicos.filter(p => p.marca === "Maison Viegas").length}`)
  console.log(`   Com preço:     ${unicos.filter(p => p.preco > 0).length}`)
  console.log(`   Com notas:     ${unicos.filter(p => p.notasTopo.length + p.notasCoracao.length + p.notasFundo.length > 0).length}`)
  console.log(`   Com família:   ${unicos.filter(p => p.familia.length > 3).length}`)

  const out = path.join(outputDir, "perfumes-verificados.json")
  fs.writeFileSync(out, JSON.stringify(unicos, null, 2), "utf-8")
  console.log(`\n💾 Salvo em: ${out}`)

  if (unicos.length) {
    console.log("\n📋 Amostra (primeiros 3):")
    unicos.slice(0, 3).forEach(p => {
      console.log(`  • ${p.marca} — ${p.nome} (${p.genero}, R$${p.preco})`)
      console.log(`    Família:  ${p.familia}`)
      console.log(`    Topo:     ${p.notasTopo.join(", ") || "–"}`)
      console.log(`    Coração:  ${p.notasCoracao.join(", ") || "–"}`)
      console.log(`    Fundo:    ${p.notasFundo.join(", ") || "–"}`)
    })
  }
}

main().catch(console.error)

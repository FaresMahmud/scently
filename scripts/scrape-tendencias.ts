// ============================================
// ARQUIVO: scripts/scrape-tendencias.ts
// O QUE FAZ: raspa tendências da Sephora BR e Fragrantica semanalmente
// QUANDO RODAR: npm run scrape:tendencias (ou Cron Job semanal)
// DEPENDE DE: SCRAPINGBEE_API_KEY no .env.local
// ============================================

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs") as typeof import("fs")
const path = require("path") as typeof import("path")

// ── Carrega .env.local ───────────────────────────────────────────────────────
const envPath = path.join(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8")
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^#\s][^=]*)=(.*)$/)
    if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "")
  }
}

// ── Tipos ────────────────────────────────────────────────────────────────────
interface PerfumeTendencia {
  id: string
  nome: string
  marca: string
  concentracao: string
  familia: string
  descricaoSensorial: string
  badge: string
  preco_estimado: string
  tipo: "importado" | "contratipo" | "nacional"
}

interface PerfumeRaspado {
  nome: string
  marca: string
  concentracao?: string
  familia?: string
  preco?: number
  fonte: string
  url: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const SCRAPINGBEE_KEY = process.env.SCRAPINGBEE_API_KEY

const MARCAS_CONTRATIPOS = ["in the box", "maison viegas", "ja essence", "azza parfum", "essencia e perfume"]
const MARCAS_NACIONAIS = ["o boticário", "boticario", "natura", "eudora", "avon", "jequiti"]

function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function tipoDaMarca(marca: string): "importado" | "contratipo" | "nacional" {
  const m = marca.toLowerCase()
  if (MARCAS_CONTRATIPOS.some(c => m.includes(c))) return "contratipo"
  if (MARCAS_NACIONAIS.some(c => m.includes(c))) return "nacional"
  return "importado"
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&agrave;/g, "à").replace(/&aacute;/g, "á").replace(/&acirc;/g, "â").replace(/&atilde;/g, "ã")
    .replace(/&eacute;/g, "é").replace(/&ecirc;/g, "ê")
    .replace(/&iacute;/g, "í")
    .replace(/&oacute;/g, "ó").replace(/&ocirc;/g, "ô").replace(/&otilde;/g, "õ")
    .replace(/&uacute;/g, "ú")
    .replace(/&ccedil;/g, "ç")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(parseInt(n)))
    .replace(/<[^>]+>/g, "")
    .trim()
}

async function scraperBee(url: string, render_js = false): Promise<string> {
  if (!SCRAPINGBEE_KEY) throw new Error("SCRAPINGBEE_API_KEY não configurada")
  const params = new URLSearchParams({
    api_key: SCRAPINGBEE_KEY,
    url,
    render_js: render_js ? "true" : "false",
    premium_proxy: "false",
    block_resources: render_js ? "false" : "true",
  })
  const res = await fetch(`https://app.scrapingbee.com/api/v1/?${params}`)
  if (!res.ok) throw new Error(`ScrapingBee error ${res.status}: ${await res.text()}`)
  return res.text()
}

// ── Sephora BR ────────────────────────────────────────────────────────────────
async function scrapeSephora(): Promise<PerfumeRaspado[]> {
  console.log("  [Sephora] Raspando...")
  const urls = [
    "https://www.sephora.com.br/perfumes/masculino?ordenacao=mais-vendidos",
    "https://www.sephora.com.br/perfumes/feminino?ordenacao=mais-vendidos",
  ]

  const resultados: PerfumeRaspado[] = []

  for (const url of urls) {
    try {
      const html = await scraperBee(url, true)

      // Tenta extrair JSON-LD (structured data)
      const jsonLdMatch = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)
      if (jsonLdMatch) {
        for (const bloco of jsonLdMatch) {
          try {
            const json = JSON.parse(bloco.replace(/<\/?script[^>]*>/gi, ""))
            const items = json["@type"] === "ItemList" ? json.itemListElement : []
            for (const item of items) {
              const p = item.item ?? item
              if (p.name && p.brand) {
                resultados.push({
                  nome: decodeHtml(p.name),
                  marca: decodeHtml(typeof p.brand === "string" ? p.brand : p.brand?.name ?? ""),
                  preco: p.offers?.price ? parseFloat(p.offers.price) : undefined,
                  fonte: "sephora",
                  url,
                })
              }
            }
          } catch {
            // ignora JSON-LD inválido
          }
        }
      }

      // Fallback: regex nos cards de produto
      if (resultados.length === 0) {
        const cardRegex = /<[^>]+(?:class="[^"]*(?:product[-_](?:card|item|name|brand))[^"]*"|data-product-name="([^"]+)")[^>]*>/gi
        const nameRegex = /(?:data-product-name|data-name|itemprop="name")="([^"]+)"/gi
        const brandRegex = /(?:data-brand|data-product-brand|itemprop="brand")="([^"]+)"/gi

        const nomes: string[] = []
        const marcas: string[] = []

        let m: RegExpExecArray | null
        nameRegex.lastIndex = 0
        while ((m = nameRegex.exec(html)) !== null) nomes.push(decodeHtml(m[1]))
        brandRegex.lastIndex = 0
        while ((m = brandRegex.exec(html)) !== null) marcas.push(decodeHtml(m[1]))

        for (let i = 0; i < Math.min(nomes.length, marcas.length, 20); i++) {
          if (nomes[i] && marcas[i]) {
            resultados.push({ nome: nomes[i], marca: marcas[i], fonte: "sephora", url })
          }
        }
      }
    } catch (e) {
      console.warn(`  [Sephora] Falhou em ${url}:`, (e as Error).message)
    }
  }

  console.log(`  [Sephora] ${resultados.length} perfumes extraídos`)
  return resultados.slice(0, 40)
}

// ── Fragrantica BR ────────────────────────────────────────────────────────────
async function scrapeFragrantica(): Promise<PerfumeRaspado[]> {
  console.log("  [Fragrantica] Raspando...")
  const url = "https://www.fragrantica.com.br/perfumes/mais-populares/"
  const resultados: PerfumeRaspado[] = []

  try {
    const html = await scraperBee(url, false)

    // Fragrantica usa células com itemprop
    const cellRegex = /<div[^>]+class="[^"]*cell[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi
    const nameRegex = /itemprop="name"[^>]*>([^<]+)/i
    const brandRegex = /itemprop="brand"[^>]*>([^<]+)/i
    const familiaRegex = /class="[^"]*family[^"]*"[^>]*>([^<]+)/i

    // Tenta extração por itemprop diretamente
    const allNames = [...html.matchAll(/itemprop="name"[^>]*>([^<]{2,80})</gi)].map(m => decodeHtml(m[1]))
    const allBrands = [...html.matchAll(/itemprop="brand"[^>]*>([^<]{2,60})</gi)].map(m => decodeHtml(m[1]))

    for (let i = 0; i < Math.min(allNames.length, allBrands.length, 30); i++) {
      if (allNames[i] && allBrands[i]) {
        resultados.push({
          nome: allNames[i],
          marca: allBrands[i],
          fonte: "fragrantica",
          url,
        })
      }
    }

    // Fallback: busca por padrão de links de perfumes Fragrantica
    if (resultados.length === 0) {
      const linkRegex = /href="https?:\/\/www\.fragrantica\.com\.br\/perfume\/([^/]+)\/([^"]+)"/gi
      let m: RegExpExecArray | null
      while ((m = linkRegex.exec(html)) !== null && resultados.length < 30) {
        const marca = m[1].replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
        const nome = m[2].replace(/-\d+\.html$/, "").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
        if (nome && marca) {
          resultados.push({ nome: decodeHtml(nome), marca: decodeHtml(marca), fonte: "fragrantica", url })
        }
      }
    }

  } catch (e) {
    console.warn("  [Fragrantica] Falhou:", (e as Error).message)
  }

  console.log(`  [Fragrantica] ${resultados.length} perfumes extraídos`)
  return resultados.slice(0, 30)
}

// ── Converter para PerfumeTendencia ──────────────────────────────────────────
function toTendencia(p: PerfumeRaspado, index: number): PerfumeTendencia {
  const tipo = tipoDaMarca(p.marca)
  const concentracao = p.concentracao ?? "EDP"
  const familia = p.familia ?? "Não classificado"
  const precoEstimado = p.preco
    ? `R$ ${Math.round(p.preco).toLocaleString("pt-BR")}`
    : tipo === "contratipo" ? "R$ 100–250" : tipo === "nacional" ? "R$ 80–300" : "R$ 300–900"
  const badges = ["🔥 Em alta", "⭐ Popular", "✨ Destaque", "💎 Top vendas"]
  return {
    id: `${slugify(p.marca)}-${slugify(p.nome)}`,
    nome: p.nome,
    marca: p.marca,
    concentracao,
    familia,
    descricaoSensorial: `${p.nome} da ${p.marca}. ${familia}.`,
    badge: badges[index % badges.length],
    preco_estimado: precoEstimado,
    tipo,
  }
}

// ── Deduplicar ────────────────────────────────────────────────────────────────
function deduplicar(lista: PerfumeRaspado[]): PerfumeRaspado[] {
  const vistos = new Set<string>()
  return lista.filter(p => {
    const chave = `${p.marca.toLowerCase()}|${p.nome.toLowerCase()}`
    if (vistos.has(chave)) return false
    vistos.add(chave)
    return true
  })
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🔍 Iniciando scraping de tendências...\n")

  if (!SCRAPINGBEE_KEY) {
    console.error("❌ SCRAPINGBEE_API_KEY não configurada no .env.local")
    process.exit(1)
  }

  const [resSephora, resFragrantica] = await Promise.allSettled([
    scrapeSephora(),
    scrapeFragrantica(),
  ])

  const sephora = resSephora.status === "fulfilled" ? resSephora.value : []
  const fragrantica = resFragrantica.status === "fulfilled" ? resFragrantica.value : []

  if (resSephora.status === "rejected") console.warn("⚠️  Sephora falhou:", resSephora.reason)
  if (resFragrantica.status === "rejected") console.warn("⚠️  Fragrantica falhou:", resFragrantica.reason)

  const todosRaspados = deduplicar([...sephora, ...fragrantica])
  const tendencias: PerfumeTendencia[] = todosRaspados
    .slice(0, 20)
    .map((p, i) => toTendencia(p, i))

  // Salva data/tendencias.json
  const dataDir = path.join(process.cwd(), "data")
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  const tendenciasPath = path.join(dataDir, "tendencias.json")
  fs.writeFileSync(tendenciasPath, JSON.stringify(tendencias, null, 2), "utf-8")
  console.log(`\n✅ ${tendencias.length} tendências salvas em data/tendencias.json`)

  // Salva scripts/output/perfumes-raspados.json para revisão manual
  const outputDir = path.join(process.cwd(), "scripts", "output")
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })
  const raspados = {
    timestamp: new Date().toISOString(),
    total: todosRaspados.length,
    fontes: {
      sephora: sephora.length,
      fragrantica: fragrantica.length,
    },
    perfumes: todosRaspados,
  }
  const outputPath = path.join(outputDir, "perfumes-raspados.json")
  fs.writeFileSync(outputPath, JSON.stringify(raspados, null, 2), "utf-8")
  console.log(`📋 ${todosRaspados.length} perfumes brutos salvos em scripts/output/perfumes-raspados.json`)
  console.log("\nRevise o arquivo antes de adicionar ao banco de contratipos.")
}

main().catch(e => {
  console.error("❌ Erro fatal:", e)
  process.exit(1)
})

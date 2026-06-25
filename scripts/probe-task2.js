/**
 * probe-task2.js — Task 2: La Rive + Nuancielo probes
 * Run: node scripts/probe-task2.js
 */
require("dotenv").config({ path: ".env.local" })
const https = require("https")
const http  = require("http")

const API_KEY = process.env.SCRAPINGBEE_API_KEY
if (!API_KEY) { console.error("SCRAPINGBEE_API_KEY não definida"); process.exit(1) }

function sbUrl(target, opts = {}) {
  const p = new URLSearchParams({
    api_key: API_KEY,
    url: target,
    render_js: opts.renderJs ? "true" : "false",
    ...(opts.wait ? { wait: String(opts.wait) } : {}),
  })
  return `https://app.scrapingbee.com/api/v1/?${p}`
}

function fetch(url) {
  return new Promise((res, rej) => {
    const mod = url.startsWith("https") ? https : http
    const chunks = []
    const req = mod.get(url, { timeout: 30000 }, r => {
      r.on("data", c => chunks.push(c))
      r.on("end", () => res({ status: r.statusCode, body: Buffer.concat(chunks).toString("utf8").slice(0, 4000) }))
    })
    req.on("error", rej)
    req.on("timeout", () => { req.destroy(); rej(new Error("timeout")) })
  })
}

async function probe(label, url, opts = {}) {
  console.log(`\n${"─".repeat(60)}`)
  console.log(`[${label}] ${url}`)
  try {
    const r = await fetch(sbUrl(url, opts))
    console.log(`  HTTP ${r.status}`)
    // Signals
    const signals = {
      "produto/perfume": (r.body.match(/perfume|parfum|fragrance|cologne/gi) || []).length,
      "price R$": (r.body.match(/R\$[\s\d]/g) || []).length,
      "product JSON keys": (r.body.match(/"price"|"name"|"title"/g) || []).length,
      "<h1>/<h2> count": (r.body.match(/<h[12]/g) || []).length,
    }
    for (const [k, v] of Object.entries(signals)) console.log(`  ${k}: ${v}`)
    // Sample
    const sample = r.body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 600)
    console.log(`  Sample: ${sample}`)
  } catch(e) {
    console.log(`  ERRO: ${e.message}`)
  }
}

async function main() {
  console.log("══════════════════════════════════════════")
  console.log("  PROBE TASK 2 — La Rive + Nuancielo")
  console.log("══════════════════════════════════════════")

  // ── La Rive ────────────────────────────────────────────
  // 1. WC REST API
  await probe("La Rive | WC REST API p1",
    "https://www.larive-parfums.com/wp-json/wc/v3/products?per_page=20&page=1&status=publish")

  // 2. WC REST API sem auth (public)
  await probe("La Rive | WC products.json (Shopify test)",
    "https://www.larive-parfums.com/products.json?limit=10")

  // 3. /shop/ com JS
  await probe("La Rive | /shop/ render_js",
    "https://www.larive-parfums.com/shop/", { renderJs: true, wait: 2000 })

  // 4. Sitemap
  await probe("La Rive | sitemap_index",
    "https://www.larive-parfums.com/sitemap_index.xml")

  await probe("La Rive | sitemap.xml",
    "https://www.larive-parfums.com/sitemap.xml")

  // ── Nuancielo ──────────────────────────────────────────
  // 1. Nuvemshop products.json API
  await probe("Nuancielo | /produtos.json p1",
    "https://www.nuancielo.com.br/produtos.json?per_page=50&page=1")

  // 2. /produtos com render_js — busca <h1>/<h2>
  await probe("Nuancielo | /produtos render_js",
    "https://www.nuancielo.com.br/produtos", { renderJs: true, wait: 2000 })

  // 3. /produtos sem JS (baseline)
  await probe("Nuancielo | /produtos sem JS",
    "https://www.nuancielo.com.br/produtos")

  console.log("\n══ FIM ══")
}

main().catch(console.error)

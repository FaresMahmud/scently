// ============================================
// ARQUIVO: app/api/cron/tendencias/route.ts
// O QUE FAZ: endpoint chamado pelo Cron Job do Vercel toda segunda-feira
// DEPENDE DE: SCRAPINGBEE_API_KEY, CRON_SECRET
// ATENÇÃO: em produção Vercel, o filesystem é read-only. Para persistir, use
//          um banco de dados (Vercel KV, Postgres, Supabase, etc.)
// ============================================

import { NextResponse } from "next/server"

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
    .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
    .replace(/&agrave;/g, "à").replace(/&aacute;/g, "á").replace(/&atilde;/g, "ã")
    .replace(/&eacute;/g, "é").replace(/&ecirc;/g, "ê")
    .replace(/&oacute;/g, "ó").replace(/&ocirc;/g, "ô").replace(/&otilde;/g, "õ")
    .replace(/&ccedil;/g, "ç")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(parseInt(n)))
    .replace(/<[^>]+>/g, "")
    .trim()
}

interface PerfumeRaspado {
  nome: string
  marca: string
  preco?: number
  fonte: string
}

async function scraperBee(url: string, render_js = false): Promise<string> {
  const chave = process.env.SCRAPINGBEE_API_KEY
  if (!chave) throw new Error("SCRAPINGBEE_API_KEY não configurada")
  const params = new URLSearchParams({
    api_key: chave,
    url,
    render_js: render_js ? "true" : "false",
    premium_proxy: "false",
    block_resources: render_js ? "false" : "true",
  })
  const res = await fetch(`https://app.scrapingbee.com/api/v1/?${params}`)
  if (!res.ok) throw new Error(`ScrapingBee ${res.status}`)
  return res.text()
}

async function raspaSephora(): Promise<PerfumeRaspado[]> {
  const urls = [
    "https://www.sephora.com.br/perfumes/masculino?ordenacao=mais-vendidos",
    "https://www.sephora.com.br/perfumes/feminino?ordenacao=mais-vendidos",
  ]
  const lista: PerfumeRaspado[] = []
  for (const url of urls) {
    try {
      const html = await scraperBee(url, true)
      const nomes = [...html.matchAll(/(?:data-product-name|data-name|itemprop="name")="([^"]{3,80})"/gi)].map(m => decodeHtml(m[1]))
      const marcas = [...html.matchAll(/(?:data-brand|data-product-brand|itemprop="brand")="([^"]{2,60})"/gi)].map(m => decodeHtml(m[1]))
      for (let i = 0; i < Math.min(nomes.length, marcas.length, 20); i++) {
        if (nomes[i] && marcas[i]) lista.push({ nome: nomes[i], marca: marcas[i], fonte: "sephora" })
      }
    } catch { /* fonte opcional */ }
  }
  return lista
}

async function raspaFragrantica(): Promise<PerfumeRaspado[]> {
  const lista: PerfumeRaspado[] = []
  try {
    const html = await scraperBee("https://www.fragrantica.com.br/perfumes/mais-populares/", false)
    const nomes = [...html.matchAll(/itemprop="name"[^>]*>([^<]{2,80})</gi)].map(m => decodeHtml(m[1]))
    const marcas = [...html.matchAll(/itemprop="brand"[^>]*>([^<]{2,60})</gi)].map(m => decodeHtml(m[1]))
    for (let i = 0; i < Math.min(nomes.length, marcas.length, 30); i++) {
      if (nomes[i] && marcas[i]) lista.push({ nome: nomes[i], marca: marcas[i], fonte: "fragrantica" })
    }
  } catch { /* fonte opcional */ }
  return lista
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })
  }

  const inicio = Date.now()

  const [resSephora, resFragrantica] = await Promise.allSettled([
    raspaSephora(),
    raspaFragrantica(),
  ])

  const sephora = resSephora.status === "fulfilled" ? resSephora.value : []
  const fragrantica = resFragrantica.status === "fulfilled" ? resFragrantica.value : []

  // Deduplica
  const vistos = new Set<string>()
  const todos = [...sephora, ...fragrantica].filter(p => {
    const chave = `${p.marca.toLowerCase()}|${p.nome.toLowerCase()}`
    if (vistos.has(chave)) return false
    vistos.add(chave)
    return true
  })

  const badges = ["🔥 Em alta", "⭐ Popular", "✨ Destaque", "💎 Top vendas"]
  const tendencias = todos.slice(0, 20).map((p, i) => ({
    id: `${slugify(p.marca)}-${slugify(p.nome)}`,
    nome: p.nome,
    marca: p.marca,
    concentracao: "EDP",
    familia: "Não classificado",
    descricaoSensorial: `${p.nome} da ${p.marca}.`,
    badge: badges[i % badges.length],
    preco_estimado: p.preco ? `R$ ${Math.round(p.preco).toLocaleString("pt-BR")}` : "Consultar",
    tipo: tipoDaMarca(p.marca),
  }))

  // Em produção Vercel: persistir em KV/Postgres ao invés do filesystem
  // Em servidor próprio: descomentar as linhas abaixo
  // const { writeFileSync } = await import("fs")
  // const { join } = await import("path")
  // writeFileSync(join(process.cwd(), "data/tendencias.json"), JSON.stringify(tendencias, null, 2))

  return NextResponse.json({
    ok: true,
    atualizados: tendencias.length,
    novos: todos.length - tendencias.length,
    fontes: { sephora: sephora.length, fragrantica: fragrantica.length },
    timestamp: new Date().toISOString(),
    duracao_ms: Date.now() - inicio,
  })
}

// ============================================
// SCRIPT: scripts/popular-catalogo.ts
// O QUE FAZ: busca perfumes de todas as marcas do ebayData via Fragella API
//            e salva em data/catalogo-fragella.json
// COMO RODAR: npm run catalogo:popular
//             (ou: npx ts-node -r tsconfig-paths/register --project tsconfig.scripts.json scripts/popular-catalogo.ts)
// ============================================

import * as path from "path"
import * as fs from "fs"

// Carrega .env.local antes de qualquer import de lib/
const envPath = path.join(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([^#\s][^=]*)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "")
  }
}

import { PERFUMES_EBAY } from "@/lib/ebayData"
import type { PerfumeFragella } from "@/lib/fragella"

const BASE_URL = "https://api.fragella.com/api/v1"
const API_KEY  = process.env.FRAGELLA_API_KEY ?? ""
const LIMIT    = 50
const DELAY_MS = 300
const SAIDA    = path.join(process.cwd(), "data", "catalogo-fragella.json")

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms))
}

function ebayParaSlug(nome: string, marca: string): string {
  const slugify = (s: string) =>
    s.toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  return `${slugify(nome)}-${slugify(marca)}`
}

interface NotaFragella { name: string; imageUrl: string }
interface RankingFragella { name: string; score: number }

function normalizarPerfume(raw: Record<string, unknown>): PerfumeFragella {
  const nome  = String(raw["Name"]  ?? "")
  const marca = String(raw["Brand"] ?? "")
  const notasObj = raw["Notes"] as { Top?: NotaFragella[]; Middle?: NotaFragella[]; Base?: NotaFragella[] } | undefined
  const acordes  = (raw["Main Accords"] as string[] | undefined) ?? []

  return {
    id: ebayParaSlug(nome, marca),
    nome,
    marca,
    concentracao:       String(raw["OilType"]  ?? "EDP"),
    genero:             String(raw["Gender"]   ?? ""),
    ano:                Number(raw["Year"]     ?? 0),
    familia:            acordes[0] ?? "",
    descricao:          acordes.length ? `${acordes.slice(0, 3).join(", ")}.` : "",
    imagem:             String(raw["Image URL"] ?? ""),
    imagemTransparente: raw["Image URL Transparent"] ? String(raw["Image URL Transparent"]) : undefined,
    imagemFallbacks:    (raw["Image Fallbacks"]    as string[]              | undefined),
    notasTopo:          notasObj?.Top?.map(n => n.name)    ?? [],
    notasCoracao:       notasObj?.Middle?.map(n => n.name) ?? [],
    notasFundo:         notasObj?.Base?.map(n => n.name)   ?? [],
    notasGerais:        (raw["General Notes"]          as string[]              | undefined),
    acordesPrincipais:  acordes,
    acordesPorcentagem: (raw["Main Accords Percentage"] as Record<string, string> | undefined),
    notasCompletas: notasObj ? {
      Top:    notasObj.Top    ?? [],
      Middle: notasObj.Middle ?? [],
      Base:   notasObj.Base   ?? [],
    } : undefined,
    longevidade: raw["Longevity"]    ? String(raw["Longevity"])    : undefined,
    sillage:     raw["Sillage"]      ? String(raw["Sillage"])      : undefined,
    popularidade:raw["Popularity"]   ? Number(raw["Popularity"])   : undefined,
    valorPreco:  raw["Price Value"]  ? String(raw["Price Value"])  : undefined,
    confianca:   raw["Confidence"]   ? Number(raw["Confidence"])   : undefined,
    rating:      raw["rating"]       ? Number(raw["rating"])       : undefined,
    pais:        raw["Country"]      ? String(raw["Country"])      : undefined,
    preco:       raw["Price"]        ? Number(raw["Price"])        : undefined,
    urlCompra:   raw["Purchase URL"] ? String(raw["Purchase URL"]) : undefined,
    rankingEstacao: (raw["Season Ranking"]   as RankingFragella[] | undefined),
    rankingOcasiao: (raw["Occasion Ranking"] as RankingFragella[] | undefined),
  }
}

async function buscarPorMarca(marca: string): Promise<PerfumeFragella[]> {
  const url = new URL(`${BASE_URL}/brands/${encodeURIComponent(marca)}`)
  url.searchParams.set("limit", String(LIMIT))

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const res = await fetch(url.toString(), {
      headers: { "x-api-key": API_KEY, "Content-Type": "application/json" },
      signal: controller.signal,
    })

    if (res.status === 404) return []   // marca não existe na Fragella — normal
    if (!res.ok) {
      console.error(`  ✗ HTTP ${res.status} para "${marca}"`)
      return []
    }

    const dados = await res.json() as Record<string, unknown>[]
    if (!Array.isArray(dados)) return []
    return dados.map(normalizarPerfume)
  } catch (e) {
    if ((e as Error).name === "AbortError") {
      console.error(`  ✗ Timeout para "${marca}"`)
    } else {
      console.error(`  ✗ Erro para "${marca}": ${(e as Error).message}`)
    }
    return []
  } finally {
    clearTimeout(timeout)
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗")
  console.log("║         POPULAR CATÁLOGO — Fragella API — Scently        ║")
  console.log("╚══════════════════════════════════════════════════════════╝\n")

  if (!API_KEY) {
    console.error("✗ FRAGELLA_API_KEY não configurada no .env.local")
    process.exit(1)
  }

  // 1. Extrai marcas únicas do ebayData (preserva grafia original)
  const marcasSet = new Map<string, string>() // lowercase → original
  for (const p of PERFUMES_EBAY) {
    const key = p.marca.toLowerCase()
    if (!marcasSet.has(key)) marcasSet.set(key, p.marca)
  }
  const marcas = Array.from(marcasSet.values()).sort()
  console.log(`Marcas únicas encontradas: ${marcas.length}\n`)

  // 2. Busca perfumes de cada marca
  const todosPerfumes: PerfumeFragella[] = []
  const vistos = new Set<string>()          // deduplica por id
  let marcasComResultado = 0

  for (let i = 0; i < marcas.length; i++) {
    const marca = marcas[i]
    const prefixo = `[${String(i + 1).padStart(String(marcas.length).length, " ")}/${marcas.length}]`

    const perfumes = await buscarPorMarca(marca)

    // Deduplica
    const novos = perfumes.filter(p => !vistos.has(p.id))
    novos.forEach(p => vistos.add(p.id))
    todosPerfumes.push(...novos)

    if (novos.length > 0) {
      marcasComResultado++
      console.log(`${prefixo} ${marca} — ${novos.length} perfume${novos.length !== 1 ? "s" : ""} encontrado${novos.length !== 1 ? "s" : ""}`)
    } else {
      console.log(`${prefixo} ${marca} — sem resultados`)
    }

    // Delay entre chamadas (exceto na última)
    if (i < marcas.length - 1) await sleep(DELAY_MS)
  }

  // 3. Salva resultado
  const resultado = {
    timestamp: new Date().toISOString(),
    total: todosPerfumes.length,
    marcas_com_resultado: marcasComResultado,
    marcas_total: marcas.length,
    perfumes: todosPerfumes,
  }

  fs.writeFileSync(SAIDA, JSON.stringify(resultado, null, 2), "utf-8")

  console.log("\n" + "━".repeat(60))
  console.log("CONCLUÍDO")
  console.log(`  ✓ ${todosPerfumes.length} perfumes coletados de ${marcasComResultado}/${marcas.length} marcas`)
  console.log(`  ✓ Salvo em: ${SAIDA}`)
}

main().catch(e => {
  console.error(`✗ Erro fatal: ${(e as Error).message}`)
  process.exit(1)
})

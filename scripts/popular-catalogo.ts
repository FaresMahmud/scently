// ============================================
// SCRIPT: scripts/popular-catalogo.ts
// O QUE FAZ: busca perfumes de todas as marcas do ebayData via Fragella API
//            e salva em data/catalogo-fragella.json
// COMO RODAR: npm run catalogo:popular    (completo)
//             npm run catalogo:continuar  (só marcas faltantes)
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

const BASE_URL   = "https://api.fragella.com/api/v1"
const API_KEY    = process.env.FRAGELLA_API_KEY ?? ""
const LIMIT      = 50
const DELAY_MS   = 800
const MAX_RETRY  = 3
const RETRY_WAIT = 5000
const SAIDA      = path.join(process.cwd(), "data", "catalogo-fragella.json")

const MODO_CONTINUAR = process.argv.includes("--continuar")

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms))
}

function slugify(s: string): string {
  return s.toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function ebayParaSlug(nome: string, marca: string): string {
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

  for (let tentativa = 1; tentativa <= MAX_RETRY; tentativa++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    try {
      const res = await fetch(url.toString(), {
        headers: { "x-api-key": API_KEY, "Content-Type": "application/json" },
        signal: controller.signal,
      })

      if (res.status === 404) return []
      if (res.status === 429) {
        console.warn(`  ⚠ 429 Rate limit para "${marca}" — tentativa ${tentativa}/${MAX_RETRY}, aguardando ${RETRY_WAIT / 1000}s…`)
        await sleep(RETRY_WAIT)
        continue
      }
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

  console.error(`  ✗ "${marca}" falhou após ${MAX_RETRY} tentativas (429 persistente)`)
  return []
}

// ── Carrega catálogo existente ────────────────────────────────────────────────

interface CatalogoJSON {
  timestamp: string
  total: number
  marcas_com_resultado: number
  marcas_total: number
  perfumes: PerfumeFragella[]
}

function carregarExistente(): { perfumes: PerfumeFragella[]; marcasComDados: Set<string> } {
  if (!fs.existsSync(SAIDA)) return { perfumes: [], marcasComDados: new Set() }
  try {
    const raw = JSON.parse(fs.readFileSync(SAIDA, "utf-8")) as CatalogoJSON
    const perfumes = Array.isArray(raw.perfumes) ? raw.perfumes : []
    const marcasComDados = new Set(perfumes.map(p => p.marca.toLowerCase()))
    return { perfumes, marcasComDados }
  } catch {
    console.warn("⚠ Não foi possível ler o catálogo existente — iniciando do zero")
    return { perfumes: [], marcasComDados: new Set() }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗")
  console.log("║         POPULAR CATÁLOGO — Fragella API — Nozze          ║")
  console.log(`║  Modo: ${MODO_CONTINUAR ? "CONTINUAR (só marcas faltantes)          " : "COMPLETO (todas as marcas)               "}║`)
  console.log("╚══════════════════════════════════════════════════════════╝\n")

  if (!API_KEY) {
    console.error("✗ FRAGELLA_API_KEY não configurada no .env.local")
    process.exit(1)
  }

  // 1. Marcas únicas do ebayData
  const marcasSet = new Map<string, string>()
  for (const p of PERFUMES_EBAY) {
    const key = p.marca.toLowerCase()
    if (!marcasSet.has(key)) marcasSet.set(key, p.marca)
  }
  const todasMarcas = Array.from(marcasSet.values()).sort()

  // 2. Carrega catálogo existente
  const { perfumes: perfumesExistentes, marcasComDados } = carregarExistente()

  // 3. Filtra marcas a buscar
  let marcas: string[]
  if (MODO_CONTINUAR) {
    marcas = todasMarcas.filter(m => !marcasComDados.has(m.toLowerCase()))
    console.log(`Catálogo existente: ${perfumesExistentes.length} perfumes de ${marcasComDados.size} marcas`)
    console.log(`Marcas faltantes:   ${marcas.length} de ${todasMarcas.length} total\n`)
    if (marcas.length === 0) {
      console.log("✓ Todas as marcas já foram coletadas. Nada a fazer.")
      return
    }
  } else {
    marcas = todasMarcas
    console.log(`Marcas únicas encontradas: ${marcas.length}\n`)
  }

  // 4. Busca marcas faltantes
  const novosPerfumes: PerfumeFragella[] = []
  const vistos = new Set<string>(perfumesExistentes.map(p => p.id))
  let marcasComResultado = 0

  for (let i = 0; i < marcas.length; i++) {
    const marca = marcas[i]
    const prefixo = `[${String(i + 1).padStart(String(marcas.length).length, " ")}/${marcas.length}]`

    const perfumes = await buscarPorMarca(marca)
    const novos = perfumes.filter(p => !vistos.has(p.id))
    novos.forEach(p => vistos.add(p.id))
    novosPerfumes.push(...novos)

    if (novos.length > 0) {
      marcasComResultado++
      console.log(`${prefixo} ${marca} — ${novos.length} perfume${novos.length !== 1 ? "s" : ""}`)
    } else {
      console.log(`${prefixo} ${marca} — sem resultados`)
    }

    if (i < marcas.length - 1) await sleep(DELAY_MS)
  }

  // 5. Merge com existentes e salva
  const todosPerfumes = MODO_CONTINUAR
    ? [...perfumesExistentes, ...novosPerfumes]
    : novosPerfumes

  const totalMarcasComDados = MODO_CONTINUAR
    ? marcasComDados.size + marcasComResultado
    : marcasComResultado

  const resultado: CatalogoJSON = {
    timestamp: new Date().toISOString(),
    total: todosPerfumes.length,
    marcas_com_resultado: totalMarcasComDados,
    marcas_total: todasMarcas.length,
    perfumes: todosPerfumes,
  }

  fs.writeFileSync(SAIDA, JSON.stringify(resultado, null, 2), "utf-8")

  console.log("\n" + "━".repeat(60))
  console.log("CONCLUÍDO")
  if (MODO_CONTINUAR) {
    console.log(`  ✓ ${novosPerfumes.length} novos perfumes coletados (${marcasComResultado} marcas novas)`)
    console.log(`  ✓ Total no catálogo: ${todosPerfumes.length} perfumes`)
  } else {
    console.log(`  ✓ ${todosPerfumes.length} perfumes coletados de ${marcasComResultado}/${todasMarcas.length} marcas`)
  }
  console.log(`  ✓ Salvo em: ${SAIDA}`)
}

main().catch(e => {
  console.error(`✗ Erro fatal: ${(e as Error).message}`)
  process.exit(1)
})

// ============================================
// ARQUIVO: lib/catalogoFragella.ts
// O QUE FAZ: acesso ao catálogo local data/catalogo-fragella.json com cache em memória
// QUANDO MANDAR PRA IA: quando quiser mudar como o catálogo local é lido ou consultado
// DEPENDE DE: data/catalogo-fragella.json (gerado por scripts/popular-catalogo.ts)
// ATENÇÃO: módulo server-only — usa fs, não importar em "use client"
// ============================================

import "server-only"
import * as fs from "fs"
import * as path from "path"
import type { PerfumeFragella } from "@/lib/fragella"
import { slugify } from "@/lib/utils"

const CAMINHO = path.join(process.cwd(), "data", "catalogo-fragella.json")

interface CatalogoJSON {
  timestamp: string
  total: number
  perfumes: PerfumeFragella[]
}

// Cache em memória — lê o arquivo uma única vez por instância do servidor
let _cache: PerfumeFragella[] | null = null
let _timestamp = ""

export function carregarCatalogo(): PerfumeFragella[] {
  if (_cache !== null) return _cache
  try {
    const raw = fs.readFileSync(CAMINHO, "utf-8")
    const data = JSON.parse(raw) as CatalogoJSON
    _cache = Array.isArray(data.perfumes) ? data.perfumes : []
    _timestamp = data.timestamp ?? ""
    return _cache
  } catch {
    _cache = []
    return _cache
  }
}

/** Busca por nome ou marca (case-insensitive, substring) */
export function buscarNoCatalogo(query: string, limit = 20): PerfumeFragella[] {
  const q = query.toLowerCase().trim()
  if (!q) return carregarCatalogo().slice(0, limit)
  return carregarCatalogo()
    .filter(p =>
      p.nome.toLowerCase().includes(q) ||
      p.marca.toLowerCase().includes(q)
    )
    .slice(0, limit)
}

/** Filtra por marca exata (case-insensitive) */
export function buscarPorMarcaLocal(marca: string): PerfumeFragella[] {
  const m = marca.toLowerCase().trim()
  return carregarCatalogo().filter(p => p.marca.toLowerCase() === m)
}

/** Total de perfumes no catálogo local */
export function totalPerfumes(): number {
  return carregarCatalogo().length
}

/** Marcas únicas no catálogo */
export function marcasUnicas(): string[] {
  const set = new Map<string, string>()
  for (const p of carregarCatalogo()) {
    set.set(p.marca.toLowerCase(), p.marca)
  }
  return Array.from(set.values()).sort()
}

/** Metadados do catálogo (gerado quando) */
export function metadadosCatalogo() {
  carregarCatalogo() // garante que o cache foi populado
  return { timestamp: _timestamp, total: _cache?.length ?? 0 }
}

/** Busca um perfume pelo slug/id — tolera sufixos -ebay/-contratipo/-fragella */
export function buscarPerfumePorSlug(slug: string): PerfumeFragella | null {
  const catalogo = carregarCatalogo()

  // Remove sufixos de fonte do slug
  const slugLimpo = slug.replace(/-(ebay|contratipo|fragella)$/, "")

  // 1. Match direto por id
  const porId = catalogo.find(p => p.id === slug || p.id === slugLimpo)
  if (porId) return porId

  // 2. Match por slugify(nome)-slugify(marca)
  const porNomeMarca = catalogo.find(p => {
    const s1 = `${slugify(p.nome)}-${slugify(p.marca)}`
    const s2 = `${slugify(p.marca)}-${slugify(p.nome)}`
    return s1 === slugLimpo || s2 === slugLimpo || s1 === slug || s2 === slug
  })
  if (porNomeMarca) return porNomeMarca

  return null
}

/** Retorna os N perfumes mais populares (por campo popularidade, depois rating) */
export function perfumesPopulares(limite = 500): PerfumeFragella[] {
  return [...carregarCatalogo()]
    .sort((a, b) => {
      const popDiff = (b.popularidade ?? 0) - (a.popularidade ?? 0)
      if (popDiff !== 0) return popDiff
      return (b.rating ?? 0) - (a.rating ?? 0)
    })
    .slice(0, limite)
}

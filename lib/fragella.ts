// ============================================
// ARQUIVO: lib/fragella.ts
// O QUE FAZ: integração com a API Fragella — busca perfumes por nome, marca, notas e similaridade
// QUANDO MANDAR PRA IA: quando quiser mudar como os perfumes são buscados ou exibidos
// DEPENDE DE: .env.local (FRAGELLA_API_KEY), lib/ebayData.ts (fallback sem API_KEY)
// DOCS: https://api.fragella.com/docs.html
// ============================================

import { buscarEbayPopulares, ebayParaSlug } from "@/lib/ebayData"

const BASE_URL = "https://api.fragella.com/api/v1"
const API_KEY = process.env.FRAGELLA_API_KEY ?? ""

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface NotaFragella {
  name: string
  imageUrl: string
}

export interface RankingFragella {
  name: string
  score: number
}

// Representa um perfume completo vindo da API Fragella
export interface PerfumeFragella {
  id: string                          // slug gerado localmente: Brand + Name
  nome: string                        // campo "Name" da API
  marca: string                       // campo "Brand"
  concentracao: string                // campo "OilType" (EDP, EDT, etc.)
  genero: string                      // campo "Gender"
  ano: number                         // campo "Year"
  familia: string                     // primeiro item de "Main Accords" ou ""
  descricao: string                   // gerado a partir dos acordes principais
  imagem: string                      // campo "Image URL"
  imagemTransparente?: string         // campo "Image URL Transparent"
  imagemFallbacks?: string[]          // campo "Image Fallbacks"
  notasTopo: string[]                 // Notes.Top[].name
  notasCoracao: string[]              // Notes.Middle[].name
  notasFundo: string[]                // Notes.Base[].name
  notasGerais?: string[]              // campo "General Notes"
  acordesPrincipais?: string[]        // campo "Main Accords"
  acordesPorcentagem?: Record<string, string> // campo "Main Accords Percentage"
  notasCompletas?: {
    Top: NotaFragella[]
    Middle: NotaFragella[]
    Base: NotaFragella[]
  }
  longevidade?: string                // Longevity
  sillage?: string                    // Sillage
  popularidade?: number               // Popularity
  valorPreco?: string                 // Price Value
  confianca?: number                  // Confidence
  rating?: number                     // rating (Bayesian)
  pais?: string                       // Country
  preco?: number                      // Price
  urlCompra?: string                  // Purchase URL
  rankingEstacao?: RankingFragella[]  // Season Ranking
  rankingOcasiao?: RankingFragella[]  // Occasion Ranking
}

// Filtros para buscarPorMatch
export interface FiltrosMatch {
  accords?: string   // formato: "woody:60,citrus:40"
  top?: string       // notas de topo separadas por vírgula
  middle?: string    // notas de coração separadas por vírgula
  base?: string      // notas de fundo separadas por vírgula
  general?: string   // notas gerais separadas por vírgula
  limit?: number     // máx 10
}

// Resultado de buscarSimilares
export interface ResultadoSimilares {
  similar_to: string
  similar_fragrances: (PerfumeFragella & { SimilarityScore?: number })[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Monta os headers de autenticação
function headers(): Record<string, string> {
  return {
    "x-api-key": API_KEY,
    "Content-Type": "application/json",
  }
}

// Converte o objeto bruto da API para PerfumeFragella normalizado
// Dados incorretos no Fragella upstream que não são detectáveis por token de nome.
// Cada entrada é um caso comprovado — não adicionar em lote sem verificação individual.
const GENERO_OVERRIDES: Record<string, "men" | "women" | "unisex"> = {
  // "212 VIP" original é feminino (lançado 2010); "212 VIP Men" é o masculino (2011).
  // Fragella retorna "Men" para o base, o que causaria colisão no gender guard do cron.
  "212-vip-carolina-herrera": "women",
}

function normalizarPerfume(raw: Record<string, unknown>): PerfumeFragella {
  const nome = String(raw["Name"] ?? "")
  const marca = String(raw["Brand"] ?? "")
  const notasObj = raw["Notes"] as { Top?: NotaFragella[]; Middle?: NotaFragella[]; Base?: NotaFragella[] } | undefined
  const acordes = (raw["Main Accords"] as string[] | undefined) ?? []
  const slug = ebayParaSlug(nome, marca)

  // Normalizar casing upstream ("Men" → "men") e aplicar override para dados incorretos
  const generoRaw      = String(raw["Gender"] ?? "").toLowerCase().trim()
  const generoFinal    = GENERO_OVERRIDES[slug] ?? generoRaw

  return {
    id: slug,
    nome,
    marca,
    concentracao: String(raw["OilType"] ?? "EDP"),
    genero: generoFinal,
    ano: Number(raw["Year"] ?? 0),
    familia: acordes[0] ?? "",
    descricao: acordes.length ? `${acordes.slice(0, 3).join(", ")}.` : "",
    imagem: String(raw["Image URL"] ?? ""),
    imagemTransparente: raw["Image URL Transparent"] ? String(raw["Image URL Transparent"]) : undefined,
    imagemFallbacks: (raw["Image Fallbacks"] as string[] | undefined),
    notasTopo: notasObj?.Top?.map(n => n.name) ?? [],
    notasCoracao: notasObj?.Middle?.map(n => n.name) ?? [],
    notasFundo: notasObj?.Base?.map(n => n.name) ?? [],
    notasGerais: (raw["General Notes"] as string[] | undefined),
    acordesPrincipais: acordes,
    acordesPorcentagem: (raw["Main Accords Percentage"] as Record<string, string> | undefined),
    notasCompletas: notasObj ? {
      Top: notasObj.Top ?? [],
      Middle: notasObj.Middle ?? [],
      Base: notasObj.Base ?? [],
    } : undefined,
    longevidade: raw["Longevity"] ? String(raw["Longevity"]) : undefined,
    sillage: raw["Sillage"] ? String(raw["Sillage"]) : undefined,
    popularidade: raw["Popularity"] ? Number(raw["Popularity"]) : undefined,
    valorPreco: raw["Price Value"] ? String(raw["Price Value"]) : undefined,
    confianca: raw["Confidence"] ? Number(raw["Confidence"]) : undefined,
    rating: raw["rating"] ? Number(raw["rating"]) : undefined,
    pais: raw["Country"] ? String(raw["Country"]) : undefined,
    preco: raw["Price"] ? Number(raw["Price"]) : undefined,
    urlCompra: raw["Purchase URL"] ? String(raw["Purchase URL"]) : undefined,
    rankingEstacao: (raw["Season Ranking"] as RankingFragella[] | undefined),
    rankingOcasiao: (raw["Occasion Ranking"] as RankingFragella[] | undefined),
  }
}

// Converte um perfume do eBay para PerfumeFragella (usado como fallback)
function ebayParaFragella(p: {
  titulo: string
  marca: string
  tipo: string
  genero: string
  preco_brl: number
}): PerfumeFragella {
  const nome = p.titulo.split(" by ")[0].split(/\s+\d/)[0].trim()
  return {
    id: ebayParaSlug(p.titulo, p.marca),
    nome,
    marca: p.marca,
    concentracao: p.tipo,
    genero: p.genero === "Masculino" ? "masculino" : "feminino",
    ano: 0,
    familia: "",
    descricao: "",
    imagem: "",
    notasTopo: [],
    notasCoracao: [],
    notasFundo: [],
    preco: p.preco_brl,
  }
}

// Requisição genérica com timeout e tratamento de erro
async function apiFetch<T>(path: string, params: Record<string, string | number> = {}): Promise<T | null> {
  const url = new URL(`${BASE_URL}${path}`)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v))
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(url.toString(), {
      headers: headers(),
      signal: controller.signal,
    })

    if (!res.ok) {
      console.error(`[Fragella] ${res.status} em ${path}`)
      return null
    }

    return (await res.json()) as T
  } catch (e) {
    console.error(`[Fragella] Erro em ${path}:`, (e as Error).message)
    return null
  } finally {
    clearTimeout(timeout)
  }
}

// ── Funções públicas ──────────────────────────────────────────────────────────

/**
 * Busca perfumes por nome — usado para autocompletar e âncora do quiz.
 * GET /fragrances?search=nome&limit=5
 */
export async function buscarPorNome(nome: string, limit = 5): Promise<PerfumeFragella[]> {
  if (!API_KEY || nome.trim().length < 3) return []

  const dados = await apiFetch<Record<string, unknown>[]>("/fragrances", { search: nome, limit })
  if (!dados) return []

  return dados.map(normalizarPerfume)
}

/**
 * Busca todos os perfumes de uma marca.
 * GET /brands/:marca?limit=20
 */
export async function buscarPorMarca(marca: string, limit = 20): Promise<PerfumeFragella[]> {
  if (!API_KEY) return []

  const dados = await apiFetch<Record<string, unknown>[]>(`/brands/${encodeURIComponent(marca)}`, { limit })
  if (!dados) return []

  return dados.map(normalizarPerfume)
}

/**
 * Busca fragrâncias similares a um nome.
 * GET /fragrances/similar?name=nome&limit=5
 * Retorna { similar_to, similar_fragrances[] }
 */
export async function buscarSimilares(nome: string, limit = 5): Promise<ResultadoSimilares | null> {
  if (!API_KEY) return null

  const dados = await apiFetch<{ similar_to: string; similar_fragrances: Record<string, unknown>[] }>(
    "/fragrances/similar",
    { name: nome, limit }
  )
  if (!dados) return null

  return {
    similar_to: dados.similar_to,
    similar_fragrances: dados.similar_fragrances.map(p => ({
      ...normalizarPerfume(p),
      SimilarityScore: (p["SimilarityScore"] as number | undefined),
    })),
  }
}

/**
 * Busca perfumes que combinam com acordes e notas específicas — ideal para o quiz.
 * GET /fragrances/match?accords=...&top=...&middle=...&base=...&limit=10
 * accords: "woody:60,citrus:40" — nome do acorde + porcentagem mínima
 */
export async function buscarPorMatch(filtros: FiltrosMatch): Promise<PerfumeFragella[]> {
  if (!API_KEY) return []

  const params: Record<string, string | number> = {}
  if (filtros.accords) params.accords = filtros.accords
  if (filtros.top)     params.top     = filtros.top
  if (filtros.middle)  params.middle  = filtros.middle
  if (filtros.base)    params.base    = filtros.base
  if (filtros.general) params.general = filtros.general
  if (filtros.limit)   params.limit   = Math.min(filtros.limit, 10)

  const dados = await apiFetch<Record<string, unknown>[]>("/fragrances/match", params)
  if (!dados) return []

  return dados.map(normalizarPerfume)
}

/**
 * Busca os perfumes em destaque para a página inicial.
 * Sem endpoint dedicado: chama buscarPorNome com termos populares e retorna 8 resultados.
 * Fallback para os mais populares do eBay quando não há API_KEY.
 */
export async function buscarDestaques(): Promise<PerfumeFragella[]> {
  if (!API_KEY) {
    return buscarEbayPopulares(8).map(ebayParaFragella)
  }

  const termos = ["Sauvage", "Chanel", "Dior"]
  const resultados = await Promise.allSettled(
    termos.map(t => buscarPorNome(t, 3))
  )

  const lista: PerfumeFragella[] = []
  const vistos = new Set<string>()

  for (const r of resultados) {
    if (r.status !== "fulfilled") continue
    for (const p of r.value) {
      if (!vistos.has(p.id)) {
        vistos.add(p.id)
        lista.push(p)
        if (lista.length >= 8) break
      }
    }
    if (lista.length >= 8) break
  }

  return lista.length > 0 ? lista : buscarEbayPopulares(8).map(ebayParaFragella)
}

/**
 * Busca um perfume pelo ID (slug).
 * A API não tem endpoint /fragrances/{id}, então faz uma busca por nome e retorna o primeiro match.
 * O mock (buscarMockPorId) serve como fallback principal na página de detalhe.
 */
export async function buscarPerfumePorId(id: string): Promise<PerfumeFragella | null> {
  if (!API_KEY) return null

  // Converte slug de volta para nome legível: "sauvage-dior" → "sauvage"
  const nomeBusca = id.split("-").slice(0, 2).join(" ")
  const resultados = await buscarPorNome(nomeBusca, 5)

  return resultados.find(p => p.id === id) ?? resultados[0] ?? null
}

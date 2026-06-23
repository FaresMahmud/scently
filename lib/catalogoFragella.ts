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
import { removerSufixoGenero, detectarGenero, mapearGeneroFragella } from "@/lib/generoGuard"

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

// ── Matching robusto (cascade) ────────────────────────────────────────────────
// Inspirado no cascade de 4 passes do buscarPerfumePorSlug, mas operando sobre
// nome+marca separados (não um slug único) — pensado pra busca livre/autocomplete.

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

// Remove sufixos de concentração ("Eau de Parfum", "Eau de Toilette", etc.) do
// nome — o catálogo às vezes omite esse sufixo, então o núcleo é o que compara.
function nucleoNome(nome: string): string {
  return nome
    .replace(/\b(eau de parfum|eau de toilette|eau de cologne|extrait de parfum)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
}

// Aliases de marca conhecidos — abreviações e variações de nome completo que
// aparecem tanto em queries quanto embutidas no campo `nome` do catálogo
// (ex: catálogo tem "D & G Light Blue" mas marca canônica é "Dolce & Gabbana").
// Todo alias resolve pra uma forma canônica; marcas já canônicas não precisam de entrada.
const ALIASES_MARCA: Record<string, string> = {
  "christian dior": "dior",
  "ck": "calvin klein",
  "ysl": "yves saint laurent",
  "d g": "dolce gabbana",
  "dg": "dolce gabbana",
  "ch": "carolina herrera",
  "jpg": "jean paul gaultier",
}

export function normalizarMarca(marca: string): string {
  const n = normalizar(marca)
  return ALIASES_MARCA[n] ?? n
}

// Remove até 3 palavras do início de `nomeNormalizado` se elas, juntas,
// canonicalizarem pra mesma marca de `marcaCatalogo` — resolve nomes onde o
// catálogo embute a marca no campo nome (ex: "Dior Sauvage", "D & G Light Blue").
function removerPrefixoMarca(nomeNormalizado: string, marcaCatalogo: string): string {
  const marcaCanon = normalizarMarca(marcaCatalogo)
  const palavras = nomeNormalizado.split(" ")
  for (let n = Math.min(3, palavras.length); n >= 1; n--) {
    const prefixo = palavras.slice(0, n).join(" ")
    if (normalizarMarca(prefixo) === marcaCanon) {
      return palavras.slice(n).join(" ").trim()
    }
  }
  return nomeNormalizado
}

function marcaCompativel(marcaQuery: string | undefined, marcaCatalogo: string): boolean {
  if (!marcaQuery) return true // busca sem marca — não filtra
  return normalizarMarca(marcaQuery) === normalizarMarca(marcaCatalogo)
}

// Pontua candidatos fuzzy (tier 3) — favorece núcleo exato, gênero compatível,
// e menos palavras extras (evita flanker tipo "212 Vip Black" quando pediram "212 Vip").
function pontuarCandidatoFuzzy(
  nucleoQuery: string,
  generoQuery: "masculino" | "feminino" | "neutro",
  p: PerfumeFragella
): number {
  const nucleoP = normalizar(removerPrefixoMarca(normalizar(p.nome), p.marca))
  let pontuacao = 0

  if (nucleoP === nucleoQuery) pontuacao += 0
  else if (nucleoP.startsWith(nucleoQuery + " ") || nucleoQuery.startsWith(nucleoP + " ")) pontuacao += 10
  else pontuacao += 30

  const generoCandidato = mapearGeneroFragella((p as unknown as { genero?: string }).genero ?? "")
  if (generoQuery !== "neutro" && generoCandidato !== "neutro" && generoCandidato !== generoQuery) {
    pontuacao += 1000 // praticamente desqualifica sem excluir (mantém determinístico)
  }

  pontuacao += nucleoP.split(" ").length // penaliza nomes com mais palavras (flankers)
  return pontuacao
}

function buscarComCascade(nome: string, marca: string | undefined, limit: number): PerfumeFragella[] {
  const catalogo = carregarCatalogo()

  // Gender guard: detecta gênero explícito no nome ANTES de remover o sufixo
  const generoQuery   = detectarGenero(nome)
  const nomeSemSufixo = removerSufixoGenero(nome)
  const nucleoQuery   = normalizar(nucleoNome(nomeSemSufixo))

  if (!nucleoQuery) return marca ? [] : carregarCatalogo().slice(0, limit)

  function generoCompativel(p: PerfumeFragella): boolean {
    if (generoQuery === "neutro") return true
    const generoCandidato = mapearGeneroFragella((p as unknown as { genero?: string }).genero ?? "")
    return generoCandidato === "neutro" || generoCandidato === generoQuery
  }

  // Tier 1: match exato do nome (sem stripping de marca) + marca compatível + gênero compatível
  const tier1 = catalogo.filter(p =>
    normalizar(nucleoNome(p.nome)) === nucleoQuery &&
    marcaCompativel(marca, p.marca) &&
    generoCompativel(p)
  )
  if (tier1.length > 0) return tier1.slice(0, limit)

  // Tier 2: match exato do núcleo após remover a marca embutida no nome do catálogo
  // (ex: "Dior Sauvage" → "Sauvage", "D & G Light Blue" → "Light Blue")
  const tier2 = catalogo.filter(p => {
    const nucleoCatalogo = normalizar(removerPrefixoMarca(normalizar(nucleoNome(p.nome)), p.marca))
    return nucleoCatalogo === nucleoQuery && marcaCompativel(marca, p.marca) && generoCompativel(p)
  })
  if (tier2.length > 0) return tier2.slice(0, limit)

  // Tier 3: fuzzy — todas as palavras do núcleo presentes no nome+marca do catálogo,
  // marca compatível, gênero compatível; rankeado por pontuarCandidatoFuzzy (menor = melhor)
  const palavrasNucleo = nucleoQuery.split(" ").filter(w => w.length > 2)
  if (palavrasNucleo.length === 0) return []

  const tier3 = catalogo.filter(p => {
    if (!marcaCompativel(marca, p.marca) || !generoCompativel(p)) return false
    const textoP = normalizar(`${p.nome} ${p.marca}`)
    return palavrasNucleo.every(palavra => textoP.includes(palavra))
  })

  return tier3
    .sort((a, b) => pontuarCandidatoFuzzy(nucleoQuery, generoQuery, a) - pontuarCandidatoFuzzy(nucleoQuery, generoQuery, b))
    .slice(0, limit)
}

/** Busca por nome ou marca — assinatura antiga (query única, substring) preservada. */
export function buscarNoCatalogo(query: string, limit?: number): PerfumeFragella[]
/** Busca por nome+marca com cascade robusto (normalização de marca, núcleo, fuzzy, gender guard). */
export function buscarNoCatalogo(nome: string, marca: string, limit?: number): PerfumeFragella[]
export function buscarNoCatalogo(
  nomeOuQuery: string,
  marcaOuLimit?: string | number,
  limitTalvez?: number
): PerfumeFragella[] {
  // Assinatura nova: (nome, marca, limit?)
  if (typeof marcaOuLimit === "string") {
    return buscarComCascade(nomeOuQuery, marcaOuLimit, limitTalvez ?? 20)
  }

  // Assinatura antiga: (query, limit?) — comportamento substring inalterado
  const limit = marcaOuLimit ?? 20
  const q = nomeOuQuery.toLowerCase().trim()
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

/**
 * Busca um perfume pelo slug/id — tolera sufixos -ebay/-contratipo/-fragella.
 * `selecionarEntreCandidatos`: callback opcional pra re-rankear os candidatos do
 * tier 4 (fuzzy) quando há ambiguidade. Se omitido, mantém o comportamento padrão
 * (candidato com slug nome+marca mais curto) — usado pelo scanner sem alteração.
 */
export function buscarPerfumePorSlug(
  slug: string,
  selecionarEntreCandidatos?: (candidatos: PerfumeFragella[]) => PerfumeFragella | null
): PerfumeFragella | null {
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

  // 3. Prefix match — o slug de input é prefixo do slug do catálogo
  // Ex: "tommy-summer-tommy" é prefixo de "tommy-summer-tommy-hilfiger"
  const porPrefixo = catalogo.find(p => {
    const textoP = slugify(p.nome + " " + p.marca)
    return textoP === slugLimpo || textoP.startsWith(slugLimpo + "-")
  })
  if (porPrefixo) return porPrefixo

  // 4. Fuzzy match — divide em palavras e busca todos os candidatos,
  //    preferindo o slug mais curto (menos palavras extras)
  const palavras = slugLimpo.split("-").filter(p => p.length > 2)
  if (palavras.length > 0) {
    const candidatos = catalogo.filter(p => {
      const textoP = slugify(p.nome + " " + p.marca)
      return palavras.every(palavra => textoP.includes(palavra))
    })
    if (candidatos.length > 0) {
      if (selecionarEntreCandidatos) {
        const escolhido = selecionarEntreCandidatos(candidatos)
        if (escolhido) return escolhido
      }
      candidatos.sort((a, b) =>
        slugify(a.nome + " " + a.marca).length - slugify(b.nome + " " + b.marca).length
      )
      return candidatos[0]
    }
  }

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

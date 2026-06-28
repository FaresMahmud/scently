// ============================================
// ARQUIVO: lib/limparNomePerfume.ts
// O QUE FAZ: remove prefixos redundantes do nome do perfume para exibição
//            (marca duplicada, "Perfume", concentração, gênero)
// QUANDO MANDAR PRA IA: quando quiser ajustar as regras de limpeza
// ============================================

// Marcas conhecidas — se o nome começa com qualquer uma dessas, remove o prefixo
const MARCAS_CONHECIDAS = [
  "In The Box", "JA Essence", "Thera Cosméticos", "Thera Cosmeticos",
  "Paris Elysees", "Maison Viegas", "Azza Parfum", "Azza Parfums",
  "Nuancielo", "La Rive", "Mahogany", "O Boticário", "Natura", "Eudora",
  "Granado", "Phebo", "Dior", "Chanel", "Givenchy", "Prada", "Valentino",
  "Montblanc", "Mugler", "Issey Miyake", "Narciso Rodriguez", "Bvlgari",
  "Coach", "Ferragamo", "Jimmy Choo", "Lattafa", "Maison Alhambra", "Afnan",
  "Armaf", "Rasasi", "Ajmal", "Swiss Arabian", "Al Haramain",
  "Fragrance World", "Paris Corner", "Zimaya", "Orientica",
]

// Aliases de marca — quando o nome do produto usa prefixo abreviado da marca
// Ex: "Jean Paul Scandal" para marca "JEAN PAUL GAULTIER"
const BRAND_PREFIXES: Record<string, string[]> = {
  "jean paul gaultier": ["jean paul"],
}

// Prefixos ambíguos — palavras genéricas que precedem o nome real e nada acrescentam
const PREFIXOS_AMBIGUOS = [
  "perfume masculino",
  "perfume feminino",
  "perfume unissex",
  "perfume",
]

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export function limparNomePerfume(nome: string, marca: string): string {
  if (!nome) return nome

  let limpo = nome.trim()

  // 1. Remove prefixos ambíguos (case insensitive), do mais específico ao mais genérico
  for (const prefixo of PREFIXOS_AMBIGUOS) {
    const regex = new RegExp(`^${escapeRegExp(prefixo)}\\s+`, "i")
    const tentativa = limpo.replace(regex, "").trim()
    if (tentativa !== limpo && tentativa.length > 2) { limpo = tentativa; break }
  }

  // 2. Remove marca passada como argumento (normalization + substring)
  if (marca) {
    const marcaNorm = marca.toLowerCase().trim()
    const nomeNorm  = limpo.toLowerCase().trim()
    if (nomeNorm.startsWith(marcaNorm)) {
      limpo = limpo.substring(marca.length).trim()
    } else {
      // Tenta prefixo abreviado da marca (ex: "Jean Paul" para "JEAN PAUL GAULTIER")
      const prefixes = BRAND_PREFIXES[marcaNorm]
      if (prefixes) {
        for (const prefix of prefixes) {
          const regex = new RegExp(`^${escapeRegExp(prefix)}\\s+`, "i")
          const tentativa = limpo.replace(regex, "").trim()
          if (tentativa.length > 2) { limpo = tentativa; break }
        }
      }
    }
  }

  // 3. Remove qualquer marca da lista MARCAS_CONHECIDAS do início
  for (const m of MARCAS_CONHECIDAS) {
    if (limpo.toLowerCase().startsWith(m.toLowerCase() + " ")) {
      const tentativa = limpo.substring(m.length).trim()
      if (tentativa.length > 2) { limpo = tentativa; break }  // startsWith garantiu que mudou
    }
  }

  // 4. Remove concentração do final (do mais longo ao mais curto para evitar match parcial)
  const concentracoes = [
    "extrait de parfum",
    "eau de parfum",
    "eau de toilette",
    "eau de cologne",
    "eau fraiche",
    "elixir parfum",
    "parfum",
    "extrait",
    "edp",
    "edt",
    "edc",
  ]
  for (const conc of concentracoes) {
    const regex    = new RegExp(`\\s+${escapeRegExp(conc)}$`, "i")
    const tentativa = limpo.replace(regex, "").trim()
    if (tentativa !== limpo && tentativa.length > 2) { limpo = tentativa; break }
  }

  // 5. Remove sufixo de gênero
  limpo = limpo.replace(/\s+(masculino|feminino|unissex|for men|for women|for him|for her)$/i, "").trim()

  // 6. Remove volume/tamanho em qualquer posição (ex: "100ml", "-100ml", "50 ml")
  limpo = limpo.replace(/\s*-?\s*\d+\s*ml/gi, "").trim()

  // 7. Remove dashes/hífens no final (artefatos após limpeza anterior)
  limpo = limpo.replace(/[\s\-–]+$/, "").trim()

  // 8. Remove dashes/hífens no início
  limpo = limpo.replace(/^[\s\-–]+/, "").trim()

  return limpo
}

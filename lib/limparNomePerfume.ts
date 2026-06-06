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

// Prefixos ambíguos — palavras genéricas que precedem o nome real e nada acrescentam
const PREFIXOS_AMBIGUOS = [
  "perfume masculino",
  "perfume feminino",
  "perfume unissex",
  "perfume",
]

export function limparNomePerfume(nome: string, marca: string): string {
  if (!nome) return nome

  let limpo = nome.trim()

  // 1. Remove prefixos ambíguos (case insensitive), do mais específico ao mais genérico
  for (const prefixo of PREFIXOS_AMBIGUOS) {
    const regex = new RegExp(`^${prefixo}\\s+`, "i")
    const tentativa = limpo.replace(regex, "").trim()
    if (tentativa.length > 2) { limpo = tentativa; break }
  }

  // 2. Remove marca passada como argumento (normalization + substring)
  if (marca) {
    const marcaNorm = marca.toLowerCase().trim()
    const nomeNorm  = limpo.toLowerCase().trim()
    if (nomeNorm.startsWith(marcaNorm)) {
      limpo = limpo.substring(marca.length).trim()
    }
  }

  // 3. Remove qualquer marca da lista MARCAS_CONHECIDAS do início
  for (const m of MARCAS_CONHECIDAS) {
    if (limpo.toLowerCase().startsWith(m.toLowerCase() + " ")) {
      const tentativa = limpo.substring(m.length).trim()
      if (tentativa.length > 2) { limpo = tentativa; break }
    }
  }

  // 4. Remove concentração do final (do mais longo ao mais curto para evitar match parcial)
  const concentracoes = [
    "extrait de parfum",
    "eau de parfum",
    "eau de toilette",
    "eau de cologne",
    "eau fraiche",
    "parfum",
    "extrait",
    "edp",
    "edt",
    "edc",
  ]
  for (const conc of concentracoes) {
    const regex    = new RegExp(`\\s+${conc}$`, "i")
    const tentativa = limpo.replace(regex, "").trim()
    if (tentativa.length > 2) { limpo = tentativa; break }
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

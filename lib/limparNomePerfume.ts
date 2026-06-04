// ============================================
// ARQUIVO: lib/limparNomePerfume.ts
// O QUE FAZ: remove prefixos redundantes do nome do perfume para exibição
//            (marca duplicada, "Perfume", concentração, gênero)
// QUANDO MANDAR PRA IA: quando quiser ajustar as regras de limpeza
// ============================================

export function limparNomePerfume(nome: string, marca: string): string {
  if (!nome) return nome

  let limpo = nome

  // Remove "Perfume" prefix (case insensitive)
  limpo = limpo.replace(/^perfume\s+/i, "")

  // Remove brand name from beginning (case insensitive)
  if (marca) {
    const marcaNorm = marca.toLowerCase().trim()
    const nomeNorm  = limpo.toLowerCase().trim()
    if (nomeNorm.startsWith(marcaNorm)) {
      limpo = limpo.substring(marca.length).trim()
    }
  }

  // Remove concentration suffix FIRST — scraped names have "Masculino Eau de Toilette"
  // so we must strip concentration before gender
  const concentracoes = [
    "eau de parfum", "eau de toilette", "eau de cologne",
    "eau fraiche", "extrait de parfum", "parfum",
    "edp", "edt", "edc", "extrait",
  ]
  for (const conc of concentracoes) {
    const regex    = new RegExp(`\\s+${conc}$`, "i")
    const tentativa = limpo.replace(regex, "").trim()
    if (tentativa.length > 2) limpo = tentativa
  }

  // Remove gender suffix (now at end after concentration stripped)
  limpo = limpo.replace(/\s+(masculino|feminino|unissex|for men|for women|for him|for her)$/i, "").trim()

  return limpo.trim()
}

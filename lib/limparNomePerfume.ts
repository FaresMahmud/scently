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

  // Remove gender suffix
  limpo = limpo.replace(/\s+(masculino|feminino|unissex)$/i, "").trim()

  // Remove concentration suffix (only if remainder still has content)
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

  return limpo.trim()
}

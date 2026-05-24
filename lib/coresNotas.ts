// ============================================
// ARQUIVO: lib/coresNotas.ts
// O QUE FAZ: cor psicológica para notas olfativas (por regex, compatível com nomes em inglês)
// QUANDO MANDAR PRA IA: quando quiser adicionar famílias ou ajustar cores
// DEPENDE DE: nada
// FONTES: PLOS One cross-cultural study 2014, Cognitive Research Journal 2020
// ============================================

/**
 * Retorna uma cor hex baseada na família olfativa da nota.
 * Funciona com nomes em inglês (API Fragella) e português.
 */
export function corDaNota(nota: string): string {
  const n = nota.toLowerCase()

  // Cítricos — amarelo vibrante
  if (/lemon|bergamot|citrus|orange|lime|grapefruit|mandarin|yuzu|neroli|petitgrain/.test(n))
    return "#E8B84B"

  // Florais — rosa/lilás
  if (/rose|jasmine|floral|lily|violet|iris|peony|magnolia|lavender|ylang|heliotrope|carnation|orchid/.test(n))
    return "#C17B9E"

  // Amadeirados — marrom quente
  if (/wood|cedar|sandalwood|oud|vetiver|patchouli|oak|teak|birch|guaiac/.test(n))
    return "#8B5E3C"

  // Orientais/baunilha — dourado
  if (/vanilla|amber|musk|incense|resin|benzoin|tonka|coumarin|myrrh|labdanum|opoponax/.test(n))
    return "#C9943A"

  // Frescos/aquáticos — azul
  if (/aquatic|marine|water|sea|ocean|fresh|mint|eucalyptus|green|moss|fern|herb/.test(n))
    return "#4A90A4"

  // Frutados — coral/pêssego
  if (/peach|apple|pear|berry|fruit|cherry|plum|raspberry|lychee|cassis|currant|melon|mango/.test(n))
    return "#D4785A"

  // Especiados — vermelho/terracota
  if (/pepper|spice|cinnamon|cardamom|ginger|clove|nutmeg|saffron|bay|anise/.test(n))
    return "#A0522D"

  // Gourmand — roxo suave
  if (/chocolate|caramel|coffee|sugar|honey|almond|praline|cocoa|rum|bourbon/.test(n))
    return "#7B5EA7"

  // Default — terracota do site
  return "#8B6F5E"
}

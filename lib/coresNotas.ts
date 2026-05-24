// ============================================
// ARQUIVO: lib/coresNotas.ts
// O QUE FAZ: cor única por nota olfativa individual — variações de saturação/brilho por família
// QUANDO MANDAR PRA IA: quando quiser adicionar notas ou ajustar cores
// DEPENDE DE: nada
// FONTES: PLOS One cross-cultural study 2014, Cognitive Research Journal 2020
// ============================================

/**
 * Retorna uma cor hex específica para cada nota olfativa.
 * Notas da mesma família compartilham o tom base mas com variações distintas.
 * Compatível com nomes em inglês (Fragella API) e português.
 */
export function corDaNota(nota: string): string {
  const mapa: Record<string, string> = {
    // Cítricos — tons amarelo/laranja
    "bergamot": "#E8C547", "bergamota": "#E8C547",
    "lemon": "#F0D030", "limão": "#F0D030",
    "orange": "#F0901E", "laranja": "#F0901E",
    "mandarin": "#F07820", "tangerina": "#F07820",
    "grapefruit": "#F0A030", "toranja": "#F0A030",
    "lime": "#A8C830", "lima": "#A8C830",
    "yuzu": "#D4B820",
    "petitgrain": "#C8A830",

    // Florais rosa
    "rose": "#D4607A", "rosa": "#D4607A",
    "peony": "#E07090", "peônia": "#E07090",
    "magnolia": "#E890A8",
    "cherry blossom": "#F0A0B8",

    // Florais brancos/lilás
    "jasmine": "#9B6FBD", "jasmim": "#9B6FBD",
    "lily": "#B87FD4", "lírio": "#B87FD4",
    "lily-of-the-valley": "#A0C870", "lírio do vale": "#A0C870",
    "gardenia": "#C89FE0",
    "tuberose": "#D4A0C8",
    "neroli": "#E8C070",
    "orange blossom": "#F0B040",
    "white floral": "#C8A0D4",

    // Lavanda/Iris
    "lavender": "#8878C8", "lavanda": "#8878C8",
    "iris": "#7870C0",
    "violet": "#9060B0", "violeta": "#9060B0",
    "heliotrope": "#A878C0",

    // Amadeirados
    "oud": "#4A2010", "agarwood": "#4A2010",
    "sandalwood": "#A07040", "sândalo": "#A07040",
    "cedarwood": "#8B5030", "cedar": "#8B5030", "cedro": "#8B5030",
    "vetiver": "#706030",
    "patchouli": "#604820",
    "oak": "#7A5020",
    "oakmoss": "#506020", "musgo de carvalho": "#506020",
    "woodsy notes": "#7A5838", "notas amadeiradas": "#7A5838",

    // Âmbar/Orientais
    "amber": "#C88820", "âmbar": "#C88820",
    "vanilla": "#D4A050", "baunilha": "#D4A050",
    "tonka": "#B87830", "fava tonka": "#B87830",
    "benzoin": "#A06828",
    "labdanum": "#906020",
    "incense": "#804828", "incenso": "#804828",
    "myrrh": "#903820",
    "frankincense": "#A06030",
    "resin": "#784020",

    // Almíscar/Sintéticos
    "musk": "#A09090", "almíscar": "#A09090",
    "white musk": "#C0B0B0", "almíscar branco": "#C0B0B0",
    "ambroxan": "#B09878",
    "ambrette": "#C0A888",
    "iso e super": "#707888",
    "hedione": "#8090A0",
    "aldehydes": "#8898A8", "aldeídos": "#8898A8",

    // Especiarias
    "pepper": "#902020", "pimenta": "#902020",
    "black pepper": "#701818", "pimenta preta": "#701818",
    "pink pepper": "#C04060", "pimenta rosa": "#C04060",
    "cinnamon": "#A03818", "canela": "#A03818",
    "cardamom": "#907030", "cardamomo": "#907030",
    "clove": "#702010", "cravo": "#702010",
    "ginger": "#C07020", "gengibre": "#C07020",
    "nutmeg": "#884020", "noz-moscada": "#884020",

    // Frutados
    "peach": "#F09060", "pêssego": "#F09060",
    "apple": "#90C040", "maçã": "#90C040",
    "pear": "#A8C840", "pêra": "#A8C840",
    "raspberry": "#C02860", "framboesa": "#C02860",
    "cherry": "#A02030", "cereja": "#A02030",
    "plum": "#702060", "ameixa": "#702060",
    "black currant": "#501850", "groselha preta": "#501850",
    "mango": "#F0A020",
    "apricot": "#F08040",

    // Aquáticos
    "aquatic": "#2880B0",
    "marine": "#1870A0",
    "sea notes": "#3090C0",
    "ozonic": "#60A8D0",
    "water": "#4898C0",

    // Verdes/Frescos
    "green": "#409040",
    "grass": "#50A030",
    "mint": "#30A878", "hortelã": "#30A878",
    "eucalyptus": "#2A9880", "eucalipto": "#2A9880",
    "basil": "#508030",
    "galbanum": "#607830",

    // Gourmand
    "chocolate": "#502818",
    "coffee": "#603820", "café": "#603820",
    "caramel": "#C07828", "caramelo": "#C07828",
    "honey": "#D09020", "mel": "#D09020",
    "almond": "#C09050", "amêndoa": "#C09050",
    "praline": "#A06030",
  }

  const n = nota.toLowerCase().trim()
  if (mapa[n]) return mapa[n]

  // Fallback por família se não encontrar exato
  if (/lemon|bergamot|citrus|lime|yuzu/.test(n))  return "#E8C040"
  if (/rose|peony|floral/.test(n))                return "#D46880"
  if (/wood|cedar|sandalwood/.test(n))            return "#8B5838"
  if (/amber|vanilla|tonka/.test(n))              return "#C89040"
  if (/musk|ambrox/.test(n))                      return "#A09080"
  if (/pepper|spice|cinnamon/.test(n))            return "#A04020"
  if (/aquatic|marine|water/.test(n))             return "#3888B8"
  if (/green|mint|herb/.test(n))                  return "#409848"
  if (/coffee|chocolate|caramel/.test(n))         return "#705028"

  return "#8B6F5E"
}

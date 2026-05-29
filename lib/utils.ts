// ============================================
// ARQUIVO: lib/utils.ts
// O QUE FAZ: funções utilitárias compartilhadas
// QUANDO MANDAR PRA IA: quando precisar de novas utilities
// DEPENDE DE: nada
// ============================================

// ── Traduções EN→PT ──────────────────────────────────────────────────────────

const TRADUCOES: Record<string, string> = {
  // Estações
  spring: "Primavera", summer: "Verão", fall: "Outono", autumn: "Outono", winter: "Inverno",
  // Ocasiões
  casual: "Casual", "night out": "Noite", professional: "Profissional",
  business: "Trabalho", romantic: "Romântico", sport: "Esporte", daily: "Dia a dia",
  // Longevidade
  "very long lasting": "Duração excepcional", "long lasting": "Longa duração",
  moderate: "Moderada", weak: "Fraca", poor: "Curta",
  // Sillage
  enormous: "Muito forte", strong: "Forte", soft: "Suave", intimate: "Íntimo",
  // Gênero
  men: "Masculino", women: "Feminino", unisex: "Unissex",
  // Popularidade
  "very high": "Muito popular", high: "Popular", medium: "Moderado",
  low: "Pouco conhecido", "not popular": "Raro",
  // Acordes / famílias olfativas
  vanilla: "Baunilha", woody: "Amadeirado", amber: "Âmbar", musk: "Almíscar",
  musky: "Almiscarado", citrus: "Cítrico", rose: "Rosa", floral: "Floral",
  powdery: "Polvilhado", balsamic: "Balsâmico", sweet: "Doce",
  animalic: "Animalístico", fresh: "Fresco", spicy: "Apimentado",
  fruity: "Frutado", green: "Verde", earthy: "Terroso", aquatic: "Aquático",
  marine: "Marinho", gourmand: "Gourmand", smoky: "Defumado",
  leather: "Couro", tobacco: "Tabaco", resinous: "Resinoso",
  "white floral": "Floral Branco", lavender: "Lavanda",
  sandalwood: "Sândalo", vetiver: "Vetiver", patchouli: "Patchouli",
  incense: "Incenso", "tonka bean": "Fava Tonka", benzoin: "Benjoim",
  "pink pepper": "Pimenta Rosa", saffron: "Açafrão",
  "woody spicy": "Amadeirado Apimentado", oriental: "Oriental",
  fougere: "Fougère", chypre: "Chypre", aromatic: "Aromático",
  warm: "Quente", dry: "Seco", rich: "Rico", light: "Leve",
  // Notas olfativas (nomes individuais da Fragella API)
  bergamot: "Bergamota", lemon: "Limão", orange: "Laranja", grapefruit: "Toranja",
  mandarin: "Tangerina", lime: "Lima", yuzu: "Yuzu",
  jasmine: "Jasmim", iris: "Íris", violet: "Violeta", peony: "Peônia",
  lily: "Lírio", neroli: "Neroli", ylang: "Ylang-Ylang", magnolia: "Magnólia",
  cedarwood: "Cedro", cedar: "Cedro", oud: "Oud",
  oakmoss: "Musgo de Carvalho", "oak moss": "Musgo de Carvalho",
  "woodsy notes": "Notas Amadeiradas", "woody notes": "Notas Amadeiradas",
  "floral notes": "Notas Florais", "citrus notes": "Notas Cítricas",
  pepper: "Pimenta", cardamom: "Cardamomo", ginger: "Gengibre",
  cinnamon: "Canela", clove: "Cravo", nutmeg: "Noz-Moscada",
  peach: "Pêssego", apple: "Maçã", pear: "Pêra", raspberry: "Framboesa",
  cherry: "Cereja", plum: "Ameixa", "black currant": "Groselha Preta",
  coffee: "Café", chocolate: "Chocolate", caramel: "Caramelo", honey: "Mel",
  mint: "Hortelã", eucalyptus: "Eucalipto",
  ambroxan: "Ambroxan", aldehydes: "Aldeídos", hedione: "Hediona",
  "white musk": "Almíscar Branco",
  narcissus: "Narciso", "lily-of-the-valley": "Lírio do Vale",
  petitgrain: "Petit Grain", galbanum: "Gálbano",
  tonka: "Fava Tonka",
  "ylang-ylang": "Ylang-Ylang",
  pineapple: "Abacaxi",
  rosemary: "Alecrim",
  cyclamen: "Ciclâmen",
  coriander: "Coentro",
  "brazilian rosewood": "Pau-Rosa Brasileiro",
  geranium: "Gerânio",
  orris: "Orris",
  labdanum: "Lábdano",
  cistus: "Cisto",
  elemi: "Elemi",
  olibanum: "Olíbano",
  styrax: "Estirace",
  castoreum: "Castóreo",
  civette: "Civeta",
  oakwood: "Madeira de Carvalho",
  birch: "Bétula",
  "guaiac wood": "Guaiaco",
  agarwood: "Madeira de Agar",
  hay: "Feno",
  smoke: "Fumaça",
  rum: "Rum",
  wine: "Vinho",
  // iris já existe acima
}

// ── Mapa PT→EN para filtro de família no catálogo ────────────────────────────

export const familiaParaIngles: Record<string, string[]> = {
  "citrico":     ["citrus", "citric"],
  "floral":      ["floral", "white floral", "rose", "flower"],
  "amadeirado":  ["woody", "wood", "cedar", "sandalwood"],
  "oriental":    ["oriental", "amber", "ambery", "balsamic"],
  "aquatico":    ["aquatic", "marine", "water", "fresh", "ozonic"],
  "especiado":   ["spicy", "fresh spicy", "spice"],
  "gourmand":    ["gourmand", "sweet", "vanilla", "caramel"],
  "almiscarado": ["musky", "musk", "powdery"],
  "verde":       ["green", "aromatic", "herbal", "fougere"],
  "frutal":      ["fruity", "fruit"],
}

export function traduzir(texto: string | undefined | null): string {
  if (!texto) return ""
  const lower = texto.toLowerCase().trim()
  return TRADUCOES[lower] ?? texto
}

export function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

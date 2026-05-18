// ============================================
// ARQUIVO: lib/coresNotas.ts
// O QUE FAZ: mapeia notas olfativas para cores baseado em psicologia da percepção
// QUANDO MANDAR PRA IA: quando quiser adicionar notas ou ajustar cores
// DEPENDE DE: nada
// FONTES: PLOS One cross-cultural study 2014, Cognitive Research Journal 2020
// ============================================

// Cor de fundo (hover) e cor do texto para cada nota
export interface CorNota {
  bg: string    // cor de fundo no hover
  text: string  // cor do texto no hover
}

export const CORES_NOTAS: Record<string, CorNota> = {
  // ── CÍTRICOS — amarelo vivo, energético ──
  "bergamota":          { bg: "#FFF3C4", text: "#8B6914" },
  "limão":              { bg: "#FFFACD", text: "#7A6200" },
  "toranja":            { bg: "#FFE4B5", text: "#8B5E00" },
  "mandarina":          { bg: "#FFE0A0", text: "#8B5500" },
  "laranja":            { bg: "#FFE0B2", text: "#8B4500" },
  "limão siciliano":    { bg: "#FFFACD", text: "#7A6200" },

  // ── FLORAIS — rosa, blush, lilás ──
  "rosa":               { bg: "#FFE4E1", text: "#8B3A3A" },
  "jasmim":             { bg: "#FFF0F5", text: "#8B3060" },
  "íris":               { bg: "#E6E0F8", text: "#4A3580" },
  "violeta":            { bg: "#EDE0F0", text: "#5B3070" },
  "peônia":             { bg: "#FFDDE8", text: "#8B2252" },
  "gardênia":           { bg: "#FFF5E6", text: "#8B6040" },
  "flor de laranjeira": { bg: "#FFF8E7", text: "#7A5C00" },
  "neroli":             { bg: "#FFFAEB", text: "#7A5C00" },
  "ylang ylang":        { bg: "#FFFDE0", text: "#7A6000" },
  "heliotropo":         { bg: "#F0E6FF", text: "#5A3580" },

  // ── AMADEIRADOS — marrom, âmbar, verde floresta ──
  "sândalo":            { bg: "#F5E6D0", text: "#6B3D1E" },
  "cedro":              { bg: "#E8DCC8", text: "#5C3D1E" },
  "vetiver":            { bg: "#D4C9A8", text: "#4A3A1A" },
  "patchouli":          { bg: "#C8B89A", text: "#3D2A0E" },
  "oud":                { bg: "#C4A882", text: "#3D2000" },
  "madeira":            { bg: "#DEB887", text: "#5C3317" },
  "bétula":             { bg: "#D2C4A0", text: "#4A3410" },

  // ── ORIENTAIS/ESPECIADOS — dourado, vermelho quente ──
  "âmbar":              { bg: "#FFE4A0", text: "#8B5500" },
  "baunilha":           { bg: "#FEFAE6", text: "#8B7030" },
  "fava tonka":         { bg: "#F5E6C8", text: "#6B4A1E" },
  "canela":             { bg: "#F4D4A0", text: "#7A3B00" },
  "cardamomo":          { bg: "#E8F0D4", text: "#3A5020" },
  "pimenta":            { bg: "#F0C8C0", text: "#7A2010" },
  "pimenta rosa":       { bg: "#F8D0D0", text: "#7A1A1A" },
  "cravo":              { bg: "#E8C4A8", text: "#6B2A0E" },
  "açafrão":            { bg: "#FFD980", text: "#8B5000" },
  "incenso":            { bg: "#D8CCB8", text: "#4A3820" },
  "mirra":              { bg: "#C8B49A", text: "#3D2810" },
  "tabaco":             { bg: "#C8A870", text: "#3D2000" },
  "benjoim":            { bg: "#F0D8B0", text: "#6B4000" },

  // ── ALMISCARADOS — branco suave, neutro ──
  "almíscar":           { bg: "#F5F0E8", text: "#6B6050" },
  "almíscar branco":    { bg: "#F8F5F0", text: "#6B6050" },
  "âmbar cinza":        { bg: "#E8E4DC", text: "#5A5045" },
  "ambroxan":           { bg: "#EDE8DC", text: "#5A5040" },

  // ── AQUÁTICOS/FRESCOS — azul claro ──
  "musgo aquático":     { bg: "#D8EEF4", text: "#1A5A6B" },
  "alga marinha":       { bg: "#C8E8F0", text: "#0A4A5A" },
  "água marinha":       { bg: "#D0ECF4", text: "#1A4A5A" },

  // ── VERDES/HERBAIS — verde natureza ──
  "lavanda":            { bg: "#E8E0F0", text: "#4A3870" },
  "hortelã":            { bg: "#D4EED4", text: "#1A5A1A" },
  "feno":               { bg: "#E8E8C0", text: "#5A5A00" },
  "musgo de carvalho":  { bg: "#C8D4B0", text: "#2A4010" },

  // ── GOURMAND — marrom doce, cacau ──
  "pralinê":            { bg: "#E8C898", text: "#5A2A00" },
  "cacau":              { bg: "#C8956C", text: "#3A1500" },
  "café":               { bg: "#C09060", text: "#3A1A00" },
  "mel":                { bg: "#FFD060", text: "#7A4000" },
  "caramelo":           { bg: "#E8A840", text: "#6A2A00" },
  "rum":                { bg: "#D4904C", text: "#5A1A00" },

  // ── FRUTADOS — tons de fruta ──
  "abacaxi":            { bg: "#FFF0A0", text: "#7A5A00" },
  "maçã":               { bg: "#E8F4D8", text: "#2A5A1A" },
  "cereja":             { bg: "#F4C0C0", text: "#7A0A0A" },
  "pêssego":            { bg: "#FFD8B0", text: "#7A3A00" },
  "framboesa":          { bg: "#F4C0D4", text: "#7A0A3A" },
  "groselha preta":     { bg: "#D8C0E0", text: "#4A0A6A" },
  "lichia":             { bg: "#FFE0E8", text: "#7A2040" },
}

// Retorna a cor da nota ou um padrão neutro se não encontrar
export function corDaNota(nota: string): CorNota {
  const chave = nota.toLowerCase().trim()
  return CORES_NOTAS[chave] ?? { bg: "var(--cor-borda)", text: "var(--cor-texto-suave)" }
}

// ============================================
// ARQUIVO: lib/contratiposData.ts
// O QUE FAZ: dados dos contratipos brasileiros — In The Box, JA Essence, Maison Viegas, Azza Parfum
// QUANDO MANDAR PRA IA: quando quiser adicionar marcas ou perfumes
// DEPENDE DE: nada
// ============================================

export interface PerfumeContratipo {
  id: string
  nome: string
  marca: string
  tipo: "EDP" | "EDT" | "EDC" | "Extrait"
  genero: "Masculino" | "Feminino" | "Unissex"
  inspiradoEm: string
  marcaOriginal: string
  familia: string
  notas: string[]
  preco_brl: number
  categoria: "contratipo"
}

export const CONTRATIPOS: PerfumeContratipo[] = [

  // ─── IN THE BOX ───────────────────────────────────────────
  { id: "itb-aventhis-2010", nome: "Aventhis 2010", marca: "In The Box", tipo: "EDP", genero: "Masculino", inspiradoEm: "Aventus (fórmula 2010)", marcaOriginal: "Creed", familia: "Frutal Amadeirado", notas: ["Abacaxi", "Bergamota", "Maçã Verde", "Bétula", "Oakmoss", "Almíscar", "Âmbar"], preco_brl: 189.90, categoria: "contratipo" },
  { id: "itb-new-aventhis", nome: "New Aventhis", marca: "In The Box", tipo: "EDP", genero: "Masculino", inspiradoEm: "Aventus (2018)", marcaOriginal: "Creed", familia: "Frutal Amadeirado", notas: ["Abacaxi", "Bétula Defumada", "Almíscar", "Âmbar", "Patchouli"], preco_brl: 189.90, categoria: "contratipo" },
  { id: "itb-colossus", nome: "Colossus", marca: "In The Box", tipo: "EDP", genero: "Masculino", inspiradoEm: "Pegasus", marcaOriginal: "Parfums de Marly", familia: "Floral Amadeirado", notas: ["Heliotropo", "Baunilha", "Sândalo", "Almíscar Branco", "Bergamota"], preco_brl: 179.90, categoria: "contratipo" },
  { id: "itb-lord-town", nome: "Lord Town", marca: "In The Box", tipo: "EDP", genero: "Masculino", inspiradoEm: "Layton", marcaOriginal: "Parfums de Marly", familia: "Floral Amadeirado", notas: ["Maçã", "Bergamota", "Lavanda", "Jasmim", "Baunilha", "Sândalo", "Patchouli"], preco_brl: 179.90, categoria: "contratipo" },
  { id: "itb-nero-del-porto", nome: "Nero Del Porto", marca: "In The Box", tipo: "EDP", genero: "Masculino", inspiradoEm: "Neroli Portofino", marcaOriginal: "Tom Ford", familia: "Cítrico Floral", notas: ["Bergamota", "Mandarina", "Néroli", "Flor de Laranjeira", "Jasmim", "Âmbar"], preco_brl: 169.90, categoria: "contratipo" },
  { id: "itb-irish-green-man", nome: "Irish Green Man", marca: "In The Box", tipo: "EDP", genero: "Masculino", inspiradoEm: "Green Irish Tweed", marcaOriginal: "Creed", familia: "Amadeirado Floral", notas: ["Limão", "Íris", "Violeta", "Sândalo", "Almíscar", "Âmbar"], preco_brl: 169.90, categoria: "contratipo" },
  { id: "itb-dark-water", nome: "Dark Water", marca: "In The Box", tipo: "EDP", genero: "Masculino", inspiradoEm: "Acqua di Giò Profumo", marcaOriginal: "Giorgio Armani", familia: "Aquático Amadeirado", notas: ["Bergamota", "Geranium", "Incenso", "Patchouli", "Âmbar Cinzento"], preco_brl: 159.90, categoria: "contratipo" },
  { id: "itb-sweetobacco", nome: "Sweetobacco", marca: "In The Box", tipo: "EDP", genero: "Unissex", inspiradoEm: "Tobacco Vanille", marcaOriginal: "Tom Ford", familia: "Oriental Especiado", notas: ["Tabaco", "Baunilha", "Cacau", "Especiarias", "Madeira de Tonka"], preco_brl: 189.90, categoria: "contratipo" },
  { id: "itb-cherry-lush", nome: "Cherry Lush", marca: "In The Box", tipo: "EDP", genero: "Unissex", inspiradoEm: "Lost Cherry", marcaOriginal: "Tom Ford", familia: "Oriental Frutado", notas: ["Cereja Amarga", "Licor de Amêndoa", "Baunilha", "Benjoim", "Sândalo"], preco_brl: 179.90, categoria: "contratipo" },
  { id: "itb-sweet-from-heaven", nome: "Sweet From Heaven", marca: "In The Box", tipo: "EDP", genero: "Unissex", inspiradoEm: "Angels' Share", marcaOriginal: "Kilian", familia: "Oriental Gourmand", notas: ["Conhaque", "Canela", "Baunilha", "Carvalho", "Tonka"], preco_brl: 189.90, categoria: "contratipo" },
  { id: "itb-unique-red", nome: "Unique Red", marca: "In The Box", tipo: "EDP", genero: "Unissex", inspiradoEm: "Baccarat Rouge 540", marcaOriginal: "Maison Francis Kurkdjian", familia: "Floral Amadeirado", notas: ["Jasmim", "Açafrão", "Ambroxan", "Cedro", "Foin Coupé"], preco_brl: 199.90, categoria: "contratipo" },
  { id: "itb-real-lignum", nome: "Real Lignum", marca: "In The Box", tipo: "EDP", genero: "Unissex", inspiradoEm: "Erba Pura", marcaOriginal: "Xerjoff", familia: "Frutado Almiscarado", notas: ["Laranja Siciliana", "Frutas Tropicais", "Almíscar Branco", "Âmbar", "Sândalo"], preco_brl: 179.90, categoria: "contratipo" },
  { id: "itb-makathen", nome: "Makathén", marca: "In The Box", tipo: "EDP", genero: "Unissex", inspiradoEm: "Hacivat", marcaOriginal: "Nishane", familia: "Amadeirado Frutado", notas: ["Abacaxi", "Bergamota", "Hortelã", "Cedro", "Patchouli", "Almíscar"], preco_brl: 179.90, categoria: "contratipo" },
  { id: "itb-the-barbarian", nome: "The Barbarian", marca: "In The Box", tipo: "EDP", genero: "Masculino", inspiradoEm: "Viking", marcaOriginal: "Creed", familia: "Fresco Amadeirado", notas: ["Bergamota", "Rosa", "Lavanda", "Pimenta Rosa", "Sândalo", "Almíscar"], preco_brl: 179.90, categoria: "contratipo" },
  { id: "itb-black-flower", nome: "Black Flower", marca: "In The Box", tipo: "EDP", genero: "Unissex", inspiradoEm: "Black Orchid", marcaOriginal: "Tom Ford", familia: "Floral Oriental", notas: ["Trufa Negra", "Bergamota", "Orquídea Negra", "Patchouli", "Sândalo", "Vetiver"], preco_brl: 169.90, categoria: "contratipo" },
  { id: "itb-essenza-nobile", nome: "Essenza Nobile", marca: "In The Box", tipo: "EDP", genero: "Masculino", inspiradoEm: "Acqua di Parma Colonia", marcaOriginal: "Acqua di Parma", familia: "Cítrico Aromático", notas: ["Limão Siciliano", "Bergamota", "Lavanda", "Rosmaninho", "Cedro", "Vetiver"], preco_brl: 159.90, categoria: "contratipo" },
  { id: "itb-addope", nome: "Addope", marca: "In The Box", tipo: "EDP", genero: "Feminino", inspiradoEm: "Dior Addict", marcaOriginal: "Dior", familia: "Floral Oriental", notas: ["Baunilha", "Rosa", "Jasmim", "Mandarina", "Almíscar"], preco_brl: 159.90, categoria: "contratipo" },
  { id: "itb-bad-girl", nome: "Bad Girl", marca: "In The Box", tipo: "EDP", genero: "Feminino", inspiradoEm: "Good Girl", marcaOriginal: "Carolina Herrera", familia: "Floral Oriental", notas: ["Amêndoa", "Tuberosa", "Fava Tonka", "Cacau", "Café"], preco_brl: 159.90, categoria: "contratipo" },
  { id: "itb-black-couture", nome: "Black Couture", marca: "In The Box", tipo: "EDP", genero: "Feminino", inspiradoEm: "Black Opium EDP", marcaOriginal: "Yves Saint Laurent", familia: "Floral Gourmand", notas: ["Café", "Baunilha", "Rosa Branca", "Almíscar", "Patchouli"], preco_brl: 159.90, categoria: "contratipo" },
  { id: "itb-lux-de-vie", nome: "Lux de Vie", marca: "In The Box", tipo: "EDP", genero: "Feminino", inspiradoEm: "La Vie Est Belle", marcaOriginal: "Lancôme", familia: "Floral Gourmand", notas: ["Pralinê de Íris", "Jasmim", "Baunilha", "Patchouli", "Almíscar"], preco_brl: 149.90, categoria: "contratipo" },
  { id: "itb-supremo-absolu", nome: "Supremo Absolu", marca: "In The Box", tipo: "EDP", genero: "Masculino", inspiradoEm: "Aventus Absolu", marcaOriginal: "Creed", familia: "Frutal Oriental", notas: ["Abacaxi", "Bergamota", "Baunilha", "Âmbar", "Almíscar"], preco_brl: 199.90, categoria: "contratipo" },

  // ─── JA ESSENCE DE LA VIE ────────────────────────────────
  { id: "ja-guerre-paix", nome: "Guerre Paix", marca: "JA Essence", tipo: "EDP", genero: "Masculino", inspiradoEm: "Aventus", marcaOriginal: "Creed", familia: "Frutal Amadeirado", notas: ["Abacaxi", "Bergamota", "Bétula", "Patchouli", "Oakmoss", "Almíscar"], preco_brl: 159.90, categoria: "contratipo" },
  { id: "ja-chevalier", nome: "Chevalier", marca: "JA Essence", tipo: "EDP", genero: "Masculino", inspiradoEm: "Layton", marcaOriginal: "Parfums de Marly", familia: "Floral Amadeirado", notas: ["Maçã", "Bergamota", "Lavanda", "Jasmim", "Baunilha", "Sândalo"], preco_brl: 149.90, categoria: "contratipo" },
  { id: "ja-ombre", nome: "Ombre", marca: "JA Essence", tipo: "EDP", genero: "Unissex", inspiradoEm: "Hacivat", marcaOriginal: "Nishane", familia: "Amadeirado Frutado", notas: ["Abacaxi", "Bergamota", "Hortelã", "Cedro", "Patchouli", "Almíscar"], preco_brl: 149.90, categoria: "contratipo" },
  { id: "ja-joie-de-vivre", nome: "Joie de Vivre", marca: "JA Essence", tipo: "EDP", genero: "Unissex", inspiradoEm: "Erba Pura", marcaOriginal: "Xerjoff", familia: "Frutado Almiscarado", notas: ["Laranja Siciliana", "Bergamota", "Frutas Tropicais", "Almíscar Branco", "Sândalo"], preco_brl: 149.90, categoria: "contratipo" },
  { id: "ja-imperial", nome: "Imperial", marca: "JA Essence", tipo: "EDP", genero: "Unissex", inspiradoEm: "Millésime Impérial", marcaOriginal: "Creed", familia: "Aquático Almiscarado", notas: ["Limão Siciliano", "Melão", "Almíscar do Ártico", "Íris", "Âmbar Cinza"], preco_brl: 159.90, categoria: "contratipo" },
  { id: "ja-imaginary-trip", nome: "Imaginary Trip", marca: "JA Essence", tipo: "EDP", genero: "Unissex", inspiradoEm: "Bal d'Afrique", marcaOriginal: "Byredo", familia: "Floral Amadeirado", notas: ["Bergamota", "Cardamomo", "Ylang-Ylang", "Violeta", "Almíscar", "Vetiver"], preco_brl: 149.90, categoria: "contratipo" },
  { id: "ja-narcotique", nome: "Narcotique", marca: "JA Essence", tipo: "EDP", genero: "Unissex", inspiradoEm: "Black Afgano", marcaOriginal: "Nasomatto", familia: "Oriental Amadeirado", notas: ["Cannabis", "Oud", "Incenso", "Café", "Resina"], preco_brl: 149.90, categoria: "contratipo" },
  { id: "ja-black-ghost", nome: "Black Ghost", marca: "JA Essence", tipo: "EDP", genero: "Unissex", inspiradoEm: "Black Phantom", marcaOriginal: "Kilian", familia: "Oriental Gourmand", notas: ["Rum", "Açúcar de Cana", "Caramelo", "Baunilha", "Tabaco"], preco_brl: 159.90, categoria: "contratipo" },
  { id: "ja-seduction", nome: "Seduction and Protection", marca: "JA Essence", tipo: "EDP", genero: "Unissex", inspiradoEm: "Back to Black", marcaOriginal: "Kilian", familia: "Oriental Tabacado", notas: ["Mel", "Tabaco", "Baunilha", "Patchouli", "Almíscar"], preco_brl: 159.90, categoria: "contratipo" },
  { id: "ja-cheval", nome: "Cheval", marca: "JA Essence", tipo: "EDP", genero: "Masculino", inspiradoEm: "Herod", marcaOriginal: "Parfums de Marly", familia: "Oriental Especiado", notas: ["Tabaco", "Baunilha", "Pimenta", "Âmbar", "Cedro"], preco_brl: 149.90, categoria: "contratipo" },
  { id: "ja-luxury-oud", nome: "Luxury Oud", marca: "JA Essence", tipo: "EDP", genero: "Unissex", inspiradoEm: "Oud for Greatness", marcaOriginal: "Initio Parfums Prives", familia: "Oriental Amadeirado", notas: ["Oud", "Almíscar", "Âmbar", "Safras", "Sândalo"], preco_brl: 169.90, categoria: "contratipo" },
  { id: "ja-le-chaos", nome: "Le Chaos", marca: "JA Essence", tipo: "EDP", genero: "Masculino", inspiradoEm: "Interlude Man", marcaOriginal: "Amouage", familia: "Oriental Amadeirado", notas: ["Oud", "Incenso", "Âmbar", "Tabaco", "Patchouli"], preco_brl: 159.90, categoria: "contratipo" },
  { id: "ja-radiant", nome: "Radiant", marca: "JA Essence", tipo: "EDP", genero: "Feminino", inspiradoEm: "Carlise", marcaOriginal: "Parfums de Marly", familia: "Floral Frutal", notas: ["Pêssego", "Bergamota", "Rosa", "Jasmim", "Almíscar", "Cedro"], preco_brl: 149.90, categoria: "contratipo" },
  { id: "ja-bad-girl", nome: "Bad Girl", marca: "JA Essence", tipo: "EDP", genero: "Feminino", inspiradoEm: "Good Girl Gone Bad", marcaOriginal: "Kilian", familia: "Floral Frutal", notas: ["Toranja", "Framboesa", "Rosa", "Jasmim", "Almíscar Branco"], preco_brl: 149.90, categoria: "contratipo" },
  { id: "ja-very", nome: "Very", marca: "JA Essence", tipo: "EDP", genero: "Feminino", inspiradoEm: "Very Good Girl", marcaOriginal: "Carolina Herrera", familia: "Floral Frutal", notas: ["Lichia", "Framboesa", "Rosa", "Almíscar Branco", "Cedro"], preco_brl: 139.90, categoria: "contratipo" },

  // ─── MAISON VIEGAS ───────────────────────────────────────
  { id: "mv-ultramare", nome: "Ultramare", marca: "Maison Viegas", tipo: "EDP", genero: "Masculino", inspiradoEm: "Megamare", marcaOriginal: "Orto Parisi", familia: "Aquático Salgado", notas: ["Alga Marinha", "Âmbar Cinzento", "Almíscar", "Madeira de Cássia", "Cedro"], preco_brl: 149.90, categoria: "contratipo" },
  { id: "mv-grand-tygar", nome: "Grand Tygar", marca: "Maison Viegas", tipo: "EDP", genero: "Masculino", inspiradoEm: "Tygar", marcaOriginal: "Bvlgari", familia: "Amadeirado Especiado", notas: ["Bergamota", "Pimenta Preta", "Cedro", "Vetiver", "Âmbar"], preco_brl: 139.90, categoria: "contratipo" },
  { id: "mv-corsario", nome: "Corsário", marca: "Maison Viegas", tipo: "EDP", genero: "Masculino", inspiradoEm: "Le Male (2006)", marcaOriginal: "Jean Paul Gaultier", familia: "Oriental Fougère", notas: ["Lavanda", "Baunilha", "Menta", "Sândalo", "Almíscar"], preco_brl: 109.90, categoria: "contratipo" },
  { id: "mv-dubai-gold", nome: "Dubai Gold", marca: "Maison Viegas", tipo: "EDP", genero: "Masculino", inspiradoEm: "Bahar", marcaOriginal: "The Spirit of Dubai", familia: "Oriental Amadeirado", notas: ["Oud", "Rosa", "Âmbar", "Almíscar", "Especiarias"], preco_brl: 129.90, categoria: "contratipo" },
  { id: "mv-vortex", nome: "Vortex", marca: "Maison Viegas", tipo: "EDP", genero: "Masculino", inspiradoEm: "Apex Pour Homme", marcaOriginal: "Parfums de Marly", familia: "Amadeirado Aromático", notas: ["Cardamomo", "Bergamota", "Sândalo", "Âmbar", "Almíscar"], preco_brl: 129.90, categoria: "contratipo" },
  { id: "mv-summer-citrus", nome: "Summer Citrus", marca: "Maison Viegas", tipo: "EDP", genero: "Masculino", inspiradoEm: "Perseus", marcaOriginal: "Parfums de Marly", familia: "Cítrico Aromático", notas: ["Limão", "Bergamota", "Neroli", "Cedro", "Almíscar"], preco_brl: 129.90, categoria: "contratipo" },
  { id: "mv-amber-absolu", nome: "Amber Absolu", marca: "Maison Viegas", tipo: "EDP", genero: "Masculino", inspiradoEm: "Boss Bottled Absolu", marcaOriginal: "Hugo Boss", familia: "Oriental Amadeirado", notas: ["Maçã", "Canela", "Âmbar", "Sândalo", "Baunilha"], preco_brl: 129.90, categoria: "contratipo" },
  { id: "mv-jazz-master", nome: "Jazz Master", marca: "Maison Viegas", tipo: "EDP", genero: "Masculino", inspiradoEm: "Jazz Club", marcaOriginal: "Maison Margiela", familia: "Oriental Amadeirado", notas: ["Rum", "Tabaco", "Baunilha", "Fava Tonka", "Cedro"], preco_brl: 149.90, categoria: "contratipo" },
  { id: "mv-heaven", nome: "Heaven", marca: "Maison Viegas", tipo: "EDP", genero: "Unissex", inspiradoEm: "Imagination", marcaOriginal: "Louis Vuitton", familia: "Aquático Almiscarado", notas: ["Bergamota", "Água Marinha", "Cedro", "Almíscar Branco", "Âmbar"], preco_brl: 169.90, categoria: "contratipo" },
  { id: "mv-iris-affair", nome: "Iris Affair", marca: "Maison Viegas", tipo: "EDP", genero: "Unissex", inspiradoEm: "Iris Silver Mist", marcaOriginal: "Serge Lutens", familia: "Floral Pó", notas: ["Íris", "Violeta", "Almíscar", "Madeira", "Baunilha"], preco_brl: 149.90, categoria: "contratipo" },

  // ─── AZZA PARFUM ─────────────────────────────────────────
  { id: "azza-imperialle", nome: "Imperialle", marca: "Azza Parfum", tipo: "EDP", genero: "Unissex", inspiradoEm: "Millésime Impérial", marcaOriginal: "Creed", familia: "Aquático Almiscarado", notas: ["Limão Siciliano", "Melão", "Almíscar do Ártico", "Íris", "Âmbar Cinza"], preco_brl: 179.90, categoria: "contratipo" },
  { id: "azza-baccarat", nome: "Baccarat Gold", marca: "Azza Parfum", tipo: "EDP", genero: "Unissex", inspiradoEm: "Baccarat Rouge 540", marcaOriginal: "Maison Francis Kurkdjian", familia: "Floral Amadeirado", notas: ["Jasmim", "Açafrão", "Ambroxan", "Cedro", "Foin Coupé"], preco_brl: 199.90, categoria: "contratipo" },
  { id: "azza-erba-pura", nome: "Erba Pura", marca: "Azza Parfum", tipo: "EDP", genero: "Unissex", inspiradoEm: "Erba Pura", marcaOriginal: "Xerjoff", familia: "Frutado Almiscarado", notas: ["Laranja Siciliana", "Frutas Tropicais", "Almíscar Branco", "Âmbar", "Sândalo"], preco_brl: 179.90, categoria: "contratipo" },
  { id: "azza-pegasus", nome: "Pegasus", marca: "Azza Parfum", tipo: "EDP", genero: "Masculino", inspiradoEm: "Pegasus", marcaOriginal: "Parfums de Marly", familia: "Floral Amadeirado", notas: ["Heliotropo", "Baunilha", "Sândalo", "Almíscar Branco", "Bergamota"], preco_brl: 169.90, categoria: "contratipo" },
  { id: "azza-grand-soir", nome: "Grand Soir", marca: "Azza Parfum", tipo: "EDP", genero: "Unissex", inspiradoEm: "Grand Soir", marcaOriginal: "Maison Francis Kurkdjian", familia: "Oriental Baunilhado", notas: ["Âmbar", "Fava Tonka", "Baunilha", "Almíscar", "Incenso"], preco_brl: 189.90, categoria: "contratipo" },
  { id: "azza-afgano", nome: "Afgano", marca: "Azza Parfum", tipo: "EDP", genero: "Unissex", inspiradoEm: "Afghan Rose", marcaOriginal: "Memo Paris", familia: "Floral Oriental", notas: ["Rosa de Damasco", "Oud", "Patchouli", "Baunilha", "Almíscar"], preco_brl: 179.90, categoria: "contratipo" },
  { id: "azza-tobacco-oud", nome: "Tobacco Oud", marca: "Azza Parfum", tipo: "EDP", genero: "Masculino", inspiradoEm: "Tobacco Oud", marcaOriginal: "Tom Ford", familia: "Oriental Amadeirado", notas: ["Tabaco", "Oud", "Cedro", "Rosa", "Âmbar"], preco_brl: 189.90, categoria: "contratipo" },
  { id: "azza-hacivat", nome: "Hacivat", marca: "Azza Parfum", tipo: "EDP", genero: "Unissex", inspiradoEm: "Hacivat", marcaOriginal: "Nishane", familia: "Amadeirado Frutado", notas: ["Abacaxi", "Bergamota", "Hortelã", "Cedro", "Patchouli", "Almíscar"], preco_brl: 169.90, categoria: "contratipo" },
]

// ── Funções auxiliares ───────────────────────────────────────────────────────

export function buscarTodosContratipos(): PerfumeContratipo[] {
  return CONTRATIPOS
}

export function buscarContratiposPorMarca(marca: string): PerfumeContratipo[] {
  return CONTRATIPOS.filter((p) => p.marca.toLowerCase() === marca.toLowerCase())
}

export function buscarContratiposPorGenero(
  genero: "Masculino" | "Feminino" | "Unissex"
): PerfumeContratipo[] {
  return CONTRATIPOS.filter((p) => p.genero === genero)
}

export function buscarContratiposPorInspiracao(nome: string): PerfumeContratipo[] {
  const q = nome.toLowerCase()
  return CONTRATIPOS.filter(
    (p) =>
      p.inspiradoEm.toLowerCase().includes(q) ||
      p.marcaOriginal.toLowerCase().includes(q)
  )
}

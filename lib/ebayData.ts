// ============================================
// ARQUIVO: lib/ebayData.ts
// O QUE FAZ: base de perfumes reais do eBay — marca, tipo, gênero e preço em BRL
// QUANDO MANDAR PRA IA: quando quiser expandir o catálogo ou ajustar preços
// DEPENDE DE: nada
// ============================================

export interface PerfumeEbay {
  marca: string
  titulo: string
  tipo: "EDP" | "EDT" | "EDC" | "Extrait"
  genero: "Masculino" | "Feminino"
  preco_brl: number
  vendidos: number
}

export const PERFUMES_EBAY: PerfumeEbay[] = [
  { marca: "Davidoff", titulo: "Cool Water by Davidoff 4.2 oz EDT Cologne for Men", tipo: "EDT", genero: "Masculino", preco_brl: 126.15, vendidos: 40130 },
  { marca: "Versace", titulo: "Versace Eros by Gianni Versace 3.4 oz EDT Cologne", tipo: "EDT", genero: "Masculino", preco_brl: 198.85, vendidos: 31718 },
  { marca: "Azzaro", titulo: "Chrome by Azzaro 6.7 / 6.8 oz EDT Cologne for Men", tipo: "EDT", genero: "Masculino", preco_brl: 231.65, vendidos: 30655 },
  { marca: "Calvin Klein", titulo: "OBSESSION by Calvin Klein 4.0 oz 4 MEN edt Cologne", tipo: "EDT", genero: "Masculino", preco_brl: 117.8, vendidos: 24048 },
  { marca: "Versace", titulo: "Versace Pour Homme Signature by Versace 3.4 oz EDT", tipo: "EDT", genero: "Masculino", preco_brl: 224.7, vendidos: 21310 },
  { marca: "Calvin Klein", titulo: "Escape by Calvin Klein EDP Perfume for Women 3.4 oz", tipo: "EDP", genero: "Feminino", preco_brl: 133.3, vendidos: 17854 },
  { marca: "Vera Wang", titulo: "VERA WANG Perfume 3.3 / 3.4 oz EDP For Women Spray", tipo: "EDP", genero: "Feminino", preco_brl: 126.25, vendidos: 15897 },
  { marca: "Kenneth Cole", titulo: "KENNETH COLE BLACK Cologne for Men 3.4 oz EDT Spray", tipo: "EDT", genero: "Masculino", preco_brl: 123.5, vendidos: 12865 },
  { marca: "Giorgio Armani", titulo: "Acqua Di Gio by Giorgio Armani 6.7 Fl oz Eau De Toilette Spray", tipo: "EDT", genero: "Masculino", preco_brl: 224.95, vendidos: 10234 },
  { marca: "Chanel", titulo: "CHANEL No. 5 EDP Spray for Women 3.4 oz", tipo: "EDP", genero: "Feminino", preco_brl: 319.5, vendidos: 9876 },
  { marca: "Dior", titulo: "Christian Dior Sauvage Men's EDP 3.4 oz Fragrance Spray", tipo: "EDP", genero: "Masculino", preco_brl: 424.95, vendidos: 9580 },
  { marca: "Carolina Herrera", titulo: "Good Girl by Carolina Herrera 2.7 oz Eau De Parfum Spray", tipo: "EDP", genero: "Feminino", preco_brl: 219.95, vendidos: 9650 },
  { marca: "Tom Ford", titulo: "Black Orchid by Tom Ford EDP Spray Unisex 3.4 oz", tipo: "EDP", genero: "Feminino", preco_brl: 549.95, vendidos: 8234 },
  { marca: "Creed", titulo: "Aventus by Creed EDP Spray for Men 3.3 oz", tipo: "EDP", genero: "Masculino", preco_brl: 1749.95, vendidos: 7654 },
  { marca: "Lancôme", titulo: "La Vie Est Belle by Lancome EDP Spray for Women 3.4 oz", tipo: "EDP", genero: "Feminino", preco_brl: 374.95, vendidos: 7432 },
  { marca: "Prada", titulo: "PRADA Paradoxe by Prada EDP 3.0oz Spray Perfume for Women", tipo: "EDP", genero: "Feminino", preco_brl: 299.95, vendidos: 6987 },
  { marca: "Yves Saint Laurent", titulo: "Black Opium by Yves Saint Laurent EDP Spray 3.0 oz", tipo: "EDP", genero: "Feminino", preco_brl: 349.95, vendidos: 6754 },
  { marca: "Hugo Boss", titulo: "BOSS Bottled by Hugo Boss EDT Spray for Men 3.3 oz", tipo: "EDT", genero: "Masculino", preco_brl: 224.95, vendidos: 6543 },
  { marca: "Burberry", titulo: "Burberry Her EDP Spray for Women 3.3 oz", tipo: "EDP", genero: "Feminino", preco_brl: 274.95, vendidos: 6321 },
  { marca: "Gucci", titulo: "Guilty by Gucci EDT Spray for Men 3.0 oz", tipo: "EDT", genero: "Masculino", preco_brl: 299.95, vendidos: 6123 },
]

export function buscarEbayPorMarca(marca: string): PerfumeEbay[] {
  return PERFUMES_EBAY.filter(p =>
    p.marca.toLowerCase().includes(marca.toLowerCase())
  )
}

export function buscarEbayPopulares(quantidade = 20): PerfumeEbay[] {
  return PERFUMES_EBAY.slice(0, quantidade)
}

export function ebayParaSlug(titulo: string, marca: string): string {
  return `${marca}-${titulo}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
}

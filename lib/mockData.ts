// ============================================
// ARQUIVO: lib/mockData.ts
// O QUE FAZ: perfumes de exemplo para o site funcionar sem chave da Fragella API
// QUANDO MANDAR PRA IA: quando quiser adicionar ou editar os perfumes de exemplo
// DEPENDE DE: lib/fragella.ts (tipo PerfumeFragella)
// ============================================

import type { PerfumeFragella } from "./fragella"
import type { Acorde } from "@/lib/types"

// Perfume com acordes para a página de detalhe
export interface PerfumeMock extends PerfumeFragella {
  acordes: Acorde[]
}

export const PERFUMES_MOCK: PerfumeMock[] = [
  {
    id: "santal-33",
    nome: "Santal 33",
    marca: "Le Labo",
    concentracao: "EDP",
    genero: "Unissex",
    ano: 2011,
    familia: "Amadeirado",
    descricao:
      "Santal 33 captura a essência de uma fogueira ao entardecer em algum lugar entre o deserto americano e um apartamento europeu. É sandalwood cru, couro seco e uma fumaça que fica — o tipo de perfume que as pessoas perguntam o que é.",
    notasTopo: ["Cardamomo", "Íris", "Violeta"],
    notasCoracao: ["Ambroxan", "Sândalo", "Cedro"],
    notasFundo: ["Almíscar", "Couro", "Cássia"],
    imagem: "",
    acordes: [
      { nome: "Amadeirado", porcentagem: 95 },
      { nome: "Couro", porcentagem: 72 },
      { nome: "Sândalo", porcentagem: 68 },
      { nome: "Almiscarado", porcentagem: 54 },
      { nome: "Defumado", porcentagem: 48 },
    ],
  },
  {
    id: "sauvage-dior",
    nome: "Sauvage",
    marca: "Dior",
    concentracao: "EDP",
    genero: "Masculino",
    ano: 2015,
    familia: "Fresco Especiado",
    descricao:
      "Um fresco que não é frivo. Sauvage EDP traz bergamota de Calábria no topo, depois seca em Sichuan pepper e Ambroxan — o ingrediente que gera aquela silagem densa que faz você ser lembrado em qualquer ambiente.",
    notasTopo: ["Bergamota", "Pimenta de Sichuan"],
    notasCoracao: ["Lavanda", "Pimenta Rosa", "Vetiver"],
    notasFundo: ["Ambroxan", "Cedro", "Almíscar"],
    imagem: "",
    acordes: [
      { nome: "Fresco", porcentagem: 88 },
      { nome: "Aromático", porcentagem: 80 },
      { nome: "Amadeirado", porcentagem: 65 },
      { nome: "Especiado", porcentagem: 60 },
      { nome: "Almiscarado", porcentagem: 45 },
    ],
  },
  {
    id: "black-orchid",
    nome: "Black Orchid",
    marca: "Tom Ford",
    concentracao: "EDP",
    genero: "Unissex",
    ano: 2006,
    familia: "Floral Oriental",
    descricao:
      "Luxuoso e deliberadamente sensual. Black Orchid é uma declaração — trufa negra, bergamota e orquídea escura construídos sobre uma base de sândalo e patchouli. Não é para qualquer hora, mas quando é a hora, não há nada parecido.",
    notasTopo: ["Trufa Negra", "Bergamota", "Ylang Ylang"],
    notasCoracao: ["Orquídea Negra", "Gardênia", "Lótus"],
    notasFundo: ["Patchouli", "Sândalo", "Vetiver"],
    imagem: "",
    acordes: [
      { nome: "Floral", porcentagem: 82 },
      { nome: "Oriental", porcentagem: 78 },
      { nome: "Amadeirado", porcentagem: 70 },
      { nome: "Terroso", porcentagem: 55 },
      { nome: "Doce", porcentagem: 42 },
    ],
  },
  {
    id: "chance-eau-tendre",
    nome: "Chance Eau Tendre",
    marca: "Chanel",
    concentracao: "EDP",
    genero: "Feminino",
    ano: 2010,
    familia: "Floral Fresco",
    descricao:
      "Chance Eau Tendre é luminosidade em frasco. Toranja e jacinto no topo, jasmim no coração, white musk e âmbar no fundo — uma composição que parece segunda pele e que agrada tanto quem usa quanto quem sente.",
    notasTopo: ["Toranja", "Limão", "Jasmim"],
    notasCoracao: ["Jacinto", "Íris", "Jasmim"],
    notasFundo: ["White Musk", "Âmbar", "Cedro"],
    imagem: "",
    acordes: [
      { nome: "Floral", porcentagem: 90 },
      { nome: "Fresco", porcentagem: 75 },
      { nome: "Cítrico", porcentagem: 68 },
      { nome: "Almiscarado", porcentagem: 52 },
      { nome: "Doce", porcentagem: 38 },
    ],
  },
  {
    id: "aventus",
    nome: "Aventus",
    marca: "Creed",
    concentracao: "EDP",
    genero: "Masculino",
    ano: 2010,
    familia: "Frutal Amadeirado",
    descricao:
      "O perfume de referência de uma geração. Abacaxi defumado sobre uma base de bétula, almíscar e âmbar. Aventus tem um DNA inconfundível — projeção densa, fixação de horas. Entenda o mito.",
    notasTopo: ["Abacaxi", "Bergamota", "Maçã"],
    notasCoracao: ["Rosa", "Jasmim", "Patchouli"],
    notasFundo: ["Bétula", "Almíscar", "Âmbar", "Oakmoss"],
    imagem: "",
    acordes: [
      { nome: "Frutal", porcentagem: 85 },
      { nome: "Defumado", porcentagem: 75 },
      { nome: "Amadeirado", porcentagem: 70 },
      { nome: "Fresco", porcentagem: 55 },
      { nome: "Terroso", porcentagem: 45 },
    ],
  },
  {
    id: "la-vie-est-belle",
    nome: "La Vie Est Belle",
    marca: "Lancôme",
    concentracao: "EDP",
    genero: "Feminino",
    ano: 2012,
    familia: "Floral Gourmand",
    descricao:
      "O nome não mente. La Vie Est Belle é um gourmand que não pesa — pralinê de íris, baunilha e almíscar criam uma doçura precisa. Um dos mais vendidos do mundo, e justificadamente.",
    notasTopo: ["Groselha Preta", "Pêra"],
    notasCoracao: ["Íris", "Jasmim", "Frésia"],
    notasFundo: ["Pralinê", "Baunilha", "Patchouli", "Almíscar"],
    imagem: "",
    acordes: [
      { nome: "Doce", porcentagem: 92 },
      { nome: "Gourmand", porcentagem: 85 },
      { nome: "Floral", porcentagem: 65 },
      { nome: "Almiscarado", porcentagem: 55 },
      { nome: "Frutal", porcentagem: 42 },
    ],
  },
]

// Busca um perfume mock pelo ID
export function buscarMockPorId(id: string): PerfumeMock | null {
  return PERFUMES_MOCK.find((p) => p.id === id) ?? null
}

// Retorna os primeiros N perfumes mock
export function buscarMockDestaques(quantidade = 4): PerfumeMock[] {
  return PERFUMES_MOCK.slice(0, quantidade)
}

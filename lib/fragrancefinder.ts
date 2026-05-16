// ============================================
// ARQUIVO: lib/fragrancefinder.ts
// O QUE FAZ: integração com a FragranceFinder API (RapidAPI) — busca dupes e alternativas de perfumes
// QUANDO MANDAR PRA IA: quando quiser mudar como as alternativas e dupes são encontrados
// DEPENDE DE: .env.local (RAPIDAPI_KEY, RAPIDAPI_HOST)
// ============================================

import axios from "axios"

// Credenciais da RapidAPI (vêm do .env.local)
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY ?? ""
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST ?? "fragrance-finder.p.rapidapi.com"

// Tipo que representa um perfume vindo da FragranceFinder
export interface PerfumeAlternativa {
  id: string
  nome: string
  marca: string
  similaridade: number // 0 a 100
  preco?: number
  notas: string[]
  imagem?: string
  ehDupe: boolean // true = inspirado em, false = similar sem intenção
}

// Cria um cliente HTTP já configurado para a RapidAPI
const cliente = axios.create({
  baseURL: `https://${RAPIDAPI_HOST}`,
  headers: {
    "x-rapidapi-key": RAPIDAPI_KEY,
    "x-rapidapi-host": RAPIDAPI_HOST,
    "Content-Type": "application/json",
  },
  timeout: 10000,
})

// Busca alternativas e dupes de um perfume pelo nome e marca
export async function buscarAlternativas(
  nomePerfume: string,
  marcaPerfume: string
): Promise<PerfumeAlternativa[]> {
  try {
    const resposta = await cliente.get("/alternatives", {
      params: {
        fragrance: nomePerfume,
        brand: marcaPerfume,
        limit: 5,
      },
    })
    return resposta.data?.results ?? []
  } catch (erro) {
    console.error("[FragranceFinder] Erro ao buscar alternativas:", erro)
    return []
  }
}

// Busca perfumes similares por notas olfativas — útil quando o consultor quer sugerir algo parecido
export async function buscarPorNotas(notas: string[]): Promise<PerfumeAlternativa[]> {
  try {
    const resposta = await cliente.get("/search-by-notes", {
      params: {
        notes: notas.join(","),
        limit: 10,
      },
    })
    return resposta.data?.results ?? []
  } catch (erro) {
    console.error("[FragranceFinder] Erro ao buscar por notas:", erro)
    return []
  }
}

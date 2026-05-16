// ============================================
// ARQUIVO: lib/fragella.ts
// O QUE FAZ: integração com a API Fragella — busca perfumes, detalhes e notas olfativas
// QUANDO MANDAR PRA IA: quando quiser mudar como os perfumes são buscados ou exibidos
// DEPENDE DE: .env.local (FRAGELLA_API_KEY, FRAGELLA_API_BASE_URL)
// ============================================

import axios from "axios"
import { buscarEbayPopulares, ebayParaSlug } from "@/lib/ebayData"

// Endereço base da API e chave de autenticação (vêm do .env.local)
const BASE_URL = process.env.FRAGELLA_API_BASE_URL ?? "https://api.fragella.com/v1"
const API_KEY = process.env.FRAGELLA_API_KEY ?? ""

// Tipo que representa um perfume vindo da Fragella
export interface PerfumeFragella {
  id: string
  nome: string
  marca: string
  concentracao: string // EDP, EDT, etc.
  genero: string // masculino, feminino, unissex
  ano: number
  notasTopo: string[]
  notasCoracao: string[]
  notasFundo: string[]
  familia: string // família olfativa
  descricao: string
  imagem: string
  preco?: number
}

// Tipo para os filtros de busca de perfumes
export interface FiltrosBusca {
  familia?: string
  genero?: string
  marca?: string
  notasIncluir?: string[]
  notasExcluir?: string[]
  precMin?: number
  precMax?: number
  pagina?: number
  porPagina?: number
}

// Cria um cliente HTTP já configurado com a autenticação
const cliente = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  },
  timeout: 10000,
})

// Busca perfumes com filtros — retorna lista paginada
export async function buscarPerfumes(filtros: FiltrosBusca = {}): Promise<PerfumeFragella[]> {
  try {
    const resposta = await cliente.get("/fragrances", {
      params: {
        family: filtros.familia,
        gender: filtros.genero,
        brand: filtros.marca,
        notes_include: filtros.notasIncluir?.join(","),
        notes_exclude: filtros.notasExcluir?.join(","),
        price_min: filtros.precMin,
        price_max: filtros.precMax,
        page: filtros.pagina ?? 1,
        per_page: filtros.porPagina ?? 20,
      },
    })
    return resposta.data.data ?? []
  } catch (erro) {
    console.error("[Fragella] Erro ao buscar perfumes:", erro)
    return []
  }
}

// Busca os detalhes completos de um perfume pelo ID
export async function buscarPerfumePorId(id: string): Promise<PerfumeFragella | null> {
  try {
    const resposta = await cliente.get(`/fragrances/${id}`)
    const data = resposta.data
    if (!data?.id || !data?.nome || !data?.marca) return null
    return data as PerfumeFragella
  } catch (erro) {
    console.error("[Fragella] Erro ao buscar perfume por ID:", erro)
    return null
  }
}

// Busca perfumes por nome — útil para a âncora do quiz (perfume atual do usuário)
export async function buscarPorNome(nome: string): Promise<PerfumeFragella[]> {
  try {
    const resposta = await cliente.get("/fragrances/search", {
      params: { q: nome, per_page: 5 },
    })
    return resposta.data.data ?? []
  } catch (erro) {
    console.error("[Fragella] Erro ao buscar por nome:", erro)
    return []
  }
}

// Busca perfumes em destaque para a página inicial
export async function buscarDestaques(): Promise<PerfumeFragella[]> {
  if (!API_KEY) {
    return buscarEbayPopulares(8).map((p) => ({
      id: ebayParaSlug(p.titulo, p.marca),
      nome: p.titulo.split(" by ")[0].split(/\s+\d/)[0].trim(),
      marca: p.marca,
      concentracao: p.tipo,
      genero: p.genero === "Masculino" ? "masculino" : "feminino",
      ano: 0,
      notasTopo: [],
      notasCoracao: [],
      notasFundo: [],
      familia: "",
      descricao: "",
      imagem: "",
      preco: p.preco_brl,
    }))
  }

  try {
    const resposta = await cliente.get("/fragrances/featured", {
      params: { per_page: 8 },
    })
    return resposta.data.data ?? []
  } catch (erro) {
    console.error("[Fragella] Erro ao buscar destaques:", erro)
    return buscarEbayPopulares(8).map((p) => ({
      id: ebayParaSlug(p.titulo, p.marca),
      nome: p.titulo.split(" by ")[0].split(/\s+\d/)[0].trim(),
      marca: p.marca,
      concentracao: p.tipo,
      genero: p.genero === "Masculino" ? "masculino" : "feminino",
      ano: 0,
      notasTopo: [],
      notasCoracao: [],
      notasFundo: [],
      familia: "",
      descricao: "",
      imagem: "",
      preco: p.preco_brl,
    }))
  }
}

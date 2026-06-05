// ============================================
// ARQUIVO: lib/contratiposData.ts
// O QUE FAZ: dados dos contratipos brasileiros — In The Box, JA Essence, Maison Viegas, Azza Parfum
// QUANDO MANDAR PRA IA: quando quiser adicionar marcas ou perfumes
// DEPENDE DE: data/contratipos.json
// Total: 138 perfumes
// ============================================

import dadosJson from "@/data/contratipos.json"

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
  disponivel?: boolean
}

export const CONTRATIPOS: PerfumeContratipo[] = dadosJson as PerfumeContratipo[]

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

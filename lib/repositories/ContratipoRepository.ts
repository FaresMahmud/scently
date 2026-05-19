// ============================================
// ARQUIVO: lib/repositories/ContratipoRepository.ts
// O QUE FAZ: camada de acesso aos contratipos brasileiros — nunca acesse os dados diretamente
// QUANDO MANDAR PRA IA: quando quiser mudar como os contratipos são buscados ou filtrados
// DEPENDE DE: data/contratipos.json
// ============================================

import type { IPerfumeRepository } from "./PerfumeRepository"
import type { PerfumeContratipo } from "@/lib/contratiposData"
import dados from "@/data/contratipos.json"

const CONTRATIPOS = dados as PerfumeContratipo[]

class ContratipoRepositoryImpl implements IPerfumeRepository<PerfumeContratipo> {
  findAll(): PerfumeContratipo[] {
    return CONTRATIPOS
  }

  findById(id: string): PerfumeContratipo | null {
    return CONTRATIPOS.find(p => p.id === id) ?? null
  }

  findByMarca(marca: string): PerfumeContratipo[] {
    return CONTRATIPOS.filter(p =>
      p.marca.toLowerCase() === marca.toLowerCase()
    )
  }

  findByGenero(genero: string): PerfumeContratipo[] {
    return CONTRATIPOS.filter(p =>
      p.genero.toLowerCase() === genero.toLowerCase()
    )
  }

  findByInspiracao(nome: string): PerfumeContratipo[] {
    const q = nome.toLowerCase()
    return CONTRATIPOS.filter(p =>
      p.inspiradoEm.toLowerCase().includes(q) ||
      p.marcaOriginal.toLowerCase().includes(q)
    )
  }

  findPopulares(quantidade = 30): PerfumeContratipo[] {
    return CONTRATIPOS.slice(0, quantidade)
  }
}

export const contratipoRepository = new ContratipoRepositoryImpl()
export type { PerfumeContratipo }

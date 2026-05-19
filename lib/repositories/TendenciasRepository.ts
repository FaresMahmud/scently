// ============================================
// ARQUIVO: lib/repositories/TendenciasRepository.ts
// O QUE FAZ: camada de acesso às tendências semanais — nunca acesse os dados diretamente
// QUANDO MANDAR PRA IA: quando quiser mudar como as tendências são buscadas ou filtradas
// DEPENDE DE: data/tendencias.json
// ============================================

import type { IPerfumeRepository } from "./PerfumeRepository"
import type { PerfumeTendencia } from "@/lib/tendencias"
import dados from "@/data/tendencias.json"

const TENDENCIAS = dados as PerfumeTendencia[]

class TendenciasRepositoryImpl implements IPerfumeRepository<PerfumeTendencia> {
  findAll(): PerfumeTendencia[] {
    return TENDENCIAS
  }

  findById(id: string): PerfumeTendencia | null {
    return TENDENCIAS.find(p => p.id === id) ?? null
  }

  findByMarca(marca: string): PerfumeTendencia[] {
    return TENDENCIAS.filter(p =>
      p.marca.toLowerCase().includes(marca.toLowerCase())
    )
  }

  findByGenero(_genero: string): PerfumeTendencia[] {
    // PerfumeTendencia não tem campo genero — retorna todos
    return TENDENCIAS
  }

  findByTipo(tipo: PerfumeTendencia["tipo"]): PerfumeTendencia[] {
    return TENDENCIAS.filter(p => p.tipo === tipo)
  }
}

export const tendenciasRepository = new TendenciasRepositoryImpl()
export type { PerfumeTendencia }

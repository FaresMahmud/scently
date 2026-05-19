// ============================================
// ARQUIVO: lib/repositories/EbayPerfumeRepository.ts
// O QUE FAZ: camada de acesso aos dados do eBay — nunca acesse os dados diretamente
// QUANDO MANDAR PRA IA: quando quiser mudar como os perfumes do eBay são buscados ou filtrados
// DEPENDE DE: lib/ebayData.ts (dados brutos — candidato a migração para data/ebay-perfumes.json)
// ============================================

import type { IPerfumeRepository } from "./PerfumeRepository"
import { PERFUMES_EBAY, ebayParaSlug } from "@/lib/ebayData"
import type { PerfumeEbay } from "@/lib/ebayData"

class EbayPerfumeRepositoryImpl implements IPerfumeRepository<PerfumeEbay> {
  findAll(): PerfumeEbay[] {
    return PERFUMES_EBAY
  }

  findById(id: string): PerfumeEbay | null {
    return PERFUMES_EBAY.find(p => ebayParaSlug(p.titulo, p.marca) === id) ?? null
  }

  findByMarca(marca: string): PerfumeEbay[] {
    return PERFUMES_EBAY.filter(p =>
      p.marca.toLowerCase().includes(marca.toLowerCase())
    )
  }

  findByGenero(genero: string): PerfumeEbay[] {
    return PERFUMES_EBAY.filter(p =>
      p.genero.toLowerCase() === genero.toLowerCase()
    )
  }

  findPopulares(quantidade = 20): PerfumeEbay[] {
    return PERFUMES_EBAY.slice(0, quantidade)
  }

  toSlug(titulo: string, marca: string): string {
    return ebayParaSlug(titulo, marca)
  }
}

export const ebayRepository = new EbayPerfumeRepositoryImpl()
export type { PerfumeEbay }

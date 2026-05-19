// ============================================
// ARQUIVO: lib/repositories/PerfumeRepository.ts
// O QUE FAZ: interface base que todos os repositórios de perfume devem implementar
// QUANDO MANDAR PRA IA: quando quiser adicionar métodos comuns a todos os repositórios
// DEPENDE DE: nada
// ============================================

export interface IPerfumeRepository<T> {
  findAll(): T[]
  findById(id: string): T | null
  findByMarca(marca: string): T[]
  findByGenero(genero: string): T[]
}

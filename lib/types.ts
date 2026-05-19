// ============================================
// ARQUIVO: lib/types.ts
// O QUE FAZ: interfaces compartilhadas entre lib/ e components/ — evita importações circulares
// QUANDO MANDAR PRA IA: quando precisar adicionar tipos usados em múltiplos lugares
// DEPENDE DE: nada
// ============================================

// Interface usada em AcordesPerfume e mockData
export interface Acorde {
  nome: string
  porcentagem: number // 0 a 100
}

// ============================================
// ARQUIVO: lib/tendencias.ts
// O QUE FAZ: perfumes em alta — atualizado semanalmente via curadoria
// QUANDO MANDAR PRA IA: quando quiser atualizar os perfumes em destaque
// DEPENDE DE: data/tendencias.json
// ============================================

import dadosJson from "@/data/tendencias.json"

export interface PerfumeTendencia {
  id: string
  nome: string
  marca: string
  concentracao: string
  familia: string
  descricaoSensorial: string
  badge: string
  preco_estimado: string
  tipo: "importado" | "contratipo" | "nacional"
}

export const TENDENCIAS_SEMANA: PerfumeTendencia[] = dadosJson as PerfumeTendencia[]

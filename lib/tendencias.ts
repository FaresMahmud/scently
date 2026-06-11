import "server-only"
import { db } from "@/lib/db"
import dadosJson from "@/data/tendencias.json"
import { limparNomePerfume } from "@/lib/limparNomePerfume"

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
  perfumeId: string | null
}

// Static seed — used as fallback when the DB table is empty
export const TENDENCIAS_SEMANA: PerfumeTendencia[] = (dadosJson as Omit<PerfumeTendencia, "perfumeId">[]).map(p => ({ ...p, perfumeId: null }))

function dbRowToTendencia(row: {
  id: string
  nome: string
  marca: string
  tipo: string
  preco: string | null
  badge: string | null
  posicao: number | null
  fonte: string | null
  perfumeId: string | null
  scrapedAt: Date
}): PerfumeTendencia {
  const nomeClean = limparNomePerfume(row.nome, row.marca)
  return {
    id:                row.id,
    nome:              nomeClean,
    marca:             row.marca,
    concentracao:      "EDP",
    familia:           "Tendência",
    descricaoSensorial:`${nomeClean} da ${row.marca}.`,
    badge:             row.badge ?? "↑ em alta",
    preco_estimado:    row.preco ?? "Consultar",
    tipo:              row.tipo as PerfumeTendencia["tipo"],
    perfumeId:         row.perfumeId,
  }
}

export async function getTendencias(): Promise<PerfumeTendencia[]> {
  try {
    const rows = await db.tendencia.findMany({
      orderBy: [{ posicao: "asc" }, { scrapedAt: "desc" }],
      take: 5,
    })
    if (rows.length === 0) return TENDENCIAS_SEMANA
    return rows.map(dbRowToTendencia)
  } catch {
    // DB unreachable — fall back to static JSON seed
    return TENDENCIAS_SEMANA
  }
}

export async function getUltimaAtualizacao(): Promise<Date> {
  try {
    const result = await db.tendencia.aggregate({ _max: { scrapedAt: true } })
    return result._max.scrapedAt ?? new Date(0)
  } catch {
    return new Date(0)
  }
}

/** Returns the current meteorological season (Southern Hemisphere — Brazil). */
export function estacaoAtual(): { nome: string; emoji: string } {
  const mes = new Date().getMonth() + 1 // 1–12
  if (mes >= 3 && mes <= 5)  return { nome: "Outono",    emoji: "🍂" }
  if (mes >= 6 && mes <= 8)  return { nome: "Inverno",   emoji: "🌿" }
  if (mes >= 9 && mes <= 11) return { nome: "Primavera", emoji: "🌸" }
  return { nome: "Verão", emoji: "☀️" }
}

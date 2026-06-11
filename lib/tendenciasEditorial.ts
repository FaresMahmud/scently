// ============================================
// ARQUIVO: lib/tendenciasEditorial.ts
// O QUE FAZ: lê as seções editoriais de tendências (inverno/primavera/global)
//            do banco, com sugestões de perfume por gênero
// QUANDO MANDAR PRA IA: quando quiser mudar como o conteúdo editorial é lido
// DEPENDE DE: lib/db.ts, tabelas tendencias_editorial + sugestões
//             (populadas por scripts/seed-tendencias-editorial.ts)
// ============================================

import "server-only"
import { db } from "@/lib/db"

export interface SugestaoEditorial {
  genero: string          // "masculino" | "feminino" | "unissex"
  nome: string
  marca: string
  perfumeId: string | null
}

export interface EntradaEditorial {
  titulo: string
  descricao: string
  sugestoes: SugestaoEditorial[]
}

export interface TendenciasEditoriais {
  inverno: EntradaEditorial[]
  primavera: EntradaEditorial[]
  global: EntradaEditorial[]
}

const VAZIO: TendenciasEditoriais = { inverno: [], primavera: [], global: [] }

export async function getTendenciasEditoriais(): Promise<TendenciasEditoriais> {
  try {
    const rows = await db.tendenciaEditorial.findMany({
      orderBy: [{ categoria: "asc" }, { ordem: "asc" }],
      include: { sugestoes: true },
    })
    if (rows.length === 0) return VAZIO

    const resultado: TendenciasEditoriais = { inverno: [], primavera: [], global: [] }
    for (const row of rows) {
      const grupo = resultado[row.categoria as keyof TendenciasEditoriais]
      if (!grupo) continue
      grupo.push({
        titulo: row.titulo,
        descricao: row.descricao,
        sugestoes: row.sugestoes.map(s => ({
          genero: s.genero,
          nome: s.nome,
          marca: s.marca,
          perfumeId: s.perfumeId,
        })),
      })
    }
    return resultado
  } catch {
    // DB inacessível — seções simplesmente não renderizam
    return VAZIO
  }
}

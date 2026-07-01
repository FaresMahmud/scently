import "server-only"
import { db } from "@/lib/db"
import dadosJson from "@/data/tendencias.json"
import { limparNomePerfume } from "@/lib/limparNomePerfume"

import { getEditorialContent } from "@/lib/perfumeEditorial"

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
  descricao: string | null
  perfumeId: string | null
  ativo: boolean
  scrapedAt: Date
}): PerfumeTendencia {
  const nomeClean = limparNomePerfume(row.nome, row.marca)
  return {
    id:                row.id,
    nome:              nomeClean,
    marca:             row.marca,
    concentracao:      "EDP",
    familia:           "Tendência",
    descricaoSensorial: row.descricao ?? `${nomeClean} da ${row.marca}.`,
    badge:             row.badge ?? "↑ em alta",
    preco_estimado:    row.preco ?? "Consultar",
    tipo:              row.tipo as PerfumeTendencia["tipo"],
    perfumeId:         row.perfumeId,
  }
}

export async function getTendencias(): Promise<PerfumeTendencia[]> {
  try {
    const rows = await db.tendencia.findMany({
      where: { ativo: true },
      orderBy: [{ posicao: "asc" }, { scrapedAt: "desc" }],
      take: 5,
    })
    if (rows.length === 0) return TENDENCIAS_SEMANA

    const tendencias = rows.map(dbRowToTendencia)

    // Enriquecimento dinâmico assíncrono para evitar descrições repetitivas ou simplistas
    for (const t of tendencias) {
      const nomeClean = t.nome
      const descSimples = `${nomeClean} da ${t.marca}.`
      const descSimplesAlt = `${t.nome} da ${t.marca}.`

      if (!t.descricaoSensorial || t.descricaoSensorial === descSimples || t.descricaoSensorial === descSimplesAlt) {
        // 1. Tenta buscar no editorial do banco de dados
        if (t.perfumeId) {
          const editorial = await getEditorialContent(t.perfumeId)
          if (editorial && editorial.comoCheira) {
            t.descricaoSensorial = editorial.comoCheira
            continue
          }
        }

        // 2. Se não houver editorial, usa um dicionário com descrições curadas para fragrâncias famosas
        const descFamosos: Record<string, string> = {
          "sauvage": "Bergamota fresca e pimenta com um fundo marcante de ambroxan. Moderno e magnético.",
          "bleu de chanel": "Frescor cítrico sofisticado com incenso e notas amadeiradas profundas. Elegância atemporal.",
          "la vie est belle": "Íris elegante combinada com pralinê doce e baunilha licorosa. O clássico da feminilidade.",
          "layton": "Maçã verde crocante, baunilha cremosa e cardamomo picante. Luxo de nicho.",
          "santal 33": "Sândalo cru, couro seco e notas amadeiradas de fogueira. O perfume cult minimalista.",
          "terre d hermes": "Laranja amarga, terra molhada e vetiver mineral. Uma assinatura madura e terrosa.",
          "grand soir": "Âmbar quente resinoso, baunilha doce e fava tonka. Uma noite parisiense em frasco.",
          "aventus": "Abacaxi fresco defumado, bétula e almíscar denso. O rei da perfumaria de nicho.",
          "good girl": "Jasmim doce e fava tonka escura. Uma fragrância sensual de saltos altos.",
          "coco mademoiselle": "Patchouli elegante, laranja fresca e rosas. Clássico refinado e marcante.",
          "ch men prive": "Couro escuro, uísque e especiarias quentes. Sensualidade noturna extrema.",
          "j adore": "Buquê floral rico de jasmim, pera e melão. A essência do luxo feminino.",
          "chance eau tendre": "Marmelo frutado, toranja fresca e almíscar macio. Frescor primaveril romântico."
        }

        const nomeNormalizado = t.nome.toLowerCase().trim()
        let matchEncontrado = false
        for (const [key, value] of Object.entries(descFamosos)) {
          if (nomeNormalizado.includes(key) || key.includes(nomeNormalizado)) {
            t.descricaoSensorial = value
            matchEncontrado = true
            break
          }
        }

        if (matchEncontrado) continue

        // 3. Fallback inteligente
        t.descricaoSensorial = `Fragrância marcante e sofisticada da ${t.marca}, excelente opção para assinatura.`
      }
    }

    return tendencias
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

// ============================================
// ARQUIVO: app/api/cron/tendencias/route.ts
// O QUE FAZ: job semanal — Gemini grounding + Google Trends → top 5 tendências
// DEPENDE DE: GEMINI_API_KEY, CRON_SECRET, DATABASE_URL
// DRY-RUN: GET /api/cron/tendencias?dryRun=true  (não escreve no banco)
// ============================================

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { buscarNoCatalogo, carregarCatalogo, buscarPerfumePorSlug } from "@/lib/catalogoFragella"
// @ts-expect-error — google-trends-api has no type definitions
import googleTrends from "google-trends-api"

const MARCAS_CONTRATIPOS = ["in the box", "maison viegas", "ja essence", "azza parfum", "essencia e perfume"]
const MARCAS_NACIONAIS   = ["o boticário", "boticario", "natura", "eudora", "avon", "jequiti"]

function tipoDaMarca(marca: string): "importado" | "contratipo" | "nacional" {
  const m = marca.toLowerCase()
  if (MARCAS_CONTRATIPOS.some(c => m.includes(c))) return "contratipo"
  if (MARCAS_NACIONAIS.some(c => m.includes(c)))   return "nacional"
  return "importado"
}

function slugify(s: string): string {
  return s.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

interface CandidatoGemini {
  nome: string
  marca: string
  genero: "masculino" | "feminino" | "unissex"
  posicaoGemini: number
}

interface CandidatoScorado extends CandidatoGemini {
  perfumeId: string | null
  temEditorial: boolean
  scoreGemini: number
  scoreTrends: number
  boostEditorial: number
  scoreTotal: number
}

// ── Fase 1: Gemini com grounding ──────────────────────────────────────────────

async function buscarCandidatosGemini(): Promise<CandidatoGemini[]> {
  const chave = process.env.GEMINI_API_KEY
  if (!chave) throw new Error("GEMINI_API_KEY não configurada")

  const genAI = new GoogleGenerativeAI(chave)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    tools: [{ googleSearch: {} } as never],
  })

  const hoje = new Date().toLocaleDateString("pt-BR", {
    day:   "numeric",
    month: "long",
    year:  "numeric",
  })

  const prompt = `Você é um especialista em perfumaria no Brasil.
Pesquise e liste os 10 perfumes masculinos E 10 perfumes femininos mais buscados e comentados no Brasil na semana de ${hoje}.
Considere: TikTok, Instagram, Mercado Livre, Amazon BR, Sephora Brasil, Pinterest e mídia especializada.
Priorize perfumes importados de marcas reconhecidas (Dior, Chanel, YSL, Tom Ford, Armani, Lancôme, etc).

Retorne APENAS um JSON válido, sem markdown, sem texto antes ou depois:
[
  {"nome": "nome do perfume", "marca": "nome da marca", "genero": "masculino|feminino|unissex", "posicaoGemini": 1},
  ...
]

Regras:
- posicaoGemini: 1 a 20 (1 = mais procurado)
- Total: exatamente 20 itens (10 masculinos + 10 femininos)
- nome: sem a marca, apenas o nome do produto
- marca: apenas o nome da marca
- genero: "masculino", "feminino" ou "unissex"`

  const result = await model.generateContent(prompt)
  const texto  = result.response.text().trim()

  // Remover possível markdown ```json ... ```
  const limpo = texto.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(limpo)
  } catch {
    throw new Error(`Gemini retornou JSON inválido. Raw: ${texto.slice(0, 500)}`)
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`Gemini não retornou array. Tipo: ${typeof parsed}`)
  }

  const candidatos: CandidatoGemini[] = (parsed as Record<string, unknown>[])
    .filter(item =>
      typeof item.nome  === "string" && item.nome.trim().length > 0 &&
      typeof item.marca === "string" && item.marca.trim().length > 0 &&
      typeof item.posicaoGemini === "number"
    )
    .map(item => ({
      nome:          String(item.nome).trim().slice(0, 100),
      marca:         String(item.marca).trim().slice(0, 80),
      genero:        (["masculino","feminino","unissex"].includes(String(item.genero))
                       ? String(item.genero)
                       : "unissex") as CandidatoGemini["genero"],
      posicaoGemini: Number(item.posicaoGemini),
    }))

  return candidatos
}

// ── Fase 2: Google Trends (com fallback silencioso) ───────────────────────────

async function buscarScoresTrends(
  candidatos: CandidatoGemini[]
): Promise<Record<string, number>> {
  const scores: Record<string, number> = {}
  const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // Trends aceita max 5 keywords por chamada
  const batches: CandidatoGemini[][] = []
  for (let i = 0; i < candidatos.length; i += 5) {
    batches.push(candidatos.slice(i, i + 5))
  }

  for (const batch of batches) {
    try {
      const keywords = batch.map(c => `${c.nome} ${c.marca}`)
      const raw = await googleTrends.interestOverTime({
        keyword:   keywords,
        geo:       "BR",
        startTime: seteDiasAtras,
      })
      const data = JSON.parse(raw) as {
        default: { timelineData: { value: number[] }[] }
      }
      const pontos = data?.default?.timelineData ?? []

      batch.forEach((c, idx) => {
        const chave = slugify(`${c.nome} ${c.marca}`)
        const valores = pontos.map((p: { value: number[] }) => p.value[idx] ?? 0)
        const media = valores.length > 0
          ? valores.reduce((a: number, b: number) => a + b, 0) / valores.length
          : 0
        scores[chave] = Math.round(media)
      })
    } catch {
      // Batch falhou — não propagamos, apenas ignoramos esse batch
    }
  }

  return scores
}

// ── Endpoint principal ────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const inicio = Date.now()
  const url    = new URL(request.url)
  const dryRun = url.searchParams.get("dryRun") === "true"

  const secret = process.env.CRON_SECRET
  const authHeader   = request.headers.get("authorization")
  const customHeader = request.headers.get("x-cron-secret")
  const authorized   = authHeader === `Bearer ${secret}` || customHeader === secret

  if (!authorized) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 })
  }

  const log = (nivel: "INFO" | "ERROR" | "DEBUG", msg: string, dados?: unknown) => {
    const linha = `[tendencias-cron][${nivel}] ${msg}`
    if (dados !== undefined) {
      console.error(linha, JSON.stringify(dados, null, 2))
    } else {
      console.error(linha)
    }
  }

  log("INFO", `Iniciando job${dryRun ? " [DRY-RUN]" : ""}`)

  try {
    // ── Fase 1: Gemini ────────────────────────────────────────────────────────
    log("INFO", "Fase 1: buscando candidatos no Gemini com grounding...")
    let candidatosGemini: CandidatoGemini[]
    try {
      candidatosGemini = await buscarCandidatosGemini()
    } catch (err) {
      log("ERROR", "Gemini falhou — abortando, banco não será alterado", { erro: String(err) })
      return NextResponse.json({ ok: false, erro: "Gemini falhou", detalhes: String(err) }, { status: 500 })
    }

    log("INFO", `Gemini retornou ${candidatosGemini.length} candidatos (bruto)`, candidatosGemini)

    if (candidatosGemini.length < 5) {
      log("ERROR", `Gemini retornou apenas ${candidatosGemini.length} candidatos — mínimo 5. Abortando.`)
      return NextResponse.json({ ok: false, erro: "Poucos candidatos do Gemini", quantidade: candidatosGemini.length }, { status: 500 })
    }

    // ── Fase 2: Google Trends ─────────────────────────────────────────────────
    log("INFO", "Fase 2: buscando scores no Google Trends...")
    let scoresTrends: Record<string, number> = {}
    let trendsDisponivel = false
    try {
      scoresTrends    = await buscarScoresTrends(candidatosGemini)
      trendsDisponivel = Object.keys(scoresTrends).length > 0
      log("INFO", `Google Trends: ${trendsDisponivel ? "disponível" : "sem dados"}`, scoresTrends)
    } catch (err) {
      log("INFO", "Google Trends indisponível — usando só Gemini (100%)", { erro: String(err) })
    }

    // ── Fase 3: Buscar dados do catálogo + editorial ──────────────────────────
    log("INFO", "Fase 3: cruzando com catálogo Nozze e PerfumeEditorial...")

    // ── DEBUG: candidatos brutos do Gemini ───────────────────────────────────
    log("DEBUG", "Lista bruta do Gemini (20 candidatos)", candidatosGemini.map(c => ({
      posicao: c.posicaoGemini,
      nome:    c.nome,
      marca:   c.marca,
      genero:  c.genero,
    })))

    // ── DEBUG: tendencias atuais no banco (perfumeId format de referência) ────
    const tendenciasAtuais = await db.tendencia.findMany({
      where:   { ativo: true },
      orderBy: { posicao: "asc" },
      take:    10,
      select:  { nome: true, marca: true, perfumeId: true, fonte: true },
    })
    log("DEBUG", "Tendencias atualmente no banco (para comparar formato de ID)", tendenciasAtuais)

    // Catálogo é JSON em memória — busca por nome+marca substring
    // Para cada candidato: pega o primeiro match e extrai o id canônico
    carregarCatalogo() // aquece o cache (sync)
    const candidatosComCatalogo = candidatosGemini.map(c => {
      const queryBusca = `${c.nome} ${c.marca}`
      const slugGerado = slugify(queryBusca)
      const resultados = buscarNoCatalogo(queryBusca, 3)
      // Confirma: o resultado deve conter tanto o nome quanto a marca do candidato
      const match = resultados.find(r => {
        const rNome  = r.nome.toLowerCase()
        const rMarca = r.marca.toLowerCase()
        const cNome  = c.nome.toLowerCase()
        const cMarca = c.marca.toLowerCase()
        return (rNome.includes(cNome) || cNome.includes(rNome.split(" ")[0])) &&
               (rMarca.includes(cMarca) || cMarca.includes(rMarca.split(" ")[0]))
      })

      // ── DEBUG: log de cada candidato ───────────────────────────────────────
      const slugMatch = buscarPerfumePorSlug(slugGerado)
      log("DEBUG", `MATCH [${c.posicaoGemini}] "${c.nome}" / "${c.marca}"`, {
        queryBusca,
        slugGerado,
        buscarNoCatalogo_resultados: resultados.map(r => ({ id: r.id, nome: r.nome, marca: r.marca })),
        buscarNoCatalogo_match:      match ? { id: match.id, nome: match.nome, marca: match.marca } : null,
        buscarPerfumePorSlug_result: slugMatch ? { id: slugMatch.id, nome: slugMatch.nome, marca: slugMatch.marca } : null,
        encontrado:                  match !== undefined || slugMatch !== null,
      })

      return { ...c, perfumeIdCatalogo: match?.id ?? null }
    })

    const slugsNoCatalogo = candidatosComCatalogo
      .filter(c => c.perfumeIdCatalogo !== null)
      .map(c => c.perfumeIdCatalogo as string)

    const [perfumesComEditorial, blocklist, pinnados] = await Promise.all([
      db.perfumeEditorial.findMany({
        where:  { perfumeId: { in: slugsNoCatalogo } },
        select: { perfumeId: true },
      }),
      db.tendenciaBlocklist.findMany({ select: { nomeMarca: true } }),
      db.tendencia.findMany({
        where:   { pinned: true, ativo: true },
        orderBy: { posicao: "asc" },
      }),
    ])

    const editorialSet  = new Set(perfumesComEditorial.map(p => p.perfumeId))
    const blocklistSet  = new Set(blocklist.map(b => b.nomeMarca))

    const noCatalogoCount = candidatosComCatalogo.filter(c => c.perfumeIdCatalogo !== null).length
    log("INFO", `Catálogo: ${noCatalogoCount} matches | Editorial: ${editorialSet.size} | Blocklist: ${blocklistSet.size} | Pins: ${pinnados.length}`)

    // ── Fase 4: Score composto ────────────────────────────────────────────────
    log("INFO", "Fase 4: calculando scores compostos...")
    const candidatosScorados: CandidatoScorado[] = candidatosComCatalogo.map(c => {
      const slug         = slugify(`${c.nome} ${c.marca}`)
      const scoreGemini  = Math.round(((20 - c.posicaoGemini) / 19) * 100)
      const scoreTrends  = scoresTrends[slug] ?? 0
      const temEditorial = c.perfumeIdCatalogo !== null && editorialSet.has(c.perfumeIdCatalogo)
      const boostEditorial = temEditorial ? 10 : 0

      const scoreTotal = trendsDisponivel
        ? Math.round(scoreGemini * 0.6 + scoreTrends * 0.4) + boostEditorial
        : scoreGemini + boostEditorial

      return {
        ...c,
        perfumeId:    c.perfumeIdCatalogo,
        temEditorial,
        scoreGemini,
        scoreTrends,
        boostEditorial,
        scoreTotal,
      }
    })

    log("DEBUG", "Scores detalhados (todos os candidatos)", candidatosScorados.map(c => ({
      nome:            c.nome,
      marca:           c.marca,
      perfumeId:       c.perfumeId,
      temEditorial:    c.temEditorial,
      scoreGemini:     c.scoreGemini,
      scoreTrends:     c.scoreTrends,
      boostEditorial:  c.boostEditorial,
      scoreTotal:      c.scoreTotal,
      noCatalogo:      c.perfumeId !== null,
    })))

    // ── Fase 5: Filtros ───────────────────────────────────────────────────────
    const aposFiltroCatalogo = candidatosScorados.filter(c => c.perfumeId !== null)
    log("INFO", `Após filtro catálogo: ${aposFiltroCatalogo.length}`, aposFiltroCatalogo.map(c => `${c.nome} - ${c.marca}`))

    const aposBlocklist = aposFiltroCatalogo.filter(c => {
      const chave = `${c.nome.toLowerCase()}|${c.marca.toLowerCase()}`
      return !blocklistSet.has(chave)
    })
    log("INFO", `Após filtro blocklist: ${aposBlocklist.length}`, aposBlocklist.map(c => `${c.nome} - ${c.marca}`))

    if (aposBlocklist.length < 5) {
      log("ERROR", `Apenas ${aposBlocklist.length} candidatos válidos após filtros — mínimo 5. Abortando para não degradar tendências.`)
      return NextResponse.json({
        ok: false,
        erro: "Candidatos insuficientes após filtros",
        aposFiltroCatalogo: aposFiltroCatalogo.length,
        aposBlocklist: aposBlocklist.length,
      }, { status: 500 })
    }

    // ── Fase 6: Selecionar top 5 respeitando pins ─────────────────────────────
    const vagasDisponiveis = Math.max(0, 5 - pinnados.length)
    const ordenados = [...aposBlocklist].sort((a, b) => b.scoreTotal - a.scoreTotal)
    const novasTendencias = ordenados.slice(0, vagasDisponiveis)

    log("INFO", `Pins existentes (${pinnados.length})`, pinnados.map(p => `pos${p.posicao}: ${p.nome} - ${p.marca}`))
    log("INFO", `Top ${vagasDisponiveis} automáticos escolhidos`, novasTendencias.map((c, i) => `pos${pinnados.length + i + 1}: ${c.nome} - ${c.marca} (score ${c.scoreTotal})`))

    const fonteValor = trendsDisponivel ? "gemini+trends" : "gemini"

    if (dryRun) {
      const duracao = Date.now() - inicio
      log("INFO", `[DRY-RUN] Simulação concluída em ${duracao}ms — banco NÃO alterado`)
      return NextResponse.json({
        ok:           true,
        dryRun:       true,
        duracao_ms:   duracao,
        trendsDisponivel,
        fonte:        fonteValor,
        pins:         pinnados.map(p => ({ nome: p.nome, marca: p.marca, posicao: p.posicao })),
        novasTendencias: novasTendencias.map((c, i) => ({
          posicao:       pinnados.length + i + 1,
          nome:          c.nome,
          marca:         c.marca,
          genero:        c.genero,
          perfumeId:     c.perfumeId,
          temEditorial:  c.temEditorial,
          scoreGemini:   c.scoreGemini,
          scoreTrends:   c.scoreTrends,
          boostEditorial: c.boostEditorial,
          scoreTotal:    c.scoreTotal,
        })),
        candidatosDescartados: {
          semCatalogo:  candidatosScorados.filter(c => c.perfumeId === null).map(c => `${c.nome} - ${c.marca}`),
          naBlocklist:  aposFiltroCatalogo.filter(c => {
            const chave = `${c.nome.toLowerCase()}|${c.marca.toLowerCase()}`
            return blocklistSet.has(chave)
          }).map(c => `${c.nome} - ${c.marca}`),
        },
      })
    }

    // ── Fase 7: Escrever no banco ─────────────────────────────────────────────
    log("INFO", "Fase 7: atualizando banco de dados...")
    const agora = new Date()

    // Desativar automáticos antigos (não toca nos pins)
    await db.tendencia.updateMany({
      where: {
        pinned: false,
        ativo:  true,
        fonte:  { in: ["gemini", "gemini+trends", "sephora", "fragrantica"] },
      },
      data: { ativo: false },
    })

    // Upsert novos automáticos
    for (let i = 0; i < novasTendencias.length; i++) {
      const c       = novasTendencias[i]
      const posicao = pinnados.length + i + 1
      const badges  = ["🔥 Em alta", "⭐ Popular", "✨ Destaque", "💎 Top vendas", "📈 Subindo"]

      await db.tendencia.upsert({
        where:  { nome_marca: { nome: c.nome, marca: c.marca } },
        create: {
          nome:          c.nome,
          marca:         c.marca,
          tipo:          tipoDaMarca(c.marca),
          badge:         badges[i % badges.length],
          posicao,
          fonte:         fonteValor,
          perfumeId:     c.perfumeId,
          tendencyScore: c.scoreTotal,
          ativo:         true,
          pinned:        false,
          scrapedAt:     agora,
        },
        update: {
          tipo:          tipoDaMarca(c.marca),
          badge:         badges[i % badges.length],
          posicao,
          fonte:         fonteValor,
          perfumeId:     c.perfumeId,
          tendencyScore: c.scoreTotal,
          ativo:         true,
          pinned:        false,
          scrapedAt:     agora,
        },
      })
    }

    // Revalidar ISR
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nozze.app"
    try {
      await fetch(`${baseUrl}/api/revalidate-tendencias`, {
        method:  "POST",
        headers: { "x-cron-secret": process.env.CRON_SECRET ?? "" },
      })
      log("INFO", "ISR revalidado: / e /tendencias")
    } catch (err) {
      log("INFO", "ISR revalidation falhou (não fatal)", { erro: String(err) })
    }

    const duracao = Date.now() - inicio
    log("INFO", `Job concluído em ${duracao}ms. ${novasTendencias.length} tendências escritas, ${pinnados.length} pins preservados.`)

    return NextResponse.json({
      ok:               true,
      duracao_ms:       duracao,
      trendsDisponivel,
      fonte:            fonteValor,
      pinsPreservados:  pinnados.length,
      novasInseridas:   novasTendencias.length,
      tendencias:       novasTendencias.map((c, i) => ({
        posicao:   pinnados.length + i + 1,
        nome:      c.nome,
        marca:     c.marca,
        scoreTotal: c.scoreTotal,
      })),
    })

  } catch (err) {
    const duracao = Date.now() - inicio
    log("ERROR", `Erro não esperado após ${duracao}ms`, { erro: String(err), stack: err instanceof Error ? err.stack : undefined })
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 })
  }
}

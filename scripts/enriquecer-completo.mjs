// ============================================
// ARQUIVO: scripts/enriquecer-completo.mjs
// O QUE FAZ: enriquecimento unificado em escala — editorial (PerfumeEditorial),
//            tradução de notas EN→PT, preenchimento de ano/gênero faltantes,
//            pra TODO o catálogo (fragella + expandido).
// USO: node scripts/enriquecer-completo.mjs --dry-run   (1 batch, não escreve nada)
//      node scripts/enriquecer-completo.mjs              (roda/retoma a campanha completa)
// RESUMÍVEL: progresso em scripts/_editorial-checkpoint.json — seguro pra Ctrl+C e re-rodar.
// ============================================
import { config } from "dotenv"
config({ path: ".env.local" })
import fs from "fs"
import path from "path"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const ROOT = process.cwd()
const DRY_RUN = process.argv.includes("--dry-run")
const CAMINHO_CHECKPOINT = path.join(ROOT, "scripts", "_editorial-checkpoint.json")
const CAMINHO_FRAGELLA = path.join(ROOT, "data", "catalogo-fragella.json")
const CAMINHO_EXPANDIDO = path.join(ROOT, "data", "perfumes-expandido.json")

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const db = new PrismaClient({ adapter })

const chave = process.env.GEMINI_API_KEY
if (!chave) throw new Error("GEMINI_API_KEY não configurada")
const genAI = new GoogleGenerativeAI(chave)
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: { thinkingConfig: { thinkingBudget: 0 } },
})

const BACKOFF_429_MS = [60000, 120000, 300000] // 60s → 120s → 300s, desiste na 4ª tentativa

async function gerarComRetry(prompt) {
  for (let tentativa = 1; tentativa <= 4; tentativa++) {
    try {
      const result = await model.generateContent(prompt)
      return result.response.text().trim()
    } catch (err) {
      const msg = String(err?.message ?? err)
      const e429 = msg.includes("429") || msg.includes("Too Many Requests")
      const e503 = msg.includes("503")

      if (tentativa === 4 || (!e429 && !e503)) throw err

      if (e429) {
        const espera = BACKOFF_429_MS[tentativa - 1]
        console.log(`    Gemini 429 (tentativa ${tentativa}/4) — aguardando ${espera / 1000}s...`)
        await new Promise(r => setTimeout(r, espera))
      } else {
        const espera = tentativa * 5000
        console.log(`    Gemini 503 (tentativa ${tentativa}/4) — aguardando ${espera}ms...`)
        await new Promise(r => setTimeout(r, espera))
      }
    }
  }
}

function limparJSON(texto) {
  return texto.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim()
}

function fmtDuracao(ms) {
  const s = Math.round(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sFinal = s % 60
  if (h > 0) return `${h}h${m}m`
  if (m > 0) return `${m}m${sFinal}s`
  return `${sFinal}s`
}

// ── Carregar catálogos (mantém estrutura original pra re-salvar) ───────────
console.log("Carregando catálogos...")
const fragellaRaw = JSON.parse(fs.readFileSync(CAMINHO_FRAGELLA, "utf8"))
const fragellaArr = fragellaRaw.perfumes ?? fragellaRaw
const expandidoArr = JSON.parse(fs.readFileSync(CAMINHO_EXPANDIDO, "utf8"))

function salvarFragella() {
  const saida = fragellaRaw.perfumes ? { ...fragellaRaw, perfumes: fragellaArr } : fragellaArr
  fs.writeFileSync(CAMINHO_FRAGELLA, JSON.stringify(saida, null, 2), "utf8")
}
function salvarExpandido() {
  fs.writeFileSync(CAMINHO_EXPANDIDO, JSON.stringify(expandidoArr, null, 2), "utf8")
}

// ── Lista mestre ESTÁVEL (ordenada por id, nunca reordena entre execuções) ──
const mestre = [
  ...fragellaArr.map(p => ({ ref: p, source: "fragella" })),
  ...expandidoArr.map(p => ({ ref: p, source: "expandido" })),
].sort((a, b) => a.ref.id.localeCompare(b.ref.id))

console.log(`Lista mestre: ${mestre.length} perfumes (fragella: ${fragellaArr.length}, expandido: ${expandidoArr.length})`)

// ── Detecção de notas em inglês (mesma tabela do diagnóstico) ───────────────
const TRADUCOES_KEYS = new Set([
  "vanilla","woody","amber","musk","musky","citrus","rose","floral","powdery","balsamic","sweet",
  "animalic","fresh","spicy","fruity","green","earthy","aquatic","marine","gourmand","smoky",
  "leather","tobacco","resinous","white floral","lavender","sandalwood","vetiver","patchouli",
  "incense","tonka bean","benzoin","pink pepper","saffron","woody spicy","oriental","fougere",
  "chypre","aromatic","warm","dry","rich","light","bergamot","lemon","orange","grapefruit",
  "mandarin","lime","yuzu","jasmine","iris","violet","peony","lily","neroli","ylang","magnolia",
  "cedarwood","cedar","oud","oakmoss","oak moss","woodsy notes","woody notes","floral notes",
  "citrus notes","pepper","cardamom","ginger","cinnamon","clove","nutmeg","peach","apple","pear",
  "raspberry","cherry","plum","black currant","coffee","chocolate","caramel","honey","mint",
  "eucalyptus","ambroxan","aldehydes","hedione","white musk","narcissus","lily-of-the-valley",
  "petitgrain","galbanum","tonka","ylang-ylang","black pepper","caraway","cumin","cacao","praline",
  "mace","star anise","tarragon","artemisia","wormwood","davana","immortelle","orris root",
  "ambergris","civet","costus","galangal","rock rose","iso e super","methyl ionone",
  "dihydromyrcenol","pineapple","rosemary","cyclamen","coriander","brazilian rosewood","geranium",
  "orris","labdanum","cistus","elemi","olibanum","styrax","castoreum","civette","oakwood","birch",
  "guaiac wood","agarwood","hay","smoke","rum","wine",
])
function notaEmIngles(nota) { return TRADUCOES_KEYS.has((nota ?? "").toLowerCase().trim()) }

function notasEstruturadas(p) {
  // Retorna { topo, coracao, fundo } — funciona pra fragella (3 campos) e expandido (flat -> tudo em topo)
  if (p.notasTopo || p.notasCoracao || p.notasFundo) {
    return { topo: p.notasTopo ?? [], coracao: p.notasCoracao ?? [], fundo: p.notasFundo ?? [] }
  }
  return { topo: p.notas ?? [], coracao: [], fundo: [] }
}

// ── PerfumeEditorial existentes (1 query) ───────────────────────────────────
const editoriaisExistentes = await db.perfumeEditorial.findMany({ select: { perfumeId: true } })
const idsComEditorial = new Set(editoriaisExistentes.map(e => e.perfumeId))
console.log(`PerfumeEditorial já no banco: ${idsComEditorial.size}\n`)

function precisa(item) {
  const p = item.ref
  const { topo, coracao, fundo } = notasEstruturadas(p)
  const todasNotas = [...topo, ...coracao, ...fundo]
  return {
    editorial: !idsComEditorial.has(p.id),
    traduzirNotas: todasNotas.some(notaEmIngles),
    ano: !p.ano || p.ano === 0,
    genero: !p.genero,
  }
}
function precisaAlgo(nec) { return nec.editorial || nec.traduzirNotas || nec.ano || nec.genero }

// ── Checkpoint ────────────────────────────────────────────────────────────
function carregarCheckpoint() {
  if (!fs.existsSync(CAMINHO_CHECKPOINT)) return null
  return JSON.parse(fs.readFileSync(CAMINHO_CHECKPOINT, "utf8"))
}
function salvarCheckpoint(cp) {
  fs.writeFileSync(CAMINHO_CHECKPOINT, JSON.stringify(cp, null, 2), "utf8")
}

let checkpoint = carregarCheckpoint()
const primeiraExecucao = checkpoint === null

if (primeiraExecucao) {
  const totalCandidatosInicial = mestre.filter(item => precisaAlgo(precisa(item))).length
  checkpoint = {
    ultimoIndiceProcessado: -1,
    totalCandidatosInicial,
    totalBatches: Math.ceil(totalCandidatosInicial / 5),
    batchesProcessados: 0,
    sucessos: 0,
    falhas: 0,
    tempoTotalMs: 0,
    falhasDetalhe: [],
  }
  console.log(`Primeira execução — ${totalCandidatosInicial} candidatos, ${checkpoint.totalBatches} batches estimados.\n`)
} else {
  console.log(`Retomando checkpoint: índice ${checkpoint.ultimoIndiceProcessado}, batch ${checkpoint.batchesProcessados}/${checkpoint.totalBatches}, ${checkpoint.sucessos} sucessos, ${checkpoint.falhas} falhas até agora.\n`)
}

// ── Backup (só na primeira execução, antes de qualquer escrita) ─────────────
if (!DRY_RUN && primeiraExecucao) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-")
  fs.copyFileSync(CAMINHO_FRAGELLA, path.join(ROOT, "data", `catalogo-fragella.backup-${ts}.json`))
  fs.copyFileSync(CAMINHO_EXPANDIDO, path.join(ROOT, "data", `perfumes-expandido.backup-${ts}.json`))
  fs.writeFileSync(path.join(ROOT, "data", `perfume-editorial-backup-${ts}.json`), JSON.stringify(editoriaisExistentes, null, 2), "utf8")
  console.log(`Backups criados (catalogo-fragella, perfumes-expandido, perfume-editorial) com timestamp ${ts}\n`)
}

// ── Prompt ───────────────────────────────────────────────────────────────────
function montarPrompt(itens) {
  const blocos = itens.map((item, i) => {
    const p = item.ref
    const nec = precisa(item)
    const { topo, coracao, fundo } = notasEstruturadas(p)
    const pedidos = []
    if (nec.editorial) pedidos.push("comoCheira, paraQuem, quandoUsar, comoSeComporta (editorial)")
    if (nec.traduzirNotas) pedidos.push("notasTraduzidas (topo/coracao/fundo em PT-BR)")
    if (nec.ano) pedidos.push("ano (número, ou null se não souber)")
    if (nec.genero) pedidos.push(`genero (${item.source === "fragella" ? "'men'|'women'|'unisex'" : "'masculino'|'feminino'|'unissex'"}, ou null se não souber)`)

    return `${i + 1}. "${p.nome}" — marca: "${p.marca}" — gênero atual: ${p.genero || "?"} — família: ${p.familia || "?"} — ano atual: ${p.ano || "?"}
   Notas atuais — topo: [${topo.join(", ")}] | coração: [${coracao.join(", ")}] | fundo: [${fundo.join(", ")}]
   PRECISA: ${pedidos.join(" | ")}`
  }).join("\n\n")

  return `Você é o redator editorial do Nozze, um app de recomendação de perfumes. Tom: elegante, pessoal, o usuário é sempre o protagonista. Frases curtas.

NUNCA escreva "este perfume possui", "notas de base compostas por", ou qualquer frase técnica de catálogo. Descreva a experiência sensorial com comparações concretas.

Exemplos de tom correto pro editorial (não copie, só calibre o estilo):
- comoCheira: "É um aroma limpo e fresco, como grama recém-cortada na cidade. Sua essência cítrica e verde traz uma sensação de banho tomado e energia."
- paraQuem: "Perfeito para o homem moderno e urbano, que busca sofisticação discreta."
- quandoUsar: "Ideal para dias quentes de primavera e verão, seja no trabalho ou lazer."
- comoSeComporta: "Tem duração moderada, fixando na pele por cerca de cinco a sete horas."

Para cada perfume abaixo, gere APENAS os campos marcados como "PRECISA". Se for pedido ano ou
genero e você não tiver certeza real (não invente), retorne null pra esse campo. Pra notas
traduzidas, traduza palavra por palavra preservando a mesma contagem de itens em cada categoria.

${blocos}

Retorne APENAS um JSON válido (array), sem markdown, sem texto antes ou depois. Cada item deve
conter SOMENTE os campos que foram pedidos pra aquele perfume (omita os não pedidos):
[
  {"comoCheira": "...", "paraQuem": "...", "quandoUsar": "...", "comoSeComporta": "...", "notasTraduzidas": {"topo": ["..."], "coracao": ["..."], "fundo": ["..."]}, "ano": 2020, "genero": "men"},
  ...
]
Total: exatamente ${itens.length} itens, na mesma ordem da lista acima.`
}

function validar(item, resultado) {
  const nec = precisa(item)
  const erros = []

  if (nec.editorial) {
    for (const campo of ["comoCheira", "paraQuem", "quandoUsar", "comoSeComporta"]) {
      const v = resultado?.[campo]
      if (!v || typeof v !== "string" || v.length < 100 || v.length > 600) erros.push(`${campo} inválido`)
      else if (/este perfume possui|notas de base compostas por/i.test(v)) erros.push(`${campo} frase proibida`)
    }
  }
  if (nec.traduzirNotas) {
    const nt = resultado?.notasTraduzidas
    const { topo, coracao, fundo } = notasEstruturadas(item.ref)
    if (!nt || !Array.isArray(nt.topo) || !Array.isArray(nt.coracao) || !Array.isArray(nt.fundo)) {
      erros.push("notasTraduzidas ausente/malformado")
    } else if (nt.topo.length !== topo.length || nt.coracao.length !== coracao.length || nt.fundo.length !== fundo.length) {
      erros.push("notasTraduzidas com contagem diferente do original")
    }
  }
  // ano/genero: null é válido (instrução explícita pra não inventar) — só valida tipo quando presente
  if (nec.ano && resultado?.ano !== null && resultado?.ano !== undefined) {
    if (typeof resultado.ano !== "number" || resultado.ano < 1900 || resultado.ano > 2026) erros.push("ano fora do range")
  }
  if (nec.genero && resultado?.genero !== null && resultado?.genero !== undefined) {
    const validos = item.source === "fragella" ? ["men", "women", "unisex"] : ["masculino", "feminino", "unissex"]
    if (!validos.includes(resultado.genero)) erros.push("genero fora do vocabulário esperado")
  }
  return erros
}

async function aplicar(item, resultado) {
  const nec = precisa(item)
  const p = item.ref

  if (nec.editorial && !idsComEditorial.has(p.id)) {
    await db.perfumeEditorial.create({
      data: {
        perfumeId: p.id,
        comoCheira: resultado.comoCheira,
        paraQuem: resultado.paraQuem,
        quandoUsar: resultado.quandoUsar,
        comoSeComporta: resultado.comoSeComporta,
      },
    })
    idsComEditorial.add(p.id)
  }
  if (nec.traduzirNotas && resultado.notasTraduzidas) {
    if (p.notasTopo !== undefined || p.notasCoracao !== undefined || p.notasFundo !== undefined) {
      p.notasTopo = resultado.notasTraduzidas.topo
      p.notasCoracao = resultado.notasTraduzidas.coracao
      p.notasFundo = resultado.notasTraduzidas.fundo
    } else {
      p.notas = resultado.notasTraduzidas.topo // expandido flat: tudo foi mapeado pra "topo"
    }
  }
  if (nec.ano && typeof resultado.ano === "number") p.ano = resultado.ano
  if (nec.genero && typeof resultado.genero === "string") p.genero = resultado.genero
}

// ── Loop principal ───────────────────────────────────────────────────────────
const inicioExecucao = Date.now()

if (DRY_RUN) {
  console.log("=== DRY-RUN: 1 batch (5 perfumes), nada será escrito ===\n")
  const candidatos = []
  for (const item of mestre) {
    if (candidatos.length >= 5) break
    if (precisaAlgo(precisa(item))) candidatos.push(item)
  }

  const texto = await gerarComRetry(montarPrompt(candidatos))
  const dados = JSON.parse(limparJSON(texto))

  candidatos.forEach((item, i) => {
    const resultado = dados[i]
    const erros = validar(item, resultado)
    console.log(`\n### ${item.ref.nome} (${item.ref.marca}) — ${item.ref.id} [${item.source}]`)
    console.log(`Necessidades:`, precisa(item))
    console.log(`Resultado Gemini:`, JSON.stringify(resultado, null, 2))
    console.log(erros.length > 0 ? `❌ ERROS: ${erros.join("; ")}` : `✅ válido`)
  })

  await db.$disconnect()
} else {
  await rodarCampanhaCompleta()
}

// ── Execução completa (resumível) ───────────────────────────────────────────
async function rodarCampanhaCompleta() {
let indiceAtual = checkpoint.ultimoIndiceProcessado + 1

while (indiceAtual < mestre.length) {
  const candidatosBatch = []
  let i = indiceAtual
  while (i < mestre.length && candidatosBatch.length < 5) {
    if (precisaAlgo(precisa(mestre[i]))) candidatosBatch.push(mestre[i])
    i++
  }
  if (candidatosBatch.length === 0) break // acabaram os candidatos

  const inicioBatch = Date.now()
  checkpoint.batchesProcessados++

  let dadosBatch
  try {
    const texto = await gerarComRetry(montarPrompt(candidatosBatch))
    dadosBatch = JSON.parse(limparJSON(texto))
  } catch (err) {
    for (const item of candidatosBatch) {
      checkpoint.falhas++
      checkpoint.falhasDetalhe.push({ id: item.ref.id, motivo: `batch falhou: ${String(err).slice(0, 100)}` })
    }
    indiceAtual = i
    checkpoint.ultimoIndiceProcessado = i - 1
    checkpoint.tempoTotalMs += Date.now() - inicioBatch
    salvarCheckpoint(checkpoint)
    console.log(`[batch ${checkpoint.batchesProcessados}/${checkpoint.totalBatches}] 0/${candidatosBatch.length} ❌ (batch falhou)`)
    continue
  }

  let sucessosBatch = 0
  for (let idx = 0; idx < candidatosBatch.length; idx++) {
    const item = candidatosBatch[idx]
    let resultado = dadosBatch?.[idx]
    let erros = resultado ? validar(item, resultado) : ["sem dados na posição"]

    if (erros.length > 0) {
      try {
        const textoRetry = await gerarComRetry(montarPrompt([item]))
        const retryDados = JSON.parse(limparJSON(textoRetry))
        resultado = Array.isArray(retryDados) ? retryDados[0] : retryDados
        erros = validar(item, resultado)
      } catch (err) {
        erros = [`retry falhou: ${String(err).slice(0, 100)}`]
      }
    }

    if (erros.length > 0) {
      checkpoint.falhas++
      checkpoint.falhasDetalhe.push({ id: item.ref.id, motivo: erros.join("; ") })
      continue
    }

    await aplicar(item, resultado)
    sucessosBatch++
    checkpoint.sucessos++
  }

  salvarFragella()
  salvarExpandido()

  indiceAtual = i
  checkpoint.ultimoIndiceProcessado = i - 1
  checkpoint.tempoTotalMs += Date.now() - inicioBatch
  salvarCheckpoint(checkpoint)

  const mediaPorBatch = checkpoint.tempoTotalMs / checkpoint.batchesProcessados
  const batchesRestantes = checkpoint.totalBatches - checkpoint.batchesProcessados
  const eta = fmtDuracao(mediaPorBatch * Math.max(0, batchesRestantes))
  const elapsed = fmtDuracao(Date.now() - inicioExecucao)

  console.log(`[batch ${checkpoint.batchesProcessados}/${checkpoint.totalBatches}] ${sucessosBatch}/${candidatosBatch.length} ✅ (elapsed: ${elapsed}, ETA: ${eta})`)
}

console.log("\n" + "═".repeat(60))
console.log("CAMPANHA CONCLUÍDA")
console.log("═".repeat(60))
console.log(`Sucessos: ${checkpoint.sucessos}`)
console.log(`Falhas:   ${checkpoint.falhas}`)
if (checkpoint.falhasDetalhe.length > 0) {
  console.log("\nFalhas (IDs):")
  checkpoint.falhasDetalhe.forEach(f => console.log(`  - ${f.id}: ${f.motivo}`))
}

await db.$disconnect()
}

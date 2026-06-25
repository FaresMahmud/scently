// ============================================
// ARQUIVO: scripts/enriquecer-editorial.mjs
// O QUE FAZ: enriquece PerfumeEditorial (banco) pra perfumes de perfumes-expandido.json
//            que têm notas mas ainda não têm comoCheira/paraQuem/quandoUsar/comoSeComporta
// USO: node scripts/enriquecer-editorial.mjs --dry-run   (só batch 1, não escreve no banco)
//      node scripts/enriquecer-editorial.mjs              (roda tudo, escreve no banco)
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

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const db = new PrismaClient({ adapter })

const chave = process.env.GEMINI_API_KEY
if (!chave) throw new Error("GEMINI_API_KEY não configurada")
const genAI = new GoogleGenerativeAI(chave)
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  // thinkingBudget: 0 — obrigatório: sem isso o thinking mode consome o budget
  // de tokens de saída antes de gerar o JSON, e a resposta vem truncada/vazia.
  generationConfig: { thinkingConfig: { thinkingBudget: 0 } },
})

async function gerarComRetry(prompt) {
  for (let tentativa = 1; tentativa <= 4; tentativa++) {
    try {
      const result = await model.generateContent(prompt)
      return result.response.text().trim()
    } catch (err) {
      const msg = String(err?.message ?? err)
      if (tentativa === 4 || !msg.includes("503")) throw err
      const espera = tentativa * 5000
      console.log(`    Gemini 503 (tentativa ${tentativa}/4) — aguardando ${espera}ms...`)
      await new Promise(r => setTimeout(r, espera))
    }
  }
}

function limparJSON(texto) {
  return texto.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim()
}

function temNotas(p) {
  return (p.notas && p.notas.length > 0) ||
         (p.notasTopo && p.notasTopo.length > 0) ||
         (p.notasCoracao && p.notasCoracao.length > 0) ||
         (p.notasFundo && p.notasFundo.length > 0)
}

function notasDe(p) {
  if (p.notas && p.notas.length > 0) return p.notas
  return [...(p.notasTopo ?? []), ...(p.notasCoracao ?? []), ...(p.notasFundo ?? [])]
}

function validar(editorial) {
  const erros = []
  for (const campo of ["comoCheira", "paraQuem", "quandoUsar", "comoSeComporta"]) {
    const v = editorial[campo]
    if (!v || typeof v !== "string") { erros.push(`${campo} ausente`); continue }
    if (v.length < 100) erros.push(`${campo} curto (${v.length} chars)`)
    if (v.length > 600) erros.push(`${campo} longo (${v.length} chars)`)
    if (/este perfume possui|notas de base compostas por/i.test(v)) erros.push(`${campo} contém frase proibida`)
  }
  return erros
}

// ── PASSO 1: descobrir quem precisa de editorial ────────────────────────────
console.log("Carregando perfumes-expandido.json e PerfumeEditorial (banco)...")
const expandido = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "perfumes-expandido.json"), "utf8"))
const editoriaisExistentes = await db.perfumeEditorial.findMany({ select: { perfumeId: true } })
const idsComEditorial = new Set(editoriaisExistentes.map(e => e.perfumeId))

const pendentes = expandido.filter(p => temNotas(p) && !idsComEditorial.has(p.id))
console.log(`Total no expandido: ${expandido.length} | com notas: ${expandido.filter(temNotas).length} | já têm editorial: ${idsComEditorial.size} (de qualquer catálogo) | pendentes: ${pendentes.length}\n`)

// ── PASSO 2: backup do estado atual de PerfumeEditorial (safety net) ────────
if (!DRY_RUN) {
  const backupPath = path.join(ROOT, "data", `perfume-editorial-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`)
  fs.writeFileSync(backupPath, JSON.stringify(await db.perfumeEditorial.findMany(), null, 2), "utf8")
  console.log(`Backup do estado atual de PerfumeEditorial salvo em ${path.basename(backupPath)}\n`)
}

// ── PASSO 3: gerar via Gemini em batches de 5 ────────────────────────────────
const TAMANHO_BATCH = 5
const lista = DRY_RUN ? pendentes.slice(0, TAMANHO_BATCH) : pendentes
const batches = []
for (let i = 0; i < lista.length; i += TAMANHO_BATCH) batches.push(lista.slice(i, i + TAMANHO_BATCH))

console.log(`Processando ${lista.length} perfumes em ${batches.length} batches${DRY_RUN ? " [DRY-RUN — só batch 1, não escreve no banco]" : ""}...\n`)

function montarPrompt(perfumes) {
  const itens = perfumes.map((p, i) => {
    const notas = notasDe(p).join(", ")
    return `${i + 1}. "${p.nome}" — marca: "${p.marca}" — gênero: ${p.genero} — família: ${p.familia} — notas: ${notas}`
  }).join("\n")

  return `Você é o redator editorial do Nozze, um app de recomendação de perfumes. Tom: elegante, pessoal, o usuário é sempre o protagonista. Frases curtas.

NUNCA escreva "este perfume possui", "notas de base compostas por", ou qualquer frase técnica de catálogo. Em vez disso, descreva a experiência sensorial com comparações concretas (ex: "como grama recém-cortada", "como uma manhã ensolarada").

Exemplos de tom correto (não copie, só calibre o estilo):
- comoCheira: "É um aroma limpo e fresco, como grama recém-cortada na cidade. Sua essência cítrica e verde traz uma sensação de banho tomado e energia."
- paraQuem: "Perfeito para o homem moderno e urbano, que busca sofisticação discreta. Combina com personalidades confiantes."
- quandoUsar: "Ideal para dias quentes de primavera e verão, seja no trabalho ou lazer. Use durante o dia."
- comoSeComporta: "Tem duração moderada, fixando na pele por cerca de cinco a sete horas. Sua projeção é notável, mas sem exageros."

Para CADA um dos perfumes abaixo, escreva os 4 campos editoriais em português brasileiro,
cada um com 2-3 frases curtas, ENTRE 100 E 400 CARACTERES:

${itens}

Retorne APENAS um JSON válido (array), sem markdown, sem texto antes ou depois:
[
  {"comoCheira": "...", "paraQuem": "...", "quandoUsar": "...", "comoSeComporta": "..."},
  ...
]
Total: exatamente ${perfumes.length} itens, na mesma ordem da lista acima.`
}

let sucessos = 0
let falhas = 0
const log = []
const falhasDetalhe = []
const amostrasDryRun = []

for (const [idxBatch, batch] of batches.entries()) {
  console.log(`--- Batch ${idxBatch + 1}/${batches.length} (${batch.length} itens) ---`)

  let dadosBatch
  try {
    const texto = await gerarComRetry(montarPrompt(batch))
    dadosBatch = JSON.parse(limparJSON(texto))
  } catch (err) {
    console.log(`  [ERRO] Batch inteiro falhou: ${String(err).slice(0, 150)}`)
    for (const p of batch) {
      falhas++
      falhasDetalhe.push({ id: p.id, motivo: `batch falhou: ${String(err).slice(0, 100)}` })
      log.push(`${p.id}: ❌ batch falhou`)
    }
    continue
  }

  for (let i = 0; i < batch.length; i++) {
    const p = batch[i]
    let editorial = dadosBatch?.[i]

    let erros = editorial ? validar(editorial) : ["sem dados na posição"]

    // Retry individual se a posição falhou na resposta em batch
    if (erros.length > 0) {
      console.log(`  [retry individual] ${p.id} (motivo: ${erros.join("; ")})`)
      try {
        const textoRetry = await gerarComRetry(montarPrompt([p]))
        const retryDados = JSON.parse(limparJSON(textoRetry))
        editorial = Array.isArray(retryDados) ? retryDados[0] : retryDados
        erros = validar(editorial)
      } catch (err) {
        erros = [`retry falhou: ${String(err).slice(0, 100)}`]
      }
    }

    if (erros.length > 0) {
      falhas++
      falhasDetalhe.push({ id: p.id, motivo: erros.join("; ") })
      log.push(`${p.id}: ❌ ${erros.join("; ")}`)
      console.log(`  [${p.id}] ❌ ${erros.join("; ")}`)
      continue
    }

    if (DRY_RUN) {
      amostrasDryRun.push({ id: p.id, nome: p.nome, marca: p.marca, ...editorial })
      sucessos++
      log.push(`${p.id}: ✅ (dry-run, não escrito)`)
      console.log(`  [${p.id}] ✅ (dry-run)`)
      continue
    }

    // Nunca sobrescrever — checa de novo antes de escrever (defesa contra duplicata na própria lista)
    const jaExiste = await db.perfumeEditorial.findUnique({ where: { perfumeId: p.id } })
    if (jaExiste) {
      log.push(`${p.id}: ⏭️ pulado (já existe no banco)`)
      console.log(`  [${p.id}] ⏭️ pulado (já existe)`)
      continue
    }

    await db.perfumeEditorial.create({
      data: {
        perfumeId: p.id,
        comoCheira: editorial.comoCheira,
        paraQuem: editorial.paraQuem,
        quandoUsar: editorial.quandoUsar,
        comoSeComporta: editorial.comoSeComporta,
      },
    })
    sucessos++
    log.push(`${p.id}: ✅`)
    console.log(`  [${p.id}] ✅`)
  }
}

console.log("\n" + "═".repeat(60))
console.log(DRY_RUN ? "RESUMO DRY-RUN (batch 1)" : "RESUMO FINAL")
console.log("═".repeat(60))
console.log(`Processados: ${lista.length}`)
console.log(`Sucessos:    ${sucessos}`)
console.log(`Falhas:      ${falhas}`)
if (falhasDetalhe.length > 0) {
  console.log("\nFalhas detalhadas:")
  falhasDetalhe.forEach(f => console.log(`  - ${f.id}: ${f.motivo}`))
}

if (DRY_RUN) {
  console.log("\n--- AMOSTRAS COMPLETAS (DRY-RUN) ---")
  amostrasDryRun.forEach(a => {
    console.log(`\n### ${a.nome} (${a.marca}) — ${a.id}`)
    console.log(`comoCheira:     ${a.comoCheira}`)
    console.log(`paraQuem:       ${a.paraQuem}`)
    console.log(`quandoUsar:     ${a.quandoUsar}`)
    console.log(`comoSeComporta: ${a.comoSeComporta}`)
  })
}

fs.writeFileSync(path.join(ROOT, "scripts", "_editorial-log.txt"), log.join("\n"), "utf8")
console.log("\nLog salvo em scripts/_editorial-log.txt")

await db.$disconnect()

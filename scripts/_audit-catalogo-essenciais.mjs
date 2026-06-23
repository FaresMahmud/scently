import { config } from "dotenv"
config({ path: ".env.local" })
import fs from "fs"
import path from "path"
import { GoogleGenerativeAI } from "@google/generative-ai"

// ── Helpers de normalização (espelha lib/utils.ts slugify, mas local e dependency-free) ──
function normalizar(s) {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function chaveNomeMarca(nome, marca) {
  return `${normalizar(nome)}|${normalizar(marca)}`
}

// Remove sufixos genéricos de concentração que o catálogo às vezes omite
// (o catálogo guarda "Bleu De Chanel" e o Gemini pede "Bleu de Chanel Eau de Parfum" —
// sem isso, o match fuzzy exige a palavra "parfum"/"eau" e falha mesmo a fragrância existindo).
// NÃO remove "Parfum"/"Elixir"/"Toilette" isolados — esses podem ser nome de flanker real
// (ex: "1 Million Parfum", "Y Le Parfum"), só as frases compostas completas.
function nucleoNome(nome) {
  return nome
    .replace(/\b(eau de parfum|eau de toilette|eau de cologne|extrait de parfum)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
}

function mapearGenero(g) {
  const v = (g ?? "").toLowerCase().trim()
  if (v === "women" || v === "feminino") return "feminino"
  if (v === "men" || v === "masculino") return "masculino"
  return "neutro"
}

// ── Carregar os 3 sources ───────────────────────────────────────────────────
const ROOT = process.cwd()

function carregarJSON(nomeArquivo) {
  const p = path.join(ROOT, "data", nomeArquivo)
  const raw = JSON.parse(fs.readFileSync(p, "utf8"))
  return Array.isArray(raw) ? raw : (raw.perfumes ?? [])
}

const fragella   = carregarJSON("catalogo-fragella.json")
const contratipos = carregarJSON("contratipos.json")
const expandido  = carregarJSON("perfumes-expandido.json")

console.log(`Catálogo carregado: fragella=${fragella.length}, contratipos=${contratipos.length}, expandido=${expandido.length}`)

// Índice combinado: chave nome|marca -> { source, entry }
const indice = new Map()
function indexar(lista, sourceName) {
  for (const p of lista) {
    const chave = chaveNomeMarca(p.nome ?? "", p.marca ?? "")
    if (!indice.has(chave)) indice.set(chave, [])
    indice.get(chave).push({ source: sourceName, entry: p })
  }
}
indexar(fragella, "fragella")
indexar(contratipos, "contratipos")
indexar(expandido, "expandido")

// Índice fuzzy auxiliar: nome normalizado -> lista de entradas (pra achar "Sauvage" mesmo se marca variar: "Dior" vs "Christian Dior")
const indiceNome = new Map()
function indexarPorNome(lista, sourceName) {
  for (const p of lista) {
    const n = normalizar(p.nome ?? "")
    if (!indiceNome.has(n)) indiceNome.set(n, [])
    indiceNome.get(n).push({ source: sourceName, entry: p })
  }
}
indexarPorNome(fragella, "fragella")
indexarPorNome(contratipos, "contratipos")
indexarPorNome(expandido, "expandido")

const TODAS_ENTRADAS = [
  ...fragella.map(e => ({ source: "fragella", entry: e })),
  ...contratipos.map(e => ({ source: "contratipos", entry: e })),
  ...expandido.map(e => ({ source: "expandido", entry: e })),
]

// Busca candidatos pelo núcleo do nome (sem sufixo de concentração) + marca compatível.
// Retorna TODOS os candidatos achados — quem escolhe o melhor é escolherMelhorMatch().
function buscarCandidatos(nome, marca) {
  const nucleo = nucleoNome(nome)
  const palavrasNucleo = normalizar(nucleo).split(" ").filter(w => w.length > 2)
  const palavraMarca   = normalizar(marca).split(" ").filter(w => w.length > 2)[0] ?? normalizar(marca)

  if (palavrasNucleo.length === 0) return []

  return TODAS_ENTRADAS.filter(({ entry }) => {
    const textoNome  = normalizar(entry.nome ?? "")
    const textoMarca = normalizar(entry.marca ?? "")
    const textoTotal = `${textoNome} ${textoMarca}`

    const nucleoBate = palavrasNucleo.every(p => textoTotal.includes(p))
    const marcaBate  = palavraMarca.length > 0 && textoMarca.includes(palavraMarca)

    return nucleoBate && marcaBate
  })
}

// Entre os candidatos achados, escolhe o melhor considerando:
// 1. núcleo exato (mesmas palavras, sem sobra) > núcleo como prefixo > contém com sobra
// 2. gênero compatível com o que o Gemini pediu
// 3. menos palavras extras (evita flankers tipo "Black Opium Illicit Green" quando
//    o pedido foi só "Black Opium")
function escolherMelhorMatch(nome, genero, candidatos) {
  if (candidatos.length === 0) return null
  if (candidatos.length === 1) return candidatos[0]

  const nucleo = normalizar(nucleoNome(nome))
  const generoGemini = mapearGenero(genero)

  function score({ entry }) {
    const nomeP = normalizar(entry.nome ?? "")
    let s = 0

    if (nomeP === nucleo) s += 0
    else if (nomeP.startsWith(nucleo + " ") || nomeP.endsWith(" " + nucleo)) s += 5
    else s += 20

    const generoEntry = mapearGenero(entry.genero ?? "")
    if (generoGemini !== "neutro" && generoEntry !== "neutro" && generoEntry !== generoGemini) s += 50

    s += nomeP.split(" ").length // penaliza nomes com mais palavras (flankers)
    return s
  }

  return [...candidatos].sort((a, b) => score(a) - score(b))[0]
}

function dadosIncompletos(entry, source) {
  const faltando = []
  if (source === "fragella") {
    if (!entry.notasTopo?.length && !entry.notasCoracao?.length && !entry.notasFundo?.length && !entry.notasGerais?.length) {
      faltando.push("notas")
    }
    if (!entry.familia) faltando.push("familia")
    if (!entry.ano) faltando.push("ano")
  } else {
    if (!entry.notas?.length) faltando.push("notas")
    if (!entry.familia) faltando.push("familia")
    if (!entry.preco_brl) faltando.push("preco")
  }
  return faltando
}

// ── Fase 1, passo 1: perguntar ao Gemini os 50 essenciais ──────────────────
const chave = process.env.GEMINI_API_KEY
if (!chave) throw new Error("GEMINI_API_KEY não configurada em .env.local")

const genAI = new GoogleGenerativeAI(chave)
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  tools: [{ googleSearch: {} }],
})

const prompt = `Liste os 50 perfumes mais vendidos e procurados no Brasil em 2025/2026, incluindo masculinos, femininos e unissex.
Para cada um, retorne:
- Nome exato do produto (com versão: EDT, EDP, Elixir, etc)
- Marca
- Ano de lançamento
- Gênero
- Família olfativa principal

Inclua tanto designer (Dior, Chanel) quanto nicho popular (Xerjoff, Parfums de Marly, Maison Francis Kurkdjian). Inclua flankers populares (Sauvage Elixir, Bleu de Chanel EDP, etc).

Retorne APENAS um JSON válido, sem markdown, sem texto antes ou depois:
[
  {"nome": "nome exato com versão", "marca": "marca", "ano": 2015, "genero": "masculino|feminino|unissex", "familia": "família olfativa principal"},
  ...
]
Total: exatamente 50 itens.`

console.log("\nConsultando Gemini (grounding)...")
let result
for (let tentativa = 1; tentativa <= 4; tentativa++) {
  try {
    result = await model.generateContent(prompt)
    break
  } catch (err) {
    const msg = String(err?.message ?? err)
    if (tentativa === 4 || !msg.includes("503")) throw err
    const espera = tentativa * 5000
    console.log(`  Gemini 503 (tentativa ${tentativa}/4) — aguardando ${espera}ms...`)
    await new Promise(r => setTimeout(r, espera))
  }
}
const texto = result.response.text().trim()
const limpo = texto.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim()

let essenciais
try {
  essenciais = JSON.parse(limpo)
} catch {
  console.error("Gemini retornou JSON inválido. Raw:", texto.slice(0, 1000))
  process.exit(1)
}

if (!Array.isArray(essenciais)) {
  console.error("Gemini não retornou array.")
  process.exit(1)
}

console.log(`Gemini retornou ${essenciais.length} perfumes essenciais.\n`)

// ── Fase 1, passo 2: classificar cada um ────────────────────────────────────
const resultados = essenciais.map(p => {
  const candidatos = buscarCandidatos(p.nome, p.marca)
  if (candidatos.length === 0) {
    return { ...p, status: "NÃO EXISTE", source: null, faltando: null }
  }

  const melhor = escolherMelhorMatch(p.nome, p.genero, candidatos)
  const nucleoGemini = normalizar(nucleoNome(p.nome))
  const nucleoMatch   = normalizar(melhor.entry.nome ?? "")
  const versaoExata   = nucleoMatch === nucleoGemini

  const faltando = dadosIncompletos(melhor.entry, melhor.source)
  const status = faltando.length > 0 ? "INCOMPLETO" : (versaoExata ? "EXISTE" : "EXISTE (versão diferente)")

  return {
    ...p,
    status,
    source: melhor.source,
    idCatalogo: melhor.entry.id,
    nomeCatalogo: melhor.entry.nome,
    marcaCatalogo: melhor.entry.marca,
    faltando: faltando.length > 0 ? faltando : null,
    totalCandidatos: candidatos.length,
  }
})

const naoExiste     = resultados.filter(r => r.status === "NÃO EXISTE")
const incompleto    = resultados.filter(r => r.status === "INCOMPLETO")
const existe        = resultados.filter(r => r.status === "EXISTE")
const versaoDiferente = resultados.filter(r => r.status === "EXISTE (versão diferente)")

console.log(`EXISTE: ${existe.length} | EXISTE (versão diferente): ${versaoDiferente.length} | INCOMPLETO: ${incompleto.length} | NÃO EXISTE: ${naoExiste.length}`)

// ── Gerar relatório markdown ─────────────────────────────────────────────────
const linhas = []
linhas.push("# Auditoria de Catálogo — Perfumes Essenciais BR 2025/2026")
linhas.push("")
linhas.push(`Gerado em: ${new Date().toISOString()}`)
linhas.push("")
linhas.push(`**Resumo:** ${existe.length}/50 existem (versão exata) · ${versaoDiferente.length}/50 existem (versão diferente da pedida) · ${incompleto.length}/50 existem mas com dados incompletos · ${naoExiste.length}/50 não existem no catálogo`)
linhas.push("")
linhas.push("## Tabela completa")
linhas.push("")
linhas.push("| # | Nome | Marca | Ano | Gênero | Status | Source | ID Catálogo | Faltando |")
linhas.push("|---|------|-------|-----|--------|--------|--------|--------------|----------|")
resultados.forEach((r, i) => {
  linhas.push(`| ${i + 1} | ${r.nome} | ${r.marca} | ${r.ano ?? "?"} | ${r.genero ?? "?"} | ${r.status} | ${r.source ?? "—"} | ${r.idCatalogo ?? "—"} | ${r.faltando ? r.faltando.join(", ") : "—"} |`)
})
linhas.push("")
linhas.push("## Não existem no catálogo")
linhas.push("")
if (naoExiste.length === 0) {
  linhas.push("Nenhum — todos os 50 essenciais têm pelo menos uma entrada no catálogo.")
} else {
  naoExiste.forEach(r => linhas.push(`- **${r.nome}** (${r.marca}, ${r.ano ?? "?"}, ${r.genero ?? "?"}) — família: ${r.familia ?? "?"}`))
}
linhas.push("")
linhas.push("## Existem mas com dados incompletos")
linhas.push("")
if (incompleto.length === 0) {
  linhas.push("Nenhum.")
} else {
  incompleto.forEach(r => linhas.push(`- **${r.nome}** (${r.marca}) — id: \`${r.idCatalogo}\` (${r.source}) — faltando: ${r.faltando.join(", ")}`))
}
linhas.push("")

const relatorio = linhas.join("\n")
fs.writeFileSync(path.join(ROOT, "scripts", "AUDIT-CATALOG-ESSENCIAIS.md"), relatorio, "utf8")
console.log("\nRelatório salvo em scripts/AUDIT-CATALOG-ESSENCIAIS.md")

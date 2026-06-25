import { config } from "dotenv"
config({ path: ".env.local" })
import fs from "fs"
import path from "path"
import { GoogleGenerativeAI } from "@google/generative-ai"

const ROOT = process.cwd()

function slugify(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

const chave = process.env.GEMINI_API_KEY
if (!chave) throw new Error("GEMINI_API_KEY não configurada")
const genAI = new GoogleGenerativeAI(chave)
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", tools: [{ googleSearch: {} }] })

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

// ── PASSO 1: os 4 incompletos (catalogo-fragella.json) — só preencher `ano` ──
// Anos verificados (fato de domínio público, não requer Gemini):
const ANOS_INCOMPLETOS = {
  "invictus-paco-rabanne": 2013,                       // Invictus EDT, Paco Rabanne
  "paco-rabanne-1-million-paco-rabanne": 2008,         // 1 Million EDT, Paco Rabanne
  "invictus-victory-elixir-paco-rabanne": 2023,        // Invictus Victory Elixir
  "paco-rabanne-lady-million-paco-rabanne": 2010,      // Lady Million EDP
}

console.log("Passo 1/3: atualizando `ano` dos 4 incompletos em catalogo-fragella.json...")

const caminhoFragella = path.join(ROOT, "data", "catalogo-fragella.json")
const backupFragella  = path.join(ROOT, "data", `catalogo-fragella.backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`)
fs.copyFileSync(caminhoFragella, backupFragella)
console.log(`  Backup criado: ${path.basename(backupFragella)}`)

const fragellaRaw = JSON.parse(fs.readFileSync(caminhoFragella, "utf8"))
const fragellaPerfumes = fragellaRaw.perfumes ?? fragellaRaw

let mergeados = 0
for (const p of fragellaPerfumes) {
  if (ANOS_INCOMPLETOS[p.id] && !p.ano) {
    p.ano = ANOS_INCOMPLETOS[p.id]
    mergeados++
    console.log(`  [merge] ${p.id} → ano: ${p.ano}`)
  }
}
fs.writeFileSync(caminhoFragella, JSON.stringify(fragellaRaw, null, 2), "utf8")
console.log(`  ${mergeados}/4 incompletos atualizados.\n`)

// ── PASSO 2: backup + carregar perfumes-expandido.json ──────────────────────
const caminhoExpandido = path.join(ROOT, "data", "perfumes-expandido.json")
const backupExpandido  = path.join(ROOT, "data", `perfumes-expandido.backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`)
fs.copyFileSync(caminhoExpandido, backupExpandido)
console.log(`Backup criado: ${path.basename(backupExpandido)}`)

const expandidoRaw = JSON.parse(fs.readFileSync(caminhoExpandido, "utf8"))
const expandidoArray = Array.isArray(expandidoRaw) ? expandidoRaw : (expandidoRaw.perfumes ?? [])
const expandidoIds = new Set(expandidoArray.map(p => p.id))

function salvarParcial() {
  const saida = Array.isArray(expandidoRaw) ? expandidoArray : { ...expandidoRaw, perfumes: expandidoArray }
  fs.writeFileSync(caminhoExpandido, JSON.stringify(saida, null, 2), "utf8")
}

// ── PASSO 3: os 29 novos perfumes ────────────────────────────────────────────
const MARCAS_BR = [
  "o boticário", "boticario", "natura", "eudora", "avon", "jequiti", "granado",
  "mahogany", "quem disse berenice", "l'occitane au brasil", "l'occitane au brésil",
  "avatim", "phebo",
]
function categoriaPorMarca(marca) {
  const m = marca.toLowerCase()
  return MARCAS_BR.some(b => m.includes(b)) ? "nacional" : "importado-designer"
}

function tipoPorNome(nome, marca) {
  const n = nome.toLowerCase()
  const ehMarcaBR = MARCAS_BR.some(b => marca.toLowerCase().includes(b))
  if (/extrait/.test(n)) return "Extrait de Parfum"
  if (/elixir/.test(n)) return "Elixir"
  if (/profumo/.test(n)) return "Profumo"
  if (/desodorante col[oô]nia/.test(n)) return "Desodorante Colônia"
  if (/cologne/.test(n)) return ehMarcaBR ? "Desodorante Colônia" : "Eau de Cologne"
  if (/eau de parfum/.test(n)) return "EDP"
  if (/eau de toilette/.test(n)) return "EDT"
  return "EDP"
}

const NOVOS_PERFUMES = [
  // 12 originais (14 - 2 cortados: CK In2U Him, Gabriela Sabatini)
  { nome: "O Boticário Malbec Gold Eau de Parfum", marca: "O Boticário" },
  { nome: "O Boticário Arbo Puro Desodorante Colônia", marca: "O Boticário" },
  { nome: "Natura Essencial Oud Masculino Eau de Parfum", marca: "Natura" },
  { nome: "Natura Kaiak Aero Masculino Desodorante Colônia", marca: "Natura" },
  { nome: "Eudora Club 6 Intenso Desodorante Colônia", marca: "Eudora" },
  { nome: "O Boticário Floratta Red Desodorante Colônia", marca: "O Boticário" },
  { nome: "Eudora Kiss Me Lovely Desodorante Colônia", marca: "Eudora" },
  { nome: "Jo Malone English Pear & Freesia Cologne", marca: "Jo Malone London" },
  { nome: "Tiziana Terenzi Kirke Extrait de Parfum", marca: "Tiziana Terenzi" },
  { nome: "O.U.i Madeleine 862 La Pistacherie Eau de Parfum", marca: "O.U.i Original Unique Individual" },
  { nome: "Amyi 5.21 Eau de Parfum", marca: "Amyi" },
  { nome: "Granado Fervo Intenso Eau de Parfum", marca: "Granado" },
  // 6 reclassificados (erro de matching / SKU distinto)
  { nome: "Giorgio Armani Acqua di Giò Profumo", marca: "Giorgio Armani" },
  { nome: "O Boticário Zaad Eau de Parfum", marca: "O Boticário" },
  { nome: "Kenzo Flower by Kenzo Eau de Parfum", marca: "Kenzo" },
  { nome: "Ralph Lauren Woman by Ralph Lauren Eau de Parfum", marca: "Ralph Lauren" },
  { nome: "Calvin Klein CK Be Eau de Toilette", marca: "Calvin Klein" },
  { nome: "Bvlgari Black Eau de Toilette", marca: "Bvlgari" },
  // 11 extras (deduplicados)
  { nome: "Malbec Desodorante Colônia", marca: "O Boticário" },
  { nome: "Malbec Pure Gold", marca: "O Boticário" },
  { nome: "Floratta Red Eau de Toilette", marca: "O Boticário" },
  { nome: "Floratta Red Passion", marca: "O Boticário" },
  { nome: "Essencial Atraia", marca: "Natura" },
  { nome: "Ilía Secreto", marca: "Natura" },
  { nome: "Una Celebrar", marca: "Natura" },
  { nome: "Kaiak Oceano Feminino", marca: "Natura" },
  { nome: "La Victorie Intense", marca: "Eudora" },
  { nome: "Imensi", marca: "Eudora" },
  { nome: "Oud for Greatness", marca: "Initio Parfums Privés" },
]

if (NOVOS_PERFUMES.length !== 29) throw new Error(`Esperava 29 novos, lista tem ${NOVOS_PERFUMES.length}`)

const TAMANHO_BATCH = 5
const batches = []
for (let i = 0; i < NOVOS_PERFUMES.length; i += TAMANHO_BATCH) {
  batches.push(NOVOS_PERFUMES.slice(i, i + TAMANHO_BATCH))
}

function validar(p) {
  const erros = []
  if (!p.notasTopo || p.notasTopo.length < 3) erros.push("notasTopo < 3")
  if (!p.notasCoracao || p.notasCoracao.length < 3) erros.push("notasCoracao < 3")
  if (!p.notasFundo || p.notasFundo.length < 3) erros.push("notasFundo < 3")
  if (!p.familia || /^[a-z\s]+$/i.test(p.familia) && /\b(woody|floral|fresh|spicy|fruity|musky|amber)\b/i.test(p.familia)) {
    // heurística simples: família em inglês comum não traduzida
    if (/\b(woody|fresh|spicy|fruity|musky|amber)\b/i.test(p.familia)) erros.push("familia parece estar em inglês")
  }
  if (!p.descricaoTraduzida || p.descricaoTraduzida.length < 100 || p.descricaoTraduzida.length > 500) erros.push(`descricaoTraduzida fora do range (${p.descricaoTraduzida?.length ?? 0} chars)`)
  if (!["masculino", "feminino", "unissex"].includes(p.genero)) erros.push(`genero inválido: ${p.genero}`)
  if (!p.ano || p.ano < 1900 || p.ano > 2026) erros.push(`ano inválido: ${p.ano}`)
  return erros
}

console.log(`\nPasso 2/3: gerando dados de ${NOVOS_PERFUMES.length} perfumes via Gemini em ${batches.length} batches de até ${TAMANHO_BATCH}...\n`)

let contador = 0
let adicionados = 0
let erros = 0
const log = []

for (const [idx, batch] of batches.entries()) {
  const listaNomes = batch.map((p, i) => `${i + 1}. "${p.nome}" — marca: "${p.marca}"`).join("\n")

  const prompt = `Você é um especialista em perfumaria com acesso a busca no Google.
Para cada um dos perfumes abaixo, pesquise e retorne dados precisos:

${listaNomes}

Para CADA perfume, retorne:
- nome: nome limpo do produto, sem prefixo de marca duplicado
- marca: nome canônico da marca (capitalização correta)
- genero: "masculino", "feminino" ou "unissex"
- ano: ano de lançamento (número)
- familia: família olfativa principal, em PORTUGUÊS (ex: "Amadeirado Especiado", "Floral Frutado", "Cítrico Aromático")
- notasTopo: array de pelo menos 3 notas de topo, em português
- notasCoracao: array de pelo menos 3 notas de coração, em português
- notasFundo: array de pelo menos 3 notas de fundo, em português
- descricaoTraduzida: 3-5 frases em português, tom editorial elegante (estilo: "Notas de sândalo e vetiver — perfeitas para noites de outono"), entre 100 e 500 caracteres
- precoMinBrl: preço mínimo estimado em reais no mercado brasileiro (número)
- precoMaxBrl: preço máximo estimado em reais no mercado brasileiro (número)

Retorne APENAS um JSON válido (array), sem markdown, sem texto antes ou depois:
[
  {"nome": "...", "marca": "...", "genero": "...", "ano": 2020, "familia": "...", "notasTopo": ["..."], "notasCoracao": ["..."], "notasFundo": ["..."], "descricaoTraduzida": "...", "precoMinBrl": 150, "precoMaxBrl": 300},
  ...
]
Total: exatamente ${batch.length} itens, na mesma ordem da lista acima.`

  console.log(`--- Batch ${idx + 1}/${batches.length} (${batch.length} itens) ---`)
  let dadosBatch
  try {
    const texto = await gerarComRetry(prompt)
    dadosBatch = JSON.parse(limparJSON(texto))
  } catch (err) {
    console.log(`  [ERRO] Batch inteiro falhou: ${String(err)}`)
    batch.forEach(p => { contador++; erros++; log.push(`[${contador}/29] ${p.nome} → ERRO (batch falhou: ${String(err).slice(0, 100)})`) })
    continue
  }

  if (!Array.isArray(dadosBatch) || dadosBatch.length !== batch.length) {
    console.log(`  [AVISO] Gemini retornou ${dadosBatch?.length ?? "?"} itens, esperado ${batch.length}. Processando o que veio.`)
  }

  for (let i = 0; i < batch.length; i++) {
    contador++
    const original = batch[i]
    const gerado = dadosBatch[i]

    if (!gerado) {
      erros++
      log.push(`[${contador}/29] ${original.nome} → ERRO (Gemini não retornou item nesta posição)`)
      console.log(`  [${contador}/29] ${original.nome} → ERRO (sem dados)`)
      continue
    }

    const erroValidacao = validar(gerado)
    if (erroValidacao.length > 0) {
      erros++
      log.push(`[${contador}/29] ${original.nome} → ERRO validação: ${erroValidacao.join("; ")}`)
      console.log(`  [${contador}/29] ${original.nome} → ERRO: ${erroValidacao.join("; ")}`)
      continue
    }

    const id = `${slugify(gerado.nome)}-${slugify(gerado.marca)}`
    if (expandidoIds.has(id)) {
      erros++
      log.push(`[${contador}/29] ${original.nome} → PULADO (id ${id} já existe no expandido)`)
      console.log(`  [${contador}/29] ${original.nome} → PULADO (já existe: ${id})`)
      continue
    }

    const notasFlat = [...gerado.notasTopo, ...gerado.notasCoracao, ...gerado.notasFundo]
    const precoMin = Number(gerado.precoMinBrl) || 0
    const precoMax = Number(gerado.precoMaxBrl) || precoMin

    const novoPerfume = {
      id,
      nome: gerado.nome,
      marca: gerado.marca,
      tipo: tipoPorNome(original.nome, original.marca),
      genero: gerado.genero,
      ano: gerado.ano,
      inspiradoEm: null,
      marcaOriginal: null,
      familia: gerado.familia,
      notas: notasFlat,
      notasTopo: gerado.notasTopo,
      notasCoracao: gerado.notasCoracao,
      notasFundo: gerado.notasFundo,
      descricaoTraduzida: gerado.descricaoTraduzida,
      preco_brl: Math.round((precoMin + precoMax) / 2),
      preco_brl_min: precoMin,
      preco_brl_max: precoMax,
      categoria: categoriaPorMarca(gerado.marca),
      disponivel: true,
      linkCompra: null,
      imagem: null,
      imagemTransparente: null,
      imagemFallbacks: [],
    }

    expandidoArray.push(novoPerfume)
    expandidoIds.add(id)
    adicionados++
    log.push(`[${contador}/29] ${original.nome} → OK (id: ${id})`)
    console.log(`  [${contador}/29] ${original.nome} → OK (${id})`)
  }

  // Salvar incrementalmente após cada batch (~5 itens)
  salvarParcial()
  console.log(`  [checkpoint] perfumes-expandido.json salvo (${expandidoArray.length} entradas totais)\n`)
}

// ── Resumo final ──────────────────────────────────────────────────────────────
console.log("═".repeat(60))
console.log("RESUMO FASE 2")
console.log("═".repeat(60))
console.log(`Adicionados:  ${adicionados}/29`)
console.log(`Erros:        ${erros}/29`)
console.log(`Incompletos atualizados (ano): ${mergeados}/4`)
console.log(`Total no expandido agora: ${expandidoArray.length}`)

fs.writeFileSync(path.join(ROOT, "scripts", "_fase2-log.txt"), log.join("\n"), "utf8")
console.log("\nLog completo salvo em scripts/_fase2-log.txt")

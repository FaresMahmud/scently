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

const caminhoExpandido = path.join(ROOT, "data", "perfumes-expandido.json")
const expandidoRaw = JSON.parse(fs.readFileSync(caminhoExpandido, "utf8"))
const expandidoArray = Array.isArray(expandidoRaw) ? expandidoRaw : (expandidoRaw.perfumes ?? [])
const expandidoIds = new Set(expandidoArray.map(p => p.id))

function salvarParcial() {
  const saida = Array.isArray(expandidoRaw) ? expandidoArray : { ...expandidoRaw, perfumes: expandidoArray }
  fs.writeFileSync(caminhoExpandido, JSON.stringify(saida, null, 2), "utf8")
}

const MARCAS_BR = ["o boticário", "boticario", "natura", "eudora", "avon", "jequiti", "granado"]
function categoriaPorMarca(marca) {
  const m = marca.toLowerCase()
  return MARCAS_BR.some(b => m.includes(b)) ? "nacional" : "importado-designer"
}

function tipoPorNome(nome) {
  const n = nome.toLowerCase()
  if (/extrait/.test(n)) return "Extrait de Parfum"
  if (/elixir/.test(n)) return "Elixir"
  if (/profumo/.test(n)) return "Profumo"
  if (/desodorante col[oô]nia|cologne/.test(n)) return "Desodorante Colônia"
  if (/eau de parfum/.test(n)) return "EDP"
  if (/eau de toilette/.test(n)) return "EDT"
  return "EDP"
}

function validar(p) {
  const erros = []
  if (!p.notasTopo || p.notasTopo.length < 3) erros.push("notasTopo < 3")
  if (!p.notasCoracao || p.notasCoracao.length < 3) erros.push("notasCoracao < 3")
  if (!p.notasFundo || p.notasFundo.length < 3) erros.push("notasFundo < 3")
  if (/\b(woody|fresh|spicy|fruity|musky|amber)\b/i.test(p.familia ?? "")) erros.push("familia parece estar em inglês")
  if (!p.descricaoTraduzida || p.descricaoTraduzida.length < 100 || p.descricaoTraduzida.length > 500) erros.push(`descricaoTraduzida fora do range (${p.descricaoTraduzida?.length ?? 0} chars)`)
  if (!["masculino", "feminino", "unissex"].includes(p.genero)) erros.push(`genero inválido: ${p.genero}`)
  if (!p.ano || p.ano < 1900 || p.ano > 2026) erros.push(`ano inválido: ${p.ano}`)
  return erros
}

const PENDENTES = [
  { nome: "O Boticário Arbo Puro Desodorante Colônia", marca: "O Boticário" },
  { nome: "Natura Essencial Oud Masculino Eau de Parfum", marca: "Natura" },
  { nome: "Natura Kaiak Aero Masculino Desodorante Colônia", marca: "Natura" },
  { nome: "Eudora Club 6 Intenso Desodorante Colônia", marca: "Eudora" },
  { nome: "Jo Malone English Pear & Freesia Cologne", marca: "Jo Malone London" },
  { nome: "Tiziana Terenzi Kirke Extrait de Parfum", marca: "Tiziana Terenzi" },
  { nome: "Amyi 5.21 Eau de Parfum", marca: "Amyi" },
  { nome: "Giorgio Armani Acqua di Giò Profumo", marca: "Giorgio Armani" },
  { nome: "Oud for Greatness", marca: "Initio Parfums Privés" },
]

console.log(`Retentando ${PENDENTES.length} perfumes, 1 por vez...\n`)

let adicionados = 0
let erros = 0
const log = []

for (let i = 0; i < PENDENTES.length; i++) {
  const original = PENDENTES[i]
  const prompt = `Você é um especialista em perfumaria com acesso a busca no Google.
Pesquise dados precisos sobre este perfume: "${original.nome}" — marca: "${original.marca}".

IMPORTANTE: mesmo que a pirâmide olfativa oficial seja simples, você DEVE preencher pelo menos
3 notas em CADA categoria (topo, coração, fundo) — se a fonte não distinguir claramente, infira
as notas mais prováveis pra cada estágio com base na família olfativa e nos acordes principais.
A descrição deve ter entre 100 e 400 caracteres (nem mais, nem menos).

Retorne:
- nome: nome limpo do produto, sem prefixo de marca duplicado
- marca: nome canônico da marca
- genero: "masculino", "feminino" ou "unissex"
- ano: ano de lançamento (número)
- familia: família olfativa principal, em PORTUGUÊS
- notasTopo: array com NO MÍNIMO 3 notas de topo, em português
- notasCoracao: array com NO MÍNIMO 3 notas de coração, em português
- notasFundo: array com NO MÍNIMO 3 notas de fundo, em português
- descricaoTraduzida: 3-4 frases em português, tom editorial, ENTRE 100 E 400 CARACTERES
- precoMinBrl: preço mínimo estimado em reais no Brasil (número)
- precoMaxBrl: preço máximo estimado em reais no Brasil (número)

Retorne APENAS um JSON válido (objeto único, não array), sem markdown:
{"nome": "...", "marca": "...", "genero": "...", "ano": 2020, "familia": "...", "notasTopo": ["...","...","..."], "notasCoracao": ["...","...","..."], "notasFundo": ["...","...","..."], "descricaoTraduzida": "...", "precoMinBrl": 150, "precoMaxBrl": 300}`

  console.log(`[retry ${i + 1}/${PENDENTES.length}] ${original.nome}...`)
  let gerado
  try {
    const texto = await gerarComRetry(prompt)
    gerado = JSON.parse(limparJSON(texto))
  } catch (err) {
    erros++
    log.push(`[retry ${i + 1}] ${original.nome} → ERRO (Gemini/parse: ${String(err).slice(0, 150)})`)
    console.log(`  ERRO: ${String(err).slice(0, 150)}`)
    continue
  }

  const erroValidacao = validar(gerado)
  if (erroValidacao.length > 0) {
    erros++
    log.push(`[retry ${i + 1}] ${original.nome} → ERRO validação (após retry): ${erroValidacao.join("; ")}`)
    console.log(`  ERRO (persistente): ${erroValidacao.join("; ")}`)
    continue
  }

  const id = `${slugify(gerado.nome)}-${slugify(gerado.marca)}`
  if (expandidoIds.has(id)) {
    erros++
    log.push(`[retry ${i + 1}] ${original.nome} → PULADO (id ${id} já existe)`)
    console.log(`  PULADO (já existe: ${id})`)
    continue
  }

  const notasFlat = [...gerado.notasTopo, ...gerado.notasCoracao, ...gerado.notasFundo]
  const precoMin = Number(gerado.precoMinBrl) || 0
  const precoMax = Number(gerado.precoMaxBrl) || precoMin

  const novoPerfume = {
    id, nome: gerado.nome, marca: gerado.marca, tipo: tipoPorNome(original.nome),
    genero: gerado.genero, ano: gerado.ano, inspiradoEm: null, marcaOriginal: null,
    familia: gerado.familia, notas: notasFlat,
    notasTopo: gerado.notasTopo, notasCoracao: gerado.notasCoracao, notasFundo: gerado.notasFundo,
    descricaoTraduzida: gerado.descricaoTraduzida,
    preco_brl: Math.round((precoMin + precoMax) / 2), preco_brl_min: precoMin, preco_brl_max: precoMax,
    categoria: categoriaPorMarca(gerado.marca), disponivel: true, linkCompra: null,
    imagem: null, imagemTransparente: null, imagemFallbacks: [],
  }

  expandidoArray.push(novoPerfume)
  expandidoIds.add(id)
  adicionados++
  salvarParcial()
  log.push(`[retry ${i + 1}] ${original.nome} → OK (id: ${id})`)
  console.log(`  OK (${id})`)
}

console.log(`\nRetry concluído: ${adicionados}/${PENDENTES.length} recuperados, ${erros} ainda com erro.`)
fs.appendFileSync(path.join(ROOT, "scripts", "_fase2-log.txt"), "\n\n--- RETRY ---\n" + log.join("\n"), "utf8")

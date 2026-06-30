// scripts/enrich-expandido-gemini.mjs
// Enriquece perfumes incompletos no perfumes-expandido.json usando Gemini Flash + Google Search grounding
// Uso: node scripts/enrich-expandido-gemini.mjs

import { readFileSync, writeFileSync, existsSync } from "fs"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT       = join(__dirname, "..")
const EXPANDIDO_PATH    = join(ROOT, "data", "perfumes-expandido.json")
const CHECKPOINT_PATH   = join(__dirname, "gemini-enrichment-checkpoint.json")
const ENV_PATH          = join(ROOT, ".env.local")

// ── Carregar GEMINI_API_KEY do .env.local ────────────────────────────────────
function loadEnv() {
  if (!existsSync(ENV_PATH)) throw new Error(".env.local não encontrado")
  const lines = readFileSync(ENV_PATH, "utf8").split("\n")
  for (const line of lines) {
    const [key, ...rest] = line.split("=")
    if (key?.trim() === "GEMINI_API_KEY") return rest.join("=").trim()
  }
  throw new Error("GEMINI_API_KEY não encontrada no .env.local")
}

// ── Ordem de prioridade de marcas ────────────────────────────────────────────
const PRIORIDADE_MARCAS = [
  // 1. Marcas que estavam zeradas no catálogo
  "Giorgio Armani", "Paco Rabanne", "Carolina Herrera", "Yves Saint Laurent",
  "Versace", "Dolce & Gabbana", "Hugo Boss", "Jean Paul Gaultier", "Lancôme",
  "Tom Ford", "Viktor & Rolf", "Creed", "Parfums de Marly",
  "Maison Francis Kurkdjian", "Xerjoff", "Nishane", "Mancera",
  "Azzaro", "Calvin Klein", "Marc Jacobs", "Burberry", "Ralph Lauren",
  // 2. Contratipos faltando
  "In The Box",
  // 3. Nacionais incompletos
  "O Boticário", "Natura", "Eudora",
]

function prioridadeMarca(marca) {
  const idx = PRIORIDADE_MARCAS.findIndex(m => marca.toLowerCase().includes(m.toLowerCase()))
  return idx === -1 ? 9999 : idx
}

// ── Verificar se perfume está incompleto ────────────────────────────────────
function estaIncompleto(p) {
  const semNotas = !p.notas ||
    (Array.isArray(p.notas) && p.notas.length === 0) ||
    (typeof p.notas === "object" && !Array.isArray(p.notas) && !p.notas.topo?.length && !p.notas.coracao?.length && !p.notas.fundo?.length)
  return semNotas || !p.comoCheira || !p.acordes?.length || !p.familia
}

// ── Carregar checkpoint ──────────────────────────────────────────────────────
function carregarCheckpoint() {
  if (!existsSync(CHECKPOINT_PATH)) return { processados: new Set(), falhas: [] }
  try {
    const raw = JSON.parse(readFileSync(CHECKPOINT_PATH, "utf8"))
    return {
      processados: new Set(raw.processados || []),
      falhas: raw.falhas || [],
    }
  } catch {
    return { processados: new Set(), falhas: [] }
  }
}

function salvarCheckpoint(processados, falhas, ultimoProcessado, total, restantes) {
  writeFileSync(CHECKPOINT_PATH, JSON.stringify({
    ultimoProcessado,
    totalProcessados: processados.size,
    totalRestantes: restantes,
    processados: [...processados],
    falhas,
  }, null, 2))
}

// ── Prompt para o Gemini ─────────────────────────────────────────────────────
function montarPrompt(p) {
  const conc = p.tipo || "EDP"
  const gen = p.genero || "Unissex"
  return `Busque informações completas sobre o perfume "${p.nome}" da marca "${p.marca}" (${conc}, ${gen}).

Retorne APENAS JSON válido, sem markdown, sem texto fora do JSON:
{
  "notas": {
    "topo": ["nota1 em português", "nota2"],
    "coracao": ["nota1 em português", "nota2"],
    "fundo": ["nota1 em português", "nota2"]
  },
  "acordes": [
    { "nome": "Amadeirado", "percentagem": 92 },
    { "nome": "Cítrico", "percentagem": 78 }
  ],
  "familia": "amadeirado",
  "preco_brl": 650,
  "estacao": {
    "verao": "Ótimo",
    "primavera": "Ótimo",
    "outono": "Bom",
    "inverno": "Fraco"
  },
  "ocasiao": {
    "casual": "Ótimo",
    "profissional": "Bom",
    "noite": "Fraco",
    "esporte": "Fraco",
    "romantico": "Bom"
  },
  "comoCheira": "Descrição sensorial em português, 2-3 frases curtas.",
  "paraQuem": "Para quem é esse perfume, 1-2 frases.",
  "quandoUsar": "Melhor momento de uso, 1-2 frases.",
  "comoSeComporta": "Projeção e fixação, 1-2 frases."
}

Regras:
- Todas as notas e acordes em PORTUGUÊS
- Preço médio atual no Brasil em reais (se não encontrar, retorne null)
- Ratings de estação/ocasião: apenas "Ótimo", "Bom" ou "Fraco"
- familia em minúsculo: amadeirado, cítrico, oriental, fresco, floral, aromático, aquático, gourmand, chipre, couro, fougère
- Descrições no tom Nozze: elegante, sensorial, frases curtas, sem jargão técnico`
}

// ── Extrair JSON da resposta ─────────────────────────────────────────────────
function extrairJSON(texto) {
  // Tenta direto
  try { return JSON.parse(texto.trim()) } catch {}
  // Remove markdown
  const match = texto.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (match) { try { return JSON.parse(match[1].trim()) } catch {} }
  // Tenta encontrar { ... }
  const start = texto.indexOf("{")
  const end   = texto.lastIndexOf("}")
  if (start !== -1 && end !== -1) {
    try { return JSON.parse(texto.slice(start, end + 1)) } catch {}
  }
  return null
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const apiKey = loadEnv()
  const genai  = new GoogleGenerativeAI(apiKey)
  const model  = genai.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      thinkingConfig: { thinkingBudget: 0 },
    },
    tools: [{ googleSearch: {} }],
  })

  // Carregar dados
  let dados = JSON.parse(readFileSync(EXPANDIDO_PATH, "utf8"))
  const { processados, falhas } = carregarCheckpoint()

  // Filtrar incompletos e ordenar por prioridade
  const fila = dados
    .filter(p => estaIncompleto(p) && !processados.has(`${p.nome}|${p.marca}`))
    .sort((a, b) => prioridadeMarca(a.marca) - prioridadeMarca(b.marca))

  const totalFila = fila.length
  console.log(`[Enrich] ${processados.size} já processados. ${totalFila} perfumes na fila.`)

  if (totalFila === 0) {
    console.log("[Enrich] Nada a enriquecer. Tudo pronto!")
    return
  }

  let processadosNestaSessao = 0

  for (let i = 0; i < fila.length; i++) {
    const p = fila[i]
    const chave = `${p.nome}|${p.marca}`
    const inicio = Date.now()

    try {
      let texto = "";
      let enriched = null;
      let ms = 0;
      const retries = 3;
      const baseDelay = 2000;

      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const prompt = montarPrompt(p)
          const result = await model.generateContent(prompt)
          texto = result.response.text()
          ms = Date.now() - inicio

          enriched = extrairJSON(texto)
          if (!enriched) {
            throw new Error(`JSON inválido ou incompleto na resposta (tentativa ${attempt}): ${texto.slice(0, 200)}`)
          }
          break; // Sucesso, sai do loop de tentativas
        } catch (err) {
          const msg = err?.message || String(err)
          console.warn(`[Enrich] [Tentativa ${attempt}/${retries}] Falha para ${chave}: ${msg}`)
          if (attempt === retries) {
            throw err; // Propaga o erro se esgotar as tentativas
          }
          // Espera antes de tentar novamente (com backoff simples)
          await new Promise(r => setTimeout(r, baseDelay * attempt))
        }
      }

      // Aplicar dados enriquecidos ao perfume (sem sobrescrever campos existentes bons)
      const idx = dados.findIndex(d => d.nome === p.nome && d.marca === p.marca)
      if (idx !== -1) {
        if (enriched.notas && typeof enriched.notas === "object" && !Array.isArray(enriched.notas)) {
          dados[idx].notas = enriched.notas
        } else if (enriched.notas && Array.isArray(enriched.notas) && enriched.notas.length > 0 &&
                   (!dados[idx].notas || (Array.isArray(dados[idx].notas) && dados[idx].notas.length === 0))) {
          dados[idx].notas = enriched.notas
        }
        if (enriched.acordes?.length) dados[idx].acordes = enriched.acordes
        if (enriched.familia)         dados[idx].familia = enriched.familia
        if (enriched.preco_brl != null && !dados[idx].preco_brl) dados[idx].preco_brl = enriched.preco_brl
        if (enriched.estacao)         dados[idx].estacao = enriched.estacao
        if (enriched.ocasiao)         dados[idx].ocasiao = enriched.ocasiao
        if (enriched.comoCheira)      dados[idx].comoCheira = enriched.comoCheira
        if (enriched.paraQuem)        dados[idx].paraQuem = enriched.paraQuem
        if (enriched.quandoUsar)      dados[idx].quandoUsar = enriched.quandoUsar
        if (enriched.comoSeComporta)  dados[idx].comoSeComporta = enriched.comoSeComporta
      }

      // Salvar imediatamente
      writeFileSync(EXPANDIDO_PATH, JSON.stringify(dados, null, 2))

      processados.add(chave)
      processadosNestaSessao++
      const restantes = totalFila - processadosNestaSessao

      salvarCheckpoint(processados, falhas, chave, dados.length, restantes)

      console.log(`[Enrich] ✓ ${processadosNestaSessao}/${totalFila} — ${chave} (${ms}ms)`)

    } catch (err) {
      const msg = err?.message || String(err)
      console.error(`[Enrich] FALHA: ${chave} — ${msg}`)
      falhas.push({ chave, erro: msg, timestamp: new Date().toISOString() })
      salvarCheckpoint(processados, falhas, chave, dados.length, totalFila - processadosNestaSessao)
    }

    // Rate limit: 2s entre chamadas
    if (i < fila.length - 1) {
      await new Promise(r => setTimeout(r, 2000))
    }
  }

  console.log(`\n[Enrich] Concluído! ${processadosNestaSessao} enriquecidos, ${falhas.length} falhas.`)
  if (falhas.length > 0) {
    console.log("[Enrich] Falhas:")
    falhas.forEach(f => console.log(`  - ${f.chave}: ${f.erro}`))
  }
}

main().catch(err => {
  console.error("[Enrich] Erro fatal:", err)
  process.exit(1)
})

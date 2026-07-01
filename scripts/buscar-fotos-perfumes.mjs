// scripts/buscar-fotos-perfumes.mjs
// Busca URLs de imagem do frasco para perfumes sem foto no perfumes-expandido.json
// Uso: node scripts/buscar-fotos-perfumes.mjs

import { readFileSync, writeFileSync, existsSync } from "fs"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import https from "https"
import http from "http"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT            = join(__dirname, "..")
const EXPANDIDO_PATH  = join(ROOT, "data", "perfumes-expandido.json")
const CHECKPOINT_PATH = join(__dirname, "fotos-checkpoint.json")
const ENV_PATH        = join(ROOT, ".env.local")

// ── Carregar GEMINI_API_KEY ──────────────────────────────────────────────────
function loadEnv() {
  if (!existsSync(ENV_PATH)) throw new Error(".env.local não encontrado")
  for (const line of readFileSync(ENV_PATH, "utf8").split("\n")) {
    const [key, ...rest] = line.split("=")
    if (key?.trim() === "GEMINI_API_KEY") return rest.join("=").trim()
  }
  throw new Error("GEMINI_API_KEY não encontrada no .env.local")
}

// ── Checkpoint ───────────────────────────────────────────────────────────────
function carregarCheckpoint() {
  if (!existsSync(CHECKPOINT_PATH)) return { processados: new Set(), falhas: [] }
  try {
    const raw = JSON.parse(readFileSync(CHECKPOINT_PATH, "utf8"))
    return { processados: new Set(raw.processados || []), falhas: raw.falhas || [] }
  } catch {
    return { processados: new Set(), falhas: [] }
  }
}

function salvarCheckpoint(processados, falhas, ultimo, total, restantes) {
  writeFileSync(CHECKPOINT_PATH, JSON.stringify({
    ultimoProcessado: ultimo,
    totalProcessados: processados.size,
    totalRestantes:   restantes,
    processados:      [...processados],
    falhas,
  }, null, 2))
}

// ── Verificar URL de imagem ───────────────────────────────────────────────────
const DOMINIOS_CONFIAVEIS = new Set([
  "fragrantica.com", "fimgs.net", "sephora.com.br", "sfrfrancaise.com",
  "cdn.shopify.com", "media.douglas.de", "i.pinimg.com",
  "perfumeboss.com.br", "epocacosmeticos.com.br", "belezanaweb.com.br",
])
const EXT_IMAGEM = /\.(jpg|jpeg|png|webp)(\?.*)?$/i

function dominioConfiavel(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "")
    return [...DOMINIOS_CONFIAVEIS].some(d => host === d || host.endsWith("." + d))
  } catch { return false }
}

function verificarUrl(url) {
  return new Promise((resolve) => {
    if (!url || !url.startsWith("http")) { resolve(false); return }
    // Domínio confiável + extensão de imagem → aceita sem verificar
    if (dominioConfiavel(url) && EXT_IMAGEM.test(url)) { resolve(true); return }
    // Outros domínios → GET com timeout 5s
    try {
      const mod = url.startsWith("https") ? https : http
      const req = mod.request(url, {
        method: "GET", timeout: 5000,
        headers: { "User-Agent": "Mozilla/5.0", "Referer": "" },
      }, (res) => {
        res.destroy() // descarta o body
        const ct = res.headers["content-type"] ?? ""
        resolve(res.statusCode === 200 && ct.startsWith("image/"))
      })
      req.on("error", () => resolve(false))
      req.on("timeout", () => { req.destroy(); resolve(false) })
      req.end()
    } catch {
      resolve(false)
    }
  })
}

// ── Extrair JSON da resposta ─────────────────────────────────────────────────
function extrairJSON(texto) {
  try { return JSON.parse(texto.trim()) } catch {}
  const match = texto.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (match) { try { return JSON.parse(match[1].trim()) } catch {} }
  const start = texto.indexOf("{"), end = texto.lastIndexOf("}")
  if (start !== -1 && end !== -1) { try { return JSON.parse(texto.slice(start, end + 1)) } catch {} }
  return null
}

// ── Prompt ───────────────────────────────────────────────────────────────────
function montarPrompt(p) {
  const conc = p.tipo || p.concentracao || "EDP"
  return `Encontre a URL da imagem oficial do frasco do perfume "${p.nome}" de "${p.marca}" na concentração ${conc}.

Regras:
- DEVE ser foto do frasco oficial, não de decant, miniatura ou amostra
- DEVE ser a concentração correta (${conc})
- Priorize fontes: site oficial da marca > Sephora > Fragrantica > Ulta > loja autorizada
- Retorne APENAS JSON válido, sem markdown: { "imagemUrl": "https://...", "fonte": "nome do site" }
- Se não encontrar imagem confiável, retorne: { "imagemUrl": null, "fonte": null }`
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const apiKey = loadEnv()
  const genai  = new GoogleGenerativeAI(apiKey)
  const model  = genai.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { thinkingConfig: { thinkingBudget: 0 } },
    tools: [{ googleSearch: {} }],
  })

  let dados = JSON.parse(readFileSync(EXPANDIDO_PATH, "utf8"))
  const { processados, falhas } = carregarCheckpoint()

  // Filtra perfumes sem imagem que ainda não foram processados
  const fila = dados.filter(p => {
    const temFoto = p.imagemUrl || p.imagem || p.imagemTransparente
    const chave   = `${p.nome}|${p.marca}`
    return !temFoto && !processados.has(chave)
  })

  const totalFila = fila.length
  console.log(`[Foto] ${processados.size} já processados. ${totalFila} perfumes sem imagem na fila.`)

  if (totalFila === 0) {
    console.log("[Foto] Nada a processar. Tudo pronto!")
    return
  }

  let processadosNestaSessao = 0

  for (let i = 0; i < fila.length; i++) {
    const p     = fila[i]
    const chave = `${p.nome}|${p.marca}`
    const inicio = Date.now()

    try {
      const result = await model.generateContent(montarPrompt(p))
      const texto  = result.response.text()
      const ms     = Date.now() - inicio
      const parsed = extrairJSON(texto)

      if (!parsed) throw new Error(`JSON inválido: ${texto.slice(0, 150)}`)

      let imagemUrl = parsed.imagemUrl ?? null
      const fonte   = parsed.fonte ?? null

      // Verificar se a URL realmente retorna uma imagem
      if (imagemUrl) {
        const ok = await verificarUrl(imagemUrl)
        if (!ok) {
          console.warn(`[Foto] URL bloqueada ou inválida: ${imagemUrl}`)
          imagemUrl = null
        }
      }

      // Salvar no JSON
      const idx = dados.findIndex(d => d.nome === p.nome && d.marca === p.marca)
      if (idx !== -1) {
        dados[idx].imagemUrl       = imagemUrl
        dados[idx].imagemUrlFonte  = fonte
      }

      writeFileSync(EXPANDIDO_PATH, JSON.stringify(dados, null, 2))

      processados.add(chave)
      processadosNestaSessao++
      const restantes = totalFila - processadosNestaSessao

      salvarCheckpoint(processados, falhas, chave, dados.length, restantes)

      const status = imagemUrl ? `✓ ${fonte}` : "— sem foto"
      console.log(`[Foto] ${status} ${processadosNestaSessao}/${totalFila} — ${chave} (${ms}ms)`)

    } catch (err) {
      const msg = err?.message || String(err)
      console.error(`[Foto] FALHA: ${chave} — ${msg}`)
      falhas.push({ chave, erro: msg, timestamp: new Date().toISOString() })
      salvarCheckpoint(processados, falhas, chave, dados.length, totalFila - processadosNestaSessao)
    }

    if (i < fila.length - 1) await new Promise(r => setTimeout(r, 2000))
  }

  const comFoto    = dados.filter(d => d.imagemUrl).length
  const semFoto    = dados.filter(d => !d.imagemUrl && !d.imagem && !d.imagemTransparente).length
  console.log(`\n[Foto] Concluído! ${processadosNestaSessao} processados, ${falhas.length} falhas.`)
  console.log(`[Foto] Situação final: ${comFoto} com foto, ${semFoto} sem foto.`)
}

main().catch(err => { console.error("[Foto] Erro fatal:", err); process.exit(1) })

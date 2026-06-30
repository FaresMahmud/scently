// ============================================
// ARQUIVO: lib/gemini.ts
// O QUE FAZ: cliente Gemini compartilhado — usado pelo consultor (chat e quiz)
//            e pelo scanner. thinkingBudget SEMPRE 0 (sem raciocínio estendido,
//            respostas mais rápidas e mais baratas).
// QUANDO MANDAR PRA IA: quando quiser trocar de modelo ou mudar config padrão
// DEPENDE DE: .env.local (GEMINI_API_KEY)
// ============================================

import "server-only"
import { GoogleGenerativeAI, type Tool } from "@google/generative-ai"

let _client: GoogleGenerativeAI | null = null

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("GEMINI_API_KEY não configurada")
  if (!_client) _client = new GoogleGenerativeAI(apiKey)
  return _client
}

interface GeminiFlashOptions {
  systemInstruction?: string
  tools?: Tool[]
  /** ex: "application/json" — força saída JSON estruturada quando suportado. */
  responseMimeType?: string
}

/** Modelo Gemini Flash padrão do projeto — thinkingBudget é sempre 0. */
export function getGeminiFlash(options: GeminiFlashOptions = {}) {
  return getClient().getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: options.systemInstruction,
    tools: options.tools,
    generationConfig: {
      thinkingConfig: { thinkingBudget: 0 },
      ...(options.responseMimeType ? { responseMimeType: options.responseMimeType } : {}),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  })
}

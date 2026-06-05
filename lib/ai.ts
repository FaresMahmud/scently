// ============================================
// ARQUIVO: lib/ai.ts
// O QUE FAZ: integração com DeepSeek via fetch direto — monta prompt e retorna recomendação
// QUANDO MANDAR PRA IA: quando quiser mudar tom de voz, estrutura do JSON ou modelo usado
// DEPENDE DE: .env.local (DEEPSEEK_API_KEY), data/regras-preco.json
// ============================================

import { contratipoRepository } from "@/lib/repositories/ContratipoRepository"
import { buscarSimilares, buscarPorNome } from "@/lib/fragella"
import { traduzir } from "@/lib/utils"
import regrasPreco from "@/data/regras-preco.json"
import { CONSULTOR_TONE_GUIDE } from "@/lib/aiPrompts"
import { z } from "zod"

export interface RespostasQuiz {
  perfil?: string
  genero?: string
  vibe?: string
  sensacao?: string
  ocasiao?: string
  clima?: string
  notasAmadas?: string[]
  notasOdiadas?: string[]
  faixaPreco?: string
  perfumeAtual?: string
  referenciaCheiro?: string
  ousadia?: string
  prioridade?: string
  estacao?: string
  hora?: string
  personalidade?: string
  ambiente?: string
  fixacaoProjecao?: string
  inspiracaoSensorial?: string
  identidade?: string | string[]
  [key: string]: unknown
}

export interface RecomendacaoIA {
  perfumePrincipal: {
    nome: string
    marca: string
    concentracao: string
    descricao: string
    notas: string[]
  }
  conselho: string
  alternativa: {
    nome: string
    marca: string
    descricao: string
  }
}

const RecomendacaoIASchema = z.object({
  perfumePrincipal: z.object({
    nome: z.string().min(1),
    marca: z.string().min(1),
    concentracao: z.enum(["EDP", "EDT", "EDC"]),
    descricao: z.string().min(1),
    notas: z.array(z.string()).max(8),
  }),
  conselho: z.string().min(1),
  alternativa: z.object({
    nome: z.string().min(1),
    marca: z.string().min(1),
    descricao: z.string().min(1),
  }),
})

const SYSTEM_PROMPT = `${CONSULTOR_TONE_GUIDE}
Schema obrigatório:
{"perfumePrincipal":{"nome":"","marca":"","concentracao":"","descricao":"","notas":[]},"conselho":"","alternativa":{"nome":"","marca":"","descricao":""}}

Regras de decisão:
- Nunca invente perfumes.
- Se a faixa for economico, use apenas contratipos ou marcas nacionais.
- Se a faixa for medio, evite nicho caro e mantenha importados acessiveis.
- Se a pessoa pedir ousadia alta, fuja dos best-sellers mais obvios.
- Use os campos de clima, estacao, hora, personalidade, ambiente e identidade juntos, nao isoladamente.
- Mantenha "conselho" curto, pratico e com motivo claro.
- Escolha uma alternativa realmente coerente, da mesma familia e clima.
- Se houver duvida, prefira a opcao mais conhecida e plausivel.`

const MARCAS_PROIBIDAS_ECONOMICO: string[] = regrasPreco.economico
const MARCAS_PROIBIDAS_MEDIO: string[] = regrasPreco.medio

export function validarFaixaPreco(resultado: RecomendacaoIA, faixaPreco: string): boolean {
  const marcaPrincipal = resultado.perfumePrincipal.marca.toLowerCase()
  const nomePrincipal = resultado.perfumePrincipal.nome.toLowerCase()
  const textoCompleto = `${marcaPrincipal} ${nomePrincipal}`

  if (faixaPreco === "economico") {
    const proibida = MARCAS_PROIBIDAS_ECONOMICO.some(m => textoCompleto.includes(m))
    if (proibida) console.warn(`[IA] BLOQUEADO econômico: "${resultado.perfumePrincipal.marca} ${resultado.perfumePrincipal.nome}"`)
    return !proibida
  }
  if (faixaPreco === "medio") {
    const proibida = MARCAS_PROIBIDAS_MEDIO.some(m => textoCompleto.includes(m))
    if (proibida) console.warn(`[IA] BLOQUEADO médio: "${resultado.perfumePrincipal.marca} ${resultado.perfumePrincipal.nome}"`)
    return !proibida
  }
  return true
}

export function formatarRespostas(r: RespostasQuiz): string {
  const partes: string[] = []
  if (r.perfil) partes.push(`perfil:${r.perfil}`)
  if (r.genero) partes.push(`genero:${r.genero}`)
  if (r.vibe) partes.push(`vibe:${r.vibe}`)
  if (r.sensacao) partes.push(`sensacao:${r.sensacao}`)
  if (r.ocasiao) partes.push(`ocasiao:${r.ocasiao}`)
  if (r.clima) partes.push(`clima:${r.clima}`)
  if (r.notasAmadas?.length) partes.push(`ama:${r.notasAmadas.join(",")}`)
  if (r.notasOdiadas?.length) partes.push(`odeia:${r.notasOdiadas.join(",")}`)
  if (r.faixaPreco) partes.push(`preco:${r.faixaPreco}`)
  if (r.perfumeAtual) partes.push(`usa:${r.perfumeAtual}`)
  if (r.referenciaCheiro) partes.push(`cheiro:${r.referenciaCheiro}`)
  if (r.ousadia) partes.push(`ousadia:${r.ousadia}`)
  if (r.prioridade) partes.push(`prioridade:${r.prioridade}`)
  if (r.estacao) partes.push(`estacao:${r.estacao}`)
  if (r.hora) partes.push(`hora:${r.hora}`)
  if (r.personalidade) partes.push(`personalidade:${r.personalidade}`)
  if (r.ambiente) partes.push(`ambiente:${r.ambiente}`)
  if (r.fixacaoProjecao) partes.push(`projecao:${r.fixacaoProjecao}`)
  if (r.inspiracaoSensorial) partes.push(`imagem:${r.inspiracaoSensorial}`)
  if (r.identidade) {
    const val = Array.isArray(r.identidade) ? r.identidade.join(",") : r.identidade
    partes.push(`identidade:${val}`)
  }
  return partes.join("|")
}

async function chamarDeepSeek(chave: string, prompt: string): Promise<string> {
  const url = "https://api.deepseek.com/chat/completions"

  const body = {
    model: "deepseek-chat",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    temperature: 0.35,
    max_tokens: 700,
    response_format: { type: "json_object" },
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  let res: Response
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${chave}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq ${res.status}: ${err}`)
  }

  const dados = await res.json()
  return dados?.choices?.[0]?.message?.content ?? ""
}

export async function gerarRecomendacao(
  respostas: Record<string, unknown>
): Promise<RecomendacaoIA | null> {
  const chave = process.env.DEEPSEEK_API_KEY
  if (!chave || chave === "sua_chave_aqui") {
    console.error("[IA] DEEPSEEK_API_KEY não configurada")
    return null
  }

  const climaExtra = (() => {
    const clima = String((respostas as RespostasQuiz).clima ?? '')
    const estacao = String((respostas as RespostasQuiz).estacao ?? '')
    const hora = String((respostas as RespostasQuiz).hora ?? '')

    const quente = clima === 'quente' || estacao === 'verao'
    const frio = clima === 'frio' || estacao === 'inverno'
    const noite = hora === 'noite' || (respostas as RespostasQuiz).ambiente === 'noite-balada'

    const instrucoes = []
    if (quente) instrucoes.push('Clima QUENTE: recomende frescos, aquáticos ou cítricos. PROIBIDO orientais pesados, gourmands densos, oud.')
    if (frio) instrucoes.push('Clima FRIO: recomende orientais, amadeirados, gourmands ou especiados. PROIBIDO aquáticos, cítricos leves.')
    if (noite) instrucoes.push('Uso NOTURNO: prefira orientais, florais intensos ou amadeirados sensuais.')

    return instrucoes.length ? '\n' + instrucoes.join('\n') : ''
  })()

  const faixaPrecoPrompt = String((respostas as RespostasQuiz).faixaPreco ?? "")

  const listaContratipos = faixaPrecoPrompt === "economico"
    ? contratipoRepository.findAll()
        .slice(0, 30)
        .map(p => `${p.nome} — ${p.marca} (${p.tipo}, ${p.genero}, ${p.familia})`)
        .join("\n")
    : null

  const instrucaoContratipos = listaContratipos
    ? `\nPERFUMES DISPONÍVEIS NO CATÁLOGO (escolha APENAS entre estes para faixa econômica):\n${listaContratipos}`
    : ""

  const prompt = `Perfil: ${formatarRespostas(respostas as RespostasQuiz)}.${climaExtra}${instrucaoContratipos}

Responda APENAS com JSON válido seguindo exatamente este exemplo:
{
  "perfumePrincipal": {
    "nome": "Carbon",
    "marca": "La Rive",
    "concentracao": "EDT",
    "descricao": "Fresco e especiado com ambroxan. Abre cítrico e seca em almíscar quente.",
    "notas": ["bergamota", "pimenta", "ambroxan", "cedro"]
  },
  "conselho": "Duas borrifadas no pescoço bastam. No calor projeta bem sozinho.",
  "alternativa": {
    "nome": "Aventhis 2010",
    "marca": "In The Box",
    "descricao": "Abacaxi defumado com bétula. Mais frutado e marcante que o Carbon."
  }
}

Regras obrigatórias:
- "nome" é o perfume especifico, nunca a marca.
- "marca" é o fabricante.
- "concentracao" deve ser apenas EDP, EDT ou EDC.
- "descricao" deve ser curta, sensorial e sem travessões.
- "conselho" precisa ser pratico e explicar o motivo.
- "alternativa" deve manter familia e clima coerentes com o principal.
- Se o clima for quente, prefira frescos ou aquaticos.
- Se o clima for frio, prefira orientais ou amadeirados.`

  console.log("[IA] Prompt enviado:", prompt)

  try {
    console.log("[IA] Chamando DeepSeek deepseek-chat")
    const texto = await chamarDeepSeek(chave, prompt)
    console.log("[IA] Resposta bruta:", texto.slice(0, 200))

    const jsonMatch = texto.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("Sem JSON na resposta")

    const parsed = RecomendacaoIASchema.safeParse(JSON.parse(jsonMatch[0]))
    if (!parsed.success) {
      console.error("[IA] JSON inválido:", parsed.error.issues.map(i => i.message).join("; "))
      throw new Error("JSON inválido")
    }
    const resultado = parsed.data

    const faixaPreco = String((respostas as RespostasQuiz).faixaPreco ?? "")
    if (faixaPreco && !validarFaixaPreco(resultado, faixaPreco)) {
      console.warn(`[IA] Marca "${resultado.perfumePrincipal.marca}" fora da faixa "${faixaPreco}" — usando fallback`)
      return gerarFallback(respostas)
    }

    // Se econômico, verifica se nome+marca existem no banco
    if (faixaPreco === "economico") {
      const existe = contratipoRepository.findAll().some(
        p =>
          p.nome.toLowerCase() === resultado.perfumePrincipal.nome.toLowerCase() &&
          p.marca.toLowerCase() === resultado.perfumePrincipal.marca.toLowerCase()
      )
      if (!existe) {
        console.warn(`[IA] Nome inventado: "${resultado.perfumePrincipal.nome} — ${resultado.perfumePrincipal.marca}" — substituindo por fallback`)
        return gerarFallback(respostas)
      }
    }

    console.log("[IA] Sucesso com Groq")

    // Enriquece as notas do perfume principal com dados reais da Fragella
    try {
      const query = `${resultado.perfumePrincipal.nome} ${resultado.perfumePrincipal.marca}`
      const dadosReais = await buscarPorNome(query, 1)
      if (dadosReais.length > 0) {
        const perfume = dadosReais[0]
        const notasReais = [
          ...perfume.notasTopo,
          ...perfume.notasCoracao,
          ...perfume.notasFundo,
        ].slice(0, 6)
        if (notasReais.length > 0) {
          resultado.perfumePrincipal.notas = notasReais
          console.log("[IA] Notas reais Fragella:", notasReais.join(", "))
        }
      } else {
        console.log("[IA] Fragella sem resultado para notas — mantendo notas da IA")
      }
    } catch {
      // Fragella indisponível — mantém notas geradas pela IA
    }

    // Enriquece a alternativa com dados reais da Fragella
    // (substitui a alternativa inventada pela IA por um perfume real, similar e dentro da faixa de preço)
    if (faixaPreco !== "economico") {
      const LIMITE_PRECO: Record<string, number> = {
        economico: 150,
        medio:     350,
        premium:   700,
        luxo:      Infinity,
      }
      const limitePreco = LIMITE_PRECO[faixaPreco] ?? Infinity
      const generoUsuario = String((respostas as RespostasQuiz).genero ?? "")

      const generoValido = (g: string) => {
        if (!generoUsuario) return true
        if (g?.toLowerCase() === "unisex") return true
        if (generoUsuario === "masculino") return g?.toLowerCase() === "men"
        if (generoUsuario === "feminino") return g?.toLowerCase() === "women"
        return true
      }
      const dentroDoPreco = (p: { preco?: number }) => !p.preco || p.preco <= limitePreco

      try {
        const similares = await buscarSimilares(resultado.perfumePrincipal.nome, 3)
        if (similares?.similar_fragrances?.length) {
          const nomePrincipal = resultado.perfumePrincipal.nome.toLowerCase()
          const marcaPrincipal = resultado.perfumePrincipal.marca.toLowerCase()

          const alt = similares.similar_fragrances.find(p => {
            const nomeSimilar  = p.nome?.toLowerCase() ?? ""
            const marcaSimilar = p.marca?.toLowerCase() ?? ""

            // Rejeita se for o mesmo perfume (match parcial no nome + mesma marca)
            const mesmoPerfume = nomeSimilar.includes(nomePrincipal) || nomePrincipal.includes(nomeSimilar)
            const mesmaMarca   = marcaSimilar === marcaPrincipal
            if (mesmoPerfume && mesmaMarca) return false

            return generoValido(p.genero) && dentroDoPreco(p)
          })
          if (alt) {
            resultado.alternativa = {
              nome: alt.nome,
              marca: alt.marca,
              descricao: alt.acordesPrincipais?.length
                ? `${alt.acordesPrincipais.slice(0, 3).map(a => traduzir(a)).join(", ")}.${alt.longevidade ? ` Longevidade ${alt.longevidade.toLowerCase()}.` : ""}`
                : resultado.alternativa.descricao,
            }
            console.log("[IA] Alternativa Fragella dentro da faixa:", alt.nome, "—", alt.marca, alt.preco ? `(R$${alt.preco})` : "(preço não informado)")
          } else {
            console.log("[IA] Nenhum similar compatível (faixa/gênero) — mantendo alternativa da IA")
          }
        }
      } catch {
        // Fragella indisponível — mantém alternativa gerada pela IA
      }
    }

    return resultado
  } catch (erro) {
    console.error("[IA] Groq falhou:", erro instanceof Error ? erro.message : erro)
  }

  console.error("[IA] Groq falhou — usando fallback")
  return gerarFallback(respostas)
}

// ── Quiz novo: free (7q) / premium (18q) ─────────────────────────────────────

export interface RecomendacaoCard {
  nome: string
  marca: string
  codigo: string
  explicacao: string
  quando?: string     // when / ideal moment to wear — max 12 words
  aplicacao?: string  // how many sprays, where to apply — max 10 words
}

export interface RecomendacaoQuiz {
  ideal:       RecomendacaoCard
  alternativo?: RecomendacaoCard
  ousado?:     RecomendacaoCard
}

const RecomendacaoCardSchema = z.object({
  nome:       z.string().min(1),
  marca:      z.string().min(1),
  codigo:     z.string().min(1),
  explicacao: z.string().min(1),
  quando:     z.string().optional(),
  aplicacao:  z.string().optional(),
})

const RecomendacaoQuizSchema = z.object({
  ideal:       RecomendacaoCardSchema,
  alternativo: RecomendacaoCardSchema.optional(),
  ousado:      RecomendacaoCardSchema.optional(),
})

// Human-readable labels for each quiz question id
const LABELS_QUIZ: Record<string, string> = {
  // free (7q)
  contexto:     "Contexto de uso",
  genero:       "Gênero buscado",
  presenca:     "Presença desejada",
  cena:         "Cena de vida",
  cidade:       "Estilo de vida",
  sensacao:     "Sensação a transmitir",
  olfato:       "Preferência olfativa",
  orcamento:    "Orçamento",
  // premium additions (18q)
  idade:        "Faixa de idade",
  experiencia:  "Experiência com perfumes",
  clima:        "Clima",
  rotina:       "Rotina diária",
  vida_social:  "Vida social",
  fds:          "Fim de semana ideal",
  frequencia:   "Frequência de uso",
  personalidade:"Personalidade",
  impressao:    "Impressão desejada",
  identidade:   "Identidade",
  luxo:         "Relação com luxo",
  estilo:       "Estilo visual",
  imagem:       "Imagem sensorial",
  bebida:       "Perfume como bebida",
  estacao:      "Época de uso",
  memoria:      "Memória olfativa",
  incomodo:     "O que incomoda em perfumes",
}

/**
 * Formats quiz answers (id → option text) into a readable multi-line string.
 * Answers are expected to already carry the option's full text (not the letter id).
 */
function formatarRespostasLegivel(respostas: Record<string, string>): string {
  return Object.entries(respostas)
    .filter(([, v]) => Boolean(v))
    .map(([k, v]) => {
      const label = LABELS_QUIZ[k] ?? k
      return `${label}: ${v}`
    })
    .join("\n")
}

// Brazilian supplier whitelist — both Azza spellings included
const MARCAS_CONTRATIPOS = new Set([
  "In The Box",
  "JA Essence",
  "Maison Viegas",
  "Azza Parfum",
  "Azza Parfums",
])

// ── Expanded catalog (perfumes-expandido.json) ────────────────────────────────

interface PerfumeExpandido {
  id:            string
  nome:          string
  marca:         string
  tipo:          string
  genero:        string
  inspiradoEm:   string | null
  marcaOriginal: string | null
  familia:       string
  notas:         string[]
  preco_brl:     number
  categoria:     "contratipo" | "arabe" | "nacional" | "importado-designer" | "nicho"
  disponivel:    boolean
  linkCompra:    string
}

let _expandido: PerfumeExpandido[] | null = null
function getExpandido(): PerfumeExpandido[] {
  if (_expandido) return _expandido
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _expandido = require("@/data/perfumes-expandido.json") as PerfumeExpandido[]
  } catch {
    _expandido = []
  }
  return _expandido
}

// Budget answer text → max price in BRL (null = no ceiling)
function limitePreco(orcamento: string | undefined): number | null {
  if (!orcamento) return null
  if (orcamento.includes("150") && orcamento.toLowerCase().startsWith("até")) return 150
  if (orcamento.includes("150") && orcamento.includes("300"))                  return 300
  if (orcamento.includes("300") && orcamento.includes("500"))                  return 500
  return null // "Sem limite" or unrecognised → no ceiling
}

// Which categories to include based on budget ceiling
function categoriasPermitidas(teto: number | null): Set<string> {
  // Low budget (≤R$300): skip nicho and importado-designer (typically R$450+)
  if (teto !== null && teto <= 300) {
    return new Set(["contratipo", "nacional", "arabe"])
  }
  // Medium budget (≤R$500): skip nicho
  if (teto !== null && teto <= 500) {
    return new Set(["contratipo", "nacional", "arabe", "importado-designer"])
  }
  // No limit: all categories
  return new Set(["contratipo", "nacional", "arabe", "importado-designer", "nicho"])
}

/**
 * Builds the catalog snippet injected into the quiz prompt.
 * Merges contratipos.json + perfumes-expandido.json, filters by:
 *   - disponivel !== false
 *   - preco_brl > 0
 *   - categoria appropriate for user's budget
 *   - contratipo entries must be from whitelisted BR suppliers
 * Format: id | nome | marca | categoria | família | tipo | inspirado em | preço
 */
function buildCatalogSnippet(orcamento?: string): string {
  const teto       = limitePreco(orcamento)
  const categorias = categoriasPermitidas(teto)

  // ── Source 1: contratipos.json (legacy) ──────────────────────────────────
  const contratiposAtivos = contratipoRepository.findAll().filter(p =>
    MARCAS_CONTRATIPOS.has(p.marca) &&
    p.disponivel !== false &&
    p.preco_brl > 0
  )

  // ── Source 2: perfumes-expandido.json ────────────────────────────────────
  const expandidoAtivos = getExpandido().filter(p =>
    p.disponivel !== false &&
    p.preco_brl > 0 &&
    categorias.has(p.categoria) &&
    // For contratipo entries in expandido, also enforce supplier whitelist
    (p.categoria !== "contratipo" || MARCAS_CONTRATIPOS.has(p.marca) ||
      ["Thera Cosméticos", "Paris Elysees"].includes(p.marca))
  )

  // ── Merge, dedup by id ────────────────────────────────────────────────────
  const seen  = new Set<string>()
  const todos: Array<{ id: string; nome: string; marca: string; familia: string; tipo: string; inspiradoEm: string | null; preco_brl: number; categoria: string }> = []

  for (const p of contratiposAtivos) {
    if (seen.has(p.id)) continue
    seen.add(p.id)
    todos.push({ id: p.id, nome: p.nome, marca: p.marca, familia: p.familia, tipo: p.tipo, inspiradoEm: p.inspiradoEm, preco_brl: p.preco_brl, categoria: "contratipo" })
  }
  for (const p of expandidoAtivos) {
    if (seen.has(p.id)) continue
    seen.add(p.id)
    todos.push({ id: p.id, nome: p.nome, marca: p.marca, familia: p.familia, tipo: p.tipo, inspiradoEm: p.inspiradoEm, preco_brl: p.preco_brl, categoria: p.categoria })
  }

  // Apply budget ceiling after merge
  const filtrados = teto !== null ? todos.filter(p => p.preco_brl <= teto) : todos

  const formato = (p: (typeof todos)[number]) =>
    `${p.id} | ${p.nome} | ${p.marca} | ${p.categoria} | ${p.familia} | ${p.tipo} | ${p.inspiradoEm ? `inspirado em ${p.inspiradoEm}` : "original"} | R$${p.preco_brl}`

  // Safety fallback: ignore budget ceiling if it filters everything
  if (filtrados.length === 0) return todos.map(formato).join("\n")
  return filtrados.map(formato).join("\n")
}

const CARD_SCHEMA_EXAMPLE = `{"nome":"...","marca":"...","codigo":"...","explicacao":"...","quando":"Noites de saída, jantares, encontros — situações onde você quer ser lembrado.","aplicacao":"2 borrifadas no pescoço. No calor, uma basta."}`
const JSON_SCHEMA_FREE    = `{"ideal":${CARD_SCHEMA_EXAMPLE}}`
const JSON_SCHEMA_PREMIUM = `{"ideal":${CARD_SCHEMA_EXAMPLE},"alternativo":${CARD_SCHEMA_EXAMPLE},"ousado":${CARD_SCHEMA_EXAMPLE}}`

const CRITERIA_FREE    = `* ideal: maior correspondência com o perfil completo do usuário`
const CRITERIA_PREMIUM = `* ideal: maior correspondência com o perfil completo do usuário
* alternativo: mesma família olfativa e intensidade, mas inspirado em um perfume DIFERENTE do ideal — nunca o mesmo perfume de outra marca. Deve ser de um fornecedor diferente quando possível.
* ousado: empurra o perfil 2 passos além — para quem quer explorar`

const SYSTEM_PROMPT_QUIZ_TEMPLATE = (mode: "free" | "premium") => `Você é a consultora de fragrâncias do nozze — elegante, precisa e humana.
Você recebe as respostas de um quiz olfativo e deve gerar recomendações de perfume do catálogo fornecido.
REGRAS ABSOLUTAS:
* Recomende APENAS perfumes desta lista. Não invente perfumes. Não recomende marcas originais.
* O campo "codigo" deve ser exatamente o id da linha do catálogo (primeira coluna)
* Nunca use termos técnicos de perfumaria na explicação ao usuário
* Máximo 18 palavras por frase nas explicações
* O usuário é o protagonista — o nozze é o guia
* alternativo nunca pode ser o mesmo perfume inspirado de outra marca — deve ser uma fragrância diferente
* quando: máximo 12 palavras. Contextualiza o momento ideal de uso.
* aplicacao: máximo 10 palavras. Instrução prática, direta.
* O contexto tem peso 10/10 — nunca recomende algo que contradiga o contexto declarado

PERFIL DO USUÁRIO (${mode === "premium" ? "quiz completo — 18 dimensões" : "quiz gratuito — 7 dimensões"}):
{{QUIZ_ANSWERS}}

═══ CONTEXTO — REGRA DE MAIOR PESO ═══
O contexto é o filtro mais importante. Aplique antes de qualquer outro critério.

SE contexto = "Encontros e sedução":
→ OBRIGATÓRIO: perfumes com caráter sensual, envolvente, que deixam rastro
→ Famílias preferidas: oriental, amadeirado quente, gourmand escuro, floral intenso
→ PROIBIDO: frescos, aquáticos, cítricos, verdes, perfumes "limpos"
→ Intensidade mínima: média-alta
→ O usuário quer ser desejado — escolha com isso em mente

SE contexto = "Uso diário":
→ Perfumes versáteis, não invasivos, duráveis, adequados para qualquer hora
→ Famílias preferidas: fresco aromático, madeira suave, floral discreto
→ PROIBIDO: perfumes muito pesados, doces em excesso, alta fixação em ambientes fechados

SE contexto = "Trabalho ou faculdade":
→ Perfumes discretos, limpos, profissionais — presença sutil
→ PROIBIDO: perfumes com muita projeção, gourmands pesados, orientais intensos

SE contexto = "Minha assinatura pessoal":
→ Perfume único e marcante, alinhado ao arquétipo completo do usuário
→ Pode ser ousado — essa pessoa sabe o que quer
═══════════════════════════════════════

CATÁLOGO DE CONTRATIPOS DISPONÍVEIS (formato: id | nome | marca | família | concentração | inspiração | preço):
{{CATALOG}}

Gere as recomendações no seguinte JSON:
${mode === "premium" ? JSON_SCHEMA_PREMIUM : JSON_SCHEMA_FREE}

Critérios de seleção:
${mode === "premium" ? CRITERIA_PREMIUM : CRITERIA_FREE}

Responda SOMENTE com o JSON. Sem texto antes ou depois. Sem markdown.`

export async function gerarRecomendacaoQuiz(
  respostas: Record<string, string>,
  mode: "free" | "premium"
): Promise<RecomendacaoQuiz | null> {
  const chave = process.env.DEEPSEEK_API_KEY
  if (!chave || chave === "sua_chave_aqui") {
    console.error("[QuizIA] DEEPSEEK_API_KEY não configurada")
    return null
  }

  const quizAnswers = formatarRespostasLegivel(respostas)
  const catalog     = buildCatalogSnippet(respostas["orcamento"])

  console.log(`[QuizIA] Catalog: ${catalog.split("\n").length} contratipos | orcamento: "${respostas["orcamento"] ?? "não informado"}"`)

  const systemPrompt = SYSTEM_PROMPT_QUIZ_TEMPLATE(mode)
    .replace("{{QUIZ_ANSWERS}}", quizAnswers)
    .replace("{{CATALOG}}", catalog)

  const body = {
    model: "deepseek-chat",
    messages: [{ role: "system", content: systemPrompt }],
    temperature: 0.4,
    max_tokens: 900,
    response_format: { type: "json_object" },
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20_000)

  let res: Response
  try {
    res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${chave}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`DeepSeek ${res.status}: ${err}`)
  }

  const dados = await res.json()
  const texto: string = dados?.choices?.[0]?.message?.content ?? ""
  console.log("[Quiz] DeepSeek raw response:", texto)

  const jsonMatch = texto.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error("[QuizIA] Sem JSON na resposta")

  const rawParsed = JSON.parse(jsonMatch[0])
  console.log("[Quiz] DeepSeek parsed keys:", Object.keys(rawParsed))

  const parsed = RecomendacaoQuizSchema.safeParse(rawParsed)
  if (!parsed.success) {
    console.error("[QuizIA] JSON inválido:", parsed.error.issues.map(i => i.message).join("; "))
    throw new Error("[QuizIA] JSON inválido")
  }

  console.log("[QuizIA] Sucesso —", mode, "—", parsed.data.ideal.nome)
  return parsed.data
}

// ─────────────────────────────────────────────────────────────────────────────

function gerarFallback(respostas: Record<string, unknown>): RecomendacaoIA {
  const r = respostas as RespostasQuiz
  const faixaPreco = String(r.faixaPreco ?? '')
  const vibe = String(r.vibe ?? 'fresco')
  const genero = String(r.genero ?? '')
  const clima = String(r.clima ?? '')

  // Se econômico, usa contratipos reais do banco
  if (faixaPreco === 'economico') {
    const todos = contratipoRepository.findAll()

    const porGenero = genero
      ? todos.filter(p => p.genero === 'Unissex' || p.genero.toLowerCase().includes(genero))
      : todos

    const familiaPreferida = (() => {
      if (clima === 'frio' || vibe === 'quente' || vibe === 'doce')
        return ['oriental', 'amadeirado', 'gourmand', 'especiado']
      if (clima === 'quente' || vibe === 'fresco')
        return ['fresco', 'aquático', 'cítrico', 'aromático']
      if (vibe === 'sofisticado')
        return ['amadeirado', 'oriental', 'floral']
      return ['amadeirado', 'floral', 'fresco']
    })()

    const compativel = porGenero.find(p =>
      familiaPreferida.some(f => p.familia.toLowerCase().includes(f))
    ) ?? porGenero[0]

    const alternativa = porGenero.find(p =>
      p.id !== compativel?.id &&
      familiaPreferida.some(f => p.familia.toLowerCase().includes(f))
    ) ?? porGenero[1]

    if (compativel) {
      return {
        perfumePrincipal: {
          nome: compativel.nome,
          marca: compativel.marca,
          concentracao: compativel.tipo,
          descricao: `${compativel.familia}. Inspirado em ${compativel.inspiradoEm} da ${compativel.marcaOriginal}.`,
          notas: compativel.notas.slice(0, 4),
        },
        conselho: clima === 'frio'
          ? 'Aplique no pulso e pescoço. O frio potencializa a fixação.'
          : 'Duas borrifadas no pescoço são suficientes. No calor projeta bem.',
        alternativa: {
          nome: alternativa?.nome ?? 'Aventhis 2010',
          marca: alternativa?.marca ?? 'In The Box',
          descricao: alternativa
            ? `${alternativa.familia}. Inspirado em ${alternativa.inspiradoEm}.`
            : 'Frutal amadeirado. Inspirado no Aventus Creed.',
        },
      }
    }
  }

  // Para médio/premium/luxo — fallback por vibe com perfumes reais
  const fallbacksPorVibe: Record<string, RecomendacaoIA> = {
    fresco: {
      perfumePrincipal: { nome: 'Acqua di Giò', marca: 'Giorgio Armani', concentracao: 'EDT', descricao: 'Água do mar cristalizada na pele. Fresco com fundo leve de almíscar.', notas: ['bergamota', 'jasmim', 'patchouli', 'almíscar'] },
      conselho: 'Em climas úmidos projeta bem. Para mais duração, prefira a versão Profumo.',
      alternativa: { nome: 'Cool Water', marca: 'Davidoff', descricao: 'O clássico aquático com excelente custo-benefício.' },
    },
    quente: {
      perfumePrincipal: { nome: 'Stronger With You Intensely', marca: 'Giorgio Armani', concentracao: 'EDP', descricao: 'Castanha e baunilha com especiarias. Quente, envolvente, marcante.', notas: ['castanha', 'baunilha', 'cardamomo', 'âmbar'] },
      conselho: 'Perfeito para o frio. Duas borrifadas no pulso e pescoço bastam.',
      alternativa: { nome: 'Armani Code Absolu', marca: 'Giorgio Armani', descricao: 'Oriental mais seco, para quem quer intensidade sem o lado doce.' },
    },
    sofisticado: {
      perfumePrincipal: { nome: 'Bleu de Chanel', marca: 'Chanel', concentracao: 'EDP', descricao: 'Amadeirado aromático com incenso e sândalo. Sofisticado sem esforço.', notas: ['limão', 'incenso', 'sândalo', 'almíscar'] },
      conselho: 'Funciona em qualquer ocasião. A versão EDP tem mais profundidade que a EDT.',
      alternativa: { nome: 'Sauvage', marca: 'Dior', descricao: 'Fresco especiado com ambroxan. O mais reconhecido da categoria.' },
    },
    doce: {
      perfumePrincipal: { nome: 'La Vie Est Belle', marca: 'Lancôme', concentracao: 'EDP', descricao: 'Íris e pralinê sobre baunilha. Doce elegante que aquece sem enjoar.', notas: ['íris', 'pralinê', 'baunilha', 'patchouli'] },
      conselho: 'No calor aplique menos. A baunilha amplifica com a temperatura.',
      alternativa: { nome: 'Good Girl', marca: 'Carolina Herrera', descricao: 'Mais especiado e noturno. Mesmo equilíbrio doce-escuro.' },
    },
  }

  return fallbacksPorVibe[vibe] ?? fallbacksPorVibe['fresco']
}

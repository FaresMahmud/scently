// ============================================
// ARQUIVO: lib/ai.ts
// O QUE FAZ: integração com DeepSeek via fetch direto — monta prompt e retorna recomendação
// QUANDO MANDAR PRA IA: quando quiser mudar tom de voz, estrutura do JSON ou modelo usado
// DEPENDE DE: .env.local (DEEPSEEK_API_KEY), data/regras-preco.json
// ============================================

import { contratipoRepository } from "@/lib/repositories/ContratipoRepository"
import { buscarSimilares, buscarPorNome } from "@/lib/fragella"
import { traduzir, slugify } from "@/lib/utils"
import regrasPreco from "@/data/regras-preco.json"
import { CONSULTOR_TONE_GUIDE } from "@/lib/aiPrompts"
import { buscarNoCatalogo, carregarCatalogo, buscarPerfumePorSlug } from "@/lib/catalogoFragella"
import { db } from "@/lib/db"
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

// ── Quiz novo: free (6q) / premium (8q) — DeepSeek ────────────────────────────

export interface RecomendacaoCard {
  nome: string
  marca: string
  concentracao: string
  explicacao: string
  notas: string[]
  quandoUsar?: string
  slug?: string
}

export interface RecomendacaoQuiz {
  ideal:       RecomendacaoCard
  alternativa?: RecomendacaoCard
  ousado?:     RecomendacaoCard
}

const RecomendacaoCardSchema = z.object({
  nome:         z.string().min(1),
  marca:        z.string().min(1),
  concentracao: z.string().min(1).max(20),
  explicacao:   z.string().min(1),
  notas:        z.array(z.string()).min(1).max(6),
  quandoUsar:   z.string().optional(),
  slug:         z.string().optional(),
})

const RecomendacaoQuizSchema = z.object({
  ideal:       RecomendacaoCardSchema,
  alternativa: RecomendacaoCardSchema.optional(),
  ousado:      RecomendacaoCardSchema.optional(),
})

// Labels legíveis para cada id de pergunta (lib/quiz/questions.ts)
const LABELS_QUIZ: Record<string, string> = {
  genero:               "Gênero",
  ocasiao:              "Ocasião",
  clima:                "Clima",
  estacao:              "Estação",
  cena:                 "Cena",
  projecao:             "Projeção",
  ousadia:              "Ousadia",
  "perfume-existente":  "Perfume que já usa",
  preco:                "Orçamento",
  rejeicao:             "Rejeições",
  impressao:            "Impressão desejada",
}

// Mapa de id da resposta de estação → chave no campo estacao dos perfumes enriquecidos
const ESTACAO_KEY: Record<string, string> = {
  "verao":        "verao",
  "inverno":      "inverno",
  "meia-estacao": "primavera",
  "ano-todo":     "",
}

/**
 * Formata as respostas do quiz (já resolvidas pra texto legível via
 * resolverRespostas) no bloco "PERFIL DO USUÁRIO" injetado no prompt.
 */
function formatarRespostasLegivel(respostas: Record<string, string>): string {
  return Object.entries(respostas)
    .filter(([k, v]) => Boolean(v) && Boolean(LABELS_QUIZ[k]))
    .map(([k, v]) => `${LABELS_QUIZ[k]}: ${v}`)
    .join("\n")
}

// ── Helpers de montarContextoCatalogo ─────────────────────────────────────

function _normGeneroQuiz(g: string): "masculino" | "feminino" | "neutro" {
  const l = g.toLowerCase()
  if (l.includes("masculino") || l === "men") return "masculino"
  if (l.includes("feminino")  || l === "women") return "feminino"
  return "neutro"
}

function _normGeneroFragella(g: string): "masculino" | "feminino" | "neutro" {
  const l = g.toLowerCase()
  if (l === "men" || l === "male") return "masculino"
  if (l === "women" || l === "female") return "feminino"
  return "neutro"
}

function _parseFaixaPreco(txt: string): { min: number; max: number } | null {
  if (txt.includes("Até R$150"))                              return { min: 0,   max: 150  }
  if (txt.includes("R$150") && txt.includes("R$300"))        return { min: 150, max: 300  }
  if (txt.includes("R$300") && txt.includes("R$500"))        return { min: 300, max: 500  }
  if (txt.includes("R$500") && txt.includes("R$1"))          return { min: 500, max: 1000 }
  return null // "Acima de R$1.000" → sem limite máximo
}

// Palavras-chave alinhadas com o texto RESOLVIDO das opções de cena e ocasião
const CENA_PARA_FAMILIAS: Array<{ palavras: string[]; familias: string[] }> = [
  { palavras: ["café da manhã", "janela aberta", "luz natural"],    familias: ["cítrico", "fresco", "aromático"] },
  { palavras: ["noite na cidade", "luzes", "energia"],              familias: ["amadeirado", "oriental", "especiado"] },
  { palavras: ["natureza", "viagem", "ar livre", "fim de semana"],  familias: ["aquático", "fresco", "verde"] },
  { palavras: ["reunião", "postura firme"],                         familias: ["amadeirado", "floral", "oriental"] },
  { palavras: ["encontros"],                                        familias: ["oriental", "amadeirado", "especiado"] },
  { palavras: ["uso diário", "todo dia"],                           familias: ["fresco", "cítrico", "floral"] },
  { palavras: ["trabalho", "faculdade"],                            familias: ["fresco", "aromático", "cítrico"] },
  { palavras: ["assinatura pessoal"],                               familias: ["amadeirado", "oriental", "nicho"] },
]

// Mapeamento PT → EN para comparar com campo `familia` do catálogo Fragella (inglês)
const FAMILIA_PT_EN: Record<string, string[]> = {
  "amadeirado":  ["woody", "wood"],
  "oriental":    ["oriental", "amber"],
  "especiado":   ["spicy"],
  "cítrico":     ["citrus"],
  "fresco":      ["fresh", "ozonic", "aquatic"],
  "aromático":   ["aromatic", "fougere", "fougère"],
  "floral":      ["floral", "flower"],
  "aquático":    ["aquatic", "marine", "oceanic", "water"],
  "verde":       ["green"],
  "nicho":       ["niche"],
  "oud":         ["oud", "aoud"],
  "couro":       ["leather"],
  "gourmand":    ["gourmand", "sweet"],
}

// Famílias priorizadas por clima (adicionadas ao familiasBusca da Camada B)
const CLIMA_BONUS: Record<string, string[]> = {
  "quente o ano todo":              ["cítrico", "fresco", "aquático", "aromático"],
  "calor no verão, frio no inverno": [],
  "frio a maior parte do ano":      ["oriental", "amadeirado", "especiado", "gourmand", "couro"],
}

function familiaMatch(familiaItem: string, termoPT: string): boolean {
  const fl = familiaItem.toLowerCase()
  if (fl.includes(termoPT)) return true
  const equivalentes = FAMILIA_PT_EN[termoPT]
  return equivalentes ? equivalentes.some(en => fl.includes(en)) : false
}

/**
 * Monta o bloco CATÁLOGO injetado no prompt do quiz.
 * Três camadas: A) perfume existente + família olfativa, B) cena+ocasião → famílias
 * com shuffle, C) diversidade forçada (contratipos, árabes/nicho).
 * Filtros obrigatórios de gênero e preço em todas as camadas.
 * Máximo 40 perfumes.
 */
async function montarContextoCatalogo(respostas: Record<string, string>): Promise<string> {
  const generoAlvo  = _normGeneroQuiz(respostas["genero"] ?? "")
  const faixaPreco  = _parseFaixaPreco(respostas["preco"] ?? "")
  const cena        = respostas["cena"] ?? ""
  const ocasiao     = respostas["ocasiao"] ?? ""
  const pfExistente = respostas["perfume-existente"] ?? ""
  const ousadiaTxt  = respostas["ousadia"] ?? ""

  function generoFragellaOk(g: string): boolean {
    if (generoAlvo === "neutro") return true
    const gn = _normGeneroFragella(g)
    return gn === "neutro" || gn === generoAlvo
  }
  function generoExpandidoOk(g: string): boolean {
    if (generoAlvo === "neutro") return true
    const l = g.toLowerCase()
    if (l === "unissex" || l === "unisex") return true
    return generoAlvo === "masculino" ? l === "masculino" : l === "feminino"
  }
  function precoOk(preco?: number): boolean {
    if (!faixaPreco || preco === undefined) return true
    return preco >= faixaPreco.min && preco <= faixaPreco.max
  }

  interface Candidato {
    id: string; nome: string; marca: string; concentracao: string
    genero: string; notas: string[]; preco?: number; familia: string; categoria?: string
  }

  const mapa = new Map<string, Candidato>()
  function chave(nome: string, marca: string) { return `${nome.toLowerCase()}|${marca.toLowerCase()}` }

  function addFragella(p: ReturnType<typeof carregarCatalogo>[number]) {
    const k = chave(p.nome, p.marca)
    if (mapa.has(k)) return
    const notas = [...(p.notasTopo ?? []), ...(p.notasCoracao ?? []), ...(p.notasFundo ?? [])].slice(0, 5)
    mapa.set(k, { id: p.id, nome: p.nome, marca: p.marca, concentracao: p.concentracao, genero: p.genero, notas, preco: p.preco, familia: p.familia, categoria: "importado" })
  }
  function addExpandido(p: PerfumeExpandido) {
    const k = chave(p.nome, p.marca)
    if (mapa.has(k)) return
    const notasList = Array.isArray(p.notas)
      ? p.notas.slice(0, 5)
      : [...(p.notas?.topo ?? []), ...(p.notas?.coracao ?? []), ...(p.notas?.fundo ?? [])].slice(0, 5)
    mapa.set(k, { id: p.id, nome: p.nome, marca: p.marca, concentracao: p.tipo, genero: p.genero, notas: notasList, preco: p.preco_brl, familia: p.familia, categoria: p.categoria })
  }

  const catalogo  = carregarCatalogo()
  const expandido = getExpandido()

  // ── CAMADA A — Perfume existente + família ────────────────────────────────
  if (pfExistente.trim()) {
    const achados = buscarNoCatalogo(pfExistente, 3)
    achados.forEach(addFragella)

    const familias = [...new Set(achados.map(p => p.familia).filter(Boolean))]
    for (const fam of familias) {
      const fl = fam.toLowerCase()
      // Expandido primeiro
      expandido.filter(p => familiaMatch(p.familia, fl) || p.familia.toLowerCase().includes(fl)).filter(p => generoExpandidoOk(p.genero) && precoOk(p.preco_brl)).slice(0, 5).forEach(addExpandido)
      // Fragella depois
      catalogo .filter(p => familiaMatch(p.familia, fl) || p.familia.toLowerCase().includes(fl)).filter(p => generoFragellaOk(p.genero) && precoOk(p.preco)).slice(0, 5).forEach(addFragella)
    }
  }

  // ── CAMADA B — Cena + Ocasião → famílias (com shuffle + ordenação estação) ──
  const textoBusca = `${cena} ${ocasiao}`.toLowerCase()
  const familiasBusca = new Set<string>()
  for (const { palavras, familias } of CENA_PARA_FAMILIAS) {
    if (palavras.some(p => textoBusca.includes(p))) familias.forEach(f => familiasBusca.add(f))
  }
  if (ousadiaTxt.toLowerCase().includes("diferente")) {
    familiasBusca.add("nicho"); familiasBusca.add("oud"); familiasBusca.add("oriental")
  }

  // Clima: adiciona famílias bônus ao conjunto de busca
  const climaTexto = (respostas["clima"] ?? "").toLowerCase()
  const climaFamilias = CLIMA_BONUS[climaTexto] ?? []
  climaFamilias.forEach(f => familiasBusca.add(f))

  // Estação: prioriza perfumes com rating "Ótimo" na estação escolhida
  const estacaoId  = respostas["estacao"] ?? ""
  const estacaoKey = ESTACAO_KEY[estacaoId] as keyof NonNullable<PerfumeExpandido["estacao"]> | undefined

  function ratingEstacao(p: PerfumeExpandido): number {
    if (!estacaoKey || !p.estacao) return 1
    const r = p.estacao[estacaoKey]
    if (r === "Ótimo") return 0
    if (r === "Bom")   return 1
    return 2 // "Fraco" ou ausente
  }

  if (familiasBusca.size > 0) {
    const fArr = [...familiasBusca]
    // Expandido primeiro (fonte primária: 25) — shuffle, depois ordena por estação
    ;[...expandido].filter(p => fArr.some(f => familiaMatch(p.familia, f)) && generoExpandidoOk(p.genero) && precoOk(p.preco_brl))
      .sort(() => Math.random() - 0.5)
      .sort((a, b) => ratingEstacao(a) - ratingEstacao(b))
      .slice(0, 25).forEach(addExpandido)
    // Fragella depois (complementa: 15) — sem campo estacao, só shuffle
    ;[...catalogo].filter(p => fArr.some(f => familiaMatch(p.familia, f)) && generoFragellaOk(p.genero) && precoOk(p.preco))
      .sort(() => Math.random() - 0.5).slice(0, 15).forEach(addFragella)
  }

  // ── CAMADA C — Diversidade forçada (shuffle só do expandido) ─────────────
  if (mapa.size < 25) {
    ;[...expandido].filter(p => generoExpandidoOk(p.genero) && precoOk(p.preco_brl))
      .sort(() => Math.random() - 0.5).slice(0, 30)
      .forEach(p => { if (mapa.size < 40) addExpandido(p) })
  }

  // Garante ≥ 3 contratipos/nacionais
  const nContratipos = [...mapa.values()].filter(c => c.categoria === "contratipo" || c.categoria === "nacional").length
  if (nContratipos < 3) {
    expandido.filter(p => (p.categoria === "contratipo" || p.categoria === "nacional") && generoExpandidoOk(p.genero) && precoOk(p.preco_brl))
      .slice(0, 3 - nContratipos).forEach(addExpandido)
  }

  // Garante ≥ 3 árabes/nicho (sem filtro de preço — costumam não ter preco_brl)
  const nArabes = [...mapa.values()].filter(c => c.categoria === "arabe" || c.categoria === "nicho").length
  if (nArabes < 3) {
    expandido.filter(p => (p.categoria === "arabe" || p.categoria === "nicho") && generoExpandidoOk(p.genero))
      .slice(0, 3 - nArabes).forEach(addExpandido)
  }

  // ── Editorial (enriquecimento opcional) ──────────────────────────────────
  const lista = [...mapa.values()].slice(0, 40)

  let editorialMap = new Map<string, { comoCheira: string; paraQuem: string }>()
  try {
    const rows = await db.perfumeEditorial.findMany({
      where:  { perfumeId: { in: lista.map(p => p.id) } },
      select: { perfumeId: true, comoCheira: true, paraQuem: true },
    })
    editorialMap = new Map(rows.map(r => [r.perfumeId, r]))
  } catch {
    // Editorial é enriquecimento opcional — segue sem ele
  }

  console.log("[QuizIA] Catálogo montado:", lista.slice(0, 3).map(p => p.nome).join(", "), `(total: ${lista.length}, gênero: ${generoAlvo}, faixa: ${JSON.stringify(faixaPreco)})`)

  return lista
    .map(p => {
      const notasTxt = p.notas.length > 0 ? p.notas.join(", ") : "N/D"
      const precoTxt = p.preco !== undefined ? `R$${p.preco}` : "N/D"
      const ed       = editorialMap.get(p.id)
      const base     = `- ${p.nome} | ${p.marca} | ${p.concentracao} | ${p.genero} | Notas: ${notasTxt} | Preço: ${precoTxt}`
      return ed ? `${base} | ${ed.comoCheira} | ${ed.paraQuem}` : base
    })
    .join("\n")
}

const FORMATO_OBRIGATORIO = `FORMATO OBRIGATÓRIO (siga exatamente):
- "concentracao": use APENAS a sigla — "EDP", "EDT", "EDC", "Parfum" ou "EDS". Nunca "Eau de Parfum".
- "notas": DEVE ser um array de strings. Nunca uma frase. Ex: ["bergamota", "cedro", "baunilha"].
- Inclua APENAS os campos do exemplo. Não adicione campos extras como "familiaOlfativa", "faixaPreco" ou "porQueCombina".`

const FORMATO_FREE = `${FORMATO_OBRIGATORIO}

FORMATO (1 recomendação):
{
  "ideal": {
    "nome": "Nome do Perfume",
    "marca": "Marca",
    "concentracao": "EDP",
    "explicacao": "Por que esse perfume é pra você, em 2-3 frases curtas.",
    "notas": ["nota 1 em português", "nota 2", "nota 3", "nota 4"],
    "quandoUsar": "Situação ideal de uso em 1 frase."
  }
}`

const FORMATO_PREMIUM = `${FORMATO_OBRIGATORIO}

FORMATO (3 recomendações):
{
  "ideal": { ...mesmo formato... },
  "alternativa": {
    ...mesmo formato...
    // Perfume com perfil similar ao ideal mas de marca/faixa diferente. Se ideal é importado, alternativa pode ser nacional ou contratipo.
  },
  "ousado": {
    ...mesmo formato...
    // Algo inesperado que amplia o repertório. Pode ser nicho, árabe, ou de uma família olfativa adjacente.
  }
}`

function montarSystemPromptQuiz(respostasFormatadas: string, catalogo: string, mode: "free" | "premium"): string {
  return `Você é o consultor de fragrâncias do nozze. Seu trabalho é recomendar o perfume certo com base no perfil do usuário.

PERFIL DO USUÁRIO:
${respostasFormatadas}

CATÁLOGO DISPONÍVEL:
${catalogo}

REGRAS:
- Responda APENAS com JSON válido. Sem markdown. Sem texto fora do JSON.
- Explore o catálogo inteiro: importados, árabes, nacionais, nichos e contratipos.
- NÃO recomende sempre os mesmos perfumes óbvios (Sauvage, 212, Malbec). Só recomende um popular se for genuinamente o melhor match.
- Se o usuário informou um perfume que já usa, use como referência principal mas NÃO recomende o mesmo perfume nem flankers diretos dele.
- Se o usuário informou rejeições, NUNCA recomende perfumes com essas características.
- Descreva as notas em português acessível: "madeira quente e baunilha" — nunca "vetiver e tonka bean".
- A explicação deve falar COM o usuário: "Combina com as suas noites na cidade" — nunca "Este perfume é indicado para..."
- Frases curtas, máximo 18 palavras por frase.

${mode === "premium" ? FORMATO_PREMIUM : FORMATO_FREE}

Responda SOMENTE com o JSON. Sem texto antes ou depois. Sem markdown.`
}

function verificarSlugExiste(nome: string, marca: string): string | null {
  const targetSlug = `${slugify(nome)}-${slugify(marca)}`

  // 1. Procurar no expandido
  const expandido = getExpandido()
  const exMatch = expandido.find(p => p.id === targetSlug || (slugify(p.nome) === slugify(nome) && slugify(p.marca) === slugify(marca)))
  if (exMatch) return exMatch.id

  // 2. Procurar no Fragella
  const fgMatch = buscarPerfumePorSlug(targetSlug)
  if (fgMatch) return fgMatch.id

  return null
}

export async function gerarRecomendacaoQuiz(
  respostas: Record<string, string>,
  mode: "free" | "premium"
): Promise<RecomendacaoQuiz | null> {
  const respostasFormatadas = formatarRespostasLegivel(respostas)
  const catalogo            = await montarContextoCatalogo(respostas)
  const systemPrompt        = montarSystemPromptQuiz(respostasFormatadas, catalogo, mode)

  const chave = process.env.DEEPSEEK_API_KEY
  if (!chave || chave === "sua_chave_aqui") {
    console.error("[QuizIA] DEEPSEEK_API_KEY não configurada")
    return null
  }

  console.log("[QuizIA] Catálogo enviado:", catalogo.substring(0, 500))

  let textoResposta: string
  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${chave}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Gere a recomendação com base no perfil acima." },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`DeepSeek ${response.status}: ${err}`)
    }

    const data = await response.json()
    textoResposta = data.choices[0].message.content
  } catch (err) {
    console.error("[QuizIA] DeepSeek falhou:", err instanceof Error ? err.message : String(err))
    return null
  }

  console.log("[QuizIA] Raw response:", textoResposta)

  const jsonLimpo = textoResposta.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()

  let rawParsed: unknown
  try {
    rawParsed = JSON.parse(jsonLimpo)
  } catch {
    console.error("[QuizIA] JSON inválido. Raw:", jsonLimpo.slice(0, 300))
    return null
  }

  const parsed = RecomendacaoQuizSchema.safeParse(rawParsed)
  if (!parsed.success) {
    console.error("[QuizIA] Schema inválido:", parsed.error.issues.map(i => i.message).join("; "))
    return null
  }

  const recomendacao = parsed.data

  // Resolve slugs para os links da página de perfume
  if (recomendacao.ideal) {
    const slug = verificarSlugExiste(recomendacao.ideal.nome, recomendacao.ideal.marca)
    if (slug) recomendacao.ideal.slug = slug
  }
  if (recomendacao.alternativa) {
    const slug = verificarSlugExiste(recomendacao.alternativa.nome, recomendacao.alternativa.marca)
    if (slug) recomendacao.alternativa.slug = slug
  }
  if (recomendacao.ousado) {
    const slug = verificarSlugExiste(recomendacao.ousado.nome, recomendacao.ousado.marca)
    if (slug) recomendacao.ousado.slug = slug
  }

  console.log("[QuizIA] Sucesso —", mode, "—", recomendacao.ideal.nome)
  return recomendacao
}

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
  notas:         string[] | { topo?: string[]; coracao?: string[]; fundo?: string[] }
  preco_brl:     number
  categoria:     "contratipo" | "arabe" | "nacional" | "importado-designer" | "nicho"
  disponivel:    boolean
  linkCompra:    string
  estacao?:      { verao?: string; primavera?: string; outono?: string; inverno?: string }
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

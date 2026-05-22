// ============================================
// ARQUIVO: lib/ai.ts
// O QUE FAZ: integração com Groq via fetch direto — monta prompt e retorna recomendação
// QUANDO MANDAR PRA IA: quando quiser mudar tom de voz, estrutura do JSON ou modelo usado
// DEPENDE DE: .env.local (GROQ_API_KEY), data/regras-preco.json
// ============================================

import { contratipoRepository } from "@/lib/repositories/ContratipoRepository"
import { buscarSimilares } from "@/lib/fragella"
import regrasPreco from "@/data/regras-preco.json"

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

const SYSTEM_PROMPT = `Consultor de perfumaria brasileiro. Responda APENAS em JSON válido, sem markdown, sem texto fora do JSON.
Tom: sofisticado, próximo, sem travessões, sensorial, frases curtas.
Schema obrigatório:
{"perfumePrincipal":{"nome":"","marca":"","concentracao":"","descricao":"","notas":[]},"conselho":"","alternativa":{"nome":"","marca":"","descricao":""}}

REGRA OBRIGATÓRIA DE PREÇO — nunca recomendar fora da faixa informada:

preco:economico (até R$300):
- Contratipos nacionais: In The Box, JA Essence, Maison Viegas, Azza Parfum (R$80–200)
- Nacionais: O Boticário, Natura, Eudora (R$80–250)
- Importados básicos: Cool Water Davidoff, Chrome Azzaro, Obsession Calvin Klein (R$150–300)
Se preco:economico → recomendar APENAS contratipos ou nacionais. NUNCA recomendar Dior, Chanel, Tom Ford, Creed, Le Labo, Parfums de Marly.

preco:medio (R$300–700):
- Sauvage Dior EDT, Bleu de Chanel EDT, La Vie Est Belle Lancôme, Good Girl Carolina Herrera
- Versace Eros EDP, Black Opium YSL, Boss Bottled Hugo Boss, Acqua di Giò EDT
Se preco:medio → importados acessíveis. NUNCA recomendar Creed, Tom Ford Private Blend, Parfums de Marly, nicho acima de R$700.

preco:premium (R$700–1.500):
- Sauvage Dior EDP/Parfum, Tom Ford Black Orchid, Chanel N°5 EDP
- Acqua di Giò Profumo, Chance Chanel EDP, Armani Code Absolu, Stronger With You Intensely

preco:luxo (acima de R$1.500):
- Creed Aventus (~R$2.600), Baccarat Rouge 540 (~R$2.000–3.000)
- Tom Ford Private Blend: Tobacco Vanille, Lost Cherry, Oud Wood (~R$1.500–2.500)
- Parfums de Marly Pegasus, Delina (~R$1.800–2.500)
- Xerjoff Erba Pura, Amouage Reflection, Initio (R$2.000+)

REGRA DE VARIEDADE — evite sempre os mesmos perfumes:
- NUNCA recomendar Sauvage, Bleu de Chanel, La Vie Est Belle ou Good Girl a menos que o perfil seja muito genérico e não haja outra opção melhor
- Se ousadia:ousado ou ousadia:raro → recomendar obrigatoriamente algo fora do mainstream. Exemplos: Replica Jazz Club, Santal 33, Hacivat Nishane, Erba Pura Xerjoff, Percival Parfums de Marly, Baccarat Rouge 540
- Se ousadia:equilibrado → perfumes conhecidos mas com personalidade: Acqua di Giò Profumo, Black Orchid, Stronger With You Intensely, Armani Code Absolu
- Se ousadia:seguro → aí sim pode recomendar os clássicos populares
- Se perfil:colecionador ou perfil:entusiasta → NUNCA recomendar os top 5 mais vendidos. Vá para nicho, indie ou algo menos óbvio
- Se cheiro:café → considerar Replica Coffee Break, Jazz Club, Tobacco Vanille
- Se cheiro:madeira → considerar Santal 33, Oud Wood, Bois d'Argent
- Se cheiro:couro → considerar Tuscan Leather, Cuir de Russie, Cuoium
- Combine TODAS as respostas para chegar a algo único, não só a vibe principal
Recomende APENAS perfumes que existem de verdade e são comercialmente disponíveis. Nunca invente nomes de perfumes. Se não tiver certeza absoluta de que o perfume existe, escolha outro que você tenha certeza.`

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

async function chamarGroq(chave: string, prompt: string): Promise<string> {
  const url = "https://api.groq.com/openai/v1/chat/completions"

  const body = {
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    temperature: 0.9,
    max_tokens: 1024,
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
  const chave = process.env.GROQ_API_KEY
  if (!chave || chave === "sua_chave_aqui") {
    console.error("[IA] GROQ_API_KEY não configurada")
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
Sessão: ${Math.random().toString(36).slice(2, 8)}

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

REGRAS OBRIGATÓRIAS:
- "nome" = nome do perfume específico NUNCA o nome da marca
- "marca" = fabricante
- "concentracao" = APENAS "EDP", "EDT" ou "EDC"
- "descricao" = frase sensorial curta sem travessões
- "conselho" = dica prática sem travessões
- "alternativa" deve ter MESMA família olfativa e MESMA faixa de clima que o principal
- Se clima quente, AMBOS principal e alternativa devem ser frescos ou aquáticos
- Se clima frio, AMBOS principal e alternativa devem ser orientais ou amadeirados`

  console.log("[IA] Prompt enviado:", prompt)

  try {
    console.log("[IA] Chamando Groq llama-3.3-70b-versatile")
    const texto = await chamarGroq(chave, prompt)
    console.log("[IA] Resposta bruta:", texto.slice(0, 200))

    const jsonMatch = texto.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("Sem JSON na resposta")

    const resultado = JSON.parse(jsonMatch[0]) as RecomendacaoIA
    if (!resultado.perfumePrincipal?.nome) throw new Error("JSON incompleto")

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
                ? `${alt.acordesPrincipais.slice(0, 3).join(", ")}.${alt.longevidade ? ` Longevidade ${alt.longevidade.toLowerCase()}.` : ""}`
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

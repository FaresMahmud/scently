// ============================================
// ARQUIVO: lib/ai.ts
// O QUE FAZ: integração com Gemini via fetch direto — monta prompt e retorna recomendação
// QUANDO MANDAR PRA IA: quando quiser mudar tom de voz, estrutura do JSON ou modelo usado
// DEPENDE DE: .env.local (GEMINI_API_KEY)
// ============================================

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
- Combine TODAS as respostas para chegar a algo único, não só a vibe principal`

const MARCAS_PROIBIDAS_ECONOMICO = [
  "dior", "chanel", "tom ford", "creed", "le labo", "maison margiela",
  "replica", "byredo", "parfums de marly", "xerjoff", "amouage", "initio",
  "maison francis kurkdjian", "mfk", "nishane", "kilian", "serge lutens",
  "memo paris", "louis vuitton", "hermès", "hermes", "guerlain", "bvlgari",
  "versace", "yves saint laurent", "ysl", "paco rabanne", "armani",
  "giorgio armani", "lancôme", "lancome", "carolina herrera", "hugo boss",
  "burberry", "gucci", "dolce", "montblanc", "lacoste", "ralph lauren",
  "givenchy", "valentino", "prada", "bulgari", "narciso rodriguez"
]

const MARCAS_PROIBIDAS_MEDIO = [
  "creed", "le labo", "maison margiela", "byredo", "parfums de marly",
  "xerjoff", "amouage", "initio", "maison francis kurkdjian", "mfk",
  "nishane", "kilian", "serge lutens", "memo paris", "louis vuitton",
  "tom ford private", "tobacco vanille", "lost cherry", "oud wood"
]

function validarFaixaPreco(resultado: RecomendacaoIA, faixaPreco: string): boolean {
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

function formatarRespostas(r: RespostasQuiz): string {
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
    temperature: 0.7,
    max_tokens: 1024,
    response_format: { type: "json_object" },
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${chave}`,
    },
    body: JSON.stringify(body),
  })

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

  const prompt = `Perfil: ${formatarRespostas(respostas as RespostasQuiz)}. Recomende um perfume.`

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

    console.log("[IA] Sucesso com Groq")
    return resultado
  } catch (erro) {
    console.error("[IA] Groq falhou:", erro instanceof Error ? erro.message : erro)
  }

  console.error("[IA] Groq falhou — usando fallback")
  return gerarFallback(respostas)
}

function gerarFallback(respostas: Record<string, unknown>): RecomendacaoIA {
  const vibe = String(respostas.vibe ?? "")
  const clima = String(respostas.clima ?? "")
  const preco = String(respostas.faixaPreco ?? "")

  // Fallback econômico — sempre respeita a faixa de preço
  if (preco === "economico") {
    return {
      perfumePrincipal: {
        nome: "Carbon",
        marca: "La Rive",
        concentracao: "EDT",
        descricao: "Fresco e especiado, inspirado no Sauvage. Boa fixação e projeção pra quem quer cheirar bem sem gastar muito.",
        notas: ["bergamota", "pimenta", "ambroxan", "cedro"],
      },
      conselho: "Aplique no pescoço e punhos logo após o banho. Com até R$100, é uma das melhores opções nacionais disponíveis.",
      alternativa: {
        nome: "Aventhis 2010",
        marca: "In The Box",
        descricao: "Contratipo do Creed Aventus fórmula original. Um dos melhores custo-benefício do mercado nacional.",
      },
    }
  }

  // Fallback por vibe para médio, premium e luxo
  const mapa: Record<string, RecomendacaoIA> = {
    fresco: {
      perfumePrincipal: {
        nome: "Acqua di Giò",
        marca: "Giorgio Armani",
        concentracao: "EDT",
        descricao: "Água do mar cristalizada na pele. Fresco, com fundo leve de almíscar que persiste sem pesar. Ideal para climas quentes e uso diário.",
        notas: ["bergamota", "jasmim", "patchouli", "almíscar branco"],
      },
      conselho: "Em climas úmidos, EDT projeta bem. Se preferir mais duração, a versão Profumo (EDP) entrega o mesmo frescor com mais fixação.",
      alternativa: {
        nome: "Cool Water",
        marca: "Davidoff",
        descricao: "O clássico aquático que ainda resiste bem ao tempo, com excelente custo-benefício.",
      },
    },
    quente: {
      perfumePrincipal: {
        nome: "Black Orchid",
        marca: "Tom Ford",
        concentracao: "EDP",
        descricao: "Denso, escuro, com trufa e orquídea preta sobre um fundo amadeirado. Envolve quem está por perto sem anunciar — ele é sentido, não visto.",
        notas: ["trufa preta", "orquídea", "patchouli", "baunilha"],
      },
      conselho: "Use com parcimônia — dois jatos no pulso bastam. Em dias quentes, o calor do corpo amplifica a projeção.",
      alternativa: {
        nome: "Oud Wood",
        marca: "Tom Ford",
        descricao: "Mais seco e madeiroso, para quem quer a intensidade sem o lado floral do Black Orchid.",
      },
    },
    sofisticado: {
      perfumePrincipal: {
        nome: "Bleu de Chanel",
        marca: "Chanel",
        concentracao: "EDP",
        descricao: "Cedro, sândalo e notas cítricas numa composição limpa e sofisticada. Versátil o suficiente para o dia, marcante o bastante para a noite.",
        notas: ["limão siciliano", "gengibre", "cedro", "sândalo", "almíscar branco"],
      },
      conselho: "O EDP tem mais profundidade amadeirada que o EDT — vale a diferença. Aplique no pescoço e punhos logo após o banho.",
      alternativa: {
        nome: "Armani Code",
        marca: "Giorgio Armani",
        descricao: "Mais especiado e sedutor, com bergamota e notas de couro. Mesma sofisticação, tom mais noturno.",
      },
    },
    doce: {
      perfumePrincipal: {
        nome: "La Vie Est Belle",
        marca: "Lancôme",
        concentracao: "EDP",
        descricao: "Iris e pralinê sobre fundo de baunilha. Doce sem ser infantil — tem uma gourmand elegante que aquece sem enjoar.",
        notas: ["iris", "pralinê", "baunilha", "patchouli"],
      },
      conselho: "Em climas frios, a baunilha ganha mais presença. No calor, aplique menos — o doce amplifica com a temperatura.",
      alternativa: {
        nome: "Good Girl",
        marca: "Carolina Herrera",
        descricao: "Mais especiado e noturno, com o mesmo equilíbrio doce-escuro para quem quer algo mais único.",
      },
    },
  }

  const chave = vibe in mapa ? vibe : clima === "frio" ? "quente" : "fresco"
  return mapa[chave] ?? mapa["fresco"]
}

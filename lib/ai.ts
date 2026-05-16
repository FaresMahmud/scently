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
  ocasiao?: string
  clima?: string
  notasAmadas?: string[]
  notasOdiadas?: string[]
  faixaPreco?: string
  perfumeAtual?: string
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

const SYSTEM_PROMPT = `Você é o consultor de perfumaria do site scently, um portal sofisticado e brasileiro.

Tom de voz:
- Sofisticado mas próximo, como um amigo entendido no assunto
- Use "você" (nunca "tu")
- Frases curtas e diretas, sem travessões
- Sem jargão técnico desnecessário
- Nunca use "incrível", "perfeito", "maravilhoso" — seja preciso e sensorial
- Explique o porquê da recomendação de forma sensorial (o que você vai sentir na pele, no ar)

Responda APENAS com JSON válido, sem texto antes ou depois, neste formato exato:
{
  "perfumePrincipal": {
    "nome": "nome do perfume",
    "marca": "nome da marca",
    "concentracao": "EDP ou EDT",
    "descricao": "2 a 3 frases sensoriais explicando por que serve para este perfil",
    "notas": ["nota1", "nota2", "nota3"]
  },
  "conselho": "dica prática ou ressalva importante",
  "alternativa": {
    "nome": "nome do perfume alternativo",
    "marca": "nome da marca",
    "descricao": "uma linha explicando por que é uma boa opção paralela"
  }
}`

function formatarRespostas(respostas: Record<string, unknown>): string {
  const linhas: string[] = []

  if (respostas.perfil) linhas.push(`Perfil: ${respostas.perfil}`)
  if (respostas.genero) linhas.push(`Preferência de fragrância: ${respostas.genero}`)
  if (respostas.vibe) linhas.push(`Vibe desejada: ${respostas.vibe}`)
  if (respostas.ocasiao) linhas.push(`Ocasião: ${respostas.ocasiao}`)
  if (respostas.clima) linhas.push(`Clima: ${respostas.clima}`)
  if (respostas.faixaPreco) linhas.push(`Faixa de preço: ${respostas.faixaPreco}`)
  if (respostas.perfumeAtual) linhas.push(`Perfume atual: ${respostas.perfumeAtual}`)
  if (respostas.prioridade) linhas.push(`O que mais importa: ${respostas.prioridade}`)

  const notasAmadas = respostas.notasAmadas
  if (Array.isArray(notasAmadas) && notasAmadas.length) {
    linhas.push(`Notas que ama: ${notasAmadas.join(", ")}`)
  }
  const notasOdiadas = respostas.notasOdiadas
  if (Array.isArray(notasOdiadas) && notasOdiadas.length) {
    linhas.push(`Notas que odeia: ${notasOdiadas.join(", ")}`)
  }

  return linhas.join("\n")
}

async function chamarGemini(chave: string, modelo: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${chave}`

  const body = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini ${res.status}: ${err}`)
  }

  const dados = await res.json()
  return dados?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
}

// Modelos em ordem de preferência — tenta o próximo se o anterior falhar
const MODELOS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro-latest",
]

export async function gerarRecomendacao(
  respostas: Record<string, unknown>
): Promise<RecomendacaoIA | null> {
  const chave = process.env.GEMINI_API_KEY
  if (!chave || chave === "COLOQUE_SUA_CHAVE_AQUI") {
    console.error("[IA] GEMINI_API_KEY não configurada")
    return null
  }

  const prompt = `Respostas do quiz:\n${formatarRespostas(respostas)}`

  for (const modelo of MODELOS) {
    try {
      console.log(`[IA] Tentando modelo: ${modelo}`)
      const texto = await chamarGemini(chave, modelo, prompt)
      console.log(`[IA] Resposta bruta (${modelo}):`, texto.slice(0, 200))

      const jsonMatch = texto.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error("Sem JSON na resposta")

      const resultado = JSON.parse(jsonMatch[0]) as RecomendacaoIA
      if (!resultado.perfumePrincipal?.nome) throw new Error("JSON incompleto")

      console.log(`[IA] Sucesso com modelo: ${modelo}`)
      return resultado
    } catch (erro) {
      console.error(`[IA] Falhou com ${modelo}:`, erro instanceof Error ? erro.message : erro)
    }
  }

  console.error("[IA] Todos os modelos falharam — usando fallback")
  return gerarFallback(respostas)
}

function gerarFallback(respostas: Record<string, unknown>): RecomendacaoIA {
  const vibe = String(respostas.vibe ?? "")
  const clima = String(respostas.clima ?? "")

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
        nome: "Santal 33",
        marca: "Le Labo",
        concentracao: "EDP",
        descricao: "Sândalo defumado com couro suave e cardamomo. Cheira a algo pessoal, como uma segunda pele bem cuidada. Unissex sem esforço.",
        notas: ["sândalo", "couro", "cardamomo", "cedro"],
      },
      conselho: "Tem projeção moderada e fixação longa — funciona melhor aplicado no pescoço e punhos do que na roupa.",
      alternativa: {
        nome: "Bleu de Chanel",
        marca: "Chanel",
        descricao: "Mais acessível, com o mesmo equilíbrio entre frescor e profundidade amadeirada.",
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

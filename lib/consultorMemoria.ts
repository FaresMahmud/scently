import { GoogleGenerativeAI } from "@google/generative-ai"
import { db } from "@/lib/db"

const MAX_FATOS_POR_USUARIO = 20

interface FatoExtraido {
  fato: string
  categoria: string
}

const CATEGORIAS_VALIDAS = new Set(["preferencia", "acervo", "caracteristica", "rejeicao"])

export async function carregarMemorias(userId: string): Promise<string | null> {
  const memorias = await db.consultorMemoria.findMany({
    where: { userId },
    orderBy: { criadoEm: "desc" },
    select: { fato: true },
  })
  if (memorias.length === 0) return null
  return `Sobre este cliente: ${memorias.map(m => m.fato).join("; ")}.`
}

function normalizar(fato: string): string {
  return fato.toLowerCase().trim()
}

/**
 * Salva as respostas do quiz premium como memória inicial do consultor chat.
 * Conversão determinística (sem chamada à IA) — os dados já vêm estruturados
 * e legíveis de resolverRespostas(). Best-effort — nunca lança.
 */
export async function salvarRespostasQuizComoMemoria(
  userId: string,
  respostasResolvidas: Record<string, string>
): Promise<void> {
  try {
    const fatos: FatoExtraido[] = []

    if (respostasResolvidas["perfume-existente"]) {
      fatos.push({ fato: `Já usa e gosta de ${respostasResolvidas["perfume-existente"]}`, categoria: "acervo" })
    }
    if (respostasResolvidas["ocasiao"]) {
      fatos.push({ fato: `Procura perfume para: ${respostasResolvidas["ocasiao"]}`, categoria: "caracteristica" })
    }
    if (respostasResolvidas["cena"]) {
      fatos.push({ fato: `Estilo de vida: ${respostasResolvidas["cena"]}`, categoria: "caracteristica" })
    }
    if (respostasResolvidas["projecao"]) {
      fatos.push({ fato: `Projeção preferida: ${respostasResolvidas["projecao"]}`, categoria: "preferencia" })
    }
    if (respostasResolvidas["ousadia"]) {
      fatos.push({ fato: `Ousadia preferida: ${respostasResolvidas["ousadia"]}`, categoria: "preferencia" })
    }
    if (respostasResolvidas["impressao"]) {
      fatos.push({ fato: `Impressão que quer causar: ${respostasResolvidas["impressao"]}`, categoria: "preferencia" })
    }
    if (respostasResolvidas["rejeicao"] && respostasResolvidas["rejeicao"] !== "Nada específico") {
      fatos.push({ fato: `Não gosta de: ${respostasResolvidas["rejeicao"]}`, categoria: "rejeicao" })
    }

    if (fatos.length === 0) return

    const existentes = await db.consultorMemoria.findMany({
      where: { userId },
      select: { id: true, fato: true, criadoEm: true },
      orderBy: { criadoEm: "asc" },
    })
    const fatosExistentesNormalizados = new Set(existentes.map(e => normalizar(e.fato)))
    const novos = fatos.filter(f => !fatosExistentesNormalizados.has(normalizar(f.fato)))
    if (novos.length === 0) return

    await db.consultorMemoria.createMany({
      data: novos.map(f => ({ userId, fato: f.fato, categoria: f.categoria })),
    })

    const total = existentes.length + novos.length
    if (total > MAX_FATOS_POR_USUARIO) {
      const excedente = total - MAX_FATOS_POR_USUARIO
      const maisAntigos = existentes.slice(0, excedente).map(e => e.id)
      if (maisAntigos.length > 0) {
        await db.consultorMemoria.deleteMany({ where: { id: { in: maisAntigos } } })
      }
    }
  } catch (err) {
    console.error("[consultorMemoria] Erro ao salvar respostas do quiz:", err)
  }
}

/** Extrai fatos novos da troca mais recente via Gemini e salva no banco. Best-effort — nunca lança. */
export async function extrairEArmazenarFatos(
  userId: string,
  mensagemUsuario: string,
  respostaConsultora: string
): Promise<void> {
  try {
    const chave = process.env.GEMINI_API_KEY
    if (!chave) return

    const genAI = new GoogleGenerativeAI(chave)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      systemInstruction:
        'Extraia fatos novos e duráveis sobre o usuário a partir da troca de mensagens abaixo, ' +
        'no contexto de uma conversa sobre perfumes. Cada fato deve ser curto (até 8 palavras) e ' +
        'categorizado como "preferencia" (gosto por família/nota/estilo), "acervo" (perfumes que ' +
        'o usuário diz ter), "caracteristica" (pele, clima, ocasião) ou "rejeicao" (o que não gosta). ' +
        'Se não houver fato novo e relevante, responda com array vazio. ' +
        'Responda APENAS com JSON válido no formato [{"fato": "...", "categoria": "..."}], sem markdown.',
      generationConfig: { thinkingConfig: { thinkingBudget: 0 } } as never,
    })

    const result = await model.generateContent(
      `Usuário: ${mensagemUsuario}\nConsultora: ${respostaConsultora}`
    )
    const texto = result.response.text().trim()
      .replace(/^```json\s*/i, "").replace(/```$/, "").trim()

    let extraidos: FatoExtraido[]
    try {
      extraidos = JSON.parse(texto)
    } catch {
      return
    }
    if (!Array.isArray(extraidos) || extraidos.length === 0) return

    const existentes = await db.consultorMemoria.findMany({
      where: { userId },
      select: { id: true, fato: true, criadoEm: true },
      orderBy: { criadoEm: "asc" },
    })
    const fatosExistentesNormalizados = new Set(existentes.map(e => normalizar(e.fato)))

    const novos = extraidos.filter(f =>
      f?.fato && typeof f.fato === "string" &&
      CATEGORIAS_VALIDAS.has(f.categoria) &&
      !fatosExistentesNormalizados.has(normalizar(f.fato))
    )
    if (novos.length === 0) return

    await db.consultorMemoria.createMany({
      data: novos.map(f => ({ userId, fato: f.fato.trim(), categoria: f.categoria })),
    })

    const total = existentes.length + novos.length
    if (total > MAX_FATOS_POR_USUARIO) {
      const excedente = total - MAX_FATOS_POR_USUARIO
      const maisAntigos = existentes.slice(0, excedente).map(e => e.id)
      if (maisAntigos.length > 0) {
        await db.consultorMemoria.deleteMany({ where: { id: { in: maisAntigos } } })
      }
    }
  } catch (err) {
    console.error("[consultorMemoria] Erro ao extrair fatos:", err)
  }
}

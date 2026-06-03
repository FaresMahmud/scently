// ============================================
// ARQUIVO: lib/gerarRanking.ts
// O QUE FAZ: gera rankings de estação e ocasião via DeepSeek com base no perfil olfativo real
// QUANDO MANDAR PRA IA: quando quiser mudar o prompt ou os parâmetros do ranking
// DEPENDE DE: .env.local (DEEPSEEK_API_KEY)
// ============================================

interface RankingItem {
  name: string
  score: number
}

export async function gerarRankingEstacao(
  nome: string,
  familia: string,
  notas: string[]
): Promise<RankingItem[]> {
  const prompt = `Você é um especialista em perfumaria. Avalie quando usar o perfume "${nome}" (família: ${familia}, notas: ${notas.slice(0, 8).join(", ")}).

REGRAS OBRIGATÓRIAS:
- Perfumes aquáticos, cítricos, frescos: verão alto (3.5-4.0), inverno baixo (0.5-1.0)
- Perfumes amadeirados, orientais, especiados: inverno alto (3.5-4.0), verão baixo (0.5-1.0)
- Perfumes florais leves: primavera alto, inverno baixo
- Perfumes gourmand/baunilha: outono/inverno alto
- Tommy, Acqua di Gio, Chrome, Light Blue = perfumes de verão/primavera

Retorne APENAS este JSON (sem markdown, sem explicação):
[{"name":"summer","score":NUMERO},{"name":"spring","score":NUMERO},{"name":"fall","score":NUMERO},{"name":"winter","score":NUMERO}]

Scores entre 0.5 e 4.0. Seja realista — um perfume de verão NÃO pode ter inverno alto.`

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
        temperature: 0.3,
      }),
    })
    const data = await response.json()
    const text  = data.choices?.[0]?.message?.content?.trim() || "[]"
    const clean = text.replace(/```json|```/g, "").trim()
    return JSON.parse(clean) as RankingItem[]
  } catch {
    return []
  }
}

export async function gerarRankingOcasiao(
  nome: string,
  familia: string,
  notas: string[]
): Promise<RankingItem[]> {
  const prompt = `Você é um especialista em perfumaria. Avalie as ocasiões ideais para "${nome}" (família: ${familia}, notas: ${notas.slice(0, 8).join(", ")}).

REGRAS OBRIGATÓRIAS:
- Perfumes frescos/aquáticos/cítricos: casual e esporte alto, noite baixo
- Perfumes pesados/orientais/oud: noite e romântico alto, esporte baixo
- Perfumes amadeirados médios: profissional e casual alto
- Perfumes florais: romântico e casual alto

Retorne APENAS este JSON (sem markdown, sem explicação):
[{"name":"casual","score":NUMERO},{"name":"professional","score":NUMERO},{"name":"night out","score":NUMERO},{"name":"sport","score":NUMERO},{"name":"romantic","score":NUMERO}]

Scores entre 0.5 e 4.0. Seja realista e coerente com o perfil olfativo.`

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
        temperature: 0.3,
      }),
    })
    const data = await response.json()
    const text  = data.choices?.[0]?.message?.content?.trim() || "[]"
    const clean = text.replace(/```json|```/g, "").trim()
    return JSON.parse(clean) as RankingItem[]
  } catch {
    return []
  }
}

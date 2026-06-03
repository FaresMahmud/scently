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
  const prompt = `Perfume: "${nome}", família olfativa: "${familia}", notas: ${notas.join(", ")}.

Avalie a adequação deste perfume para cada estação do ano.
Retorne APENAS JSON válido, sem markdown:
[
  {"name": "summer", "score": NUMBER},
  {"name": "spring", "score": NUMBER},
  {"name": "fall", "score": NUMBER},
  {"name": "winter", "score": NUMBER}
]
Scores de 0.5 a 4.0. Seja preciso — um perfume aquático/cítrico deve ter score alto no verão e baixo no inverno.`

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
  const prompt = `Perfume: "${nome}", família olfativa: "${familia}", notas: ${notas.join(", ")}.

Avalie a adequação deste perfume para cada ocasião.
Retorne APENAS JSON válido, sem markdown:
[
  {"name": "casual", "score": NUMBER},
  {"name": "professional", "score": NUMBER},
  {"name": "night out", "score": NUMBER},
  {"name": "sport", "score": NUMBER},
  {"name": "romantic", "score": NUMBER}
]
Scores de 0.5 a 4.0. Seja preciso baseado nas características reais do perfume.`

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

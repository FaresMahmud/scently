// ============================================
// ARQUIVO: lib/gerarRanking.ts
// O QUE FAZ: gera rankings de estação e ocasião — override por nome, depois DeepSeek
// QUANDO MANDAR PRA IA: quando quiser mudar o prompt ou os parâmetros do ranking
// DEPENDE DE: .env.local (DEEPSEEK_API_KEY)
// ============================================

interface RankingItem {
  name: string
  score: number
}

// [summer, spring, fall, winter]
const SCORES_FIXOS: Record<string, [number, number, number, number]> = {
  summer: [3.9, 2.8, 1.4, 0.6],
  winter: [0.6, 1.2, 3.0, 3.9],
  spring: [2.8, 3.9, 1.8, 0.9],
  fall:   [1.2, 1.8, 3.9, 3.2],
}

function detectarEstacaoNome(nome: string): string | null {
  const n = nome.toLowerCase()
  if (n.includes("summer") || n.includes("verão") || n.includes("verao") ||
      n.includes("aqua")   || n.includes("blu")   || n.includes("blue")  ||
      n.includes("eau fraiche") || n.includes("ocean") || n.includes("sea") ||
      n.includes("marine"))
    return "summer"
  if (n.includes("winter")  || n.includes("inverno") || n.includes("noir")    ||
      n.includes("intense") || n.includes("nuit")    || n.includes("night")   ||
      n.includes("dark"))
    return "winter"
  if (n.includes("spring")   || n.includes("primavera") || n.includes("rose")    ||
      n.includes("bloom")    || n.includes("blossom")   || n.includes("fleur"))
    return "spring"
  if (n.includes("autumn") || n.includes("fall")    || n.includes("outono") ||
      n.includes("harvest") || n.includes("amber")  || n.includes("wood"))
    return "fall"
  return null
}

export async function gerarRankingEstacao(
  nome: string,
  familia: string,
  notas: string[]
): Promise<RankingItem[]> {
  // Override por nome — sem chamada à API
  const estacaoDetectada = detectarEstacaoNome(nome)
  if (estacaoDetectada) {
    const [s, sp, f, w] = SCORES_FIXOS[estacaoDetectada]
    return [
      { name: "summer", score: s  },
      { name: "spring", score: sp },
      { name: "fall",   score: f  },
      { name: "winter", score: w  },
    ]
  }

  const prompt = `IMPORTANTE: O nome do perfume é "${nome}" — use isso como contexto principal.
Família olfativa: "${familia}"
Notas principais: ${notas.slice(0, 6).join(", ")}

Classifique a adequação por estação. Siga ESTRITAMENTE estas regras:
- Aquático/Cítrico/Fresco/Marine → verão: 3.8-4.0, primavera: 2.5-3.2, outono: 1.2-1.8, inverno: 0.5-0.9
- Floral leve → primavera: 3.8-4.0, verão: 2.8-3.2, outono: 1.5-2.0, inverno: 0.8-1.2
- Amadeirado/Oriental/Especiado → inverno: 3.8-4.0, outono: 3.0-3.5, primavera: 1.2-1.8, verão: 0.5-0.9
- Gourmand/Baunilha/Âmbar → inverno: 4.0, outono: 3.5, primavera: 1.0, verão: 0.5
- Fougère/Aromático → primavera: 3.5, verão: 2.8, outono: 2.5, inverno: 1.5

Retorne SOMENTE este JSON, sem nenhum texto adicional:
[{"name":"summer","score":NUMERO},{"name":"spring","score":NUMERO},{"name":"fall","score":NUMERO},{"name":"winter","score":NUMERO}]`

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
    const data  = await response.json()
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
  const prompt = `IMPORTANTE: O nome do perfume é "${nome}" — use isso como contexto principal.
Família olfativa: "${familia}"
Notas principais: ${notas.slice(0, 6).join(", ")}

Classifique a adequação por ocasião. Siga ESTRITAMENTE estas regras:
- Aquático/Cítrico/Fresco → casual: 4.0, esporte: 3.5, profissional: 2.5, noite: 1.0, romântico: 1.2
- Amadeirado leve/Fougère → profissional: 4.0, casual: 3.5, noite: 2.5, romântico: 2.8, esporte: 1.5
- Oriental/Especiado/Oud → noite: 4.0, romântico: 3.8, profissional: 1.5, casual: 1.8, esporte: 0.5
- Floral → romântico: 4.0, casual: 3.2, profissional: 2.5, noite: 2.0, esporte: 1.0
- Gourmand → noite: 3.5, romântico: 3.8, casual: 2.0, profissional: 1.0, esporte: 0.5

Retorne SOMENTE este JSON, sem nenhum texto adicional:
[{"name":"casual","score":NUMERO},{"name":"professional","score":NUMERO},{"name":"night out","score":NUMERO},{"name":"sport","score":NUMERO},{"name":"romantic","score":NUMERO}]`

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
    const data  = await response.json()
    const text  = data.choices?.[0]?.message?.content?.trim() || "[]"
    const clean = text.replace(/```json|```/g, "").trim()
    return JSON.parse(clean) as RankingItem[]
  } catch {
    return []
  }
}

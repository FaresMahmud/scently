// ============================================
// ARQUIVO: lib/copyTendencia.ts
// O QUE FAZ: gera copy editorial para cards de tendência — manual ou via DeepSeek
// QUANDO MANDAR PRA IA: quando quiser adicionar copies manuais ou mudar o prompt
// ============================================

const COPIES_MANUAIS: Record<string, string> = {
  "light blue":        "Fresco, direto, sem esforço. Funciona no trabalho e ainda está presente no fim do dia.",
  "tommy new york":    "O clássico americano que o Brasil nunca abandonou. Limpo, jovem, confiável.",
  "tommy summer":      "Cítrico, leve, feito para dias quentes. O irmão mais despretensioso do Tommy New York.",
  "sauvage edp":       "Todo mundo reconhece. Poucos sabem por quê funciona tão bem. A resposta está no ambroxan.",
  "sauvage":           "Todo mundo reconhece. Poucos sabem por quê funciona tão bem. A resposta está no ambroxan.",
  "baccarat rouge 540":"O perfume mais imitado do mundo por uma razão: ninguém consegue replicar o original.",
  "aventus":           "Abacaxi defumado sobre musgo de carvalho. Um clássico moderno que justifica o preço.",
  "bleu de chanel":    "Discreto o suficiente para o trabalho. Marcante o suficiente para ser lembrado.",
  "good girl":         "O frasco é o perfume. Dentro: amêndoa torrada e jasmim que ficam na memória.",
  "la vie est belle":  "Doce sem ser enjoativo. O motivo pelo qual todo mundo tem uma garrafa em casa.",
  "black opium":       "Café e baunilha com energia elétrica. Para quem quer ser notado.",
  "chrome":            "Aquático e limpo. O perfume que não erra — em nenhuma ocasião.",
}

export async function getCopyTendencia(nome: string, marca: string, familia?: string): Promise<string> {
  const nomeNorm = nome.toLowerCase().trim()

  // Check manual copies first
  for (const [key, copy] of Object.entries(COPIES_MANUAIS)) {
    if (nomeNorm.includes(key)) return copy
  }

  // Generate with DeepSeek
  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{
          role: "user",
          content: `Escreva UMA frase de no máximo 18 palavras sobre o perfume "${nome}" da marca "${marca}"${familia ? `, família ${familia}` : ""}. Tom: elegante, direto, com personalidade. Sem repetir o nome do perfume. Sem emojis. Sem aspas. Só a frase.`,
        }],
        max_tokens: 60,
        temperature: 0.8,
      }),
    })
    const data = await response.json()
    return data.choices?.[0]?.message?.content?.trim() || ""
  } catch {
    return ""
  }
}

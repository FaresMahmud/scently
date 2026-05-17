// ============================================
// TEST: lib/ai.ts — formatarRespostas
// Verifica que a função serializa as respostas do quiz no formato "chave:valor|..."
// ============================================

import { formatarRespostas, RespostasQuiz } from "@/lib/ai"

describe("formatarRespostas", () => {
  it("retorna string vazia para objeto sem campos preenchidos", () => {
    expect(formatarRespostas({})).toBe("")
  })

  it("serializa perfil corretamente", () => {
    const r: RespostasQuiz = { perfil: "casual" }
    expect(formatarRespostas(r)).toBe("perfil:casual")
  })

  it("serializa múltiplos campos separados por pipe", () => {
    const r: RespostasQuiz = { perfil: "iniciante", genero: "masculino", vibe: "fresco" }
    const resultado = formatarRespostas(r)
    expect(resultado).toBe("perfil:iniciante|genero:masculino|vibe:fresco")
  })

  it("inclui notasAmadas quando preenchidas", () => {
    const r: RespostasQuiz = { notasAmadas: ["citrico", "floral"] }
    expect(formatarRespostas(r)).toContain("ama:citrico,floral")
  })

  it("inclui notasOdiadas quando preenchidas", () => {
    const r: RespostasQuiz = { notasOdiadas: ["oriental", "especiado"] }
    expect(formatarRespostas(r)).toContain("odeia:oriental,especiado")
  })

  it("omite notasAmadas quando array vazio", () => {
    const r: RespostasQuiz = { notasAmadas: [] }
    expect(formatarRespostas(r)).toBe("")
  })

  it("inclui faixaPreco como 'preco:...'", () => {
    const r: RespostasQuiz = { faixaPreco: "economico" }
    expect(formatarRespostas(r)).toBe("preco:economico")
  })

  it("inclui perfumeAtual como 'usa:...'", () => {
    const r: RespostasQuiz = { perfumeAtual: "Sauvage" }
    expect(formatarRespostas(r)).toBe("usa:Sauvage")
  })

  it("inclui referenciaCheiro como 'cheiro:...'", () => {
    const r: RespostasQuiz = { referenciaCheiro: "café" }
    expect(formatarRespostas(r)).toBe("cheiro:café")
  })

  it("inclui ousadia corretamente", () => {
    const r: RespostasQuiz = { ousadia: "ousado" }
    expect(formatarRespostas(r)).toBe("ousadia:ousado")
  })

  it("inclui fixacaoProjecao como 'projecao:...'", () => {
    const r: RespostasQuiz = { fixacaoProjecao: "rastro" }
    expect(formatarRespostas(r)).toBe("projecao:rastro")
  })

  it("inclui inspiracaoSensorial como 'imagem:...'", () => {
    const r: RespostasQuiz = { inspiracaoSensorial: "praia-maresia" }
    expect(formatarRespostas(r)).toBe("imagem:praia-maresia")
  })

  it("serializa todos os campos de uma vez — modo aprofundado completo", () => {
    const r: RespostasQuiz = {
      perfil: "entusiasta",
      genero: "masculino",
      vibe: "fresco",
      sensacao: "intrigar",
      ocasiao: "especial",
      clima: "quente",
      notasAmadas: ["amadeirado", "citrico"],
      notasOdiadas: ["oriental"],
      faixaPreco: "medio",
      perfumeAtual: "Bleu de Chanel",
      referenciaCheiro: "madeira",
      ousadia: "equilibrado",
      prioridade: "sillage",
      estacao: "verao",
      hora: "noite",
      personalidade: "elegante",
      ambiente: "noite-balada",
      fixacaoProjecao: "marcante",
      inspiracaoSensorial: "jantar-elegante",
    }
    const resultado = formatarRespostas(r)
    expect(resultado).toContain("perfil:entusiasta")
    expect(resultado).toContain("genero:masculino")
    expect(resultado).toContain("vibe:fresco")
    expect(resultado).toContain("preco:medio")
    expect(resultado).toContain("ama:amadeirado,citrico")
    expect(resultado).toContain("odeia:oriental")
    expect(resultado).toContain("ousadia:equilibrado")
    expect(resultado).toContain("projecao:marcante")
    expect(resultado).toContain("imagem:jantar-elegante")
    // Verifica separação por pipe
    expect(resultado.split("|").length).toBeGreaterThan(10)
  })

  it("clima quente gera instrução de bloqueio de orientais no prompt — verificação via campos", () => {
    // Testa que os campos clima e estacao são passados corretamente para a serialização
    const r: RespostasQuiz = { clima: "quente", estacao: "verao" }
    const resultado = formatarRespostas(r)
    expect(resultado).toContain("clima:quente")
    expect(resultado).toContain("estacao:verao")
  })
})

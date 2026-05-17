// ============================================
// TEST: lib/ai.ts — validarFaixaPreco
// Verifica que marcas proibidas são bloqueadas por faixa de preço
// ============================================

import { validarFaixaPreco, RecomendacaoIA } from "@/lib/ai"

function makeRecomendacao(marca: string, nome: string): RecomendacaoIA {
  return {
    perfumePrincipal: {
      nome,
      marca,
      concentracao: "EDP",
      descricao: "Teste",
      notas: [],
    },
    conselho: "Teste",
    alternativa: { nome: "Alt", marca: "AltMarca", descricao: "Alt desc" },
  }
}

describe("validarFaixaPreco — faixa econômico", () => {
  it("bloqueia Dior na faixa econômico", () => {
    expect(validarFaixaPreco(makeRecomendacao("Dior", "Sauvage"), "economico")).toBe(false)
  })

  it("bloqueia Chanel na faixa econômico", () => {
    expect(validarFaixaPreco(makeRecomendacao("Chanel", "Bleu de Chanel"), "economico")).toBe(false)
  })

  it("bloqueia Tom Ford na faixa econômico", () => {
    expect(validarFaixaPreco(makeRecomendacao("Tom Ford", "Black Orchid"), "economico")).toBe(false)
  })

  it("bloqueia Creed na faixa econômico", () => {
    expect(validarFaixaPreco(makeRecomendacao("Creed", "Aventus"), "economico")).toBe(false)
  })

  it("bloqueia Le Labo na faixa econômico", () => {
    expect(validarFaixaPreco(makeRecomendacao("Le Labo", "Santal 33"), "economico")).toBe(false)
  })

  it("bloqueia Maison Margiela (Replica) na faixa econômico", () => {
    expect(validarFaixaPreco(makeRecomendacao("Maison Margiela", "Jazz Club"), "economico")).toBe(false)
  })

  it("bloqueia Parfums de Marly na faixa econômico", () => {
    expect(validarFaixaPreco(makeRecomendacao("Parfums de Marly", "Pegasus"), "economico")).toBe(false)
  })

  it("bloqueia Nishane na faixa econômico", () => {
    expect(validarFaixaPreco(makeRecomendacao("Nishane", "Hacivat"), "economico")).toBe(false)
  })

  it("bloqueia Louis Vuitton na faixa econômico", () => {
    expect(validarFaixaPreco(makeRecomendacao("Louis Vuitton", "Imagination"), "economico")).toBe(false)
  })

  it("permite La Rive (contratipo nacional) na faixa econômico", () => {
    expect(validarFaixaPreco(makeRecomendacao("La Rive", "Carbon"), "economico")).toBe(true)
  })

  it("permite In The Box na faixa econômico", () => {
    expect(validarFaixaPreco(makeRecomendacao("In The Box", "Aventhis 2010"), "economico")).toBe(true)
  })

  it("permite O Boticário na faixa econômico", () => {
    expect(validarFaixaPreco(makeRecomendacao("O Boticário", "Quasar"), "economico")).toBe(true)
  })

  it("a comparação é case-insensitive — 'DIOR' também deve ser bloqueado", () => {
    expect(validarFaixaPreco(makeRecomendacao("DIOR", "Sauvage"), "economico")).toBe(false)
  })
})

describe("validarFaixaPreco — faixa médio", () => {
  it("bloqueia Creed na faixa médio", () => {
    expect(validarFaixaPreco(makeRecomendacao("Creed", "Aventus"), "medio")).toBe(false)
  })

  it("bloqueia Parfums de Marly na faixa médio", () => {
    expect(validarFaixaPreco(makeRecomendacao("Parfums de Marly", "Layton"), "medio")).toBe(false)
  })

  it("bloqueia Tom Ford Private Blend — Tom Ford Private como parte do nome", () => {
    expect(validarFaixaPreco(makeRecomendacao("Tom Ford", "Tom Ford Private"), "medio")).toBe(false)
  })

  it("bloqueia Xerjoff na faixa médio", () => {
    expect(validarFaixaPreco(makeRecomendacao("Xerjoff", "Erba Pura"), "medio")).toBe(false)
  })

  it("bloqueia Amouage na faixa médio", () => {
    expect(validarFaixaPreco(makeRecomendacao("Amouage", "Reflection"), "medio")).toBe(false)
  })

  it("permite Dior Sauvage EDT na faixa médio", () => {
    // Dior NÃO está na lista de bloqueados para médio
    expect(validarFaixaPreco(makeRecomendacao("Dior", "Sauvage"), "medio")).toBe(true)
  })

  it("permite Giorgio Armani na faixa médio", () => {
    expect(validarFaixaPreco(makeRecomendacao("Giorgio Armani", "Acqua di Giò"), "medio")).toBe(true)
  })

  it("permite Carolina Herrera na faixa médio", () => {
    expect(validarFaixaPreco(makeRecomendacao("Carolina Herrera", "Good Girl"), "medio")).toBe(true)
  })
})

describe("validarFaixaPreco — faixas sem restrição", () => {
  it("permite qualquer marca na faixa premium", () => {
    expect(validarFaixaPreco(makeRecomendacao("Creed", "Aventus"), "premium")).toBe(true)
  })

  it("permite qualquer marca na faixa luxo", () => {
    expect(validarFaixaPreco(makeRecomendacao("Creed", "Aventus"), "luxo")).toBe(true)
  })

  it("permite qualquer marca quando faixaPreco não é informada", () => {
    expect(validarFaixaPreco(makeRecomendacao("Creed", "Aventus"), "")).toBe(true)
  })
})

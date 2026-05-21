// ============================================
// TEST: config/site.ts
// Verifica conteúdo e integridade das configurações do site
// ============================================

import {
  siteMeta,
  textosHome,
  textosConsultor,
  perguntasRapidas,
  perguntasAprofundadas,
} from "@/config/site"

describe("siteMeta", () => {
  it("tem nome definido", () => {
    expect(siteMeta.nome).toBeTruthy()
    expect(typeof siteMeta.nome).toBe("string")
  })

  it("tem tagline definida", () => {
    expect(siteMeta.tagline).toBeTruthy()
  })

  it("tem URL definida", () => {
    expect(siteMeta.url).toBeTruthy()
  })

  it("idioma é pt-BR", () => {
    expect(siteMeta.idioma).toBe("pt-BR")
  })
})

describe("textosHome", () => {
  it("tem heroTitulo e heroSubtitulo", () => {
    expect(textosHome.heroTitulo).toBeTruthy()
    expect(textosHome.heroSubtitulo).toBeTruthy()
  })

  it("tem botão de início", () => {
    expect(textosHome.heroBotao).toBeTruthy()
  })
})

describe("textosConsultor", () => {
  it("tem título definido", () => {
    expect(textosConsultor.titulo).toBeTruthy()
  })

  it("tem mensagem de carregando", () => {
    expect(textosConsultor.mensagemCarregando).toBeTruthy()
  })

  it("tem mensagem de erro", () => {
    expect(textosConsultor.mensagemErro).toBeTruthy()
  })
})

describe("perguntasRapidas", () => {
  it("contém pelo menos 6 perguntas", () => {
    expect(perguntasRapidas.length).toBeGreaterThanOrEqual(6)
  })

  it("todos os itens têm id e pergunta", () => {
    for (const perg of perguntasRapidas) {
      expect(perg.id).toBeTruthy()
      expect(perg.pergunta).toBeTruthy()
    }
  })

  it("todos os ids são únicos", () => {
    const ids = perguntasRapidas.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("pergunta de perfil existe e tem 4 opções", () => {
    const pergunta = perguntasRapidas.find((p) => p.id === "perfil")
    expect(pergunta).toBeDefined()
    expect(pergunta!.opcoes).toHaveLength(4)
  })

  it("pergunta de clima existe e inclui opção 'quente'", () => {
    const pergunta = perguntasRapidas.find((p) => p.id === "clima")
    expect(pergunta).toBeDefined()
    const valores = pergunta!.opcoes!.map((o) => o.valor)
    expect(valores).toContain("quente")
  })

  it("pergunta de vibe existe e inclui as 4 vibes principais", () => {
    const pergunta = perguntasRapidas.find((p) => p.id === "vibe")
    expect(pergunta).toBeDefined()
    const valores = pergunta!.opcoes!.map((o) => o.valor)
    expect(valores).toContain("fresco")
    expect(valores).toContain("quente")
    expect(valores).toContain("sofisticado")
    expect(valores).toContain("doce")
  })

  it("todas as opções têm valor e texto", () => {
    for (const perg of perguntasRapidas) {
      if (perg.opcoes) {
        for (const op of perg.opcoes) {
          expect(op.valor).toBeTruthy()
          expect(op.texto).toBeTruthy()
        }
      }
    }
  })
})

describe("perguntasAprofundadas", () => {
  it("contém pelo menos 5 perguntas", () => {
    expect(perguntasAprofundadas.length).toBeGreaterThanOrEqual(5)
  })

  it("inclui pergunta de preço com 4 faixas", () => {
    const pergunta = perguntasAprofundadas.find((p) => p.id === "faixaPreco")
    expect(pergunta).toBeDefined()
    const valores = pergunta!.opcoes!.map((o) => o.valor)
    expect(valores).toContain("economico")
    expect(valores).toContain("medio")
    expect(valores).toContain("premium")
    expect(valores).toContain("luxo")
  })

  it("inclui pergunta de ousadia com as 4 opções", () => {
    const pergunta = perguntasAprofundadas.find((p) => p.id === "ousadia")
    expect(pergunta).toBeDefined()
    const valores = pergunta!.opcoes!.map((o) => o.valor)
    expect(valores).toContain("seguro")
    expect(valores).toContain("equilibrado")
    expect(valores).toContain("ousado")
    expect(valores).toContain("raro")
  })

  it("inclui pergunta de ambiente com 'noite-balada' como opção", () => {
    const pergunta = perguntasAprofundadas.find((p) => p.id === "ambiente")
    expect(pergunta).toBeDefined()
    const valores = pergunta!.opcoes!.map((o) => o.valor)
    expect(valores).toContain("noite-balada")
  })

  it("todos os ids são únicos entre perguntas rápidas e aprofundadas", () => {
    const idsRapidas = perguntasRapidas.map((p) => p.id)
    const idsAprofundadas = perguntasAprofundadas.map((p) => p.id)
    const todos = [...idsRapidas, ...idsAprofundadas]
    expect(new Set(todos).size).toBe(todos.length)
  })
})

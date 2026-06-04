// ============================================
// TEST: lib/contratiposData.ts
// Verifica estrutura dos dados e funções auxiliares
// ============================================

import {
  CONTRATIPOS,
  buscarTodosContratipos,
  buscarContratiposPorMarca,
  buscarContratiposPorGenero,
  buscarContratiposPorInspiracao,
  PerfumeContratipo,
} from "@/lib/contratiposData"

describe("CONTRATIPOS — integridade dos dados", () => {
  it("contém pelo menos 1 item", () => {
    expect(CONTRATIPOS.length).toBeGreaterThan(0)
  })

  it("todos os itens têm id único", () => {
    const ids = CONTRATIPOS.map((p) => p.id)
    const unicos = new Set(ids)
    expect(unicos.size).toBe(ids.length)
  })

  it("todos os itens têm campos obrigatórios preenchidos", () => {
    for (const p of CONTRATIPOS) {
      expect(p.id).toBeTruthy()
      expect(p.nome).toBeTruthy()
      expect(p.marca).toBeTruthy()
      expect(p.familia).toBeTruthy()
      expect(p.preco_brl).toBeGreaterThan(0)
      // inspiradoEm e marcaOriginal são opcionais — perfumes originais de marcas brasileiras podem não ter referência
      // Regra de consistência: se um está preenchido, o outro também deve estar
      expect(!!p.inspiradoEm).toBe(!!p.marcaOriginal)
    }
  })

  it("todos os tipos são EDP, EDT, EDC ou Extrait", () => {
    const tiposValidos = ["EDP", "EDT", "EDC", "Extrait"]
    for (const p of CONTRATIPOS) {
      expect(tiposValidos).toContain(p.tipo)
    }
  })

  it("todos os gêneros são Masculino, Feminino ou Unissex", () => {
    const generosValidos = ["Masculino", "Feminino", "Unissex"]
    for (const p of CONTRATIPOS) {
      expect(generosValidos).toContain(p.genero)
    }
  })

  it("categoria sempre é 'contratipo'", () => {
    for (const p of CONTRATIPOS) {
      expect(p.categoria).toBe("contratipo")
    }
  })

  it("preços estão dentro da faixa esperada para contratipos (R$50 a R$300)", () => {
    for (const p of CONTRATIPOS) {
      expect(p.preco_brl).toBeGreaterThanOrEqual(50)
      expect(p.preco_brl).toBeLessThanOrEqual(300)
    }
  })
})

describe("buscarTodosContratipos", () => {
  it("retorna todos os contratipos", () => {
    expect(buscarTodosContratipos()).toHaveLength(CONTRATIPOS.length)
  })

  it("retorna o mesmo array referenciado por CONTRATIPOS", () => {
    expect(buscarTodosContratipos()).toBe(CONTRATIPOS)
  })
})

describe("buscarContratiposPorMarca", () => {
  it("retorna apenas perfumes da marca informada", () => {
    const resultado = buscarContratiposPorMarca("In The Box")
    expect(resultado.length).toBeGreaterThan(0)
    for (const p of resultado) {
      expect(p.marca.toLowerCase()).toBe("in the box")
    }
  })

  it("é case-insensitive", () => {
    const maiusculo = buscarContratiposPorMarca("IN THE BOX")
    const minusculo = buscarContratiposPorMarca("in the box")
    expect(maiusculo).toEqual(minusculo)
  })

  it("retorna array vazio para marca inexistente", () => {
    expect(buscarContratiposPorMarca("Marca Inexistente XYZW")).toEqual([])
  })

  it("retorna perfumes da JA Essence", () => {
    const resultado = buscarContratiposPorMarca("JA Essence")
    expect(resultado.length).toBeGreaterThan(0)
  })

  it("retorna perfumes da Maison Viegas", () => {
    const resultado = buscarContratiposPorMarca("Maison Viegas")
    expect(resultado.length).toBeGreaterThan(0)
  })

  it("retorna perfumes da Azza Parfum", () => {
    const resultado = buscarContratiposPorMarca("Azza Parfum")
    expect(resultado.length).toBeGreaterThan(0)
  })
})

describe("buscarContratiposPorGenero", () => {
  it("retorna perfumes masculinos corretamente", () => {
    const resultado = buscarContratiposPorGenero("Masculino")
    expect(resultado.length).toBeGreaterThan(0)
    for (const p of resultado) {
      expect(p.genero).toBe("Masculino")
    }
  })

  it("retorna perfumes femininos corretamente", () => {
    const resultado = buscarContratiposPorGenero("Feminino")
    expect(resultado.length).toBeGreaterThan(0)
    for (const p of resultado) {
      expect(p.genero).toBe("Feminino")
    }
  })

  it("retorna perfumes unissex corretamente", () => {
    const resultado = buscarContratiposPorGenero("Unissex")
    expect(resultado.length).toBeGreaterThan(0)
    for (const p of resultado) {
      expect(p.genero).toBe("Unissex")
    }
  })

  it("masculino + feminino + unissex somam o total de contratipos", () => {
    const masc = buscarContratiposPorGenero("Masculino").length
    const fem = buscarContratiposPorGenero("Feminino").length
    const uni = buscarContratiposPorGenero("Unissex").length
    expect(masc + fem + uni).toBe(CONTRATIPOS.length)
  })
})

describe("buscarContratiposPorInspiracao", () => {
  it("encontra contratipos inspirados em Aventus", () => {
    const resultado = buscarContratiposPorInspiracao("Aventus")
    expect(resultado.length).toBeGreaterThan(0)
    for (const p of resultado) {
      const texto = `${p.inspiradoEm} ${p.marcaOriginal}`.toLowerCase()
      expect(texto).toContain("aventus")
    }
  })

  it("encontra contratipos por marca original (Creed)", () => {
    const resultado = buscarContratiposPorInspiracao("Creed")
    expect(resultado.length).toBeGreaterThan(0)
    for (const p of resultado) {
      const texto = `${p.inspiradoEm} ${p.marcaOriginal}`.toLowerCase()
      expect(texto).toContain("creed")
    }
  })

  it("é case-insensitive na busca", () => {
    const minusculo = buscarContratiposPorInspiracao("creed")
    const maiusculo = buscarContratiposPorInspiracao("CREED")
    expect(minusculo).toEqual(maiusculo)
  })

  it("retorna array vazio para inspiração inexistente", () => {
    expect(buscarContratiposPorInspiracao("MarcaQueNaoExisteXYZ")).toEqual([])
  })
})

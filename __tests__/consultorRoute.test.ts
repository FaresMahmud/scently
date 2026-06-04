// @jest-environment node
// ============================================
// TEST: app/api/consultor/route.ts
// Testa o endpoint POST /api/consultor incluindo validação, rate limiting e resposta da IA
// Usa polyfill de Request/Response via next/jest e mocks de next/server
// ============================================

// Polyfill Web APIs para ambiente Node (necessário para next/server no Jest)
import { TextEncoder, TextDecoder } from "util"
global.TextEncoder = TextEncoder as typeof global.TextEncoder
// @ts-expect-error TextDecoder is assigned from util for Jest Node polyfill
global.TextDecoder = TextDecoder

// Mocka next/server com implementações mínimas compatíveis com Node
jest.mock("next/server", () => {
  class MockNextRequest {
    private _body: string
    public headers: Map<string, string>
    public method: string

    constructor(url: string, init: RequestInit = {}) {
      this._body = (init.body as string) ?? ""
      this.headers = new Map(Object.entries(init.headers ?? {}))
      this.method = init.method ?? "GET"
    }

    async json() {
      return JSON.parse(this._body)
    }
  }

  class MockNextResponse {
    public status: number
    private _body: unknown

    constructor(body: unknown, init: { status?: number } = {}) {
      this._body = body
      this.status = init.status ?? 200
    }

    async json() {
      return this._body
    }

    static json(body: unknown, init: { status?: number } = {}) {
      return new MockNextResponse(body, init)
    }
  }

  return {
    NextRequest: MockNextRequest,
    NextResponse: MockNextResponse,
  }
})

// Mocka gerarRecomendacao para não precisar de chave de API
jest.mock("@/lib/ai", () => ({
  gerarRecomendacao: jest.fn(),
}))

import { POST } from "@/app/api/consultor/route"
import { gerarRecomendacao } from "@/lib/ai"
import { resetRateLimitStore } from "@/lib/rateLimit"

const mockGerarRecomendacao = gerarRecomendacao as jest.MockedFunction<typeof gerarRecomendacao>
type ConsultorRequest = Parameters<typeof POST>[0]

const RECOMENDACAO_MOCK = {
  perfumePrincipal: {
    nome: "Carbon",
    marca: "La Rive",
    concentracao: "EDT",
    descricao: "Fresco e especiado.",
    notas: ["bergamota", "pimenta"],
  },
  conselho: "Duas borrifadas no pescoço bastam.",
  alternativa: {
    nome: "Aventhis 2010",
    marca: "In The Box",
    descricao: "Abacaxi defumado.",
  },
}

function makeRequest(body: unknown, ip = "1.2.3.4") {
  return {
    headers: {
      get: (name: string) => {
        if (name === "x-forwarded-for") return ip
        if (name === "x-real-ip") return null
        return null
      },
    },
    async json() {
      return body
    },
  }
}

function makeRequestNoForwardedFor(body: unknown, realIp = "10.0.0.1") {
  return {
    headers: {
      get: (name: string) => {
        if (name === "x-forwarded-for") return null
        if (name === "x-real-ip") return realIp
        return null
      },
    },
    async json() {
      return body
    },
  }
}

function makeRequestBadJson() {
  return {
    headers: {
      get: (name: string) => (name === "x-forwarded-for" ? "9.9.9.1" : null),
    },
    async json() {
      throw new SyntaxError("Unexpected token")
    },
  }
}

describe("POST /api/consultor — validação de entrada", () => {
  beforeEach(() => {
    resetRateLimitStore()
    mockGerarRecomendacao.mockResolvedValue(RECOMENDACAO_MOCK)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("retorna 400 quando body é um objeto vazio", async () => {
    const req = makeRequest({})
    const res = await POST(req as ConsultorRequest)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.erro).toBeTruthy()
  })

  it("retorna 400 quando respostas é um array", async () => {
    const req = makeRequest({ respostas: [] })
    const res = await POST(req as ConsultorRequest)
    expect(res.status).toBe(400)
  })

  it("retorna 400 quando body não pode ser parseado como JSON", async () => {
    const req = makeRequestBadJson()
    const res = await POST(req as ConsultorRequest)
    expect(res.status).toBe(400)
  })

  it("retorna 200 e a recomendação quando respostas é válida (wrapper 'respostas')", async () => {
    const req = makeRequest({ respostas: { vibe: "fresco", faixaPreco: "medio" } }, "2.2.2.2")
    const res = await POST(req as ConsultorRequest)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.perfumePrincipal).toBeDefined()
    expect(json.perfumePrincipal.nome).toBe("Carbon")
  })

  it("aceita respostas diretamente no body (sem wrapper 'respostas')", async () => {
    const req = makeRequest({ vibe: "fresco" }, "3.3.3.3")
    const res = await POST(req as ConsultorRequest)
    expect(res.status).toBe(200)
  })

  it("retorna 500 quando gerarRecomendacao retorna null", async () => {
    mockGerarRecomendacao.mockResolvedValue(null)
    const req = makeRequest({ vibe: "fresco" }, "4.4.4.4")
    const res = await POST(req)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.erro).toBeTruthy()
  })

  it("chama gerarRecomendacao com as respostas corretas", async () => {
    const respostas = { vibe: "fresco", faixaPreco: "premium" }
    const req = makeRequest({ respostas }, "20.20.20.20")
    await POST(req as ConsultorRequest)
    expect(mockGerarRecomendacao).toHaveBeenCalledWith(respostas)
  })
})

describe("POST /api/consultor — rate limiting", () => {
  beforeEach(() => {
    resetRateLimitStore()
    mockGerarRecomendacao.mockResolvedValue(RECOMENDACAO_MOCK)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("permite até 10 requisições do mesmo IP e bloqueia a 11ª com 429", async () => {
    const ip = "5.5.5.5"
    const body = { vibe: "fresco", genero: "masculino" }

    // As 20 primeiras devem passar
    for (let i = 0; i < 20; i++) {
      const req = makeRequest(body, ip)
      const res = await POST(req as ConsultorRequest)
      expect(res.status).toBe(200)
    }

    // A 21ª deve ser bloqueada
    const req21 = makeRequest(body, ip)
    const res21 = await POST(req21)
    expect(res21.status).toBe(429)
    const json = await res21.json()
    expect(json.erro).toContain("Limite")
  })

  it("IPs diferentes não compartilham contador de rate limit", async () => {
    const body = { vibe: "fresco" }

    // Esgota o limite do IP A
    const ipA = "6.6.6.6"
    for (let i = 0; i < 20; i++) {
      await POST(makeRequest(body, ipA) as ConsultorRequest)
    }
    const resA = await POST(makeRequest(body, ipA) as ConsultorRequest)
    expect(resA.status).toBe(429)

    // IP B ainda deve funcionar
    const ipB = "7.7.7.7"
    const resB = await POST(makeRequest(body, ipB) as ConsultorRequest)
    expect(resB.status).toBe(200)
  })

  it("resposta 429 inclui mensagem de erro em português", async () => {
    const ip = "8.8.8.8"
    const body = { vibe: "fresco" }

    for (let i = 0; i < 20; i++) {
      await POST(makeRequest(body, ip) as ConsultorRequest)
    }

    const res = await POST(makeRequest(body, ip) as ConsultorRequest)
    const json = await res.json()
    expect(json.erro).toMatch(/hora|limite/i)
  })
})

describe("POST /api/consultor — extração de IP", () => {
  beforeEach(() => {
    resetRateLimitStore()
    mockGerarRecomendacao.mockResolvedValue(RECOMENDACAO_MOCK)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("usa x-forwarded-for quando presente", async () => {
    const req = makeRequest({ vibe: "fresco" }, "10.0.0.1")
    const res = await POST(req as ConsultorRequest)
    expect(res.status).toBe(200)
  })

  it("usa x-real-ip como fallback quando x-forwarded-for não está presente", async () => {
    const req = makeRequestNoForwardedFor({ vibe: "fresco" }, "10.0.0.99")
    const res = await POST(req as ConsultorRequest)
    expect(res.status).toBe(200)
  })
})

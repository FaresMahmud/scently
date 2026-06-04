// @jest-environment node
// Teste de contrato para app/api/scanner/route.ts — mock do Google Generative API

import { TextEncoder, TextDecoder } from "util"
global.TextEncoder = TextEncoder as typeof global.TextEncoder
// @ts-expect-error TextDecoder is assigned from util for Jest Node polyfill
global.TextDecoder = TextDecoder

// Mock minimal de next/server usado nos endpoints
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
    headers = {
      get: () => null,
    }
  }

  class MockNextResponse {
    public status: number
    private _body: unknown
    constructor(body: unknown, init: { status?: number } = {}) {
      this._body = body
      this.status = init.status ?? 200
    }
    async json() { return this._body }
    static json(body: unknown, init: { status?: number } = {}) { return new MockNextResponse(body, init) }
  }

  return { NextRequest: MockNextRequest, NextResponse: MockNextResponse }
})

// Mock do @google/generative-ai
const mockGenerateContent = jest.fn()
jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({ generateContent: mockGenerateContent })
  })),
  SchemaType: { OBJECT: "object", STRING: "string", ARRAY: "array", BOOLEAN: "boolean" }
}))

let POST: typeof import("@/app/api/scanner/route").POST

type ScannerRequest = Parameters<typeof POST>[0]

function makeReq(body: unknown, ip = "1.2.3.4") {
  return {
    headers: {
      get: (name: string) => (name === "x-forwarded-for" ? ip : null),
    },
    cookies: { get: () => undefined },
    async json() { return body }
  }
}

describe("POST /api/scanner (contrato)", () => {
  beforeAll(async () => {
    ;({ POST } = await import("@/app/api/scanner/route"))
  })

  afterEach(() => {
    jest.clearAllMocks()
    delete process.env.GEMINI_API_KEY
  })

  it("retorna 200 com resposta válida do Gemini", async () => {
    process.env.GEMINI_API_KEY = "teste"
    const geminiJson = JSON.stringify({
      found: true, name: "Perfume X", brand: "Marca Y", confidence: "high",
      notes: ["bergamot"], family: "fresh", occasions: ["diurno"], description: "descricao"
    })
    mockGenerateContent.mockResolvedValue({ response: { text: () => geminiJson } })

    const req = makeReq({ imageBase64: "aaa", mimeType: "image/jpeg" }, "9.9.9.9")
    const res = await POST(req as ScannerRequest)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.perfume).toBeDefined()
    expect(json.perfume.name).toBe("Perfume X")
  })

  it("retorna 422 quando Gemini retorna JSON inválido (parse fail)", async () => {
    process.env.GEMINI_API_KEY = "teste"
    mockGenerateContent.mockResolvedValue({ response: { text: () => "nota json" } })
    const req = makeReq({ imageBase64: "aaa", mimeType: "image/jpeg" }, "9.9.9.8")
    const res = await POST(req as ScannerRequest)
    expect(res.status).toBe(422)
  })

  it("retorna 502 quando Gemini retorna JSON fora do schema (zod fail)", async () => {
    process.env.GEMINI_API_KEY = "teste"
    // confidence inválida -> schema falhará
    const bad = JSON.stringify({ found: true, name: "X", brand: "Y", confidence: "weird", notes: [], family: "f", occasions: [], description: "d" })
    mockGenerateContent.mockResolvedValue({ response: { text: () => bad } })
    const req = makeReq({ imageBase64: "aaa", mimeType: "image/jpeg" }, "9.9.9.7")
    const res = await POST(req as ScannerRequest)
    expect(res.status).toBe(502)
  })

  it("retorna 503 quando GEMINI_API_KEY não está configurada", async () => {
    delete process.env.GEMINI_API_KEY
    const req = makeReq({ imageBase64: "aaa", mimeType: "image/jpeg" }, "9.9.9.6")
    const res = await POST(req as ScannerRequest)
    expect(res.status).toBe(503)
  })
})

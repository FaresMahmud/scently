// ============================================
// SCRIPT: scripts/seed-tendencias-editorial.ts
// O QUE FAZ: popula tendencias_editorial + sugestões com conteúdo curado,
//            resolvendo perfumeId contra o catálogo Fragella local
//            (mesma lógica de buscarPerfumePorSlug em lib/catalogoFragella.ts,
//             replicada aqui porque o módulo é server-only)
// COMO RODAR: npm run tendencias:editorial:seed
// DEPENDE DE: DATABASE_URL no .env.local, data/catalogo-fragella.json
// ============================================

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs") as typeof import("fs")
const path = require("path") as typeof import("path")

// ── Carrega .env.local ───────────────────────────────────────────────────────
const envPath = path.join(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8")
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^#\s][^=]*)=(.*)$/)
    if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "")
  }
}

import { db } from "@/lib/db"
import { slugify } from "@/lib/utils"

// ── Catálogo Fragella local ──────────────────────────────────────────────────

interface PerfumeCatalogo { id: string; nome: string; marca: string }

function carregarCatalogo(): PerfumeCatalogo[] {
  const caminho = path.join(process.cwd(), "data", "catalogo-fragella.json")
  const data = JSON.parse(fs.readFileSync(caminho, "utf-8"))
  return Array.isArray(data.perfumes) ? data.perfumes : []
}

// Correções manuais — casos onde o match automático erra ou acerta o flanker errado.
// null = original não existe no catálogo; mostrar como texto, sem link.
const OVERRIDES: Record<string, string | null> = {
  // prefix-match pegava o flanker "Le Parfum"; a versão base existe
  "la nuit de l'homme|yves saint laurent": "la-nuit-de-l-homme-yves-saint-laurent-yves-saint-laurent",
  // apostrofe em L'Homme — slug canônico inclui marca duplicada
  "l'homme yves saint laurent|yves saint laurent": "l-homme-yves-saint-laurent-yves-saint-laurent",
  // só existem flankers (Discover Vulcano etc.) — link errado é pior que nenhum
  "light blue pour homme|dolce & gabbana": null,
  // catálogo tem Elixir/Night/Absolu etc., mas não o Parfum
  "boss bottled parfum|hugo boss": null,
  // base feminina — ID canônico com prefixo "D & G"
  "light blue|dolce & gabbana": "d-g-light-blue-dolce-gabbana",
  // base unissex — ID canônico simples
  "l'eau d'issey|issey miyake": "l-eau-d-issey-issey-miyake",
  // Chanel Bleu — slug curto é o canônico
  "bleu de chanel|chanel": "bleu-de-chanel-chanel",
  // Acqua di Giò base masculino
  "acqua di giò|giorgio armani": "acqua-di-gio-giorgio-armani",
}

/** Mesma cascata de buscarPerfumePorSlug: id → nome+marca → prefixo → palavras */
function resolverPerfumeId(catalogo: PerfumeCatalogo[], nome: string, marca: string): string | null {
  const chave = `${nome.toLowerCase()}|${marca.toLowerCase()}`
  if (chave in OVERRIDES) return OVERRIDES[chave]

  const slug = slugify(`${nome} ${marca}`)

  const porId = catalogo.find(p => p.id === slug)
  if (porId) return porId.id

  const porNomeMarca = catalogo.find(p => {
    const s1 = `${slugify(p.nome)}-${slugify(p.marca)}`
    const s2 = `${slugify(p.marca)}-${slugify(p.nome)}`
    return s1 === slug || s2 === slug
  })
  if (porNomeMarca) return porNomeMarca.id

  const porPrefixo = catalogo.find(p => {
    const textoP = slugify(`${p.nome} ${p.marca}`)
    return textoP === slug || textoP.startsWith(slug + "-")
  })
  if (porPrefixo) return porPrefixo.id

  const palavras = slug.split("-").filter(p => p.length > 2)
  if (palavras.length > 0) {
    const candidatos = catalogo.filter(p => {
      const textoP = slugify(`${p.nome} ${p.marca}`)
      return palavras.every(palavra => textoP.includes(palavra))
    })
    if (candidatos.length > 0) {
      candidatos.sort((a, b) =>
        slugify(`${a.nome} ${a.marca}`).length - slugify(`${b.nome} ${b.marca}`).length
      )
      return candidatos[0].id
    }
  }

  return null
}

// ── Conteúdo curado ──────────────────────────────────────────────────────────

interface Sugestao { genero: "masculino" | "feminino" | "unissex"; papel?: "base" | "topo"; nome: string; marca: string }
interface Entrada  { titulo: string; descricao: string; sugestoes: Sugestao[] }

const CONTEUDO: Record<string, Entrada[]> = {
  inverno: [
    {
      titulo: "Amadeirados que aquecem",
      descricao: "Cedro, sândalo e couro ganham espaço nos dias frios, trazendo profundidade e fixação maior na pele.",
      sugestoes: [
        { genero: "masculino", nome: "Dior Homme Intense", marca: "Dior" },
        { genero: "feminino",  nome: "Coco Mademoiselle",  marca: "Chanel" },
      ],
    },
    {
      titulo: "Soft power: oud discreto",
      descricao: "Em vez de projeção avassaladora, fragrâncias com oud e almíscar ficam mais próximas da pele. Luxo silencioso.",
      sugestoes: [
        { genero: "unissex",  nome: "Oud Wood",     marca: "Tom Ford" },
        { genero: "feminino", nome: "Black Orchid", marca: "Tom Ford" },
      ],
    },
    {
      titulo: "Especiarias quentes",
      descricao: "Cardamomo, gengibre e canela em composições que lembram bebidas quentes de inverno.",
      sugestoes: [
        { genero: "masculino", nome: "La Nuit de L'Homme", marca: "Yves Saint Laurent" },
        { genero: "feminino",  nome: "Libre",              marca: "Yves Saint Laurent" },
      ],
    },
  ],
  primavera: [
    {
      titulo: "Florais que respiram",
      descricao: "Jasmim e flores brancas em versões mais leves devem dominar os lançamentos da próxima estação.",
      sugestoes: [
        { genero: "feminino",  nome: "J'adore",                    marca: "Dior" },
        { genero: "masculino", nome: "L'Homme Yves Saint Laurent", marca: "Yves Saint Laurent" },
      ],
    },
    {
      titulo: "Frescor quente",
      descricao: "Composições que misturam notas cítricas com madeiras quentes. O contraste vira assinatura.",
      sugestoes: [
        { genero: "masculino", nome: "Bleu de Chanel",    marca: "Chanel" },
        { genero: "feminino",  nome: "Chance Eau Tendre", marca: "Chanel" },
      ],
    },
    {
      titulo: "Acordes inesperados",
      descricao: "Notas marinhas e frutadas incomuns, como melão e maresia, fogem do floral tradicional e ganham espaço.",
      sugestoes: [
        { genero: "feminino", nome: "Light Blue",     marca: "Dolce & Gabbana" },
        { genero: "unissex",  nome: "L'Eau d'Issey",  marca: "Issey Miyake"    },
      ],
    },
  ],
  global: [
    {
      titulo: "Scent stacking ganha força",
      descricao: "Em vez de um perfume só, combine camadas. Um amadeirado por baixo, um cítrico por cima — a combinação fica única.",
      sugestoes: [
        { genero: "masculino", papel: "base", nome: "Bleu de Chanel",  marca: "Chanel" },
        { genero: "masculino", papel: "topo", nome: "Acqua di Giò",    marca: "Giorgio Armani" },
      ],
    },
    {
      titulo: "Nicho em ascensão",
      descricao: "Casas jovens como a Xerjoff usam ingredientes raros e frascos quase artísticos. Menos sobre seguir tendência, mais sobre causar impressão.",
      sugestoes: [
        { genero: "unissex", nome: "Erba Gold", marca: "Xerjoff" },
      ],
    },
    {
      titulo: "Brasil na conversa global",
      descricao: "O país já é o terceiro maior consumidor e lançador de perfumes do mundo. Tendências daqui também influenciam o mercado internacional.",
      sugestoes: [],
    },
  ],
}

// ── Seed ─────────────────────────────────────────────────────────────────────

async function main() {
  const catalogo = carregarCatalogo()
  console.log(`Catálogo carregado: ${catalogo.length} perfumes\n`)

  const resumo: Array<{ titulo: string; sugestao: string; perfumeId: string }> = []

  for (const [categoria, entradas] of Object.entries(CONTEUDO)) {
    for (let i = 0; i < entradas.length; i++) {
      const entrada = entradas[i]
      const ordem = i + 1

      const editorial = await db.tendenciaEditorial.upsert({
        where:  { categoria_ordem: { categoria, ordem } },
        update: { titulo: entrada.titulo, descricao: entrada.descricao },
        create: { categoria, ordem, titulo: entrada.titulo, descricao: entrada.descricao },
      })

      // Recria sugestões do zero — seed é idempotente
      await db.tendenciaEditorialSugestao.deleteMany({ where: { editorialId: editorial.id } })

      for (const s of entrada.sugestoes) {
        const perfumeId = resolverPerfumeId(catalogo, s.nome, s.marca)
        await db.tendenciaEditorialSugestao.create({
          data: {
            editorialId: editorial.id,
            genero: s.genero,
            papel:  s.papel ?? null,
            nome:   s.nome,
            marca:  s.marca,
            perfumeId,
          },
        })
        resumo.push({
          titulo: `[${categoria}] ${entrada.titulo}`,
          sugestao: `${s.nome} (${s.marca})`,
          perfumeId: perfumeId ?? "não encontrado",
        })
      }
    }
  }

  console.log("Resolução das sugestões:\n")
  console.table(resumo)

  // Remove any rows beyond the 3 kept per category (idempotent cleanup)
  for (const categoria of Object.keys(CONTEUDO)) {
    const deleted = await db.tendenciaEditorial.deleteMany({
      where: { categoria, ordem: { gt: 3 } },
    })
    if (deleted.count > 0) console.log(`Removidas ${deleted.count} entrada(s) extras de [${categoria}]`)
  }

  const total = await db.tendenciaEditorial.count()
  const totalSug = await db.tendenciaEditorialSugestao.count()
  console.log(`\nTotal: ${total} entradas editoriais, ${totalSug} sugestões`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())

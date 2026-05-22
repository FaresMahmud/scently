// ============================================
// ARQUIVO: app/marca/[slug]/page.tsx
// O QUE FAZ: exibe todos os perfumes de uma marca, enriquecidos com dados reais da Fragella
// QUANDO MANDAR PRA IA: quando quiser mudar o layout da página de marca
// DEPENDE DE: EbayPerfumeRepository, ContratipoRepository, mockData, fragella, lib/utils
// ============================================

import type { Metadata } from "next"
import Link from "next/link"
import { ebayRepository } from "@/lib/repositories/EbayPerfumeRepository"
import { contratipoRepository } from "@/lib/repositories/ContratipoRepository"
import { PERFUMES_MOCK } from "@/lib/mockData"
import { buscarPorMarca } from "@/lib/fragella"
import type { PerfumeFragella } from "@/lib/fragella"
import { slugify } from "@/lib/utils"
import CardPerfume from "@/components/perfume/CardPerfume"
import type { DadosCardPerfume } from "@/components/perfume/CardPerfume"

// ISR: revalida a cada 24h para pegar novos dados da Fragella
export const revalidate = 86400

// Monta a lista de perfumes locais (eBay + contratipos + mock)
function coletarPerfumesLocais(slug: string): { perfumes: DadosCardPerfume[]; nomeMarca: string } {
  const lista: DadosCardPerfume[] = []

  for (const p of ebayRepository.findAll()) {
    if (slugify(p.marca) === slug) {
      lista.push({
        id: `${ebayRepository.toSlug(p.titulo, p.marca)}-ebay`,
        nome: p.titulo,
        marca: p.marca,
        concentracao: p.tipo,
        familia: p.genero,
      })
    }
  }

  for (const p of contratipoRepository.findAll()) {
    if (slugify(p.marca) === slug) {
      lista.push({
        id: `${p.id}-ct`,
        nome: p.nome,
        marca: p.marca,
        concentracao: p.tipo,
        familia: p.genero,
        notas: p.notas,
      })
    }
  }

  for (const p of PERFUMES_MOCK) {
    if (slugify(p.marca) === slug) {
      lista.push({
        id: p.id,
        nome: p.nome,
        marca: p.marca,
        concentracao: p.concentracao ?? undefined,
        familia: p.familia ?? undefined,
        imagem: p.imagem ?? undefined,
      })
    }
  }

  return { perfumes: lista, nomeMarca: lista[0]?.marca ?? "" }
}

// Enriquece os perfumes locais com imagens, notas e rating da Fragella;
// adiciona perfumes da Fragella que não existem localmente
function enriquecerComFragella(locais: DadosCardPerfume[], fragella: PerfumeFragella[]): DadosCardPerfume[] {
  const fragellaMap = new Map(fragella.map(p => [p.nome.toLowerCase(), p]))
  const nomesLocais = new Set(locais.map(p => p.nome.toLowerCase()))

  // Enriquece locais
  const enriquecidos = locais.map(local => {
    const f = fragellaMap.get(local.nome.toLowerCase())
    if (!f) return local
    return {
      ...local,
      imagem: f.imagemTransparente || f.imagem || local.imagem,
      notas: f.notasTopo.length ? f.notasTopo : local.notas,
      familia: f.familia || local.familia,
      rating: f.rating,
    }
  })

  // Adiciona perfumes exclusivos da Fragella (não presentes localmente)
  const extras: DadosCardPerfume[] = fragella
    .filter(f => !nomesLocais.has(f.nome.toLowerCase()))
    .map(f => ({
      id: f.id,
      nome: f.nome,
      marca: f.marca,
      concentracao: f.concentracao,
      familia: f.familia,
      imagem: f.imagemTransparente || f.imagem,
      notas: f.notasTopo,
      rating: f.rating,
    }))

  return [...enriquecidos, ...extras]
}

export function generateStaticParams() {
  const slugs = new Set<string>()
  for (const p of ebayRepository.findAll()) slugs.add(slugify(p.marca))
  for (const p of contratipoRepository.findAll()) slugs.add(slugify(p.marca))
  for (const p of PERFUMES_MOCK) slugs.add(slugify(p.marca))
  return Array.from(slugs).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const { nomeMarca, perfumes } = coletarPerfumesLocais(slug)
  if (!nomeMarca) return { title: "Marca não encontrada" }
  return {
    title: `${nomeMarca} — ${perfumes.length} fragrâncias`,
    description: `Explore todas as fragrâncias ${nomeMarca} disponíveis no catálogo Scently.`,
  }
}

export default async function PaginaMarca({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { perfumes: locais, nomeMarca } = coletarPerfumesLocais(slug)

  if (!nomeMarca || locais.length === 0) {
    return (
      <main className="container-site" style={{ paddingTop: "5rem", paddingBottom: "5rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--cor-texto-suave)", marginBottom: "1rem" }}>
          404
        </p>
        <h1 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, marginBottom: "1rem" }}>
          Marca não encontrada
        </h1>
        <p style={{ marginBottom: "2rem" }}>Nenhuma fragrância encontrada para esta marca.</p>
        <Link href="/catalogo" style={{ color: "var(--cor-destaque)", fontFamily: "var(--fonte-corpo)", fontSize: "0.875rem" }}>
          ← Explorar catálogo
        </Link>
      </main>
    )
  }

  // Enriquece com Fragella — pula durante o build para evitar 429 em massa
  // Em runtime (ISR revalidation), os dados reais são buscados
  let perfumes = locais
  const isBuild = process.env.NEXT_PHASE === "phase-production-build"

  if (!isBuild && process.env.FRAGELLA_API_KEY) {
    const fragella = await buscarPorMarca(nomeMarca, 20).catch(() => [])
    if (fragella.length > 0) {
      perfumes = enriquecerComFragella(locais, fragella)
    }
  }

  return (
    <main>
      <div className="container-site" style={{ paddingTop: "4rem", paddingBottom: "5rem" }}>

        {/* Header da marca */}
        <section style={{ marginBottom: "3rem" }}>
          <p style={{ fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--cor-texto-suave)", marginBottom: "0.75rem" }}>
            marca
          </p>
          <h1 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "clamp(2.5rem, 6vw, 4rem)", lineHeight: 1 }}>
            {nomeMarca}
          </h1>
          <div className="separador" />
          <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.9rem", color: "var(--cor-texto-suave)" }}>
            {perfumes.length.toLocaleString("pt-BR")}{" "}
            {perfumes.length === 1 ? "fragrância" : "fragrâncias"} no catálogo
          </p>
        </section>

        {/* Grid de perfumes */}
        <section>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1.25rem" }}>
            {perfumes.map((p) => (
              <CardPerfume key={p.id} perfume={p} />
            ))}
          </div>
        </section>

      </div>
    </main>
  )
}

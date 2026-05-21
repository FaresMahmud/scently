// ============================================
// ARQUIVO: app/marca/[slug]/page.tsx
// O QUE FAZ: exibe todos os perfumes de uma marca específica
// QUANDO MANDAR PRA IA: quando quiser mudar o layout da página de marca
// DEPENDE DE: EbayPerfumeRepository, ContratipoRepository, mockData, lib/utils
// ============================================

import type { Metadata } from "next"
import Link from "next/link"
import { ebayRepository } from "@/lib/repositories/EbayPerfumeRepository"
import { contratipoRepository } from "@/lib/repositories/ContratipoRepository"
import { PERFUMES_MOCK } from "@/lib/mockData"
import { slugify } from "@/lib/utils"
import CardPerfume from "@/components/perfume/CardPerfume"
import type { DadosCardPerfume } from "@/components/perfume/CardPerfume"

function coletarPerfumesDaMarca(slug: string): { perfumes: DadosCardPerfume[]; nomeMarca: string } {
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

  const nomeMarca = lista[0]?.marca ?? ""
  return { perfumes: lista, nomeMarca }
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
  const { nomeMarca, perfumes } = coletarPerfumesDaMarca(slug)
  if (!nomeMarca) return { title: "Marca não encontrada" }
  return {
    title: `${nomeMarca} — ${perfumes.length} fragrâncias`,
    description: `Explore todas as fragrâncias ${nomeMarca} disponíveis no catálogo Scently.`,
  }
}

export default async function PaginaMarca({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { perfumes, nomeMarca } = coletarPerfumesDaMarca(slug)

  if (!nomeMarca || perfumes.length === 0) {
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

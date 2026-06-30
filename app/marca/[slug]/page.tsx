// ============================================
// ARQUIVO: app/marca/[slug]/page.tsx
// O QUE FAZ: exibe todos os perfumes de uma marca
//   Fontes: contratipos.json + perfumes-expandido.json + catalogo-fragella.json
// QUANDO MANDAR PRA IA: quando quiser mudar o layout da página de marca
// DEPENDE DE: data/*.json, lib/catalogoFragella, lib/utils
// ============================================

import type { Metadata } from "next"
import Link from "next/link"
import contratiposData from "@/data/contratipos.json"
import expandidoData from "@/data/perfumes-expandido.json"
import { carregarCatalogo } from "@/lib/catalogoFragella"
import { slugify } from "@/lib/utils"
import { limparNomePerfume } from "@/lib/limparNomePerfume"
import CardPerfume from "@/components/perfume/CardPerfume"
import type { DadosCardPerfume } from "@/components/perfume/CardPerfume"

export const revalidate = 86400

// ── Tipos locais ──────────────────────────────────────────────────────────────

interface ContratipoEntry {
  id: string; nome: string; marca: string; tipo: string; genero: string
  familia: string; notas: string[]; preco_brl: number
  inspiradoEm: string; marcaOriginal: string; categoria: string
}

interface ExpandidoEntry {
  id: string; nome: string; marca: string; tipo: string; genero: string
  familia: string; notas: string[] | { topo?: string[]; coracao?: string[]; fundo?: string[] }; preco_brl: number
  categoria: string; inspiradoEm?: string; marcaOriginal?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Resolve o nome original da marca a partir do slug — busca em todas as fontes */
function resolverNomeMarca(slug: string): string {
  for (const p of contratiposData as ContratipoEntry[]) {
    if (slugify(p.marca) === slug) return p.marca
  }
  for (const p of expandidoData as ExpandidoEntry[]) {
    if (slugify(p.marca) === slug) return p.marca
  }
  for (const p of carregarCatalogo()) {
    if (slugify(p.marca) === slug) return p.marca
  }
  return ""
}

/** Coleta todos os perfumes de uma marca nas três fontes */
function coletarPerfumesDaMarca(slug: string): DadosCardPerfume[] {
  const lista: DadosCardPerfume[] = []
  const vistosId = new Set<string>()

  for (const p of contratiposData as ContratipoEntry[]) {
    if (slugify(p.marca) !== slug) continue
    if (vistosId.has(p.id)) continue
    vistosId.add(p.id)
    lista.push({
      id:           p.id,
      nome:         limparNomePerfume(p.nome, p.marca),
      marca:        p.marca,
      concentracao: p.tipo,
      familia:      p.familia,
      notas:        p.notas,
    })
  }

  for (const p of expandidoData as ExpandidoEntry[]) {
    if (slugify(p.marca) !== slug) continue
    if (vistosId.has(p.id)) continue
    vistosId.add(p.id)
    const notasEx: string[] = Array.isArray(p.notas)
      ? p.notas
      : [...(p.notas.topo ?? []), ...(p.notas.coracao ?? []), ...(p.notas.fundo ?? [])]
    lista.push({
      id:           p.id,
      nome:         limparNomePerfume(p.nome, p.marca),
      marca:        p.marca,
      concentracao: p.tipo,
      familia:      p.familia,
      notas:        notasEx,
    })
  }

  for (const p of carregarCatalogo()) {
    if (slugify(p.marca) !== slug) continue
    if (vistosId.has(p.id)) continue
    vistosId.add(p.id)
    lista.push({
      id:           p.id,
      nome:         limparNomePerfume(p.nome, p.marca),
      marca:        p.marca,
      concentracao: p.concentracao || undefined,
      familia:      p.familia || undefined,
      imagem:       p.imagemTransparente || p.imagem || undefined,
      notas:        p.notasTopo ?? [],
      rating:       p.rating ?? undefined,
    })
  }

  return lista
}

// ── Static params ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  const slugs = new Set<string>()
  for (const p of contratiposData as ContratipoEntry[]) slugs.add(slugify(p.marca))
  for (const p of expandidoData as ExpandidoEntry[])   slugs.add(slugify(p.marca))
  for (const p of carregarCatalogo())                  slugs.add(slugify(p.marca))
  return Array.from(slugs).map(slug => ({ slug }))
}

// ── Metadata ──────────────────────────────────────────────────────────────────

const BASE_URL = "https://nozze.app"

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const nome = resolverNomeMarca(slug)
  if (!nome) return { title: "Marca não encontrada" }

  const perfumes  = coletarPerfumesDaMarca(slug)
  const url       = `${BASE_URL}/marca/${slug}`
  const titulo    = `${nome} — Fragrâncias | Nozze`
  const descricao = `Explore ${perfumes.length > 0 ? perfumes.length + " " : ""}fragrâncias da ${nome} no Nozze.`

  return {
    title: titulo,
    description: descricao,
    keywords: `${nome}, perfumes ${nome}, fragrâncias ${nome}`,
    alternates: { canonical: url },
    openGraph: {
      title:       `${nome} — Fragrâncias`,
      description: descricao,
      url,
      siteName:    "Nozze",
      locale:      "pt_BR",
      type:        "website",
    },
    twitter: {
      card:        "summary",
      title:       `${nome} — Fragrâncias`,
      description: descricao,
    },
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PaginaMarca(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug }  = await params
  const nomeMarca = resolverNomeMarca(slug)

  if (!nomeMarca) {
    return (
      <main className="container-site" style={{ paddingTop: "5rem", paddingBottom: "5rem", textAlign: "center" }}>
        <p style={{
          fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase",
          color: "var(--cor-texto-suave)", marginBottom: "1rem",
        }}>
          404
        </p>
        <h1 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, marginBottom: "1rem" }}>
          Marca não encontrada
        </h1>
        <p style={{ marginBottom: "34px" }}>Nenhuma fragrância encontrada para esta marca.</p>
        <Link href="/catalogo" style={{
          color: "var(--cor-destaque)", fontFamily: "var(--fonte-corpo)", fontSize: "0.875rem",
        }}>
          ← Explorar catálogo
        </Link>
      </main>
    )
  }

  const perfumes = coletarPerfumesDaMarca(slug)

  return (
    <main>
      <div className="container-site" style={{ paddingTop: "55px", paddingBottom: "89px" }}>

        {/* Header da marca */}
        <section style={{ marginBottom: "34px" }}>
          <p style={{
            fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase",
            color: "var(--cor-texto-suave)", marginBottom: "0.75rem",
          }}>
            marca
          </p>
          <h1 style={{
            fontFamily: "var(--fonte-titulo)", fontWeight: 300,
            fontSize: "clamp(42px, 6vw, 68px)", lineHeight: 1,
          }}>
            {nomeMarca}
          </h1>
          <div className="separador" />
          <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.9rem", color: "var(--cor-texto-suave)" }}>
            {perfumes.length.toLocaleString("pt-BR")}{" "}
            {perfumes.length === 1 ? "fragrância" : "fragrâncias"} no catálogo
          </p>
        </section>

        {/* Grid */}
        {perfumes.length > 0 ? (
          <section>
            <div className="perfumes-grid">
              {perfumes.map(p => (
                <CardPerfume key={p.id} perfume={p} />
              ))}
            </div>
          </section>
        ) : (
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <p style={{
              fontFamily: "var(--fonte-titulo)", fontSize: "26px", fontWeight: 300,
              color: "var(--cor-texto-suave)", marginBottom: "21px",
            }}>
              Nenhuma fragrância encontrada para esta marca.
            </p>
            <Link href="/catalogo" style={{
              color: "var(--cor-destaque)", fontFamily: "var(--fonte-corpo)", fontSize: "0.875rem",
            }}>
              ← Explorar catálogo
            </Link>
          </div>
        )}

      </div>
    </main>
  )
}

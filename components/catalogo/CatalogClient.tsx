// ============================================
// ARQUIVO: components/catalogo/CatalogClient.tsx
// O QUE FAZ: catálogo interativo com busca, filtros, ordenação e scroll infinito
// QUANDO MANDAR PRA IA: quando quiser mudar filtros, layout ou comportamento do catálogo
// DEPENDE DE: components/perfume/CardPerfume.tsx
// ============================================

"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import CardPerfume from "@/components/perfume/CardPerfume"
import type { DadosCardPerfume } from "@/components/perfume/CardPerfume"
import { familiaParaIngles } from "@/lib/utils"

const PAGE_SIZE = 48

type Genero    = "Masculino" | "Feminino" | "Unissex"
type Categoria = "contratipo" | "nacional" | "arabe" | "importado-designer"
type Ordenacao = "relevancia" | "menor-preco" | "maior-preco" | "az"
export type FontePerfume = "contratipo" | "expandido" | "fragella"

export interface CardUnificado extends DadosCardPerfume {
  preco_brl?:      number
  vendidos?:       number
  inspiracaoInfo?: string
  categoria?:      string
  generoNorm?:     Genero
  fonte?:          FontePerfume
  acordes?:        string[]
}

// ── Pill ─────────────────────────────────────────────────────────────────────

function Pill({ label, ativo, onClick }: { label: string; ativo: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setHovered(false)}
      style={{
        fontFamily:    "var(--fonte-corpo)",
        fontSize:      "0.75rem",
        letterSpacing: "0.08em",
        padding:       "0 13px",
        minHeight:     "44px",
        borderRadius:  "99px",
        cursor:        "pointer",
        background:    ativo ? "rgba(196, 113, 74, 0.08)" : "transparent",
        color:         ativo ? "var(--cor-destaque)" : "var(--cor-texto-suave)",
        border:        ativo
          ? "1px solid var(--cor-destaque)"
          : hovered
          ? "1px solid var(--cor-texto-suave)"
          : "1px solid var(--cor-borda)",
        transition: "border-color 0.15s, background 0.15s, color 0.15s",
        whiteSpace: "nowrap" as const,
      }}
    >
      {label}
    </button>
  )
}

// ── Utils ─────────────────────────────────────────────────────────────────────

function normalizar(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
}

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]
}

/**
 * Interleave: mistura categorias proporcionalmente na ordenação por relevância.
 * Padrão por 10 itens: 3 contratipo + 2 nacional + 2 arabe + 3 importado.
 * Quando um balde esgota, os demais preenchem o espaço restante.
 */
function interleaveCategories(lista: CardUnificado[]): CardUnificado[] {
  const buckets: Record<string, CardUnificado[]> = {
    "contratipo":         [],
    "nacional":           [],
    "arabe":              [],
    "importado-designer": [],
    "__other":            [],
  }
  for (const p of lista) {
    const cat = p.categoria ?? "__other"
    ;(buckets[cat] ?? buckets["__other"]).push(p)
  }

  // Per 10 items: 3 ct + 2 nac + 2 ara + 3 imp
  const pattern = [
    "contratipo", "importado-designer", "nacional",
    "contratipo", "importado-designer", "arabe",
    "contratipo", "importado-designer", "nacional",
    "importado-designer",
  ]

  const ptrs: Record<string, number> = Object.fromEntries(Object.keys(buckets).map(k => [k, 0]))
  const result: CardUnificado[] = []

  while (result.length < lista.length) {
    let added = false
    for (const cat of pattern) {
      const bucket = buckets[cat] ?? buckets["__other"]
      const ptr    = ptrs[cat] ?? 0
      if (ptr < bucket.length) {
        result.push(bucket[ptr])
        ptrs[cat] = ptr + 1
        added = true
        if (result.length >= lista.length) break
      }
    }
    if (!added) break
  }

  // Flush any remaining from all buckets (preserves order within each bucket)
  for (const [cat, bucket] of Object.entries(buckets)) {
    while ((ptrs[cat] ?? 0) < bucket.length && result.length < lista.length) {
      result.push(bucket[ptrs[cat]++])
    }
  }

  return result
}

// Mapeamento categoria → label de exibição
const CATEGORIA_LABELS: Record<Categoria, string> = {
  "contratipo":         "Contratipo",
  "nacional":           "Nacional",
  "arabe":              "Árabe",
  "importado-designer": "Importado",
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  perfumes: CardUnificado[]
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function CatalogClient({ perfumes }: Props) {
  // useSearchParams removido — causava DehydratedFragment (Suspense + Next.js 15 Turbopack
  // não agendava hydration). Filtros agora iniciam vazios; URL-sharing de filtros
  // pode ser re-adicionado com router.push quando necessário.
  const [busca,        setBusca]        = useState("")
  const [familiaAtiva, setFamiliaAtiva] = useState("")
  const [generos,      setGeneros]      = useState<Genero[]>([])
  const [categorias,   setCategorias]   = useState<Categoria[]>([])
  const [ordenacao,    setOrdenacao]    = useState<Ordenacao>("relevancia")
  const [limite,       setLimite]       = useState(PAGE_SIZE)
  const sentinelaRef                    = useRef<HTMLDivElement>(null)

  // Filtra + ordena
  const resultados = useMemo(() => {
    let lista = perfumes.filter(p => {
      // Busca por texto — todas as palavras devem aparecer
      if (busca.trim()) {
        const palavras = normalizar(busca).split(/\s+/).filter(Boolean)
        const texto = normalizar(
          [p.nome, p.marca, p.concentracao, p.familia, p.inspiracaoInfo, ...(p.notas ?? [])]
            .filter(Boolean).join(" ")
        )
        if (!palavras.every(w => texto.includes(w))) return false
      }
      // Filtro de família olfativa
      if (familiaAtiva) {
        const f       = normalizar(familiaAtiva)
        const termosEN = familiaParaIngles[f] ?? [f]
        const familia  = normalizar(p.familia ?? "")
        const acordes  = (p.acordes ?? []).map(a => normalizar(a))
        const bate     = termosEN.some(t => familia.includes(t) || acordes.some(a => a.includes(t)))
        if (!bate) return false
      }
      // Filtro de gênero
      if (generos.length > 0) {
        if (!p.generoNorm || !generos.includes(p.generoNorm)) return false
      }
      // Filtro de categoria
      if (categorias.length > 0) {
        if (!p.categoria || !categorias.includes(p.categoria as Categoria)) return false
      }
      return true
    })

    switch (ordenacao) {
      case "relevancia":  lista = interleaveCategories(lista); break
      case "menor-preco": lista = [...lista].sort((a, b) => (a.preco_brl ?? 0) - (b.preco_brl ?? 0)); break
      case "maior-preco": lista = [...lista].sort((a, b) => (b.preco_brl ?? 0) - (a.preco_brl ?? 0)); break
      case "az":          lista = [...lista].sort((a, b) => (a.nome ?? "").localeCompare(b.nome ?? "", "pt-BR")); break
    }

    return lista
  }, [perfumes, busca, familiaAtiva, generos, categorias, ordenacao])

  // Reinicia paginação quando filtros mudam
  useEffect(() => {
    setLimite(PAGE_SIZE)
  }, [busca, familiaAtiva, generos, categorias, ordenacao])

  // Scroll infinito
  useEffect(() => {
    if (limite >= resultados.length) return
    const el = sentinelaRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setLimite(prev => prev + PAGE_SIZE) },
      { rootMargin: "300px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [limite, resultados.length])

  function limparFiltros() {
    setBusca("")
    setFamiliaAtiva("")
    setGeneros([])
    setCategorias([])
    setOrdenacao("relevancia")
  }

  const temFiltros = busca || familiaAtiva || generos.length > 0 || categorias.length > 0
  const visiveis   = resultados.slice(0, limite)
  const temMais    = limite < resultados.length

  return (
    <>
      {/* Busca */}
      <div style={{ position: "relative", marginBottom: "21px" }}>
        <input
          type="text"
          placeholder="Buscar por nome, marca, nota ou família..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{
            width:           "100%",
            fontFamily:      "var(--fonte-corpo)",
            fontSize:        "1rem", // ≥16px — evita zoom-on-focus no iOS Safari
            color:           "var(--cor-texto)",
            backgroundColor: "var(--cor-card)",
            border:          "1px solid var(--cor-borda)",
            borderRadius:    "var(--raio-borda-suave)",
            padding:         "0 21px",
            height:          "44px",
            boxSizing:       "border-box",
          }}
        />
        {busca && (
          <button
            onClick={() => setBusca("")}
            style={{
              position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer",
              color: "var(--cor-texto-suave)", fontSize: "1rem", lineHeight: 1,
              minHeight: "44px", minWidth: "44px", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Badge de família ativa */}
      {familiaAtiva && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "13px" }}>
          <span style={{
            fontFamily: "var(--fonte-corpo)", fontSize: "0.75rem", letterSpacing: "0.08em",
            padding: "0.35rem 0.9rem", borderRadius: "99px",
            background: "rgba(196, 113, 74, 0.08)", color: "var(--cor-destaque)",
            border: "1px solid var(--cor-destaque)",
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
          }}>
            Família: {familiaAtiva.charAt(0).toUpperCase() + familiaAtiva.slice(1)}
            <button
              onClick={() => setFamiliaAtiva("")}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--cor-destaque)", fontSize: "1rem", lineHeight: 1, padding: 0,
                minHeight: "44px", minWidth: "44px", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              ×
            </button>
          </span>
        </div>
      )}

      {/* Pills — gênero */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
        {(["Masculino", "Feminino", "Unissex"] as Genero[]).map(g => (
          <Pill key={g} label={g} ativo={generos.includes(g)} onClick={() => setGeneros(toggle(generos, g))} />
        ))}
        <div style={{ width: "1px", backgroundColor: "var(--cor-borda)", margin: "0 4px", alignSelf: "stretch" }} />
        {(Object.entries(CATEGORIA_LABELS) as [Categoria, string][]).map(([val, label]) => (
          <Pill key={val} label={label} ativo={categorias.includes(val)} onClick={() => setCategorias(toggle(categorias, val))} />
        ))}
      </div>

      {/* Pills — ordenação + contador */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", marginBottom: "34px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {([
            { valor: "relevancia",  label: "Relevância" },
            { valor: "menor-preco", label: "Menor preço" },
            { valor: "maior-preco", label: "Maior preço" },
            { valor: "az",          label: "A → Z" },
          ] as { valor: Ordenacao; label: string }[]).map(({ valor, label }) => (
            <Pill key={valor} label={label} ativo={ordenacao === valor} onClick={() => setOrdenacao(valor)} />
          ))}
        </div>
        <p style={{
          marginLeft: "auto", fontFamily: "var(--fonte-corpo)",
          fontSize: "0.8rem", color: "var(--cor-texto-suave)",
        }}>
          {visiveis.length.toLocaleString("pt-BR")} / {resultados.length.toLocaleString("pt-BR")} fragrâncias
        </p>
      </div>

      {/* Grid */}
      {resultados.length > 0 ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "21px" }}>
            {visiveis.map(perfume => (
              <div key={perfume.id}>
                <CardPerfume perfume={perfume} />
                {perfume.inspiracaoInfo && (
                  <p style={{
                    fontFamily: "var(--fonte-corpo)", fontSize: "0.68rem",
                    color: "var(--cor-destaque)", letterSpacing: "0.04em",
                    marginTop: "0.4rem", paddingLeft: "0.1rem", opacity: 0.85,
                  }}>
                    {perfume.inspiracaoInfo}
                  </p>
                )}
              </div>
            ))}
          </div>

          {temMais && <div ref={sentinelaRef} style={{ height: "1px", marginTop: "2rem" }} />}
          {temMais && (
            <p style={{
              textAlign: "center", fontFamily: "var(--fonte-corpo)",
              fontSize: "0.8rem", color: "var(--cor-texto-suave)",
              marginTop: "1.5rem", opacity: 0.6,
            }}>
              Carregando mais…
            </p>
          )}
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "6rem 0" }}>
          <p style={{
            fontFamily: "var(--fonte-titulo)", fontSize: "26px", fontWeight: 300,
            color: "var(--cor-texto-suave)", marginBottom: "21px",
          }}>
            Nenhuma fragrância encontrada.
          </p>
          {temFiltros && (
            <button
              onClick={limparFiltros}
              style={{
                background: "none", border: "1px solid var(--cor-borda)", borderRadius: "99px",
                padding: "0 21px", minHeight: "44px", fontFamily: "var(--fonte-corpo)",
                fontSize: "0.8rem", letterSpacing: "0.08em",
                color: "var(--cor-destaque)", cursor: "pointer",
              }}
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}
    </>
  )
}

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

const PAGE_SIZE = 48

type Genero = "Masculino" | "Feminino" | "Unissex"
type Tipo = "EDP" | "EDT" | "EDC" | "Extrait" | "Contratipo"
type Ordenacao = "relevancia" | "mais-vendidos" | "menor-preco" | "maior-preco"
export type FontePerfume = "ebay" | "contratipo" | "fragella"

export interface CardUnificado extends DadosCardPerfume {
  preco_brl?: number
  vendidos?: number
  inspiracaoInfo?: string
  categoria?: string
  generoNorm?: Genero
  fonte?: FontePerfume
}

function Pill({ label, ativo, onClick }: { label: string; ativo: boolean; onClick: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        fontFamily: "var(--fonte-corpo)",
        fontSize: "0.75rem",
        letterSpacing: "0.08em",
        padding: "0.4rem 1rem",
        borderRadius: "99px",
        cursor: "pointer",
        background: ativo ? "rgba(196, 113, 74, 0.08)" : "transparent",
        color: ativo ? "var(--cor-destaque)" : "var(--cor-texto-suave)",
        border: ativo
          ? "1px solid var(--cor-destaque)"
          : hover
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

function perfumeMatchBusca(perfume: CardUnificado, termo: string): boolean {
  if (!termo.trim()) return true
  const t = termo.toLowerCase().trim()
  return (
    perfume.nome?.toLowerCase().includes(t) ||
    perfume.marca?.toLowerCase().includes(t) ||
    perfume.familia?.toLowerCase().includes(t) ||
    perfume.notas?.some(n => n.toLowerCase().includes(t)) ||
    perfume.inspiracaoInfo?.toLowerCase().includes(t) ||
    false
  )
}

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]
}

interface Props {
  perfumes: CardUnificado[]
  totalFragella: number
}

export default function CatalogClient({ perfumes, totalFragella }: Props) {
  const [busca, setBusca]         = useState("")
  const [generos, setGeneros]     = useState<Genero[]>([])
  const [tipos, setTipos]         = useState<Tipo[]>([])
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("relevancia")
  const [limite, setLimite]       = useState(PAGE_SIZE)
  const sentinelaRef              = useRef<HTMLDivElement>(null)

  // Filtra + ordena todos os resultados
  const resultados = useMemo(() => {
    let lista = perfumes.filter(p => {
      if (!perfumeMatchBusca(p, busca)) return false
      if (generos.length > 0) {
        const gn = p.generoNorm
        if (!gn || !generos.includes(gn)) return false
      }
      if (tipos.length > 0) {
        const isContratipo = p.categoria === "contratipo"
        if (tipos.includes("Contratipo") && isContratipo) return true
        if (tipos.some(t => t !== "Contratipo") && tipos.includes(p.concentracao as Tipo)) return true
        return false
      }
      return true
    })

    switch (ordenacao) {
      case "mais-vendidos": lista = [...lista].sort((a, b) => (b.vendidos ?? 0) - (a.vendidos ?? 0)); break
      case "menor-preco":   lista = [...lista].sort((a, b) => (a.preco_brl ?? 0) - (b.preco_brl ?? 0)); break
      case "maior-preco":   lista = [...lista].sort((a, b) => (b.preco_brl ?? 0) - (a.preco_brl ?? 0)); break
    }

    return lista
  }, [perfumes, busca, generos, tipos, ordenacao])

  // Reinicia a paginação sempre que os filtros mudarem
  useEffect(() => {
    setLimite(PAGE_SIZE)
  }, [busca, generos, tipos, ordenacao])

  // IntersectionObserver — carrega +48 ao chegar no sentinela
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
    setGeneros([])
    setTipos([])
    setOrdenacao("relevancia")
  }

  const temFiltros  = busca || generos.length > 0 || tipos.length > 0
  const visiveis    = resultados.slice(0, limite)
  const temMais     = limite < resultados.length

  return (
    <>
      {/* Busca */}
      <div style={{ position: "relative", marginBottom: "1.5rem" }}>
        <input
          type="text"
          placeholder="Buscar por nome, marca, nota ou família..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{
            width: "100%",
            fontFamily: "var(--fonte-corpo)",
            fontSize: "0.9rem",
            color: "var(--cor-texto)",
            backgroundColor: "var(--cor-card)",
            border: "1px solid var(--cor-borda)",
            borderRadius: "var(--raio-borda-suave)",
            padding: "0.85rem 1.25rem",
            boxSizing: "border-box",
          }}
        />
        {busca && (
          <button
            onClick={() => setBusca("")}
            style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--cor-texto-suave)", fontSize: "1rem", lineHeight: 1 }}
          >
            ×
          </button>
        )}
      </div>

      {/* Pills — gênero */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.6rem" }}>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {(["Masculino", "Feminino", "Unissex"] as Genero[]).map(g => (
            <Pill key={g} label={g} ativo={generos.includes(g)} onClick={() => setGeneros(toggle(generos, g))} />
          ))}
        </div>
        <div style={{ width: "1px", backgroundColor: "var(--cor-borda)", margin: "0 0.5rem", alignSelf: "stretch" }} />
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {(["EDP", "EDT", "EDC", "Extrait", "Contratipo"] as Tipo[]).map(t => (
            <Pill key={t} label={t} ativo={tipos.includes(t)} onClick={() => setTipos(toggle(tipos, t))} />
          ))}
        </div>
      </div>

      {/* Pills — ordenação + contador */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center", marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {([
            { valor: "relevancia",    label: "Relevância" },
            { valor: "mais-vendidos", label: "Mais vendidos" },
            { valor: "menor-preco",   label: "Menor preço" },
            { valor: "maior-preco",   label: "Maior preço" },
          ] as { valor: Ordenacao; label: string }[]).map(({ valor, label }) => (
            <Pill key={valor} label={label} ativo={ordenacao === valor} onClick={() => setOrdenacao(valor)} />
          ))}
        </div>
        <p style={{ marginLeft: "auto", fontFamily: "var(--fonte-corpo)", fontSize: "0.8rem", color: "var(--cor-texto-suave)" }}>
          {visiveis.length.toLocaleString("pt-BR")} / {resultados.length.toLocaleString("pt-BR")} fragrâncias
        </p>
      </div>

      {/* Grid */}
      {resultados.length > 0 ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.25rem" }}>
            {visiveis.map(perfume => (
              <div key={perfume.id}>
                <CardPerfume perfume={perfume} />
                {perfume.inspiracaoInfo && (
                  <p style={{
                    fontFamily: "var(--fonte-corpo)",
                    fontSize: "0.68rem",
                    color: "var(--cor-destaque)",
                    letterSpacing: "0.04em",
                    marginTop: "0.4rem",
                    paddingLeft: "0.1rem",
                    opacity: 0.85,
                  }}>
                    {perfume.inspiracaoInfo}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Sentinela invisível — aciona o IntersectionObserver */}
          {temMais && <div ref={sentinelaRef} style={{ height: "1px", marginTop: "2rem" }} />}

          {/* Indicador de carregamento */}
          {temMais && (
            <p style={{ textAlign: "center", fontFamily: "var(--fonte-corpo)", fontSize: "0.8rem", color: "var(--cor-texto-suave)", marginTop: "1.5rem", opacity: 0.6 }}>
              Carregando mais…
            </p>
          )}
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "6rem 0" }}>
          <p style={{ fontFamily: "var(--fonte-titulo)", fontSize: "1.5rem", fontWeight: 300, color: "var(--cor-texto-suave)", marginBottom: "1.5rem" }}>
            Nenhuma fragrância encontrada.
          </p>
          {temFiltros && (
            <button
              onClick={limparFiltros}
              style={{ background: "none", border: "1px solid var(--cor-borda)", borderRadius: "99px", padding: "0.5rem 1.5rem", fontFamily: "var(--fonte-corpo)", fontSize: "0.8rem", letterSpacing: "0.08em", color: "var(--cor-destaque)", cursor: "pointer" }}
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}
    </>
  )
}

// ============================================
// ARQUIVO: app/catalogo/page.tsx
// O QUE FAZ: catálogo completo — perfumes eBay + contratipos brasileiros, filtros em pill multi-select
// QUANDO MANDAR PRA IA: quando quiser mudar layout, filtros ou fonte dos dados
// DEPENDE DE: lib/repositories/EbayPerfumeRepository, lib/repositories/ContratipoRepository
// ============================================

"use client"

import { useState, useMemo } from "react"
import CardPerfume from "@/components/perfume/CardPerfume"
import type { DadosCardPerfume } from "@/components/perfume/CardPerfume"
import { ebayRepository } from "@/lib/repositories/EbayPerfumeRepository"
import type { PerfumeEbay } from "@/lib/repositories/EbayPerfumeRepository"
import { contratipoRepository } from "@/lib/repositories/ContratipoRepository"
import type { PerfumeContratipo } from "@/lib/repositories/ContratipoRepository"

type Genero = "Masculino" | "Feminino" | "Unissex"
type Tipo = "EDP" | "EDT" | "EDC" | "Extrait" | "Contratipo"
type Ordenacao = "relevancia" | "mais-vendidos" | "menor-preco" | "maior-preco"

interface CardUnificado extends DadosCardPerfume {
  preco_brl?: number
  vendidos?: number
  inspiracaoInfo?: string
  categoria?: string
}

function ebayParaCard(p: PerfumeEbay): CardUnificado {
  return {
    id: ebayRepository.toSlug(p.titulo, p.marca),
    nome: p.titulo,
    marca: p.marca,
    concentracao: p.tipo,
    familia: p.genero,
    preco_brl: p.preco_brl,
    vendidos: p.vendidos,
  }
}

function contratipoParaCard(p: PerfumeContratipo): CardUnificado {
  return {
    id: p.id,
    nome: p.nome,
    marca: p.marca,
    concentracao: p.tipo,
    familia: p.genero,
    notas: p.notas,
    preco_brl: p.preco_brl,
    vendidos: 0,
    inspiracaoInfo: `inspirado em ${p.inspiradoEm} — ${p.marcaOriginal}`,
    categoria: p.categoria,
  }
}

function Pill({
  label,
  ativo,
  onClick,
}: {
  label: string
  ativo: boolean
  onClick: () => void
}) {
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
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]
}

export default function PaginaCatalogo() {
  const [busca, setBusca] = useState("")
  const [generos, setGeneros] = useState<Genero[]>([])
  const [tipos, setTipos] = useState<Tipo[]>([])
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("relevancia")

  // Combina eBay + contratipos via repositórios — lazy, apenas na primeira renderização
  const todosPerfu = useMemo<CardUnificado[]>(() =>
    [
      ...ebayRepository.findAll().map(ebayParaCard),
      ...contratipoRepository.findAll().map(contratipoParaCard),
    ].map((p, index) => ({ ...p, id: `${p.id}-${index}` }))
  , [])

  const resultados = useMemo(() => {
    const buscaNorm = busca.toLowerCase().trim()

    let lista = todosPerfu.filter((p) => {
      if (!perfumeMatchBusca(p, busca)) return false

      if (generos.length > 0 && !generos.includes(p.familia as Genero)) return false

      if (tipos.length > 0) {
        const isContratipo = p.categoria === "contratipo"
        if (tipos.includes("Contratipo") && isContratipo) return true
        if (tipos.some((t) => t !== "Contratipo") && tipos.includes(p.concentracao as Tipo)) return true
        return false
      }

      return true
    })

    switch (ordenacao) {
      case "mais-vendidos":
        lista = [...lista].sort((a, b) => (b.vendidos ?? 0) - (a.vendidos ?? 0))
        break
      case "menor-preco":
        lista = [...lista].sort((a, b) => (a.preco_brl ?? 0) - (b.preco_brl ?? 0))
        break
      case "maior-preco":
        lista = [...lista].sort((a, b) => (b.preco_brl ?? 0) - (a.preco_brl ?? 0))
        break
    }

    return lista
  }, [busca, generos, tipos, ordenacao])

  function limparFiltros() {
    setBusca("")
    setGeneros([])
    setTipos([])
    setOrdenacao("relevancia")
  }

  const temFiltros = busca || generos.length > 0 || tipos.length > 0

  return (
    <main>
      <div className="container-site" style={{ paddingTop: "4rem", paddingBottom: "5rem" }}>

        {/* Título */}
        <div style={{ marginBottom: "3rem" }}>
          <p style={{ fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--cor-texto-suave)", marginBottom: "0.75rem" }}>
            fragrâncias
          </p>
          <h1 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "clamp(2.5rem, 6vw, 4rem)", lineHeight: 1 }}>
            catálogo
          </h1>
        </div>

        {/* Busca */}
        <div style={{ position: "relative", marginBottom: "1.5rem" }}>
          <input
            type="text"
            placeholder="Buscar por nome, marca, nota ou família..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
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

        {/* Pills — linha 1: gênero */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.6rem" }}>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {(["Masculino", "Feminino", "Unissex"] as Genero[]).map((g) => (
              <Pill key={g} label={g} ativo={generos.includes(g)} onClick={() => setGeneros(toggle(generos, g))} />
            ))}
          </div>

          <div style={{ width: "1px", backgroundColor: "var(--cor-borda)", margin: "0 0.5rem", alignSelf: "stretch" }} />

          {/* Pills — tipo + Contratipo */}
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {(["EDP", "EDT", "EDC", "Extrait", "Contratipo"] as Tipo[]).map((t) => (
              <Pill key={t} label={t} ativo={tipos.includes(t)} onClick={() => setTipos(toggle(tipos, t))} />
            ))}
          </div>
        </div>

        {/* Pills — linha 2: ordenação + contador */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center", marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {(
              [
                { valor: "relevancia", label: "Relevância" },
                { valor: "mais-vendidos", label: "Mais vendidos" },
                { valor: "menor-preco", label: "Menor preço" },
                { valor: "maior-preco", label: "Maior preço" },
              ] as { valor: Ordenacao; label: string }[]
            ).map(({ valor, label }) => (
              <Pill key={valor} label={label} ativo={ordenacao === valor} onClick={() => setOrdenacao(valor)} />
            ))}
          </div>

          <p style={{ marginLeft: "auto", fontFamily: "var(--fonte-corpo)", fontSize: "0.8rem", color: "var(--cor-texto-suave)" }}>
            {resultados.length.toLocaleString("pt-BR")} fragrâncias
          </p>
        </div>

        {/* Grid */}
        {resultados.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.25rem" }}>
            {resultados.map((perfume) => (
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
      </div>
    </main>
  )
}

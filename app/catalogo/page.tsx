// ============================================
// ARQUIVO: app/catalogo/page.tsx
// O QUE FAZ: catálogo completo de perfumes com busca, filtros em pill (multi-select) e ordenação
// QUANDO MANDAR PRA IA: quando quiser mudar layout, filtros ou fonte dos dados
// DEPENDE DE: lib/ebayData.ts, components/perfume/CardPerfume.tsx
// ============================================

"use client"

import { useState, useMemo } from "react"
import CardPerfume from "@/components/perfume/CardPerfume"
import type { DadosCardPerfume } from "@/components/perfume/CardPerfume"
import { PERFUMES_EBAY, ebayParaSlug } from "@/lib/ebayData"
import type { PerfumeEbay } from "@/lib/ebayData"

type Genero = "Masculino" | "Feminino" | "Unissex"
type Tipo = "EDP" | "EDT" | "EDC" | "Extrait"
type Ordenacao = "relevancia" | "mais-vendidos" | "menor-preco" | "maior-preco"

function ebayParaCard(p: PerfumeEbay): DadosCardPerfume {
  return {
    id: ebayParaSlug(p.titulo, p.marca),
    nome: p.titulo,
    marca: p.marca,
    concentracao: p.tipo,
    familia: p.genero,
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

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]
}

export default function PaginaCatalogo() {
  const [busca, setBusca] = useState("")
  const [generos, setGeneros] = useState<Genero[]>([])
  const [tipos, setTipos] = useState<Tipo[]>([])
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("relevancia")

  const resultados = useMemo(() => {
    const buscaNorm = busca.toLowerCase().trim()

    let lista = PERFUMES_EBAY.filter((p) => {
      if (buscaNorm && !p.titulo.toLowerCase().includes(buscaNorm) && !p.marca.toLowerCase().includes(buscaNorm)) return false
      if (generos.length > 0 && !generos.includes(p.genero as Genero)) return false
      if (tipos.length > 0 && !tipos.includes(p.tipo as Tipo)) return false
      return true
    })

    switch (ordenacao) {
      case "mais-vendidos":
        lista = [...lista].sort((a, b) => b.vendidos - a.vendidos)
        break
      case "menor-preco":
        lista = [...lista].sort((a, b) => a.preco_brl - b.preco_brl)
        break
      case "maior-preco":
        lista = [...lista].sort((a, b) => b.preco_brl - a.preco_brl)
        break
    }

    return lista.map(ebayParaCard)
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
            placeholder="Buscar por nome ou marca..."
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

        {/* Pills — linha 1: gênero + tipo */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.6rem" }}>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {(["Masculino", "Feminino", "Unissex"] as Genero[]).map((g) => (
              <Pill key={g} label={g} ativo={generos.includes(g)} onClick={() => setGeneros(toggle(generos, g))} />
            ))}
          </div>

          <div style={{ width: "1px", backgroundColor: "var(--cor-borda)", margin: "0 0.5rem", alignSelf: "stretch" }} />

          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {(["EDP", "EDT", "EDC", "Extrait"] as Tipo[]).map((t) => (
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
              <CardPerfume key={perfume.id} perfume={perfume} />
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

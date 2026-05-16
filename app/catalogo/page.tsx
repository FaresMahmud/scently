// ============================================
// ARQUIVO: app/catalogo/page.tsx
// O QUE FAZ: catálogo completo de perfumes com busca, filtros e ordenação client-side
// QUANDO MANDAR PRA IA: quando quiser mudar layout, filtros ou fonte dos dados
// DEPENDE DE: lib/ebayData.ts, components/perfume/CardPerfume.tsx
// ============================================

"use client"

import { useState, useMemo } from "react"
import CardPerfume from "@/components/perfume/CardPerfume"
import type { DadosCardPerfume } from "@/components/perfume/CardPerfume"
import { PERFUMES_EBAY, ebayParaSlug } from "@/lib/ebayData"
import type { PerfumeEbay } from "@/lib/ebayData"

type Genero = "Todos" | "Masculino" | "Feminino"
type Tipo = "Todos" | "EDP" | "EDT" | "EDC" | "Extrait"
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

const TODOS_PERFUMES = PERFUMES_EBAY.map(ebayParaCard)

const estiloSelect: React.CSSProperties = {
  fontFamily: "var(--fonte-corpo)",
  fontSize: "0.8rem",
  color: "var(--cor-texto)",
  backgroundColor: "var(--cor-card)",
  border: "1px solid var(--cor-borda)",
  borderRadius: "var(--raio-borda-suave)",
  padding: "0.55rem 0.9rem",
  cursor: "pointer",
  appearance: "none" as const,
  WebkitAppearance: "none" as const,
  minWidth: "120px",
}

export default function PaginaCatalogo() {
  const [busca, setBusca] = useState("")
  const [genero, setGenero] = useState<Genero>("Todos")
  const [tipo, setTipo] = useState<Tipo>("Todos")
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("relevancia")

  const resultados = useMemo(() => {
    const buscaNorm = busca.toLowerCase().trim()

    let lista = PERFUMES_EBAY.filter((p) => {
      if (buscaNorm && !p.titulo.toLowerCase().includes(buscaNorm) && !p.marca.toLowerCase().includes(buscaNorm)) return false
      if (genero !== "Todos" && p.genero !== genero) return false
      if (tipo !== "Todos" && p.tipo !== tipo) return false
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
  }, [busca, genero, tipo, ordenacao])

  function limparFiltros() {
    setBusca("")
    setGenero("Todos")
    setTipo("Todos")
    setOrdenacao("relevancia")
  }

  const temFiltros = busca || genero !== "Todos" || tipo !== "Todos"

  return (
    <main>
      <div className="container-site" style={{ paddingTop: "4rem", paddingBottom: "5rem" }}>

        {/* Título */}
        <div style={{ marginBottom: "3rem" }}>
          <p style={{ fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--cor-texto-suave)", marginBottom: "0.75rem" }}>
            fragrâncias
          </p>
          <h1
            style={{
              fontFamily: "var(--fonte-titulo)",
              fontWeight: 300,
              fontSize: "clamp(2.5rem, 6vw, 4rem)",
              lineHeight: 1,
              marginBottom: "0.5rem",
            }}
          >
            catálogo
          </h1>
        </div>

        {/* Barra de busca */}
        <div style={{ position: "relative", marginBottom: "1.25rem" }}>
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
              style={{
                position: "absolute",
                right: "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--cor-texto-suave)",
                fontSize: "1rem",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Filtros em linha */}
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <div style={{ position: "relative" }}>
            <select value={genero} onChange={(e) => setGenero(e.target.value as Genero)} style={estiloSelect}>
              <option value="Todos">Todos os gêneros</option>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
            </select>
          </div>

          <div style={{ position: "relative" }}>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as Tipo)} style={estiloSelect}>
              <option value="Todos">Todos os tipos</option>
              <option value="EDP">EDP</option>
              <option value="EDT">EDT</option>
              <option value="EDC">EDC</option>
              <option value="Extrait">Extrait</option>
            </select>
          </div>

          <div style={{ position: "relative" }}>
            <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value as Ordenacao)} style={estiloSelect}>
              <option value="relevancia">Relevância</option>
              <option value="mais-vendidos">Mais vendidos</option>
              <option value="menor-preco">Menor preço</option>
              <option value="maior-preco">Maior preço</option>
            </select>
          </div>

          {/* Contador */}
          <p
            style={{
              marginLeft: "auto",
              fontFamily: "var(--fonte-corpo)",
              fontSize: "0.8rem",
              color: "var(--cor-texto-suave)",
            }}
          >
            {resultados.length.toLocaleString("pt-BR")} fragrâncias encontradas
          </p>
        </div>

        {/* Grid de resultados */}
        {resultados.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {resultados.map((perfume) => (
              <CardPerfume key={perfume.id} perfume={perfume} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "6rem 0" }}>
            <p
              style={{
                fontFamily: "var(--fonte-titulo)",
                fontSize: "1.5rem",
                fontWeight: 300,
                color: "var(--cor-texto-suave)",
                marginBottom: "1.5rem",
              }}
            >
              Nenhuma fragrância encontrada.
            </p>
            {temFiltros && (
              <button
                onClick={limparFiltros}
                style={{
                  background: "none",
                  border: "1px solid var(--cor-borda)",
                  borderRadius: "var(--raio-borda)",
                  padding: "0.65rem 1.5rem",
                  fontFamily: "var(--fonte-corpo)",
                  fontSize: "0.85rem",
                  color: "var(--cor-destaque)",
                  cursor: "pointer",
                }}
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

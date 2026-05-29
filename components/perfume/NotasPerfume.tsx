// ============================================
// ARQUIVO: components/perfume/NotasPerfume.tsx
// O QUE FAZ: exibe a pirâmide olfativa — notas de topo, coração e fundo
// QUANDO MANDAR PRA IA: quando quiser mudar como as notas aparecem na página do perfume
// DEPENDE DE: lib/coresNotas.ts, lib/utils.ts
// ============================================

"use client"
import { useState } from "react"
import { traduzir } from "@/lib/utils"
import { corDaNota } from "@/lib/coresNotas"

interface Nota { name: string; imageUrl?: string }

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return `${r}, ${g}, ${b}`
}

function ChipNota({ nota, selecionada, onToggle }: { nota: Nota, selecionada: boolean, onToggle: () => void }) {
  const [hover, setHover] = useState(false)
  const cor = corDaNota(nota.name)
  const rgb = hexToRgb(cor)

  const style = selecionada
    ? { backgroundColor: cor, color: "#fff", border: `2px solid ${cor}` }
    : hover
    ? { backgroundColor: cor, color: "#fff", border: `1.5px solid ${cor}` }
    : { backgroundColor: `rgba(${rgb}, 0.12)`, color: cor, border: `1.5px solid rgba(${rgb}, 0.5)` }

  return (
    <span
      onClick={onToggle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...style, cursor: "pointer", padding: "4px 12px", borderRadius: "999px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "4px", transition: "all 0.15s ease", userSelect: "none" }}
    >
      {selecionada && <span>✓</span>}
      {traduzir(nota.name)}
    </span>
  )
}

export function NotasPerfume({ topo, coracao, fundo }: { topo: Nota[], coracao: Nota[], fundo: Nota[] }) {
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set())
  const toggle = (nome: string) => setSelecionadas(prev => {
    const next = new Set(prev)
    next.has(nome) ? next.delete(nome) : next.add(nome)
    return next
  })

  const secao = (label: string, sub: string, notas: Nota[]) => notas.length === 0 ? null : (
    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
      <div style={{ minWidth: "110px" }}>
        <div style={{ fontSize: "11px", letterSpacing: "0.1em", color: "#C9943A", fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: "11px", color: "#999" }}>{sub}</div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {notas.map(n => (
          <ChipNota key={n.name} nota={n} selecionada={selecionadas.has(n.name)} onToggle={() => toggle(n.name)} />
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {secao("TOPO", "primeira impressão", topo)}
      {secao("CORAÇÃO", "a essência", coracao)}
      {secao("FUNDO", "o que fica", fundo)}
    </div>
  )
}

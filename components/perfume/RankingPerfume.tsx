// ============================================
// ARQUIVO: components/perfume/RankingPerfume.tsx
// O QUE FAZ: exibe rankings de estação e ocasião com barras de progresso e tooltip explicativo
// QUANDO MANDAR PRA IA: quando quiser mudar o visual ou as explicações dos rankings
// DEPENDE DE: lib/utils.ts
// ============================================

"use client"
import { useState } from "react"
import { traduzir } from "@/lib/utils"

interface RankingItem { name: string; score: number }

function nivelDoScore(score: number, maxScore: number): { label: string; cor: string; bg: string; borda: string; porcentagem: number } {
  const pct = maxScore > 0 ? score / maxScore : 0
  if (pct >= 0.7) return { label: "Ótimo", cor: "#8B5E20", bg: "#F5EDE0", borda: "#D4A050", porcentagem: pct * 100 }
  if (pct >= 0.4) return { label: "Bom", cor: "#6B6B5A", bg: "#F0F0EC", borda: "#C0BCAC", porcentagem: pct * 100 }
  return { label: "Fraco", cor: "#9B9B8A", bg: "#F5F2EE", borda: "#DDD8CC", porcentagem: pct * 100 }
}

function gerarExplicacao(
  itemNome: string,
  tipo: "estacao" | "ocasiao",
  nivel: string,
  nomePerfume: string,
  familia: string
): string {
  const nome = traduzir(itemNome)
  const fam = familia?.toLowerCase() ?? ""

  if (tipo === "estacao") {
    if (nivel === "Ótimo") {
      if (itemNome === "spring") return `${nomePerfume} brilha na primavera — suas notas ${fam} ganham leveza com o ar fresco e flores em bloom.`
      if (itemNome === "summer") return `O calor do verão ativa as notas de ${fam} do ${nomePerfume}, projetando mais longe e durando mais na pele aquecida.`
      if (itemNome === "fall")   return `O outono é a estação perfeita — a queda de temperatura faz as notas ${fam} do ${nomePerfume} se desenvolverem mais lentamente e com mais profundidade.`
      if (itemNome === "winter") return `No frio do inverno, ${nomePerfume} envolve como uma segunda pele — ideal para noites fechadas e ambientes aquecidos.`
    }
    if (nivel === "Bom") {
      return `${nomePerfume} funciona bem no(a) ${nome}, mas não é onde brilha mais. Considere aplicar um pouco mais que o habitual.`
    }
    return `${nomePerfume} não foi feito para o(a) ${nome} — as notas ${fam} podem ficar desequilibradas nessa temperatura.`
  }

  if (tipo === "ocasiao") {
    if (nivel === "Ótimo") {
      if (itemNome === "professional") return `${nomePerfume} é elegante sem ser invasivo — presença certa para reuniões e escritório sem incomodar colegas.`
      if (itemNome === "casual")       return `Leve e versátil, ${nomePerfume} é a escolha certa para o dia a dia — confortável, memorável, sem exagero.`
      if (itemNome === "night out")    return `${nomePerfume} foi feito para a noite — suas notas ${fam} ganham intensidade sob as luzes e ficam na memória de quem passa perto.`
      if (itemNome === "romantic")     return `A profundidade ${fam} do ${nomePerfume} cria a atmosfera perfeita para momentos íntimos — sedutor sem ser óbvio.`
      if (itemNome === "sport")        return `${nomePerfume} aguenta bem a atividade física — notas frescas que resistem ao movimento e deixam um rastro limpo.`
      return `${nomePerfume} se encaixa perfeitamente nessa ocasião pelas suas notas ${fam} que criam a atmosfera certa.`
    }
    if (nivel === "Bom") {
      return `${nomePerfume} funciona nessa ocasião, mas existem escolhas mais certeiras. Use com moderação.`
    }
    return `Essa não é a ocasião ideal para ${nomePerfume} — as notas ${fam} podem ser excessivas ou inadequadas para esse contexto.`
  }

  return ""
}

function ItemRanking({ item, tipo, maxScore, nomePerfume, familia }: {
  item: RankingItem
  tipo: "estacao" | "ocasiao"
  maxScore: number
  nomePerfume: string
  familia: string
}) {
  const [tooltip, setTooltip] = useState(false)
  const nivel = nivelDoScore(item.score, maxScore)
  const explicacao = gerarExplicacao(item.name, tipo, nivel.label, nomePerfume, familia)

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
      <span style={{ fontSize: "13px", color: "var(--cor-texto)", width: "90px", flexShrink: 0 }}>
        {traduzir(item.name)}
      </span>
      <div style={{ flex: 1, height: "4px", background: "#EDE8E0", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{
          width: `${nivel.porcentagem}%`,
          height: "100%",
          background: nivel.porcentagem >= 70 ? "#C9943A" : "#C0BCAC",
          borderRadius: "2px",
          transition: "width 0.3s",
        }} />
      </div>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <span
          onMouseEnter={() => setTooltip(true)}
          onMouseLeave={() => setTooltip(false)}
          style={{
            fontSize: "11px",
            padding: "2px 8px",
            borderRadius: "999px",
            fontWeight: 500,
            cursor: "help",
            background: nivel.bg,
            color: nivel.cor,
            border: `1px solid ${nivel.borda}`,
            userSelect: "none",
          }}
        >
          {nivel.label}
        </span>
        {tooltip && (
          <div style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            right: 0,
            width: "220px",
            background: "var(--cor-base)",
            border: "1px solid var(--cor-borda)",
            borderRadius: "8px",
            padding: "10px 12px",
            fontSize: "12px",
            lineHeight: 1.6,
            color: "var(--cor-texto)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            zIndex: 10,
          }}>
            {explicacao}
          </div>
        )}
      </div>
    </div>
  )
}

export function RankingPerfume({ estacao, ocasiao, nomePerfume, familia }: {
  estacao: RankingItem[]
  ocasiao: RankingItem[]
  nomePerfume: string
  familia: string
}) {
  const maxEstacao = Math.max(...estacao.map(i => i.score), 1)
  const maxOcasiao = Math.max(...ocasiao.map(i => i.score), 1)

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", padding: "24px 0" }}>
      <div>
        <p style={{ fontSize: "11px", letterSpacing: "0.12em", color: "var(--cor-texto-suave)", marginBottom: "16px", fontWeight: 500 }}>
          ESTAÇÃO IDEAL
        </p>
        {estacao.map(item => (
          <ItemRanking key={item.name} item={item} tipo="estacao" maxScore={maxEstacao} nomePerfume={nomePerfume} familia={familia} />
        ))}
      </div>
      <div>
        <p style={{ fontSize: "11px", letterSpacing: "0.12em", color: "var(--cor-texto-suave)", marginBottom: "16px", fontWeight: 500 }}>
          MELHOR OCASIÃO
        </p>
        {ocasiao.map(item => (
          <ItemRanking key={item.name} item={item} tipo="ocasiao" maxScore={maxOcasiao} nomePerfume={nomePerfume} familia={familia} />
        ))}
      </div>
    </div>
  )
}

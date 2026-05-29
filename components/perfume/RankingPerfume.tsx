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
  const fam = familia?.toLowerCase() ?? "olfativa"

  if (tipo === "estacao") {
    if (nivel === "Ótimo") {
      if (itemNome === "spring") return `Na primavera, as notas ${fam} do ${nomePerfume} se abrem com mais naturalidade. O frescor do ar ativa a composição sem precisar forçar a projeção.`
      if (itemNome === "summer") return `O calor do verão potencializa as notas ${fam} do ${nomePerfume}. A pele aquecida projeta mais longe e a fixação aumenta ao longo do dia.`
      if (itemNome === "fall")   return `O outono é onde o ${nomePerfume} se destaca. Com a queda de temperatura, as notas ${fam} se desenvolvem mais lentamente e ganham profundidade.`
      if (itemNome === "winter") return `No inverno, o ${nomePerfume} funciona como uma segunda pele. O frio concentra a projeção e as notas ${fam} duram mais em ambientes aquecidos.`
    }
    if (nivel === "Bom") {
      if (itemNome === "spring") return `Na primavera o ${nomePerfume} funciona bem, mas não é onde brilha mais. Em dias quentes da estação, aplique com um pouco mais de generosidade.`
      if (itemNome === "summer") return `No calor intenso o ${nomePerfume} perde um pouco da elegância. Use menos quantidade e prefira aplicar no cabelo ou nas roupas para durar mais.`
      if (itemNome === "fall")   return `O ${nomePerfume} funciona no outono, especialmente nos dias mais amenos. Nos dias frios prefira fragrâncias mais densas para a estação.`
      if (itemNome === "winter") return `No inverno o ${nomePerfume} pode parecer leve para alguns ambientes. Compense aplicando em pontos que retêm calor, como pescoço e pulsos internos.`
      return `${nomePerfume} funciona bem no(a) ${nome}, mas não é onde brilha mais. Aplique um pouco mais que o habitual.`
    }
    if (itemNome === "spring") return `O outono pede perfumes mais quentes. O ${nomePerfume} pode parecer leve demais para a estação, mas ainda funciona em dias ainda amenos.`
    if (itemNome === "summer") return `As notas ${fam} do ${nomePerfume} não combinam bem com o calor intenso. Reserve para dias ou ambientes mais frescos.`
    if (itemNome === "fall")   return `O ${nomePerfume} tende a parecer deslocado no outono. As notas ${fam} ficam desequilibradas com a queda de temperatura.`
    if (itemNome === "winter") return `No frio do inverno as notas ${fam} do ${nomePerfume} podem sumir rápido. Não é a escolha mais eficiente para essa estação.`
    return `As notas ${fam} do ${nomePerfume} ficam desequilibradas no(a) ${nome}. Guarde para uma estação mais adequada.`
  }

  if (tipo === "ocasiao") {
    if (nivel === "Ótimo") {
      if (itemNome === "professional") return `O ${nomePerfume} tem a presença certa para o ambiente de trabalho. Elegante sem invadir o espaço dos outros, deixa uma impressão positiva sem chamar atenção demais.`
      if (itemNome === "casual")       return `Para o dia a dia, o ${nomePerfume} é uma escolha acertada. Versátil o suficiente para qualquer situação, confortável de usar e fácil de combinar com qualquer humor.`
      if (itemNome === "night out")    return `O ${nomePerfume} foi pensado para a noite. As notas ${fam} ganham intensidade sob as luzes e deixam um rastro que as pessoas ao redor vão notar e lembrar.`
      if (itemNome === "romantic")     return `A complexidade ${fam} do ${nomePerfume} cria uma atmosfera de intimidade. É o tipo de perfume que fica na memória de quem está perto, sem precisar anunciar a presença.`
      if (itemNome === "sport")        return `O ${nomePerfume} aguenta bem a atividade física. As notas ${fam} resistem ao movimento, e o resultado final na pele aquecida costuma ser ainda mais agradável.`
      return `O ${nomePerfume} cria a atmosfera certa para essa ocasião. As notas ${fam} se adaptam bem ao contexto e deixam uma impressão adequada.`
    }
    if (nivel === "Bom") {
      if (itemNome === "professional") return `O ${nomePerfume} é aceitável no trabalho, mas use com cautela. Duas borrifadas são suficientes para não ultrapassar o limite do espaço compartilhado.`
      if (itemNome === "casual")       return `Para o casual, o ${nomePerfume} funciona mas pode ser um pouco intenso demais para o contexto. Aplique apenas uma borrifada em dias mais quentes.`
      if (itemNome === "night out")    return `O ${nomePerfume} serve para uma saída à noite sem ser a escolha mais impactante. Funciona melhor em ambientes menores e mais intimistas.`
      if (itemNome === "romantic")     return `Para um encontro, o ${nomePerfume} funciona com moderação. Não é a escolha mais sedutora, mas é agradável e não vai errar.`
      if (itemNome === "sport")        return `O ${nomePerfume} aguenta uma atividade leve, mas não foi feito para isso. Para treinos intensos considere algo mais refrescante.`
      return `${nomePerfume} funciona nessa ocasião, mas existem escolhas mais certeiras. Use com moderação.`
    }
    if (itemNome === "professional") return `O ${nomePerfume} pode ser invasivo demais no ambiente de trabalho. As notas ${fam} projetam forte e podem incomodar quem está perto.`
    if (itemNome === "casual")       return `Para o dia a dia, o ${nomePerfume} pode ser pesado demais. Guarde para momentos especiais onde a intensidade ${fam} seja bem-vinda.`
    if (itemNome === "night out")    return `Para uma noite fora, as notas ${fam} do ${nomePerfume} podem não criar o impacto esperado. Considere algo com mais projeção e presença noturna.`
    if (itemNome === "romantic")     return `Para momentos românticos, o ${nomePerfume} pode não criar o clima certo. As notas ${fam} não são as mais sedutoras para essa ocasião específica.`
    if (itemNome === "sport")        return `O ${nomePerfume} não foi pensado para atividade física. Em movimento e com suor, as notas ${fam} podem ficar desagradáveis.`
    return `Essa não é a ocasião ideal para o ${nomePerfume}. As notas ${fam} podem ser inadequadas para esse contexto específico.`
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

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
  const fam = familia?.toLowerCase() ?? ""
  const nome = traduzir(itemNome)

  // Categorias de família
  const isQuente = /oriental|amadeirado|woody|amber|oud|especiado|spicy|gourmand|vanilla|baunilha/.test(fam)
  const isFresco = /cítrico|citrus|aquático|aquatic|fresh|verde|green|aromatic/.test(fam)
  const isFloral = /floral|rose|jasmine/.test(fam)
  const isFrutal = /frutal|fruity/.test(fam)

  if (tipo === "estacao") {
    const estacao = itemNome

    if (nivel === "Ótimo") {
      if (estacao === "fall" || estacao === "autumn") {
        if (isQuente) return `O outono é a estação perfeita para o ${nomePerfume}. Perfumes ${fam} ganham profundidade com a queda de temperatura e se desenvolvem lentamente na pele, criando uma presença envolvente.`
        if (isFresco) return `O ${nomePerfume} funciona bem no outono pelos dias ainda amenos. Aplique um pouco mais que o habitual conforme as temperaturas caem.`
        return `O outono equilibra bem as notas do ${nomePerfume}. Nem quente demais para sobrecarregar, nem frio demais para apagar a projeção.`
      }
      if (estacao === "winter") {
        if (isQuente) return `No inverno, o ${nomePerfume} está no seu elemento. O frio intensifica as notas ${fam} e cria uma presença quente e envolvente em ambientes fechados.`
        if (isFresco) return `O ${nomePerfume} é surpreendentemente bom no inverno. As notas frescas criam um contraste elegante com o frio e duram mais na pele seca do inverno.`
        return `O inverno favorece o ${nomePerfume}, especialmente em ambientes aquecidos onde as notas se desenvolvem com mais intensidade.`
      }
      if (estacao === "spring") {
        if (isFresco || isFloral || isFrutal) return `A primavera é a estação ideal para o ${nomePerfume}. As notas ${fam} se harmonizam perfeitamente com o ar fresco e o clima ameno, sem pesar.`
        if (isQuente) return `Na primavera o ${nomePerfume} ganha leveza. O clima ameno suaviza as notas mais pesadas e cria uma versão mais acessível da fragrância.`
        return `O ${nomePerfume} abre bem na primavera. O clima equilibrado permite que todas as camadas da pirâmide olfativa se desenvolvam naturalmente.`
      }
      if (estacao === "summer") {
        if (isFresco) return `O verão é feito para o ${nomePerfume}. O calor potencializa as notas ${fam} e cria uma projeção natural sem precisar forçar a aplicação.`
        if (isQuente) return `No verão o ${nomePerfume} surpreende. Aplique com moderação, pois o calor intensifica as notas ${fam} e a projeção aumenta consideravelmente.`
        return `O ${nomePerfume} funciona bem no verão. Use 1 ou 2 borrifadas nos pulsos e deixe o calor fazer o trabalho.`
      }
    }

    if (nivel === "Bom") {
      if (estacao === "fall" || estacao === "autumn") {
        if (isFresco) return `O ${nomePerfume} funciona no outono nos dias ainda amenos. Conforme o frio aumenta, considere adicionar uma borrifada extra para compensar a menor volatilidade.`
        return `O ${nomePerfume} se adapta ao outono, mas não é onde brilha mais. Funciona bem nos dias de transição entre o calor e o frio.`
      }
      if (estacao === "winter") {
        if (isFresco) return `O inverno não é o forte do ${nomePerfume}, mas funciona. O frio reduz a projeção, então aplique em pontos quentes como pescoço e pulsos para compensar.`
        return `O ${nomePerfume} sobrevive bem ao inverno. Não é a escolha mais óbvia para o frio, mas tem seu charme nos dias menos rigorosos.`
      }
      if (estacao === "summer") {
        if (isQuente) return `No verão o ${nomePerfume} pede cuidado. O calor amplifica as notas ${fam} e pode ficar intenso demais. Use com moderação, 1 borrifada no máximo.`
        return `O ${nomePerfume} funciona no verão com moderação. Evite aplicar em excesso, pois o calor já potencializa a projeção naturalmente.`
      }
      return `O ${nomePerfume} funciona bem no(a) ${nome}, mas existem estações onde brilha mais. Vale a pena experimentar.`
    }

    // Fraco
    if (estacao === "summer" && isQuente) return `O verão não combina com o ${nomePerfume}. As notas ${fam} ficam pesadas demais no calor e podem incomodar. Reserve para os meses mais frios.`
    if ((estacao === "fall" || estacao === "winter") && isFresco) return `O frio do(a) ${nome} apaga as notas ${fam} do ${nomePerfume}. A projeção cai muito e o perfume perde o que tem de melhor.`
    if (estacao === "spring" && isQuente) return `A primavera ainda é quente demais para as notas ${fam} do ${nomePerfume}. Aguarde o outono para tirar o máximo dessa fragrância.`
    return `O(a) ${nome} não é a melhor época para o ${nomePerfume}. As condições climáticas trabalham contra as notas ${fam} da fragrância.`
  }

  if (tipo === "ocasiao") {
    if (nivel === "Ótimo") {
      if (itemNome === "professional") return `O ${nomePerfume} tem a presença certa para ambientes de trabalho. Discreto o suficiente para não incomodar, marcante o suficiente para ser lembrado.`
      if (itemNome === "casual")       return `Para o dia a dia, o ${nomePerfume} é uma escolha certeira. Versátil, confortável e sem exagero, funciona em qualquer situação informal.`
      if (itemNome === "night out")    return `O ${nomePerfume} foi feito para a noite. As notas ${fam} ganham intensidade sob o calor do corpo e criam uma presença marcante que fica na memória.`
      if (itemNome === "romantic")     return `Para momentos íntimos, o ${nomePerfume} cria a atmosfera certa. A profundidade ${fam} é sedutora sem ser óbvia, exatamente o que uma fragrância romântica precisa ser.`
      if (itemNome === "sport")        return `O ${nomePerfume} aguenta bem a atividade física. As notas ${fam} resistem ao movimento e deixam um rastro limpo e agradável mesmo após esforço.`
      return `O ${nomePerfume} é uma escolha excelente para essa ocasião pelas suas notas ${fam}.`
    }
    if (nivel === "Bom") {
      if (itemNome === "professional") return `O ${nomePerfume} funciona no trabalho, mas aplique com moderação. As notas ${fam} podem ser um pouco marcantes em espaços fechados.`
      if (itemNome === "night out")    return `Para a noite o ${nomePerfume} funciona, mas não é a escolha mais impactante. Se quiser algo mais intenso para sair, considere uma borrifada extra no cabelo.`
      return `O ${nomePerfume} funciona bem nessa ocasião. Não é a combinação mais óbvia, mas tem seu charme.`
    }
    // Fraco
    if (itemNome === "professional") return `As notas ${fam} do ${nomePerfume} podem ser fortes demais para ambientes de trabalho. Se precisar usar, limite a 1 borrifada em ponto discreto.`
    if (itemNome === "sport")        return `O ${nomePerfume} não foi feito para atividade física. As notas ${fam} ficam estranhas misturadas com suor e a fixação cai rapidamente.`
    return `Essa ocasião não favorece o ${nomePerfume}. As notas ${fam} pedem um contexto diferente para brilhar.`
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

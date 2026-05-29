// ============================================
// ARQUIVO: components/perfume/TagInfo.tsx
// O QUE FAZ: tag semântica com cor baseada no conteúdo — hover, clique nas famílias vai ao catálogo
// QUANDO MANDAR PRA IA: quando quiser mudar o visual ou comportamento das tags da página de perfume
// DEPENDE DE: styles/globals.css, next/link
// ============================================

"use client"

import { useState } from "react"
import Link from "next/link"

// ── Mapeamento de cor por conteúdo ─────────────────────────────────────────

interface CorTag { bg: string; text: string; hover: string }

function corDaTag(texto: string): CorTag {
  const t = texto.toLowerCase()
  // Família olfativa
  if (/c[ií]trico|citrus|citric/.test(t))       return { bg: "#FFF8E7", text: "#C8960A", hover: "#C8960A" }
  if (/floral/.test(t))                          return { bg: "#FFF0F5", text: "#C4687A", hover: "#C4687A" }
  if (/amadeirado|woody|wood/.test(t))           return { bg: "#F5EFE8", text: "#7A4A28", hover: "#7A4A28" }
  if (/oriental|especiado|spicy/.test(t))        return { bg: "#FFF3E8", text: "#A04020", hover: "#A04020" }
  if (/aqu[áa]tico|aquatic|fresco|fresh/.test(t))return { bg: "#EEF6FC", text: "#2878A0", hover: "#2878A0" }
  if (/gourmand/.test(t))                        return { bg: "#F5EEF8", text: "#6B3A8C", hover: "#6B3A8C" }
  if (/fougere|fougère/.test(t))                 return { bg: "#EEF5EE", text: "#2A6840", hover: "#2A6840" }
  if (/chypre/.test(t))                          return { bg: "#F5F0E8", text: "#6A5028", hover: "#6A5028" }
  if (/arom[áa]tico|aromatic/.test(t))           return { bg: "#EEF8EE", text: "#287840", hover: "#287840" }
  if (/couro|leather/.test(t))                   return { bg: "#F0EBE5", text: "#5A3820", hover: "#5A3820" }
  if (/verde|green/.test(t))                     return { bg: "#EEFAEE", text: "#287830", hover: "#287830" }
  // Concentração
  if (/extrait/.test(t))                         return { bg: "#1A1A1A", text: "#F0E8D8", hover: "#000" }
  if (/edp|eau de parfum/.test(t))               return { bg: "#F5EDE8", text: "#8B4A30", hover: "#8B4A30" }
  if (/edt|eau de toilette/.test(t))             return { bg: "#E8F0F5", text: "#2A5878", hover: "#2A5878" }
  if (/edc|eau de cologne/.test(t))              return { bg: "#EEF8F0", text: "#2A7848", hover: "#2A7848" }
  // Gênero
  if (/masculino/.test(t))                       return { bg: "#EAF2FA", text: "#1E5F8C", hover: "#1E5F8C" }
  if (/feminino/.test(t))                        return { bg: "#FAE8F0", text: "#8C1E50", hover: "#8C1E50" }
  if (/unissex/.test(t))                         return { bg: "#F0EAF5", text: "#5A1E8C", hover: "#5A1E8C" }
  // Longevidade — nível forte
  if (/longa dura[çc]|very long|excepcional/.test(t))       return { bg: "#EAF3DE", text: "#3B6D11", hover: "#3B6D11" }
  // Longevidade — nível moderado
  if (/moderada|moderate/.test(t))                          return { bg: "#FFF8E7", text: "#8B6000", hover: "#8B6000" }
  // Longevidade — nível fraco
  if (/fraca|weak|curta/.test(t))                           return { bg: "#FCEBEB", text: "#A32D2D", hover: "#A32D2D" }
  // Sillage — forte
  if (/sillage.*(forte|enorme)|enormous|strong/.test(t))    return { bg: "#EAF3DE", text: "#3B6D11", hover: "#3B6D11" }
  // Sillage — moderado
  if (/sillage.*(moderada|soft)/.test(t))                   return { bg: "#FFF8E7", text: "#8B6000", hover: "#8B6000" }
  // Sillage — íntimo
  if (/sillage.*([ií]ntimo|intimate)/.test(t))              return { bg: "#F5EFE8", text: "#6B4A28", hover: "#6B4A28" }
  // Legado genérico
  if (/dura[çc]|lasting/.test(t))                           return { bg: "#EEFAF5", text: "#1E7848", hover: "#1E7848" }
  if (/forte|strong|sillage/.test(t))                       return { bg: "#FFF0E8", text: "#A04828", hover: "#A04828" }
  // Default
  return { bg: "#F0EDE8", text: "#6B5848", hover: "#4A3828" }
}

// ── Mapeamento família → slug do catálogo ────────────────────────────────

function slugDeFamilia(texto: string): string | null {
  const t = texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  const mapa: Record<string, string> = {
    citrico: "citrico", citrus: "citrico", citric: "citrico",
    floral: "floral",
    amadeirado: "amadeirado", woody: "amadeirado", wood: "amadeirado",
    oriental: "oriental", especiado: "oriental", spicy: "oriental",
    aquatico: "aquatico", aquatic: "aquatico", fresco: "aquatico", fresh: "aquatico",
    gourmand: "gourmand",
    fougere: "fougere",
    chypre: "chypre",
    aromatico: "aromatico", aromatic: "aromatico",
    couro: "couro", leather: "couro",
    verde: "verde", green: "verde",
  }
  return mapa[t] ?? null
}

// ── Componente ─────────────────────────────────────────────────────────────

interface Props {
  children: React.ReactNode
  cor?: "destaque" | "dourado"  // força cor explícita; omitir = auto por conteúdo
}

export default function TagInfo({ children, cor }: Props) {
  const [hover, setHover] = useState(false)

  const texto   = String(children ?? "")
  const familia = slugDeFamilia(texto)

  // Resolve cores: explícita ou automática por conteúdo
  let resolvedBg: string, resolvedText: string, resolvedHover: string
  if (cor === "destaque") {
    resolvedBg    = "transparent"
    resolvedText  = "var(--cor-destaque)"
    resolvedHover = "var(--cor-destaque)"
  } else if (cor === "dourado") {
    resolvedBg    = "transparent"
    resolvedText  = "var(--cor-dourado)"
    resolvedHover = "var(--cor-dourado)"
  } else {
    const c       = corDaTag(texto)
    resolvedBg    = c.bg
    resolvedText  = c.text
    resolvedHover = c.hover
  }

  const style: React.CSSProperties = {
    display: "inline-block",
    fontFamily: "var(--fonte-corpo)",
    fontSize: "0.68rem",
    fontWeight: 500,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    border: `1px solid ${hover ? resolvedHover : resolvedText}`,
    padding: "0.2rem 0.6rem",
    borderRadius: "var(--raio-borda)",
    cursor: familia ? "pointer" : "default",
    transition: "background-color 0.15s, color 0.15s, border-color 0.15s",
    backgroundColor: hover ? resolvedHover : resolvedBg,
    color: hover ? "#fff" : resolvedText,
    userSelect: "none",
    textDecoration: "none",
  }

  const handlers = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
  }

  if (familia) {
    return (
      <Link href={`/catalogo?familia=${familia}`} style={style} {...handlers}>
        {children}
      </Link>
    )
  }

  return <span style={style} {...handlers}>{children}</span>
}

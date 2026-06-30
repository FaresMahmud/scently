// ============================================
// ARQUIVO: components/perfume/CardPerfume.tsx
// O QUE FAZ: card de perfume para listagens — imagem em "palco" próprio,
//            marca como eyebrow editorial, nome em serif, meta discreta
// QUANDO MANDAR PRA IA: quando quiser mudar como os perfumes aparecem no catálogo
// DEPENDE DE: styles/globals.css, lib/utils.ts, lib/limparNomePerfume.ts
// ============================================

"use client"

import { useState } from "react"
import Link from "next/link"
import { slugify } from "@/lib/utils"
import { limparNomePerfume } from "@/lib/limparNomePerfume"

export interface DadosCardPerfume {
  id: string
  nome: string
  marca: string
  concentracao?: string
  familia?: string
  notas?: string[]
  // Full image fallback chain — mirrors PerfumeFragella fields
  imagem?: string
  imagemTransparente?: string
  imagemFallbacks?: string[]
  rating?: number   // rating Bayesian da Fragella (0–10)
}

interface PropsCardPerfume {
  perfume: DadosCardPerfume
}

/** Silhueta de flacon em traço fino — placeholder deliberado, não erro */
function FlaconPlaceholder() {
  return (
    <svg
      viewBox="0 0 89 144"
      width="55"
      height="89"
      fill="none"
      stroke="var(--cor-destaque)"
      strokeWidth="1"
      opacity="0.3"
      aria-hidden
    >
      {/* tampa */}
      <rect x="34" y="8" width="21" height="18" rx="1" />
      {/* gargalo */}
      <path d="M38 26 h13 v10 h-13 z" />
      {/* corpo */}
      <path d="M27 36 h35 c4 6 6 13 6 21 v68 a8 8 0 0 1 -8 8 H29 a8 8 0 0 1 -8 -8 V57 c0 -8 2 -15 6 -21 z" />
      {/* linha do líquido */}
      <path d="M23 76 h43" strokeDasharray="2 3" />
    </svg>
  )
}

export default function CardPerfume({ perfume }: PropsCardPerfume) {
  const href = `/perfume/${perfume.id}`
  const nomeLimpo = limparNomePerfume(perfume.nome, perfume.marca)

  // Build priority chain: transparent (.webp) → jpg → fallbacks → placeholder
  const srcs = [
    perfume.imagemTransparente,
    perfume.imagem,
    ...(perfume.imagemFallbacks ?? []),
  ].filter(Boolean) as string[]

  const [srcIndex, setSrcIndex] = useState(0)
  const [failed,   setFailed]   = useState(false)
  const [loaded,   setLoaded]   = useState(false)
  const showPlaceholder = failed || srcs.length === 0

  const handleError = () => {
    if (srcIndex < srcs.length - 1) {
      setSrcIndex(i => i + 1)
    } else {
      setFailed(true)
    }
  }

  // Meta discreta: família · concentração (texto, não caixas)
  const meta = [perfume.familia, perfume.concentracao].filter(Boolean).join(" · ")

  return (
    <article
      className="card-perfume"
      style={{
        backgroundColor: "var(--cor-card)",
        border: "1px solid var(--cor-borda)",
        borderRadius: "var(--raio-borda-suave)",
        overflow: "hidden",
      }}
    >
      {/* Palco da imagem — fundo distinto, frasco flutua com respiro */}
      <Link href={href} style={{ display: "block" }} aria-label={`${nomeLimpo} — ${perfume.marca}`}>
        <div
          style={{
            aspectRatio: "4 / 5",
            backgroundColor: "var(--cor-base)",
            borderBottom: "1px solid var(--cor-borda)",
            overflow: "hidden",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "21px",
          }}
        >
          {!showPlaceholder ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={srcs[srcIndex]}
              alt={`${nomeLimpo} — ${perfume.marca}`}
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={handleError}
              onLoad={() => setLoaded(true)}
              className="card-perfume-img"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                opacity: loaded ? 1 : 0,
              }}
            />
          ) : (
            <FlaconPlaceholder />
          )}
        </div>
      </Link>

      {/* Informações — ordem editorial: marca → nome → meta */}
      <div className="card-perfume-info">
        {/* Marca como eyebrow — pequenas capitulares espaçadas */}
        <Link
          href={`/marca/${slugify(perfume.marca)}`}
          className="link-marca card-perfume-brand"
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "44px",
            fontWeight: 500,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          {perfume.marca}
        </Link>

        {/* Nome do perfume — protagonista do card */}
        <Link href={href} style={{ display: "flex", alignItems: "center", minHeight: "44px", textDecoration: "none" }}>
          <h3 className="card-perfume-title">
            {nomeLimpo}
          </h3>
        </Link>

        {/* Meta discreta + prova social (rating) */}
        {(meta || (perfume.rating && perfume.rating > 0)) && (
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "8px" }}>
            {meta && (
              <span style={{
                fontFamily: "var(--fonte-corpo)",
                fontSize: "0.75rem",
                fontWeight: 300,
                color: "var(--cor-texto-suave)",
                letterSpacing: "0.04em",
              }}>
                {meta}
              </span>
            )}
            {perfume.rating != null && perfume.rating > 0 && (
              <span style={{
                fontFamily: "var(--fonte-corpo)",
                fontSize: "0.72rem",
                color: "var(--cor-dourado)",
                letterSpacing: "0.04em",
                marginLeft: "auto",
                whiteSpace: "nowrap",
              }}>
                ★ {perfume.rating.toFixed(1)}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

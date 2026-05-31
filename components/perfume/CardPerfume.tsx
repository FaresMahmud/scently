// ============================================
// ARQUIVO: components/perfume/CardPerfume.tsx
// O QUE FAZ: card de perfume para listagens — exibe imagem, nome, marca e família olfativa
// QUANDO MANDAR PRA IA: quando quiser mudar como os perfumes aparecem no catálogo
// DEPENDE DE: components/ui/Tag.tsx, styles/globals.css, lib/utils.ts
// ============================================

"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import Tag from "@/components/ui/Tag"
import { slugify } from "@/lib/utils"

export interface DadosCardPerfume {
  id: string
  nome: string
  marca: string
  concentracao?: string
  familia?: string
  notas?: string[]
  imagem?: string
  rating?: number   // rating Bayesian da Fragella (0–10)
}

interface PropsCardPerfume {
  perfume: DadosCardPerfume
}

export default function CardPerfume({ perfume }: PropsCardPerfume) {
  const [imgError, setImgError] = useState(false)
  const href = `/perfume/${slugify(perfume.nome)}-${slugify(perfume.marca)}`

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
      {/* Imagem — clica e vai para o perfume */}
      <Link href={href} style={{ display: "block" }}>
        <div
          style={{
            height: "200px",
            backgroundColor: "var(--cor-card)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {perfume.imagem && !imgError ? (
            <Image
              src={perfume.imagem}
              alt={`${perfume.nome} — ${perfume.marca}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 240px"
              style={{ objectFit: "cover" }}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
            />
          ) : (
            <div style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <span style={{
                fontFamily: "var(--fonte-titulo)",
                fontSize: "2rem",
                fontWeight: 300,
                color: "var(--cor-texto-suave)",
                letterSpacing: "0.1em",
              }}>
                {perfume.marca.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Informações do perfume */}
      <div style={{ padding: "21px" }}>
        {/* Família olfativa, concentração e rating */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "13px", flexWrap: "wrap", alignItems: "center" }}>
          {perfume.familia && <Tag>{perfume.familia}</Tag>}
          {perfume.concentracao && <Tag cor="dourado">{perfume.concentracao}</Tag>}
          {perfume.rating && perfume.rating > 0 && (
            <span style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.68rem", color: "var(--cor-dourado)", letterSpacing: "0.04em", marginLeft: "auto" }}>
              ★ {perfume.rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Nome do perfume — clica e vai para o perfume */}
        <Link href={href} style={{ display: "flex", alignItems: "center", minHeight: "44px", textDecoration: "none" }}>
          <h3
            style={{
              fontFamily: "var(--fonte-titulo)",
              fontWeight: 300,
              fontSize: "26px",
              marginBottom: "0.25rem",
              color: "var(--cor-texto)",
            }}
          >
            {perfume.nome}
          </h3>
        </Link>

        {/* Marca — clica e vai para a página da marca */}
        <Link
          href={`/marca/${slugify(perfume.marca)}`}
          className="link-marca"
          style={{ display: "inline-flex", alignItems: "center", minHeight: "44px" }}
        >
          {perfume.marca}
        </Link>
      </div>
    </article>
  )
}

// ============================================
// ARQUIVO: components/perfume/CardPerfume.tsx
// O QUE FAZ: card de perfume para listagens — exibe imagem, nome, marca e família olfativa
// QUANDO MANDAR PRA IA: quando quiser mudar como os perfumes aparecem no catálogo
// DEPENDE DE: components/ui/Tag.tsx, styles/globals.css, lib/utils.ts
// ============================================

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
      <Link href={`/perfume/${perfume.id}`} style={{ display: "block" }}>
        <div
          style={{
            height: "200px",
            backgroundColor: "var(--cor-card)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {perfume.imagem ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={perfume.imagem}
              alt={`${perfume.nome} — ${perfume.marca}`}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            // Placeholder minimalista: letra + linha de etiqueta + nome da marca
            <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontFamily: "var(--fonte-titulo)", fontSize: "4rem", fontWeight: 300, color: "var(--cor-texto-suave)", opacity: 0.12, lineHeight: 1, marginBottom: "1rem" }}>
                {perfume.marca.charAt(0)}
              </p>
              <div style={{ width: "48px", height: "1px", backgroundColor: "var(--cor-borda)", marginBottom: "0.75rem" }} />
              <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cor-texto-suave)", opacity: 0.35 }}>
                {perfume.marca}
              </p>
            </div>
          )}
        </div>
      </Link>

      {/* Informações do perfume */}
      <div style={{ padding: "1.25rem" }}>
        {/* Família olfativa, concentração e rating */}
        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          {perfume.familia && <Tag>{perfume.familia}</Tag>}
          {perfume.concentracao && <Tag cor="dourado">{perfume.concentracao}</Tag>}
          {perfume.rating && perfume.rating > 0 && (
            <span style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.68rem", color: "var(--cor-dourado)", letterSpacing: "0.04em", marginLeft: "auto" }}>
              ★ {perfume.rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Nome do perfume — clica e vai para o perfume */}
        <Link href={`/perfume/${perfume.id}`} style={{ display: "block", textDecoration: "none" }}>
          <h3
            style={{
              fontFamily: "var(--fonte-titulo)",
              fontWeight: 300,
              fontSize: "1.2rem",
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
        >
          {perfume.marca}
        </Link>
      </div>
    </article>
  )
}

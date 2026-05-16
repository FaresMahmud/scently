// ============================================
// ARQUIVO: components/perfume/CardPerfume.tsx
// O QUE FAZ: card de perfume para listagens — exibe imagem, nome, marca e família olfativa
// QUANDO MANDAR PRA IA: quando quiser mudar como os perfumes aparecem no catálogo
// DEPENDE DE: components/ui/Tag.tsx, styles/globals.css
// ============================================

import Link from "next/link"
import Tag from "@/components/ui/Tag"

export interface DadosCardPerfume {
  id: string
  nome: string
  marca: string
  concentracao?: string
  familia?: string
  notas?: string[]
  imagem?: string
}

interface PropsCardPerfume {
  perfume: DadosCardPerfume
}

export default function CardPerfume({ perfume }: PropsCardPerfume) {
  return (
    <Link
      href={`/perfume/${perfume.id}`}
      style={{ display: "block", textDecoration: "none" }}
    >
      <article
        style={{
          backgroundColor: "var(--cor-card)",
          border: "1px solid var(--cor-borda)",
          borderRadius: "var(--raio-borda-suave)",
          overflow: "hidden",
          transition: "border-color 0.2s",
        }}
      >
        {/* Área da imagem — placeholder elegante quando não há foto */}
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
              {/* Letra inicial */}
              <p style={{ fontFamily: "var(--fonte-titulo)", fontSize: "4rem", fontWeight: 300, color: "var(--cor-texto-suave)", opacity: 0.12, lineHeight: 1, marginBottom: "1rem" }}>
                {perfume.marca.charAt(0)}
              </p>
              {/* Linha de etiqueta */}
              <div style={{ width: "48px", height: "1px", backgroundColor: "var(--cor-borda)", marginBottom: "0.75rem" }} />
              {/* Nome da marca */}
              <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cor-texto-suave)", opacity: 0.35 }}>
                {perfume.marca}
              </p>
            </div>
          )}
        </div>

        {/* Informações do perfume */}
        <div style={{ padding: "1.25rem" }}>
          {/* Família olfativa e concentração */}
          <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
            {perfume.familia && <Tag>{perfume.familia}</Tag>}
            {perfume.concentracao && <Tag cor="dourado">{perfume.concentracao}</Tag>}
          </div>

          {/* Nome do perfume */}
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

          {/* Marca */}
          <p
            style={{
              fontFamily: "var(--fonte-corpo)",
              fontSize: "0.8rem",
              color: "var(--cor-texto-suave)",
              fontWeight: 300,
            }}
          >
            {perfume.marca}
          </p>
        </div>
      </article>
    </Link>
  )
}

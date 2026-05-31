interface Props {
  ultimaAtualizacao: string // ISO date string — serialized from server
}

function formatarData(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime()) || d.getFullYear() < 2000) return "curadoria editorial"
  return d.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default function HeroTendencias({ ultimaAtualizacao }: Props) {
  const dataFormatada = formatarData(ultimaAtualizacao)

  return (
    <section
      style={{
        backgroundColor: "#1A1A18",
        color: "#F5F2ED",
        padding: "89px 0",
      }}
    >
      <div className="container-site">
        {/* Eyebrow */}
        <p
          style={{
            fontFamily: "var(--fonte-corpo)",
            fontSize: "0.72rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "#C4714A",
            marginBottom: "21px",
          }}
        >
          tendências · nozze
        </p>

        {/* Main title */}
        <h1
          style={{
            fontFamily: "var(--fonte-titulo)",
            fontWeight: 300,
            fontSize: "clamp(42px, 8vw, 68px)",
            lineHeight: 1.05,
            letterSpacing: "-0.01em",
            color: "#F5F2ED",
            maxWidth: "760px",
            marginBottom: "34px",
          }}
        >
          O que o mundo está usando agora.
        </h1>

        {/* Divider */}
        <div
          style={{
            width: "55px",
            height: "1px",
            backgroundColor: "#C4714A",
            marginBottom: "34px",
          }}
        />

        {/* Metadata row */}
        <div
          style={{
            display: "flex",
            gap: "34px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <p
            style={{
              fontFamily: "var(--fonte-corpo)",
              fontSize: "16px",
              color: "rgba(245,242,237,0.55)",
            }}
          >
            Atualizado em{" "}
            <span style={{ color: "rgba(245,242,237,0.8)" }}>{dataFormatada}</span>
          </p>
          <p
            style={{
              fontFamily: "var(--fonte-corpo)",
              fontSize: "16px",
              color: "rgba(245,242,237,0.55)",
            }}
          >
            Fontes: Sephora · Fragrantica · curadoria Nozze
          </p>
        </div>
      </div>
    </section>
  )
}

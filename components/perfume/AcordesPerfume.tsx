// ============================================
// ARQUIVO: components/perfume/AcordesPerfume.tsx
// O QUE FAZ: exibe barras horizontais com os acordes (características) principais do perfume
// QUANDO MANDAR PRA IA: quando quiser mudar o visual das barras de acordes
// DEPENDE DE: styles/globals.css
// ============================================

export interface Acorde {
  nome: string
  porcentagem: number  // 0 a 100 — define o comprimento da barra
}

interface PropsAcordes {
  acordes: Acorde[]
}

export default function AcordesPerfume({ acordes }: PropsAcordes) {
  if (!acordes?.length) return null

  // Ordena do mais alto para o mais baixo
  const ordenados = [...acordes].sort((a, b) => b.porcentagem - a.porcentagem)

  return (
    <section>
      <h3
        style={{
          fontFamily: "var(--fonte-titulo)",
          fontWeight: 300,
          fontSize: "1.3rem",
          marginBottom: "1.5rem",
        }}
      >
        Acordes principais
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        {ordenados.map((acorde) => (
          <div key={acorde.nome}>
            {/* Nome do acorde e porcentagem */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.3rem",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--fonte-corpo)",
                  fontSize: "0.82rem",
                  color: "var(--cor-texto)",
                  fontWeight: 400,
                }}
              >
                {acorde.nome}
              </span>
              <span
                style={{
                  fontFamily: "var(--fonte-corpo)",
                  fontSize: "0.72rem",
                  color: "var(--cor-texto-suave)",
                }}
              >
                {acorde.porcentagem}%
              </span>
            </div>

            {/* Trilho + barra preenchida */}
            <div
              style={{
                height: "3px",
                backgroundColor: "var(--cor-borda)",
                borderRadius: "2px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${acorde.porcentagem}%`,
                  // Gradiente sutil do destaque para o dourado baseado na intensidade
                  backgroundColor:
                    acorde.porcentagem > 70 ? "var(--cor-destaque)" : "var(--cor-dourado)",
                  borderRadius: "2px",
                  transition: "width 0.6s ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ============================================
// ARQUIVO: components/perfume/NotasPerfume.tsx
// O QUE FAZ: exibe a pirâmide olfativa — notas de topo, coração e fundo
// QUANDO MANDAR PRA IA: quando quiser mudar como as notas aparecem na página do perfume
// DEPENDE DE: styles/globals.css
// ============================================

interface PropsNotasPerfume {
  notasTopo?: string[]
  notasCoracao?: string[]
  notasFundo?: string[]
}

// Cada camada da pirâmide tem um rótulo e uma cor diferente
const camadas = [
  {
    chave: "topo" as const,
    rotulo: "Topo",
    descricao: "primeira impressão",
    cor: "var(--cor-destaque)",
  },
  {
    chave: "coracao" as const,
    rotulo: "Coração",
    descricao: "a essência",
    cor: "var(--cor-dourado)",
  },
  {
    chave: "fundo" as const,
    rotulo: "Fundo",
    descricao: "o que fica",
    cor: "var(--cor-texto-suave)",
  },
]

export default function NotasPerfume({ notasTopo, notasCoracao, notasFundo }: PropsNotasPerfume) {
  const notas = {
    topo: notasTopo ?? [],
    coracao: notasCoracao ?? [],
    fundo: notasFundo ?? [],
  }

  // Não renderiza se não tiver nenhuma nota
  if (!notasTopo?.length && !notasCoracao?.length && !notasFundo?.length) return null

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
        Pirâmide olfativa
      </h3>

      {/* Cada camada da pirâmide */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {camadas.map((camada) => {
          const notasDaCamada = notas[camada.chave]
          if (!notasDaCamada.length) return null

          return (
            <div key={camada.chave} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              {/* Rótulo da camada */}
              <div style={{ minWidth: "80px" }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: camada.cor }}>
                  {camada.rotulo}
                </p>
                <p style={{ fontSize: "0.65rem", color: "var(--cor-texto-suave)", marginTop: "0.1rem" }}>
                  {camada.descricao}
                </p>
              </div>

              {/* Notas da camada */}
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {notasDaCamada.map((nota) => (
                  <span
                    key={nota}
                    style={{
                      fontFamily: "var(--fonte-corpo)",
                      fontSize: "0.8rem",
                      color: "var(--cor-texto)",
                      backgroundColor: "var(--cor-base)",
                      border: "1px solid var(--cor-borda)",
                      padding: "0.3rem 0.75rem",
                      borderRadius: "2rem",
                    }}
                  >
                    {nota}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

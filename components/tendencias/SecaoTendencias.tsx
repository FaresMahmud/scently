interface Props {
  titulo: string
  subtitulo?: string
  children: React.ReactNode
  scrollHorizontal?: boolean
  fundoAlternativo?: boolean
}

export default function SecaoTendencias({
  titulo,
  subtitulo,
  children,
  scrollHorizontal = false,
  fundoAlternativo = false,
}: Props) {
  return (
    <section
      style={{
        backgroundColor: fundoAlternativo ? "var(--cor-card)" : "var(--cor-base)",
        borderTop: "1px solid var(--cor-borda)",
        borderBottom: "1px solid var(--cor-borda)",
      }}
    >
      <div className="container-site" style={{ paddingTop: "89px", paddingBottom: "89px" }}>
        {/* Section header */}
        <div style={{ marginBottom: "55px" }}>
          <h2
            style={{
              fontFamily: "var(--fonte-titulo)",
              fontWeight: 300,
              fontSize: "42px",
              lineHeight: 1.1,
              marginBottom: subtitulo ? "13px" : "0",
            }}
          >
            {titulo}
          </h2>
          {subtitulo && (
            <p
              style={{
                fontFamily: "var(--fonte-corpo)",
                fontSize: "16px",
                color: "var(--cor-texto-suave)",
                maxWidth: "520px",
                lineHeight: 1.6,
              }}
            >
              {subtitulo}
            </p>
          )}
        </div>

        {/* Content — horizontal scroll on mobile, grid on desktop */}
        {scrollHorizontal ? (
          <>
            {/* Mobile: horizontal scroll with snap */}
            <div
              className="secao-scroll-mobile"
              style={{
                display: "flex",
                gap: "21px",
                overflowX: "auto",
                scrollSnapType: "x mandatory",
                WebkitOverflowScrolling: "touch",
                paddingBottom: "13px",
                // Hide scrollbar visually
                scrollbarWidth: "none",
              }}
            >
              {children}
            </div>
            <style>{`
              .secao-scroll-mobile::-webkit-scrollbar { display: none; }
              @media (min-width: 768px) {
                .secao-scroll-mobile {
                  display: grid !important;
                  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                  overflow-x: visible;
                  scroll-snap-type: none;
                }
              }
            `}</style>
          </>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "34px",
            }}
          >
            {children}
          </div>
        )}
      </div>
    </section>
  )
}

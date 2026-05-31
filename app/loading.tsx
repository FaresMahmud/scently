// ============================================
// ARQUIVO: app/loading.tsx
// O QUE FAZ: tela de carregamento exibida enquanto qualquer página do site carrega
// QUANDO MANDAR PRA IA: quando quiser mudar o visual do loading
// DEPENDE DE: styles/globals.css
// ============================================

export default function Carregando() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "50vh",
        flexDirection: "column",
        gap: "21px",
      }}
    >
      {/* Nome do site pulsando */}
      <p
        style={{
          fontFamily: "var(--fonte-titulo)",
          fontSize: "26px",
          fontWeight: 300,
          letterSpacing: "0.15em",
          color: "var(--cor-texto-suave)",
          animation: "fadeIn 1s infinite alternate",
        }}
      >
        nozze
      </p>

      {/* Linha animada */}
      <div
        style={{
          width: "40px",
          height: "1px",
          backgroundColor: "var(--cor-destaque)",
          animation: "fadeIn 0.6s 0.3s infinite alternate",
        }}
      />
    </div>
  )
}

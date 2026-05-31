"use client"

// ============================================
// ARQUIVO: components/ui/Botao.tsx
// O QUE FAZ: botão reutilizável em três estilos — primário (terracota), secundário (borda) e fantasma (só texto)
// QUANDO MANDAR PRA IA: quando quiser mudar o visual dos botões do site inteiro
// DEPENDE DE: styles/globals.css
// ============================================

import { ButtonHTMLAttributes, forwardRef } from "react"

type Variante = "primario" | "secundario" | "fantasma"
type Tamanho = "pequeno" | "normal" | "grande"

interface PropsBotao extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  tamanho?: Tamanho
  larguraTotal?: boolean
}

// Estilos de cada variante visual
const estilosVariante: Record<Variante, React.CSSProperties> = {
  primario: {
    backgroundColor: "var(--cor-destaque)",
    color: "#fff",
    border: "1px solid var(--cor-destaque)",
  },
  secundario: {
    backgroundColor: "transparent",
    color: "var(--cor-texto)",
    border: "1px solid var(--cor-borda)",
  },
  fantasma: {
    backgroundColor: "transparent",
    color: "var(--cor-destaque)",
    border: "none",
    padding: 0,
    letterSpacing: "normal",
  },
}

// Tamanhos de padding e fonte
const estilosTamanho: Record<Tamanho, React.CSSProperties> = {
  pequeno: { fontSize: "0.75rem", padding: "0.5rem 1.2rem", minHeight: "44px" },
  normal:  { fontSize: "0.875rem", padding: "0.875rem 2rem", minHeight: "44px" },
  grande:  { fontSize: "1rem", padding: "1.1rem 2.75rem", minHeight: "44px" },
}

const Botao = forwardRef<HTMLButtonElement, PropsBotao>(function Botao(
  { variante = "primario", tamanho = "normal", larguraTotal, children, style, ...resto },
  ref
) {
  return (
    <button
      ref={ref}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        fontFamily: "var(--fonte-corpo)",
        fontWeight: 500,
        letterSpacing: "0.07em",
        borderRadius: "var(--raio-borda)",
        cursor: "pointer",
        transition: "opacity 0.2s, background-color 0.2s",
        width: larguraTotal ? "100%" : undefined,
        ...estilosVariante[variante],
        ...estilosTamanho[tamanho],
        ...style,
      }}
      {...resto}
    >
      {children}
    </button>
  )
})

export default Botao

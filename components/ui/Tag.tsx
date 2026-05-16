// ============================================
// ARQUIVO: components/ui/Tag.tsx
// O QUE FAZ: etiqueta pequena para exibir família olfativa, concentração, etc.
// QUANDO MANDAR PRA IA: quando quiser mudar o visual das etiquetas
// DEPENDE DE: styles/globals.css
// ============================================

import { HTMLAttributes } from "react"

interface PropsTag extends HTMLAttributes<HTMLSpanElement> {
  cor?: "padrao" | "destaque" | "dourado"
}

const coresTag = {
  padrao:   { color: "var(--cor-texto-suave)", borderColor: "var(--cor-borda)" },
  destaque: { color: "var(--cor-destaque)",    borderColor: "var(--cor-destaque)" },
  dourado:  { color: "var(--cor-dourado)",     borderColor: "var(--cor-dourado)" },
}

export default function Tag({ cor = "padrao", children, style, ...resto }: PropsTag) {
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: "var(--fonte-corpo)",
        fontSize: "0.68rem",
        fontWeight: 500,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        border: "1px solid",
        padding: "0.2rem 0.6rem",
        borderRadius: "var(--raio-borda)",
        ...coresTag[cor],
        ...style,
      }}
      {...resto}
    >
      {children}
    </span>
  )
}

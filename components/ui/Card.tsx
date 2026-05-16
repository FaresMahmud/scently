// ============================================
// ARQUIVO: components/ui/Card.tsx
// O QUE FAZ: container com borda suave usado em cards de perfume, resultado do consultor etc.
// QUANDO MANDAR PRA IA: quando quiser mudar o estilo geral dos cards
// DEPENDE DE: styles/globals.css
// ============================================

import { HTMLAttributes } from "react"

interface PropsCard extends HTMLAttributes<HTMLDivElement> {
  destaque?: boolean  // borda terracota quando true — usado no resultado principal
  semPadding?: boolean
}

export default function Card({ destaque, semPadding, children, style, ...resto }: PropsCard) {
  return (
    <div
      style={{
        backgroundColor: "var(--cor-card)",
        border: destaque
          ? "1px solid var(--cor-destaque)"
          : "1px solid var(--cor-borda)",
        borderRadius: "var(--raio-borda-suave)",
        padding: semPadding ? 0 : "1.75rem",
        ...style,
      }}
      {...resto}
    >
      {children}
    </div>
  )
}

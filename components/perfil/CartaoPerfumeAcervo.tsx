"use client"

import { useState } from "react"

export interface ItemAcervo {
  id: string
  perfumeId: string
  perfumeName: string
  brand: string
  status: "TENHO" | "JA_SENTI_GOSTEI" | "QUERO_EXPERIMENTAR"
  rating: number | null
  notes: string | null
  addedAt: string
}

const STATUS_LABEL: Record<ItemAcervo["status"], string> = {
  TENHO:              "Tenho",
  JA_SENTI_GOSTEI:   "Já senti e gostei",
  QUERO_EXPERIMENTAR:"Quero experimentar",
}

const STATUS_COLOR: Record<ItemAcervo["status"], { bg: string; text: string }> = {
  TENHO:              { bg: "rgba(196,113,74,0.12)", text: "var(--cor-destaque)" },
  JA_SENTI_GOSTEI:   { bg: "rgba(201,168,76,0.12)", text: "#C9A84C" },
  QUERO_EXPERIMENTAR:{ bg: "rgba(74,74,71,0.08)",   text: "var(--cor-texto-suave)" },
}

function Dots({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: "3px" }}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            backgroundColor: i < value ? "var(--cor-destaque)" : "var(--cor-borda)",
          }}
        />
      ))}
    </span>
  )
}

interface Props {
  item: ItemAcervo
  onRemove: (perfumeId: string) => void
  onEdit:   (item: ItemAcervo) => void
}

export default function CartaoPerfumeAcervo({ item, onRemove, onEdit }: Props) {
  const [removing, setRemoving] = useState(false)
  const sc = STATUS_COLOR[item.status]

  async function handleRemove() {
    if (!confirm(`Remover "${item.perfumeName}" do acervo?`)) return
    setRemoving(true)
    try {
      await fetch(`/api/perfil/acervo/${encodeURIComponent(item.perfumeId)}`, { method: "DELETE" })
      onRemove(item.perfumeId)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div
      style={{
        backgroundColor: "var(--cor-card)",
        border: "1px solid var(--cor-borda)",
        borderRadius: "var(--raio-borda-suave)",
        padding: "21px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      {/* Status badge */}
      <span
        style={{
          display: "inline-block",
          fontSize: "0.68rem",
          fontWeight: 500,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          backgroundColor: sc.bg,
          color: sc.text,
          padding: "3px 8px",
          borderRadius: "2px",
          alignSelf: "flex-start",
        }}
      >
        {STATUS_LABEL[item.status]}
      </span>

      {/* Name + brand */}
      <div>
        <p
          style={{
            fontFamily: "var(--fonte-titulo)",
            fontWeight: 300,
            fontSize: "26px",
            lineHeight: 1.1,
          }}
        >
          {item.perfumeName}
        </p>
        <p style={{ fontSize: "0.78rem", color: "var(--cor-texto-suave)", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: "4px" }}>
          {item.brand}
        </p>
      </div>

      {/* Rating */}
      {item.rating !== null && item.rating > 0 && (
        <Dots value={item.rating} />
      )}

      {/* Notes */}
      {item.notes && (
        <p style={{ fontSize: "0.82rem", color: "var(--cor-texto-suave)", lineHeight: 1.5, fontStyle: "italic" }}>
          "{item.notes}"
        </p>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "13px", marginTop: "8px" }}>
        <button
          onClick={() => onEdit(item)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--fonte-corpo)",
            fontSize: "0.78rem",
            color: "var(--cor-destaque)",
            padding: "8px 0",
            minHeight: "44px",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          Editar
        </button>
        <button
          onClick={handleRemove}
          disabled={removing}
          style={{
            background: "none",
            border: "none",
            cursor: removing ? "not-allowed" : "pointer",
            fontFamily: "var(--fonte-corpo)",
            fontSize: "0.78rem",
            color: "var(--cor-texto-suave)",
            padding: "8px 0",
            minHeight: "44px",
            display: "inline-flex",
            alignItems: "center",
            opacity: removing ? 0.5 : 1,
          }}
        >
          Remover
        </button>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect, useRef } from "react"
import type { ItemAcervo } from "./CartaoPerfumeAcervo"

interface ResultadoBusca {
  id: string
  nome: string
  marca: string
  concentracao: string | null
}

interface Props {
  onClose:  () => void
  onSalvar: (item: Omit<ItemAcervo, "id" | "addedAt">) => void
  inicial?: ItemAcervo | null  // set when editing existing entry
}

function Dots({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", gap: "8px" }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(value === n ? 0 : n)}
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            backgroundColor: n <= value ? "var(--cor-destaque)" : "var(--cor-borda)",
            transition: "background-color 0.15s",
          }}
        />
      ))}
    </div>
  )
}

export default function ModalAdicionarPerfume({ onClose, onSalvar, inicial }: Props) {
  const [query,    setQuery]    = useState(inicial ? `${inicial.perfumeName} ${inicial.brand}` : "")
  const [results,  setResults]  = useState<ResultadoBusca[]>([])
  const [selected, setSelected] = useState<ResultadoBusca | null>(
    inicial ? { id: inicial.perfumeId, nome: inicial.perfumeName, marca: inicial.brand, concentracao: null } : null
  )
  const [status, setStatus] = useState<ItemAcervo["status"]>(inicial?.status ?? "QUERO_EXPERIMENTAR")
  const [rating, setRating] = useState(inicial?.rating ?? 0)
  const [notes,  setNotes]  = useState(inicial?.notes ?? "")
  const [saving, setSaving] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (selected || query.length < 2) { setResults([]); return }
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      const res = await fetch(`/api/perfil/buscar?q=${encodeURIComponent(query)}&limit=8`)
      if (res.ok) {
        const data = await res.json() as { results: ResultadoBusca[] }
        setResults(data.results)
      }
    }, 300)
  }, [query, selected])

  function handleSelect(r: ResultadoBusca) {
    setSelected(r)
    setQuery(`${r.nome} — ${r.marca}`)
    setResults([])
  }

  const canSave = !!(selected && status)
  const showRating = status === "TENHO" || status === "JA_SENTI_GOSTEI"

  async function handleSalvar() {
    if (!selected || !canSave) return
    setSaving(true)
    try {
      onSalvar({
        perfumeId:   selected.id,
        perfumeName: selected.nome,
        brand:       selected.marca,
        status,
        rating:      showRating ? rating || null : null,
        notes:       notes.trim() || null,
      })
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    fontFamily: "var(--fonte-corpo)",
    fontSize: "16px",
    color: "var(--cor-texto)",
    backgroundColor: "var(--cor-card)",
    border: "1px solid var(--cor-borda)",
    borderRadius: "var(--raio-borda-suave)",
    padding: "0 21px",
    height: "44px",
    outline: "none",
    boxSizing: "border-box",
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--fonte-corpo)",
    fontSize: "0.72rem",
    fontWeight: 500,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "var(--cor-texto-suave)",
    display: "block",
    marginBottom: "8px",
  }

  const STATUS_OPTIONS: { value: ItemAcervo["status"]; label: string }[] = [
    { value: "TENHO",              label: "Tenho" },
    { value: "JA_SENTI_GOSTEI",   label: "Já senti e gostei" },
    { value: "QUERO_EXPERIMENTAR", label: "Quero experimentar" },
  ]

  return (
    /* Overlay */
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(26,26,24,0.5)",
        zIndex: 100,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "0",
      }}
    >
      {/* Sheet */}
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          backgroundColor: "var(--cor-base)",
          borderRadius: "var(--raio-borda-suave) var(--raio-borda-suave) 0 0",
          padding: "34px 21px",
          display: "flex",
          flexDirection: "column",
          gap: "21px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "26px" }}>
            {inicial ? "Editar perfume" : "Adicionar ao acervo"}
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", minHeight: "44px", minWidth: "44px", fontSize: "1.2rem", color: "var(--cor-texto-suave)", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ×
          </button>
        </div>

        {/* Search */}
        {!inicial && (
          <div style={{ position: "relative" }}>
            <label style={labelStyle}>Buscar perfume</label>
            <input
              type="text"
              placeholder="Nome ou marca..."
              value={query}
              onChange={e => { setQuery(e.target.value); setSelected(null) }}
              style={inputStyle}
              autoFocus
            />
            {results.length > 0 && (
              <ul
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "var(--cor-card)",
                  border: "1px solid var(--cor-borda)",
                  borderRadius: "var(--raio-borda-suave)",
                  marginTop: "4px",
                  listStyle: "none",
                  padding: 0,
                  zIndex: 10,
                  maxHeight: "220px",
                  overflowY: "auto",
                }}
              >
                {results.map(r => (
                  <li key={r.id}>
                    <button
                      onClick={() => handleSelect(r)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        borderBottom: "1px solid var(--cor-borda)",
                        padding: "13px 21px",
                        cursor: "pointer",
                        fontFamily: "var(--fonte-corpo)",
                        minHeight: "44px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                      }}
                    >
                      <span style={{ fontSize: "0.9rem", color: "var(--cor-texto)" }}>{r.nome}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--cor-texto-suave)" }}>{r.marca}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Status picker */}
        <div>
          <label style={labelStyle}>Status</label>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                style={{
                  textAlign: "left",
                  fontFamily: "var(--fonte-corpo)",
                  fontSize: "0.9rem",
                  padding: "0 21px",
                  height: "44px",
                  borderRadius: "var(--raio-borda-suave)",
                  border: status === opt.value ? "1.5px solid var(--cor-destaque)" : "1px solid var(--cor-borda)",
                  backgroundColor: status === opt.value ? "rgba(196,113,74,0.06)" : "var(--cor-card)",
                  color: "var(--cor-texto)",
                  cursor: "pointer",
                  transition: "border-color 0.15s, background-color 0.15s",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rating */}
        {showRating && (
          <div>
            <label style={labelStyle}>Avaliação (opcional)</label>
            <Dots value={rating} onChange={setRating} />
          </div>
        )}

        {/* Notes */}
        <div>
          <label style={labelStyle}>Anotação pessoal (opcional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value.slice(0, 280))}
            placeholder="O que você pensa sobre este perfume..."
            style={{
              width: "100%",
              fontFamily: "var(--fonte-corpo)",
              fontSize: "16px",
              color: "var(--cor-texto)",
              backgroundColor: "var(--cor-card)",
              border: "1px solid var(--cor-borda)",
              borderRadius: "var(--raio-borda-suave)",
              padding: "13px 21px",
              outline: "none",
              resize: "vertical",
              minHeight: "88px",
              boxSizing: "border-box",
            }}
          />
          <p style={{ fontSize: "0.68rem", color: "var(--cor-texto-suave)", textAlign: "right", marginTop: "4px" }}>
            {notes.length}/280
          </p>
        </div>

        {/* Save */}
        <button
          onClick={handleSalvar}
          disabled={!canSave || saving}
          style={{
            width: "100%",
            minHeight: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--fonte-corpo)",
            fontSize: "0.875rem",
            fontWeight: 500,
            letterSpacing: "0.07em",
            backgroundColor: canSave ? "var(--cor-destaque)" : "var(--cor-borda)",
            color: canSave ? "#fff" : "var(--cor-texto-suave)",
            border: "none",
            borderRadius: "var(--raio-borda)",
            cursor: canSave ? "pointer" : "not-allowed",
            transition: "background-color 0.2s",
          }}
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </div>
  )
}

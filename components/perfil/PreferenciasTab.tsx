"use client"

import { useState } from "react"

export interface Preferencias {
  favoriteNotes:     string[]
  avoidNotes:        string[]
  favoriteOccasions: string[]
  favoriteFamilies:  string[]
  intensity:         "LEVE" | "MODERADO" | "INTENSO" | "QUALQUER"
  updatedAt:         string | null
}

interface Props {
  inicial: Preferencias
}

const NOTAS = [
  "Cítrico", "Floral", "Rosa", "Jasmim", "Amadeirado", "Sândalo", "Cedro",
  "Ambarado", "Almiscarado", "Baunilha", "Especiado", "Pimenta",
  "Frutal", "Verde", "Aquático", "Couro", "Gourmand", "Defumado",
  "Balsâmico", "Terroso", "Mentolado", "Oud",
]

const OCASIOES = [
  { valor: "casual",      rotulo: "Casual / dia a dia" },
  { valor: "trabalho",    rotulo: "Trabalho / reuniões" },
  { valor: "romantico",   rotulo: "Encontro romântico" },
  { valor: "festa",       rotulo: "Festa / balada" },
  { valor: "sport",       rotulo: "Academia / esporte" },
  { valor: "praia",       rotulo: "Praia / verão" },
  { valor: "inverno",     rotulo: "Clima frio" },
  { valor: "noturno",     rotulo: "Noite em geral" },
]

const FAMILIAS = [
  "Floral", "Amadeirado", "Oriental", "Cítrico", "Aquático",
  "Gourmand", "Fougère", "Chypre", "Aromático", "Couro", "Verde", "Especiado",
]

const INTENSIDADES: { valor: Preferencias["intensity"]; rotulo: string; desc: string }[] = [
  { valor: "LEVE",      rotulo: "Leve",     desc: "Discreto, só quem está perto sente" },
  { valor: "MODERADO",  rotulo: "Moderado", desc: "Equilibrado, perceptível" },
  { valor: "INTENSO",   rotulo: "Intenso",  desc: "Marcante, deixa rastro" },
  { valor: "QUALQUER",  rotulo: "Qualquer", desc: "Sem preferência" },
]

function Toggle({
  label, ativo, onClick,
}: { label: string; ativo: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: "var(--fonte-corpo)",
        fontSize: "0.82rem",
        padding: "0 13px",
        minHeight: "44px",
        borderRadius: "var(--raio-borda-suave)",
        border: ativo ? "1.5px solid var(--cor-destaque)" : "1px solid var(--cor-borda)",
        backgroundColor: ativo ? "rgba(196,113,74,0.08)" : "var(--cor-card)",
        color: ativo ? "var(--cor-destaque)" : "var(--cor-texto-suave)",
        cursor: "pointer",
        transition: "border-color 0.15s, background-color 0.15s, color 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  )
}

export default function PreferenciasTab({ inicial }: Props) {
  const [pref, setPref] = useState<Preferencias>(inicial)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  function toggleArray(field: keyof Preferencias, valor: string) {
    setPref(prev => {
      const arr = prev[field] as string[]
      return {
        ...prev,
        [field]: arr.includes(valor) ? arr.filter(v => v !== valor) : [...arr, valor],
      }
    })
  }

  async function handleSalvar() {
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const res = await fetch("/api/perfil/preferencias", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pref),
      })
      if (!res.ok) { setError("Erro ao salvar. Tente novamente."); return }
      const { pref: salvo } = await res.json() as { pref: { updatedAt: string } }
      setPref(prev => ({ ...prev, updatedAt: salvo.updatedAt }))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  const sectionTitle: React.CSSProperties = {
    fontFamily: "var(--fonte-titulo)",
    fontWeight: 300,
    fontSize: "26px",
    marginBottom: "13px",
  }

  const sectionDesc: React.CSSProperties = {
    fontFamily: "var(--fonte-corpo)",
    fontSize: "0.82rem",
    color: "var(--cor-texto-suave)",
    marginBottom: "21px",
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "55px" }}>

      {/* Notas favoritas */}
      <section>
        <h2 style={sectionTitle}>Notas que ama</h2>
        <p style={sectionDesc}>Selecione as notas olfativas que você mais gosta.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {NOTAS.map(n => (
            <Toggle
              key={n}
              label={n}
              ativo={pref.favoriteNotes.includes(n)}
              onClick={() => toggleArray("favoriteNotes", n)}
            />
          ))}
        </div>
      </section>

      {/* Notas a evitar */}
      <section>
        <h2 style={sectionTitle}>Notas que evita</h2>
        <p style={sectionDesc}>Notas que você não gosta ou tem alergia.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {NOTAS.map(n => (
            <Toggle
              key={n}
              label={n}
              ativo={pref.avoidNotes.includes(n)}
              onClick={() => toggleArray("avoidNotes", n)}
            />
          ))}
        </div>
      </section>

      {/* Ocasiões */}
      <section>
        <h2 style={sectionTitle}>Ocasiões favoritas</h2>
        <p style={sectionDesc}>Quando você mais usa perfume?</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {OCASIOES.map(o => (
            <Toggle
              key={o.valor}
              label={o.rotulo}
              ativo={pref.favoriteOccasions.includes(o.valor)}
              onClick={() => toggleArray("favoriteOccasions", o.valor)}
            />
          ))}
        </div>
      </section>

      {/* Famílias */}
      <section>
        <h2 style={sectionTitle}>Famílias olfativas</h2>
        <p style={sectionDesc}>Quais estilos de fragrância você prefere?</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {FAMILIAS.map(f => (
            <Toggle
              key={f}
              label={f}
              ativo={pref.favoriteFamilies.includes(f)}
              onClick={() => toggleArray("favoriteFamilies", f)}
            />
          ))}
        </div>
      </section>

      {/* Intensidade */}
      <section>
        <h2 style={sectionTitle}>Intensidade preferida</h2>
        <p style={sectionDesc}>Quão marcante você quer que seu perfume seja?</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {INTENSIDADES.map(opt => (
            <button
              key={opt.valor}
              type="button"
              onClick={() => setPref(prev => ({ ...prev, intensity: opt.valor }))}
              style={{
                textAlign: "left",
                fontFamily: "var(--fonte-corpo)",
                padding: "0 21px",
                height: "54px",
                borderRadius: "var(--raio-borda-suave)",
                border: pref.intensity === opt.valor ? "1.5px solid var(--cor-destaque)" : "1px solid var(--cor-borda)",
                backgroundColor: pref.intensity === opt.valor ? "rgba(196,113,74,0.06)" : "var(--cor-card)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "2px",
                transition: "border-color 0.15s, background-color 0.15s",
              }}
            >
              <span style={{ fontSize: "0.9rem", fontWeight: 500, color: pref.intensity === opt.valor ? "var(--cor-destaque)" : "var(--cor-texto)" }}>
                {opt.rotulo}
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--cor-texto-suave)" }}>
                {opt.desc}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Footer: last updated + save */}
      <div style={{ display: "flex", flexDirection: "column", gap: "13px", paddingBottom: "34px" }}>
        {pref.updatedAt && (
          <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.72rem", color: "var(--cor-texto-suave)" }}>
            Última atualização: {new Date(pref.updatedAt).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}
        {error && (
          <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.82rem", color: "#C0392B" }}>{error}</p>
        )}
        <button
          onClick={handleSalvar}
          disabled={saving}
          style={{
            alignSelf: "flex-start",
            minHeight: "44px",
            padding: "0 34px",
            fontFamily: "var(--fonte-corpo)",
            fontSize: "0.875rem",
            fontWeight: 500,
            letterSpacing: "0.07em",
            backgroundColor: saved ? "#508C64" : "var(--cor-destaque)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--raio-borda)",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.8 : 1,
            transition: "background-color 0.3s",
          }}
        >
          {saved ? "Salvo ✓" : saving ? "Salvando…" : "Salvar preferências"}
        </button>
      </div>
    </div>
  )
}

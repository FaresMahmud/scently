"use client"

import { useState } from "react"
import CartaoPerfumeAcervo, { type ItemAcervo } from "./CartaoPerfumeAcervo"
import ModalAdicionarPerfume from "./ModalAdicionarPerfume"

interface Acervo {
  tenho:             ItemAcervo[]
  jaSentiGostei:     ItemAcervo[]
  queroExperimentar: ItemAcervo[]
}

interface Props {
  inicial: Acervo
}

const SECOES: { chave: keyof Acervo; titulo: string; vazio: string }[] = [
  { chave: "tenho",             titulo: "Tenho",              vazio: "Os perfumes que você possui aparecem aqui." },
  { chave: "jaSentiGostei",     titulo: "Já senti e gostei",  vazio: "Perfumes que você experimentou e adorou aparecem aqui." },
  { chave: "queroExperimentar", titulo: "Quero experimentar", vazio: "Sua lista de desejos olfativa fica aqui." },
]

export default function AcervoTab({ inicial }: Props) {
  const [acervo, setAcervo] = useState<Acervo>(inicial)
  const [modal, setModal] = useState<{ aberto: boolean; status?: ItemAcervo["status"]; editando?: ItemAcervo }>({ aberto: false })

  function abrirAdicionar(status: ItemAcervo["status"]) {
    setModal({ aberto: true, status })
  }

  function abrirEditar(item: ItemAcervo) {
    setModal({ aberto: true, editando: item })
  }

  function fecharModal() {
    setModal({ aberto: false })
  }

  async function salvarPerfume(item: Omit<ItemAcervo, "id" | "addedAt">) {
    const res = await fetch("/api/perfil/acervo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    })
    if (!res.ok) return
    const { item: salvo } = await res.json() as { item: ItemAcervo }

    setAcervo(prev => {
      // Remove from all lists first (status might change on edit)
      const remover = (list: ItemAcervo[]) => list.filter(i => i.perfumeId !== salvo.perfumeId)
      const novo: Acervo = {
        tenho:             remover(prev.tenho),
        jaSentiGostei:     remover(prev.jaSentiGostei),
        queroExperimentar: remover(prev.queroExperimentar),
      }
      // Add to correct list
      if (salvo.status === "TENHO")              novo.tenho             = [salvo, ...novo.tenho]
      if (salvo.status === "JA_SENTI_GOSTEI")   novo.jaSentiGostei     = [salvo, ...novo.jaSentiGostei]
      if (salvo.status === "QUERO_EXPERIMENTAR") novo.queroExperimentar = [salvo, ...novo.queroExperimentar]
      return novo
    })

    fecharModal()
  }

  function removerPerfume(perfumeId: string) {
    setAcervo(prev => ({
      tenho:             prev.tenho.filter(i => i.perfumeId !== perfumeId),
      jaSentiGostei:     prev.jaSentiGostei.filter(i => i.perfumeId !== perfumeId),
      queroExperimentar: prev.queroExperimentar.filter(i => i.perfumeId !== perfumeId),
    }))
  }

  const total = acervo.tenho.length + acervo.jaSentiGostei.length + acervo.queroExperimentar.length

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "55px" }}>
      {/* Summary */}
      <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.82rem", color: "var(--cor-texto-suave)" }}>
        {total} perfume{total !== 1 ? "s" : ""} no acervo
      </p>

      {SECOES.map(secao => {
        const items = acervo[secao.chave]
        return (
          <section key={secao.chave}>
            {/* Section header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "21px" }}>
              <h2
                style={{
                  fontFamily: "var(--fonte-titulo)",
                  fontWeight: 300,
                  fontSize: "26px",
                }}
              >
                {secao.titulo}
                <span style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.78rem", color: "var(--cor-texto-suave)", marginLeft: "8px" }}>
                  {items.length}
                </span>
              </h2>
              <button
                onClick={() => abrirAdicionar(secao.chave === "tenho" ? "TENHO" : secao.chave === "jaSentiGostei" ? "JA_SENTI_GOSTEI" : "QUERO_EXPERIMENTAR")}
                style={{
                  background: "none",
                  border: "1px solid var(--cor-borda)",
                  borderRadius: "var(--raio-borda)",
                  cursor: "pointer",
                  fontFamily: "var(--fonte-corpo)",
                  fontSize: "0.78rem",
                  color: "var(--cor-texto-suave)",
                  padding: "0 13px",
                  minHeight: "44px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                }}
              >
                + Adicionar
              </button>
            </div>

            {/* Cards grid */}
            {items.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: "21px",
                }}
              >
                {items.map(item => (
                  <CartaoPerfumeAcervo
                    key={item.id}
                    item={item}
                    onRemove={removerPerfume}
                    onEdit={abrirEditar}
                  />
                ))}
              </div>
            ) : (
              <p
                style={{
                  fontFamily: "var(--fonte-corpo)",
                  fontSize: "0.85rem",
                  color: "var(--cor-texto-suave)",
                  fontStyle: "italic",
                  padding: "34px 0",
                  borderTop: "1px solid var(--cor-borda)",
                }}
              >
                {secao.vazio}
              </p>
            )}
          </section>
        )
      })}

      {/* Modal */}
      {modal.aberto && (
        <ModalAdicionarPerfume
          onClose={fecharModal}
          onSalvar={salvarPerfume}
          inicial={modal.editando ?? null}
        />
      )}
    </div>
  )
}

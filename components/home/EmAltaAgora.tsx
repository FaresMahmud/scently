// ============================================
// ARQUIVO: components/home/EmAltaAgora.tsx
// O QUE FAZ: exibe os 3 perfumes mais populares do momento — atualizado semanalmente
// QUANDO MANDAR PRA IA: quando quiser mudar o visual desta seção
// DEPENDE DE: lib/repositories/TendenciasRepository
// ============================================

import Link from "next/link"
import { tendenciasRepository } from "@/lib/repositories/TendenciasRepository"
import type { PerfumeTendencia } from "@/lib/repositories/TendenciasRepository"

function corTipo(tipo: PerfumeTendencia["tipo"]): { bg: string; cor: string } {
  if (tipo === "importado") return { bg: "rgba(196,113,74,0.12)", cor: "var(--cor-destaque)" }
  if (tipo === "contratipo") return { bg: "rgba(201,168,76,0.12)", cor: "var(--cor-dourado)" }
  return { bg: "rgba(80,140,100,0.12)", cor: "#508C64" }
}

function labelTipo(tipo: PerfumeTendencia["tipo"]): string {
  if (tipo === "importado") return "importado"
  if (tipo === "contratipo") return "contratipo"
  return "nacional"
}

export default function EmAltaAgora() {
  return (
    <section style={{ borderBottom: "1px solid var(--cor-borda)" }}>
      <div className="container-site" style={{ paddingTop: "7rem", paddingBottom: "7rem" }}>

        {/* Cabeçalho */}
        <p style={{ fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--cor-texto-suave)", marginBottom: "0.75rem" }}>
          em alta esta semana
        </p>
        <h2 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, maxWidth: "600px", fontSize: "clamp(2.2rem, 5vw, 3.8rem)" }}>
          O que o mundo está usando agora
        </h2>
        <div className="separador" />

        {/* Cards */}
        <div className="em-alta-grid" style={{ marginTop: "3.5rem", alignItems: "stretch" }}>
          {tendenciasRepository.findAll().map((p) => {
            const tipoStyle = corTipo(p.tipo)
            const href = `/catalogo?busca=${encodeURIComponent(p.nome + " " + p.marca)}`
            return (
              <Link key={p.id} href={href} style={{ textDecoration: "none" }}>
                <article
                  style={{
                    backgroundColor: "var(--cor-card)",
                    border: "1px solid var(--cor-borda)",
                    borderRadius: "var(--raio-borda)",
                    padding: "2rem",
                    minHeight: "320px",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--fib-3)",
                    transition: "border-color 0.2s",
                    cursor: "pointer",
                    boxSizing: "border-box",
                  }}
                >
                  {/* Badge */}
                  <p style={{ fontSize: "0.72rem", fontWeight: 500, color: "var(--cor-texto-suave)", letterSpacing: "0.04em" }}>
                    {p.badge}
                  </p>

                  {/* Nome + marca */}
                  <div>
                    <h3 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)", lineHeight: 1.15, marginBottom: "0.25rem" }}>
                      {p.nome}
                    </h3>
                    <p style={{ fontSize: "0.8rem", color: "var(--cor-texto-suave)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {p.marca}
                    </p>
                  </div>

                  {/* Família + tipo */}
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span className="tag">{p.familia}</span>
                    <span
                      className="tag"
                      style={{ borderColor: tipoStyle.cor, color: tipoStyle.cor, backgroundColor: tipoStyle.bg }}
                    >
                      {labelTipo(p.tipo)}
                    </span>
                  </div>

                  {/* Descrição sensorial */}
                  <p style={{ fontSize: "1rem", lineHeight: 1.8, flex: 1 }}>
                    {p.descricaoSensorial}
                  </p>

                  {/* Preço — sempre na base do card */}
                  <p style={{ fontFamily: "var(--fonte-titulo)", fontSize: "1.25rem", fontWeight: 300, color: "var(--cor-texto)", marginTop: "auto", paddingTop: "1rem" }}>
                    {p.preco_estimado}
                  </p>
                </article>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

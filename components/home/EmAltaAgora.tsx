// ============================================
// ARQUIVO: components/home/EmAltaAgora.tsx
// O QUE FAZ: exibe os 3 perfumes mais populares do momento — grid 3 colunas desktop, 1 mobile
// QUANDO MANDAR PRA IA: quando quiser mudar o visual desta seção
// DEPENDE DE: lib/repositories/TendenciasRepository, components/tendencias/CardTendencia
// ============================================

import { tendenciasRepository } from "@/lib/repositories/TendenciasRepository"
import CardTendencia from "@/components/tendencias/CardTendencia"
import { slugify } from "@/lib/utils"
import { limparNomePerfume } from "@/lib/limparNomePerfume"

function limparBadge(badge: string): string {
  return badge.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}↑↓]/gu, "").trim()
}

export default function EmAltaAgora() {
  const perfumes = tendenciasRepository.findAll().slice(0, 3)

  return (
    <section style={{ borderBottom: "1px solid var(--cor-borda)" }}>
      <div className="container-site" style={{ paddingTop: "89px", paddingBottom: "89px" }}>

        {/* Cabeçalho */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "21px", marginBottom: "55px" }}>
          <div>
            <p style={{ fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--cor-texto-suave)", marginBottom: "13px" }}>
              em alta esta semana
            </p>
            <h2 style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, maxWidth: "600px", fontSize: "clamp(42px, 5vw, 68px)" }}>
              Três fragrâncias que todo mundo está buscando.
            </h2>
          </div>
          <a href="/tendencias" style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.875rem", color: "var(--cor-destaque)", textDecoration: "none", whiteSpace: "nowrap", letterSpacing: "0.05em" }}>
            Ver todas →
          </a>
        </div>

        {/* Grid — 3 cols desktop, 1 col mobile */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "34px 55px",
        }}>
          {perfumes.map(p => (
            <CardTendencia
              key={p.id}
              nome={p.nome}
              marca={p.marca}
              badge={limparBadge(p.badge)}
              tipo={p.tipo}
              preco={p.preco_estimado}
              copy={p.descricaoSensorial}
              perfumeId={`${slugify(limparNomePerfume(p.nome, p.marca))}-${slugify(p.marca)}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

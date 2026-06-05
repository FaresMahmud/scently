// ============================================
// ARQUIVO: components/ui/Logo.tsx
// O QUE FAZ: logo do Nozze — SVG (topo do borrifador + partículas) + texto HTML
// Proporções áureas: viewBox 80×34 — partículas top 61.8% (21px), bico bottom 38.2% (13px)
// ============================================

export default function Logo({ width = 64 }: { width?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0px" }}>
      {/*
        SVG — topo do borrifador apenas (pescoço + cabeça do spray + bico + partículas)
        Corpo do frasco removido — linha de corte limpa no base do pescoço.
        Stroke only, fill none, stroke-width 1.2, currentColor.
        Partículas em nuvem fibonacci saindo para cima e para a direita.
      */}
      <svg
        width={width}
        viewBox="0 0 80 34"
        role="presentation"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block", overflow: "visible" }}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        color="#3A2E28"
      >
        {/* ── Mecanismo do bico (y 21→34, 38.2% inferior) ── */}

        {/* Pescoço fino — liga o topo do corpo ao cabeçote */}
        <rect x="14" y="22" width="6" height="12" rx="1.5"/>

        {/* Cabeçote do spray — bloco principal do mecanismo */}
        <rect x="9"  y="26" width="16" height="8" rx="2"/>

        {/* Bico — tubo horizontal de onde sai o spray */}
        <rect x="25" y="28" width="9"  height="4" rx="2"/>

        {/* Abertura do bico — ponto de saída */}
        <circle cx="34" cy="30" r="1.4"/>

        {/* ── Nuvem de partículas (y 0→21, 61.8% superior) ── */}
        {/*  Fan saindo de (34, 30) para cima e para a direita  */}
        {/*  Raio e opacidade diminuem com a distância — curva fibonacci */}

        {/* Coluna 1 — ~8px */}
        <circle cx="38" cy="27" r="1.8"/>
        <circle cx="38" cy="33" r="1.6"/>

        {/* Coluna 2 — ~13px */}
        <circle cx="43" cy="23" r="1.7"/>
        <circle cx="43" cy="29" r="1.7"/>

        {/* Coluna 3 — ~21px */}
        <circle cx="49" cy="19" r="1.5"/>
        <circle cx="49" cy="26" r="1.5"/>
        <circle cx="49" cy="33" r="1.4"/>

        {/* Coluna 4 — ~34px */}
        <circle cx="55" cy="15" r="1.4"/>
        <circle cx="55" cy="23" r="1.4"/>
        <circle cx="55" cy="31" r="1.2"/>

        {/* Coluna 5 — ~55px */}
        <circle cx="61" cy="18" r="1.2"/>
        <circle cx="61" cy="27" r="1.2"/>

        {/* Coluna 6 — ~89px (fade out) */}
        <circle cx="67" cy="21" r="1.0"/>
        <circle cx="67" cy="29" r="0.9"/>

        {/* Coluna 7 — extremidade */}
        <circle cx="73" cy="24" r="0.8"/>

        {/* Linha divisória vertical */}
        <line x1="77" y1="4" x2="77" y2="30" strokeWidth="0.7" opacity="0.5"/>
      </svg>

      {/* Texto HTML — fonte carrega garantidamente */}
      <span style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontWeight: 300,
        fontSize: "18px",
        letterSpacing: "0.12em",
        color: "#3A2E28",
        lineHeight: 1,
        paddingLeft: "4px",
      }}>
        nozze
      </span>
    </div>
  )
}

// ============================================
// ARQUIVO: components/ui/Logo.tsx
// O QUE FAZ: logo do Scently — SVG (frasco + partículas) + texto HTML
// ============================================

export default function Logo({ width = 60 }: { width?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0px" }}>
      {/* SVG — só frasco + partículas + linha divisória */}
      <svg
        width={width}
        viewBox="0 0 120 120"
        role="presentation"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block", overflow: "visible" }}
      >
        <style>{`
          .sp { fill: #C9943A; }
          .bt { fill: none; stroke: #3A2E28; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
          .bf { fill: #3A2E28; }
          .dv { stroke: #3A2E28; stroke-width: 0.7; opacity: 0.4; }
        `}</style>

        {/* Corpo do frasco */}
        <rect x="10" y="62" width="44" height="52" rx="5" className="bt"/>
        <path d="M10 67 Q10 62 15 62 L49 62 Q54 62 54 67" fill="none" className="bt"/>
        {/* Pescoço */}
        <rect x="20" y="44" width="24" height="20" rx="2" className="bt"/>
        <rect x="17" y="61" width="30" height="4" rx="1.5" className="bt"/>
        {/* Cabeça do spray */}
        <rect x="22" y="30" width="20" height="16" rx="2" className="bt"/>
        {/* Botão topo */}
        <rect x="26" y="22" width="12" height="9" rx="1.5" className="bt"/>
        {/* Bico */}
        <rect x="42" y="35" width="14" height="5" rx="1.5" className="bf"/>
        <circle cx="56" cy="37" r="1.5" fill="#F5F0EA"/>

        {/* Partículas */}
        <circle cx="60" cy="36" r="1.5" className="sp" opacity="0.95"/>
        <circle cx="64" cy="33" r="1.3" className="sp" opacity="0.9"/>
        <circle cx="64" cy="39" r="1.3" className="sp" opacity="0.9"/>
        <circle cx="68" cy="30" r="1.2" className="sp" opacity="0.85"/>
        <circle cx="68" cy="36" r="1.4" className="sp" opacity="0.88"/>
        <circle cx="68" cy="42" r="1.2" className="sp" opacity="0.85"/>
        <circle cx="73" cy="27" r="1.1" className="sp" opacity="0.8"/>
        <circle cx="73" cy="34" r="1.2" className="sp" opacity="0.82"/>
        <circle cx="73" cy="41" r="1.2" className="sp" opacity="0.82"/>
        <circle cx="73" cy="48" r="1.1" className="sp" opacity="0.75"/>
        <circle cx="78" cy="24" r="1.0" className="sp" opacity="0.75"/>
        <circle cx="78" cy="32" r="1.1" className="sp" opacity="0.75"/>
        <circle cx="78" cy="40" r="1.1" className="sp" opacity="0.75"/>
        <circle cx="78" cy="48" r="1.0" className="sp" opacity="0.68"/>
        <circle cx="78" cy="55" r="0.9" className="sp" opacity="0.62"/>
        <circle cx="84" cy="21" r="0.9" className="sp" opacity="0.68"/>
        <circle cx="84" cy="30" r="1.0" className="sp" opacity="0.68"/>
        <circle cx="84" cy="39" r="1.0" className="sp" opacity="0.68"/>
        <circle cx="84" cy="48" r="0.9" className="sp" opacity="0.62"/>
        <circle cx="84" cy="57" r="0.8" className="sp" opacity="0.55"/>
        <circle cx="90" cy="27" r="0.9" className="sp" opacity="0.58"/>
        <circle cx="90" cy="37" r="0.9" className="sp" opacity="0.58"/>
        <circle cx="90" cy="47" r="0.8" className="sp" opacity="0.52"/>
        <circle cx="90" cy="57" r="0.7" className="sp" opacity="0.45"/>
        <circle cx="96" cy="32" r="0.8" className="sp" opacity="0.48"/>
        <circle cx="96" cy="42" r="0.8" className="sp" opacity="0.45"/>
        <circle cx="96" cy="52" r="0.7" className="sp" opacity="0.38"/>
        <circle cx="102" cy="36" r="0.7" className="sp" opacity="0.38"/>
        <circle cx="102" cy="46" r="0.7" className="sp" opacity="0.35"/>
        <circle cx="108" cy="40" r="0.6" className="sp" opacity="0.28"/>

        {/* Linha divisória */}
        <line x1="112" y1="16" x2="112" y2="98" className="dv"/>
      </svg>

      {/* Texto HTML — fonte carrega garantidamente */}
      <span style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontWeight: 300,
        fontSize: "22px",
        letterSpacing: "0.12em",
        color: "#3A2E28",
        lineHeight: 1,
        paddingLeft: "10px",
      }}>
        scently
      </span>
    </div>
  )
}

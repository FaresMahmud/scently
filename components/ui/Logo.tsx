// ============================================
// ARQUIVO: components/ui/Logo.tsx
// O QUE FAZ: logo SVG do Scently — borrifador + partículas + nome
// ============================================

export default function Logo({ width = 220 }: { width?: number }) {
  return (
    <svg
      width={width}
      viewBox="0 0 480 120"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <title>Scently</title>
      <style>{`
        .sp { fill: #C9943A; }
        .bt { fill: none; stroke: #3A2E28; stroke-width: 1.2; stroke-linecap: round; stroke-linejoin: round; }
        .bf { fill: #3A2E28; }
        .dv { stroke: #3A2E28; stroke-width: 0.7; opacity: 0.4; }
        .br { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 300; font-size: 36px; fill: #3A2E28; letter-spacing: 0.1em; }
      `}</style>

      {/* Corpo do frasco */}
      <rect x="18" y="62" width="44" height="52" rx="5" className="bt"/>
      {/* Ombros */}
      <path d="M18 67 Q18 62 23 62 L57 62 Q62 62 62 67" fill="none" className="bt"/>
      {/* Pescoço */}
      <rect x="28" y="44" width="24" height="20" rx="2" className="bt"/>
      {/* Anel */}
      <rect x="25" y="61" width="30" height="4" rx="1.5" className="bt"/>
      {/* Cabeça do spray */}
      <rect x="30" y="30" width="20" height="16" rx="2" className="bt"/>
      {/* Botão topo */}
      <rect x="34" y="22" width="12" height="9" rx="1.5" className="bt"/>
      {/* Bico */}
      <rect x="50" y="35" width="14" height="5" rx="1.5" className="bf"/>
      {/* Orifício */}
      <circle cx="64" cy="37" r="1.5" fill="#F0EBE0"/>

      {/* Partículas em cone */}
      <circle cx="68" cy="36" r="1.5" className="sp" opacity="0.95"/>
      <circle cx="71" cy="34" r="1.3" className="sp" opacity="0.9"/>
      <circle cx="71" cy="38" r="1.3" className="sp" opacity="0.9"/>
      <circle cx="75" cy="32" r="1.2" className="sp" opacity="0.85"/>
      <circle cx="75" cy="37" r="1.4" className="sp" opacity="0.88"/>
      <circle cx="75" cy="42" r="1.2" className="sp" opacity="0.85"/>
      <circle cx="80" cy="29" r="1.1" className="sp" opacity="0.8"/>
      <circle cx="80" cy="35" r="1.3" className="sp" opacity="0.82"/>
      <circle cx="80" cy="41" r="1.3" className="sp" opacity="0.82"/>
      <circle cx="80" cy="47" r="1.1" className="sp" opacity="0.78"/>
      <circle cx="86" cy="26" r="1.0" className="sp" opacity="0.75"/>
      <circle cx="86" cy="33" r="1.2" className="sp" opacity="0.78"/>
      <circle cx="86" cy="39" r="1.2" className="sp" opacity="0.78"/>
      <circle cx="86" cy="46" r="1.1" className="sp" opacity="0.74"/>
      <circle cx="86" cy="52" r="1.0" className="sp" opacity="0.7"/>
      <circle cx="92" cy="23" r="1.0" className="sp" opacity="0.7"/>
      <circle cx="92" cy="30" r="1.1" className="sp" opacity="0.72"/>
      <circle cx="92" cy="37" r="1.1" className="sp" opacity="0.72"/>
      <circle cx="92" cy="44" r="1.1" className="sp" opacity="0.7"/>
      <circle cx="92" cy="51" r="1.0" className="sp" opacity="0.66"/>
      <circle cx="92" cy="57" r="0.9" className="sp" opacity="0.62"/>
      <circle cx="98" cy="20" r="0.9" className="sp" opacity="0.65"/>
      <circle cx="98" cy="28" r="1.0" className="sp" opacity="0.67"/>
      <circle cx="98" cy="36" r="1.0" className="sp" opacity="0.67"/>
      <circle cx="98" cy="44" r="1.0" className="sp" opacity="0.65"/>
      <circle cx="98" cy="52" r="0.9" className="sp" opacity="0.6"/>
      <circle cx="98" cy="59" r="0.8" className="sp" opacity="0.55"/>

      {/* Linha divisória */}
      <line x1="106" y1="14" x2="106" y2="96" className="dv"/>

      {/* Partículas cruzando a linha */}
      <circle cx="110" cy="18" r="0.9" className="sp" opacity="0.55"/>
      <circle cx="112" cy="26" r="0.9" className="sp" opacity="0.55"/>
      <circle cx="110" cy="34" r="0.9" className="sp" opacity="0.55"/>
      <circle cx="112" cy="42" r="0.8" className="sp" opacity="0.5"/>
      <circle cx="110" cy="50" r="0.8" className="sp" opacity="0.48"/>
      <circle cx="112" cy="58" r="0.8" className="sp" opacity="0.45"/>
      <circle cx="110" cy="66" r="0.7" className="sp" opacity="0.4"/>
      <circle cx="118" cy="22" r="0.8" className="sp" opacity="0.45"/>
      <circle cx="120" cy="32" r="0.8" className="sp" opacity="0.42"/>
      <circle cx="118" cy="42" r="0.7" className="sp" opacity="0.38"/>
      <circle cx="120" cy="52" r="0.7" className="sp" opacity="0.35"/>
      <circle cx="118" cy="62" r="0.6" className="sp" opacity="0.3"/>
      <circle cx="122" cy="70" r="0.6" className="sp" opacity="0.28"/>

      {/* Texto */}
      <text x="132" y="68" className="br">scently</text>
    </svg>
  )
}

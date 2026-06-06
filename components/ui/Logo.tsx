// ============================================
// ARQUIVO: components/ui/Logo.tsx
// O QUE FAZ: logo do Nozze — SVG (frasco parcial + névoa) + texto HTML
// ============================================

export default function Logo({ width = 32 }: { width?: number }) {
  // Proporção viewBox 114:160 → height = width * (160/114)
  const height = Math.round(width * (120 / 114))

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0px" }}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 114 120"
        role="presentation"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block", overflow: "hidden" }}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.3"
        color="#3A2E28"
      >
        {/* CORPO — aberto em baixo, 34px de altura visível */}
        <line x1="26" y1="120" x2="26" y2="88"/>
        <line x1="26" y1="88"  x2="98" y2="88"/>
        <line x1="98" y1="88"  x2="98" y2="120"/>

        {/* PESCOÇO — height=36 (era 52) */}
        <rect x="51.5" y="52" width="21" height="36"/>

        {/* ATUADOR — mantido height=28 */}
        <rect x="45" y="20" width="34" height="28"/>

        {/* BICO */}
        <line x1="79" y1="30" x2="92" y2="30"/>
        <line x1="92" y1="26" x2="92" y2="34"/>

        {/* NÉVOA — partículas deslocadas -38px no eixo Y */}
        <circle cx="99"  cy="27" r="1.1"  fill="currentColor" stroke="none"/>
        <circle cx="102" cy="22" r="0.9"  fill="currentColor" stroke="none"/>
        <circle cx="105" cy="29" r="0.8"  fill="currentColor" stroke="none"/>
        <circle cx="100" cy="17" r="0.7"  fill="currentColor" stroke="none"/>
        <circle cx="108" cy="20" r="0.9"  fill="currentColor" stroke="none"/>
        <circle cx="111" cy="14" r="0.8"  fill="currentColor" stroke="none"/>
        <circle cx="106" cy="11" r="0.7"  fill="currentColor" stroke="none"/>
        <circle cx="103" cy="5"  r="0.6"  fill="currentColor" stroke="none"/>
        <circle cx="109" cy="9"  r="0.7"  fill="currentColor" stroke="none"/>
        <circle cx="112" cy="24" r="0.6"  fill="currentColor" stroke="none"/>
        <circle cx="113" cy="5"  r="0.6"  fill="currentColor" stroke="none"/>
        <circle cx="107" cy="0"  r="0.5"  fill="currentColor" stroke="none"/>
      </svg>

      {/* Texto HTML — fonte carrega garantidamente */}
      <span style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontWeight: 300,
        fontSize: "18px",
        letterSpacing: "0.12em",
        color: "#3A2E28",
        lineHeight: 1,
        paddingLeft: "8px",
      }}>
        nozze
      </span>
    </div>
  )
}

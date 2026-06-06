// ============================================
// ARQUIVO: components/ui/Logo.tsx
// O QUE FAZ: logo do Nozze — SVG (frasco parcial + névoa) + texto HTML
// ============================================

export default function Logo({ width = 32 }: { width?: number }) {
  // Proporção viewBox 114:160 → height = width * (160/114)
  const height = Math.round(width * (148 / 114))

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0px" }}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 114 148"
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
        {/* CORPO — aberto em baixo, só o topo visível */}
        <line x1="26" y1="160" x2="26" y2="138"/>
        <line x1="26" y1="138" x2="98" y2="138"/>
        <line x1="98" y1="138" x2="98" y2="160"/>

        {/* PESCOÇO */}
        <rect x="51.5" y="86" width="21" height="52"/>

        {/* ATUADOR */}
        <rect x="45" y="58" width="34" height="28"/>

        {/* BICO */}
        <line x1="79" y1="68" x2="92" y2="68"/>
        <line x1="92" y1="64" x2="92" y2="72"/>

        {/* NÉVOA */}
        <circle cx="99"  cy="65" r="1.1"  fill="currentColor" stroke="none"/>
        <circle cx="102" cy="60" r="0.9"  fill="currentColor" stroke="none"/>
        <circle cx="105" cy="67" r="0.8"  fill="currentColor" stroke="none"/>
        <circle cx="100" cy="55" r="0.7"  fill="currentColor" stroke="none"/>
        <circle cx="108" cy="58" r="0.9"  fill="currentColor" stroke="none"/>
        <circle cx="111" cy="52" r="0.8"  fill="currentColor" stroke="none"/>
        <circle cx="106" cy="49" r="0.7"  fill="currentColor" stroke="none"/>
        <circle cx="103" cy="43" r="0.6"  fill="currentColor" stroke="none"/>
        <circle cx="109" cy="47" r="0.7"  fill="currentColor" stroke="none"/>
        <circle cx="112" cy="62" r="0.6"  fill="currentColor" stroke="none"/>
        <circle cx="113" cy="43" r="0.6"  fill="currentColor" stroke="none"/>
        <circle cx="107" cy="38" r="0.5"  fill="currentColor" stroke="none"/>
        <circle cx="110" cy="35" r="0.5"  fill="currentColor" stroke="none"/>
        <circle cx="104" cy="33" r="0.5"  fill="currentColor" stroke="none"/>
        <circle cx="112" cy="29" r="0.4"  fill="currentColor" stroke="none"/>
        <circle cx="108" cy="26" r="0.4"  fill="currentColor" stroke="none"/>
        <circle cx="106" cy="21" r="0.35" fill="currentColor" stroke="none"/>
        <circle cx="111" cy="18" r="0.3"  fill="currentColor" stroke="none"/>
        <circle cx="109" cy="14" r="0.25" fill="currentColor" stroke="none"/>
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

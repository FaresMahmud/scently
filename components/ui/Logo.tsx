// ============================================
// ARQUIVO: components/ui/Logo.tsx
// O QUE FAZ: logo do Nozze — SVG (frasco parcial + névoa) + texto HTML
// ============================================

export default function Logo({ width = 64 }: { width?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0px" }}>
      <svg
        width={width}
        viewBox="0 0 114 264"
        role="presentation"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block", overflow: "visible" }}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.3"
        color="#3A2E28"
      >
        {/* CORPO LARGO — aberto em baixo */}
        <line x1="26" y1="258" x2="26" y2="192"/>
        <line x1="26" y1="192" x2="98" y2="192"/>
        <line x1="98" y1="192" x2="98" y2="258"/>

        {/* PESCOÇO */}
        <rect x="51.5" y="140" width="21" height="52"/>

        {/* ATUADOR */}
        <rect x="45" y="112" width="34" height="28"/>

        {/* BICO */}
        <line x1="79" y1="122" x2="92" y2="122"/>
        <line x1="92" y1="118" x2="92" y2="126"/>

        {/* NÉVOA — pontos sólidos preenchidos */}
        <circle cx="99"  cy="119" r="1.1"  fill="currentColor" stroke="none"/>
        <circle cx="102" cy="114" r="0.9"  fill="currentColor" stroke="none"/>
        <circle cx="105" cy="121" r="0.8"  fill="currentColor" stroke="none"/>
        <circle cx="100" cy="109" r="0.7"  fill="currentColor" stroke="none"/>
        <circle cx="108" cy="112" r="0.9"  fill="currentColor" stroke="none"/>
        <circle cx="111" cy="106" r="0.8"  fill="currentColor" stroke="none"/>
        <circle cx="106" cy="103" r="0.7"  fill="currentColor" stroke="none"/>
        <circle cx="103" cy="97"  r="0.6"  fill="currentColor" stroke="none"/>
        <circle cx="109" cy="101" r="0.7"  fill="currentColor" stroke="none"/>
        <circle cx="112" cy="116" r="0.6"  fill="currentColor" stroke="none"/>
        <circle cx="113" cy="97"  r="0.6"  fill="currentColor" stroke="none"/>
        <circle cx="107" cy="92"  r="0.5"  fill="currentColor" stroke="none"/>
        <circle cx="110" cy="89"  r="0.5"  fill="currentColor" stroke="none"/>
        <circle cx="104" cy="87"  r="0.5"  fill="currentColor" stroke="none"/>
        <circle cx="112" cy="83"  r="0.4"  fill="currentColor" stroke="none"/>
        <circle cx="108" cy="80"  r="0.4"  fill="currentColor" stroke="none"/>
        <circle cx="113" cy="77"  r="0.35" fill="currentColor" stroke="none"/>
        <circle cx="106" cy="75"  r="0.3"  fill="currentColor" stroke="none"/>
        <circle cx="111" cy="72"  r="0.3"  fill="currentColor" stroke="none"/>
        <circle cx="109" cy="68"  r="0.25" fill="currentColor" stroke="none"/>
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

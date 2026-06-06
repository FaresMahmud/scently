// ============================================
// ARQUIVO: components/ui/Logo.tsx
// O QUE FAZ: logo do Nozze — SVG unificado (ícone + texto "nozze" em um único elemento)
// ============================================

export default function Logo({ width = 200 }: { width?: number }) {
  const height = Math.round(width * (60 / 260))

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 260 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <g stroke="#3D3935" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.1">
        <line x1="10" y1="56" x2="10" y2="42"/>
        <line x1="10" y1="42" x2="36" y2="42"/>
        <line x1="36" y1="42" x2="36" y2="56"/>
        <rect x="17" y="26" width="10" height="16"/>
        <rect x="13" y="14" width="18" height="12"/>
        <line x1="31" y1="19" x2="39" y2="19"/>
        <line x1="39" y1="16" x2="39" y2="22"/>
      </g>

      <circle cx="44" cy="17" r="0.9" fill="#3D3935"/>
      <circle cx="48" cy="13" r="0.75" fill="#3D3935"/>
      <circle cx="52" cy="16" r="0.7" fill="#3D3935"/>
      <circle cx="51" cy="10" r="0.65" fill="#3D3935"/>
      <circle cx="56" cy="12" r="0.6" fill="#3D3935"/>
      <circle cx="60" cy="9" r="0.55" fill="#3D3935"/>
      <circle cx="55" cy="7" r="0.5" fill="#3D3935"/>
      <circle cx="64" cy="14" r="0.5" fill="#3D3935"/>
      <circle cx="65" cy="7" r="0.45" fill="#3D3935"/>
      <circle cx="68" cy="11" r="0.4" fill="#3D3935"/>
      <circle cx="70" cy="5" r="0.38" fill="#3D3935"/>
      <circle cx="73" cy="9" r="0.35" fill="#3D3935"/>
      <circle cx="75" cy="4" r="0.3" fill="#3D3935"/>
      <circle cx="78" cy="8" r="0.28" fill="#3D3935"/>
      <circle cx="80" cy="3" r="0.25" fill="#3D3935"/>
      <circle cx="82" cy="7" r="0.22" fill="#3D3935"/>
      <circle cx="84" cy="2" r="0.2" fill="#3D3935"/>

      <text
        x="42"
        y="46"
        fontFamily="'Cormorant Garamond', Georgia, serif"
        fontSize="28"
        fontWeight="300"
        letterSpacing="4"
        fill="#3D3935"
      >nozze</text>
    </svg>
  )
}

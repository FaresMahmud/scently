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
      {/* Topo do borrifador — bico + pescoço fino, cortado na linha onde começa o corpo.
          Mecanismo ocupa 38.2% da altura do ícone (y 29-42 = 13), partículas 61.8% (y 8-29 = 21). */}
      <g stroke="#3D3935" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.1">
        <rect x="17" y="29" width="12" height="5"/>
        <rect x="20" y="34" width="6" height="8"/>
        <line x1="29" y1="31" x2="37" y2="31"/>
        <line x1="37" y1="29" x2="37" y2="33"/>
      </g>

      <circle cx="42" cy="29"   r="0.9"  fill="#3D3935"/>
      <circle cx="46" cy="23.4" r="0.75" fill="#3D3935"/>
      <circle cx="50" cy="27.6" r="0.7"  fill="#3D3935"/>
      <circle cx="49" cy="19.2" r="0.65" fill="#3D3935"/>
      <circle cx="54" cy="22"   r="0.6"  fill="#3D3935"/>
      <circle cx="58" cy="17.8" r="0.55" fill="#3D3935"/>
      <circle cx="53" cy="15"   r="0.5"  fill="#3D3935"/>
      <circle cx="62" cy="24.8" r="0.5"  fill="#3D3935"/>
      <circle cx="63" cy="15"   r="0.45" fill="#3D3935"/>
      <circle cx="66" cy="20.6" r="0.4"  fill="#3D3935"/>
      <circle cx="68" cy="12.2" r="0.38" fill="#3D3935"/>
      <circle cx="71" cy="17.8" r="0.35" fill="#3D3935"/>
      <circle cx="73" cy="10.8" r="0.3"  fill="#3D3935"/>
      <circle cx="76" cy="16.4" r="0.28" fill="#3D3935"/>
      <circle cx="78" cy="9.4"  r="0.25" fill="#3D3935"/>
      <circle cx="80" cy="15"   r="0.22" fill="#3D3935"/>
      <circle cx="82" cy="8"    r="0.2"  fill="#3D3935"/>

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

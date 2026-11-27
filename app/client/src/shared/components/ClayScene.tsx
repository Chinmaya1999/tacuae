// Soft "clay" illustration of a protected smart building, drawn in SVG (no image or 3D library downloads).
// Each object is its own layer, so floating them only moves a composited element.
import { useId, type CSSProperties, type ReactNode } from 'react'

function Clay({ className, viewBox = '0 0 200 200', dur = 7, delay = 0, tilt = 0, children }: { className: string; viewBox?: string; dur?: number; delay?: number; tilt?: number; children: (id: (name: string) => string) => ReactNode }) {
  const uid = useId().replace(/[^\w-]/g, '')
  const id = (name: string) => `${name}-${uid}`
  const gradients: [string, string, string][] = [['indigo', '#8f96ff', '#4338ca'], ['violet', '#c4a8ff', '#7c3aed'], ['white', '#ffffff', '#c3caf0'], ['mint', '#8ff0d2', '#14a387'], ['amber', '#ffe29a', '#f59e0b'], ['night', '#4a52a8', '#1e2257']]
  return (
    <div className={`float absolute ${className}`} style={{ '--dur': `${dur}s`, '--delay': `${delay}s`, '--tilt': `${tilt}deg` } as CSSProperties}>
      <svg viewBox={viewBox} className="h-full w-full overflow-visible">
        <defs>
          {gradients.map(([name, a, b]) => <linearGradient key={name} id={id(name)} x1="0.15" y1="0" x2="0.75" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient>)}
          {/* clay material: soft cast shadow, shaded lower edge and a bright upper edge */}
          <filter id={id('clay')} x="-40%" y="-40%" width="180%" height="190%" colorInterpolationFilters="sRGB">
            <feDropShadow in="SourceAlpha" dx="0" dy="14" stdDeviation="11" floodColor="#02051a" floodOpacity=".45" result="cast" />
            <feOffset in="SourceAlpha" dx="-7" dy="-9" /><feGaussianBlur stdDeviation="6" result="a" />
            <feComposite in="SourceAlpha" in2="a" operator="arithmetic" k2="1" k3="-1" /><feComponentTransfer result="am"><feFuncA type="linear" slope=".75" /></feComponentTransfer>
            <feFlood floodColor="#120a4f" /><feComposite in2="am" operator="in" result="shade" />
            <feOffset in="SourceAlpha" dx="6" dy="8" /><feGaussianBlur stdDeviation="5" result="b" />
            <feComposite in="SourceAlpha" in2="b" operator="arithmetic" k2="1" k3="-1" /><feComponentTransfer result="bm"><feFuncA type="linear" slope=".85" /></feComponentTransfer>
            <feFlood floodColor="#ffffff" /><feComposite in2="bm" operator="in" result="light" />
            <feMerge><feMergeNode in="cast" /><feMergeNode in="SourceGraphic" /><feMergeNode in="shade" /><feMergeNode in="light" /></feMerge>
          </filter>
        </defs>
        {children(id)}
      </svg>
    </div>
  )
}

export default function ClayScene({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none relative aspect-[5/4] select-none ${/\bw-/.test(className) ? '' : 'w-full'} ${className}`}>
      <div className="absolute inset-x-[12%] bottom-[6%] h-[16%] rounded-[50%] bg-primary/40 blur-3xl" />
      {/* platform and smart building */}
      <Clay className="inset-x-[14%] bottom-[3%] top-[16%]" viewBox="0 0 360 300" dur={9}>{(id) => <>
        <ellipse cx="180" cy="248" rx="164" ry="42" fill={`url(#${id('night')})`} filter={`url(#${id('clay')})`} />
        <g filter={`url(#${id('clay')})`}><rect x="196" y="62" width="92" height="180" rx="26" fill={`url(#${id('violet')})`} /></g>
        {[0, 1, 2, 3].map((r) => [0, 1].map((c) => <rect key={`${r}${c}`} x={216 + c * 32} y={84 + r * 33} width="20" height="20" rx="7" fill={(r + c) % 3 ? '#efeaff' : '#ffe29a'} opacity=".92" />))}
        <g filter={`url(#${id('clay')})`}><path d="M62 150 Q62 138 72 130 L124 90 Q136 81 148 90 L200 130 Q210 138 210 150 V222 Q210 244 188 244 H84 Q62 244 62 222 Z" fill={`url(#${id('white')})`} /></g>
        <g filter={`url(#${id('clay')})`}><path d="M44 143 L122 80 Q136 69 150 80 L228 143 Q238 153 229 162 Q221 170 211 162 L136 103 L61 162 Q51 170 43 162 Q34 153 44 143 Z" fill={`url(#${id('indigo')})`} /></g>
        <rect x="116" y="186" width="40" height="58" rx="16" fill={`url(#${id('indigo')})`} />
        <rect x="82" y="168" width="24" height="24" rx="9" fill={`url(#${id('amber')})`} /><rect x="166" y="168" width="24" height="24" rx="9" fill={`url(#${id('amber')})`} />
      </>}</Clay>
      {/* security shield */}
      <Clay className="left-[2%] top-[30%] w-[30%]" dur={7} delay={-2} tilt={-8}>{(id) => <>
        <path d="M100 14 C122 32 146 40 172 42 Q182 44 182 56 V98 C182 146 146 176 106 190 Q100 192 94 190 C54 176 18 146 18 98 V56 Q18 44 28 42 C54 40 78 32 100 14 Z" fill={`url(#${id('indigo')})`} filter={`url(#${id('clay')})`} />
        <path d="M63 100 L89 126 L139 76" fill="none" stroke="#fff" strokeWidth="19" strokeLinecap="round" strokeLinejoin="round" />
      </>}</Clay>
      {/* cloud */}
      <Clay className="right-[1%] top-[2%] w-[32%]" viewBox="0 0 220 150" dur={10} delay={-5}>{(id) => (
        <path d="M58 128 C30 128 14 110 14 90 C14 70 30 56 50 56 C54 30 78 14 104 14 C132 14 154 32 158 58 C186 56 206 72 206 94 C206 114 190 128 166 128 Z" fill={`url(#${id('white')})`} filter={`url(#${id('clay')})`} />
      )}</Clay>
      {/* padlock */}
      <Clay className="right-[5%] top-[52%] w-[20%]" dur={8} delay={-3} tilt={10}>{(id) => <>
        <path d="M62 96 V66 C62 44 78 28 100 28 C122 28 138 44 138 66 V96" fill="none" stroke={`url(#${id('white')})`} strokeWidth="22" strokeLinecap="round" />
        <rect x="38" y="82" width="124" height="100" rx="34" fill={`url(#${id('violet')})`} filter={`url(#${id('clay')})`} />
        <circle cx="100" cy="124" r="14" fill="#fff" /><rect x="93" y="128" width="14" height="28" rx="7" fill="#fff" />
      </>}</Clay>
      {/* status orbs */}
      <Clay className="left-[15%] top-[4%] w-[15%]" dur={6} delay={-1}>{(id) => <>
        <circle cx="100" cy="100" r="74" fill={`url(#${id('amber')})`} filter={`url(#${id('clay')})`} />
        <path d="M110 56 L74 108 H98 L90 146 L128 90 H103 Z" fill="#fff" />
      </>}</Clay>
      <Clay className="left-[22%] bottom-[1%] w-[11%]" dur={7.5} delay={-4}>{(id) => <circle cx="100" cy="100" r="74" fill={`url(#${id('mint')})`} filter={`url(#${id('clay')})`} />}</Clay>
    </div>
  )
}

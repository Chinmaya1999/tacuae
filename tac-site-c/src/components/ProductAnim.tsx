import type { ReactNode } from 'react'

// Illustrative, conceptual animations of what each product type does in a KNX system.
// They are NOT product photos or specifications.
const C = '#00D5FF', B = '#268BFF', I = '#A5E8FF', S = '#65758B'
const d = (n: number) => ({ animationDelay: `${n * 0.3}s` })

const Bulb = ({ x, y, delay = 0 }: { x: number; y: number; delay?: number }) => (
  <g>
    <circle cx={x} cy={y} r="16" fill="#ffe6a8" className="a-glow" style={d(delay)} />
    <circle cx={x} cy={y} r="7" fill="#ffd36b" />
    <rect x={x - 4} y={y + 7} width="8" height="6" rx="1" fill={S} />
  </g>
)
const Box = ({ x, y, w, h, label }: { x: number; y: number; w: number; h: number; label?: string }) => (
  <g><rect x={x} y={y} width={w} height={h} rx="5" fill="#13213a" stroke={C} strokeOpacity=".6" />
    {label && <text x={x + w / 2} y={y + h / 2 + 3} textAnchor="middle" fontSize="8" fill={I} fontFamily="Sora">{label}</text>}</g>
)
const Led = ({ x, y, delay = 0, c = C }: { x: number | string; y: number | string; delay?: number; c?: string }) => <circle cx={x} cy={y} r="2.5" fill={c} className="a-blink" style={d(delay)} />
const Flow = ({ d: p, c = C }: { d: string; c?: string }) => <path d={p} fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" className="a-flow" />

const scenes: Record<string, ReactNode> = {
  'audiofy-system': (<>
    <Box x={30} y={50} w={46} h={60} /><circle cx="53" cy="86" r="14" fill="none" stroke={I} /><circle cx="53" cy="86" r="5" fill={C} />
    {[0, 1, 2].map((i) => <circle key={i} cx="53" cy="86" r="14" fill="none" stroke={C} className="a-ripple" style={d(i * 2)} />)}
    {[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} x={110 + i * 12} y="40" width="7" height="70" rx="2" fill={i % 2 ? B : C} className="a-bar" style={{ animationDelay: `${i * 0.13}s` }} />)}
  </>),
  'rack-mount-type': (<>
    {[0, 1, 2].map((i) => <g key={i}><rect x="30" y={30 + i * 32} width="140" height="26" rx="3" fill="#13213a" stroke={C} strokeOpacity=".5" />
      {[0, 1, 2, 3].map((j) => <Led key={j} x={46 + j * 12} y={43 + i * 32} delay={i + j} />)}
      <rect x="120" y={38 + i * 32} width="40" height="10" rx="2" fill="#0b1728" /></g>)}
    <Flow d="M170 43 H190 M170 75 H190 M170 107 H190" />
  </>),
  'envision-touch-server': (<>
    <rect x="35" y="22" width="130" height="96" rx="8" fill="#0b1728" stroke={C} />
    {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={46 + (i % 3) * 38} y={34 + Math.floor(i / 3) * 40} width="32" height="32" rx="6" fill={B} className="a-glow" style={d(i)} />)}
    <circle cx="62" cy="50" r="6" fill="none" stroke="#fff" className="a-ripple" style={{ animationDuration: '3s' }} />
  </>),
  'compact-and-compactdin': (<>
    <rect x="15" y="92" width="170" height="8" fill={S} />
    {[0, 1, 2].map((i) => <g key={i}><rect x={28 + i * 54} y="36" width="46" height="62" rx="4" fill="#13213a" stroke={C} strokeOpacity=".6" />
      <Led x={38 + i * 54} y="48" delay={i * 2} /><Led x={50 + i * 54} y="48" delay={i * 2 + 1} c="#7CFFB2" /><rect x={36 + i * 54} y="62" width="30" height="20" rx="2" fill="#0b1728" /></g>)}
    <Flow d="M20 112 H180" />
  </>),
  'micro-and-microdin': (<>
    <rect x="15" y="86" width="170" height="6" fill={S} />
    {[0, 1, 2, 3].map((i) => <g key={i}><rect x={24 + i * 41} y="50" width="32" height="40" rx="4" fill="#13213a" stroke={C} strokeOpacity=".6" /><Led x={40 + i * 41} y="60" delay={i} /></g>)}
    <circle cx="40" cy="108" r="3.5" fill={C} className="a-hop" style={{ '--dx': '120px' } as React.CSSProperties} /><Flow d="M30 108 H170" />
  </>),
  'knx-cable': (<>
    <path d="M20 90 C 60 20, 100 160, 140 70 S 180 50, 185 60" fill="none" stroke={S} strokeWidth="10" strokeLinecap="round" />
    <path d="M20 90 C 60 20, 100 160, 140 70 S 180 50, 185 60" fill="none" stroke="#0b1728" strokeWidth="6" strokeLinecap="round" />
    <path d="M20 90 C 60 20, 100 160, 140 70 S 180 50, 185 60" fill="none" stroke={C} strokeWidth="2" strokeLinecap="round" className="a-flow" />
    <circle cx="20" cy="90" r="7" fill={B} /><circle cx="185" cy="60" r="7" fill={C} className="a-glow" />
  </>),
  'flush-dali-gateway': (<>
    <Box x={14} y={50} w={46} h={40} label="DALI" />
    <Flow d="M60 70 H190" />
    {[0, 1, 2, 3].map((i) => <Bulb key={i} x={86 + i * 30} y={50} delay={i * 2} />)}
    {[0, 1, 2, 3].map((i) => <line key={i} x1={86 + i * 30} y1="64" x2={86 + i * 30} y2="70" stroke={C} />)}
  </>),
  '640ma-din-power-supply-with-30v-auxillary': (<>
    <Box x={20} y={40} w={60} h={60} />
    <path d="M52 52 L44 72 H54 L48 90 L64 66 H54 Z" fill={C} className="a-glow" />
    <Flow d="M80 60 H140 M80 70 H140 M80 80 H140" /><Flow d="M80 90 H140" c="#ffb347" />
    {[0, 1, 2, 3].map((i) => <circle key={i} cx="160" cy={52 + i * 14} r="5" fill={i === 3 ? '#ffb347' : B} className="a-blink" style={d(i)} />)}
  </>),
  '160ma-flush-power-supply': (<>
    <circle cx="70" cy="70" r="32" fill="#13213a" stroke={C} /><circle cx="70" cy="70" r="14" fill="#0b1728" stroke={I} />
    <circle cx="70" cy="70" r="14" fill="none" stroke={C} className="a-ripple" /><circle cx="70" cy="70" r="14" fill="none" stroke={C} className="a-ripple" style={d(3)} />
    <Flow d="M105 70 H185" />
  </>),
  '8-channel-push-button-interface': (<>
    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <g key={i} className="a-press" style={d(i)}><rect x={22 + (i % 4) * 36} y={26 + Math.floor(i / 4) * 34} width="28" height="24" rx="5" fill={B} fillOpacity=".7" stroke={I} /></g>)}
    <Flow d="M100 98 V120 H190" /><circle cx="100" cy="106" r="3" fill={C} className="a-blink" />
  </>),
  'single-channel-fan-controller': (<>
    <g className="sv"><g className="a-spin" style={{ animationDuration: '1.2s' }}>{[0, 120, 240].map((a) => <ellipse key={a} cx="70" cy="42" rx="10" ry="26" fill={B} fillOpacity=".8" transform={`rotate(${a} 70 70)`} />)}</g></g>
    <circle cx="70" cy="70" r="7" fill={I} />
    <Box x={130} y={44} w={50} h={52} />{[0, 1, 2].map((i) => <rect key={i} x={140 + i * 12} y="52" width="7" height="36" rx="2" fill={C} className="a-bar" style={{ animationDelay: `${i * 0.4}s`, animationDuration: '3s' }} />)}
  </>),
  '4-channel-switch-actuator-flush-mounted': (<>
    <Box x={14} y={30} w={50} h={80} label="4×" />
    {[0, 1, 2, 3].map((i) => <g key={i}><Flow d={`M64 ${42 + i * 19} H150`} /><Bulb x={170} y={42 + i * 19} delay={i * 2} /></g>)}
  </>),
}

export default function ProductAnim({ slug, className = '' }: { slug: string; className?: string }) {
  return (
    <svg viewBox="0 0 200 140" className={`sv h-full w-full ${className}`} role="img" aria-label="Illustrative animation of the product function">
      <defs><radialGradient id="pg"><stop offset="0" stopColor="#0f2a4a" /><stop offset="1" stopColor="#07111f" /></radialGradient></defs>
      <rect width="200" height="140" fill="url(#pg)" />
      <g stroke="#00D5FF" strokeOpacity=".08">{[...Array(10)].map((_, i) => <path key={i} d={`M${i * 22} 0V140M0 ${i * 16}H200`} />)}</g>
      {scenes[slug] ?? null}
    </svg>
  )
}

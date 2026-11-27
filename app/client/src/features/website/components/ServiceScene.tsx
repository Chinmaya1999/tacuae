import { useRef, useState, useEffect, type CSSProperties, type ReactNode } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import ProductAnim from './ProductAnim'

const C = '#8b93ff', B = '#6366f1', I = '#c7d2fe', S = '#65758B'
const dl = (n: number): CSSProperties => ({ animationDelay: `${n}s` })

const Bg = () => (<>
  <defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#232a55" /><stop offset="1" stopColor="#0b1020" /></linearGradient></defs>
  <rect width="600" height="380" fill="url(#sg)" />
  <g stroke={C} strokeOpacity=".07">{[...Array(16)].map((_, i) => <path key={i} d={`M${i * 40} 0V380M0 ${i * 40}H600`} />)}</g>
</>)
const Gauge = ({ x, y, label, v, c }: { x: number; y: number; label: string; v: string; c: string }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r="34" fill="none" stroke="#ffffff14" strokeWidth="7" />
    <circle r="34" fill="none" stroke={c} strokeWidth="7" strokeLinecap="round" pathLength="100" strokeDasharray="100" className="a-arc" style={{ transform: 'rotate(-90deg)' }} />
    <text textAnchor="middle" y="4" fontSize="13" fill="#fff" fontFamily="Sora">{v}</text>
    <text textAnchor="middle" y="52" fontSize="9" fill={I} fontFamily="Sora" letterSpacing="1">{label}</text>
  </g>
)

const scenes: Record<string, ReactNode> = {
  'building-management-system': (<>
    <g transform="translate(40 40)"><rect width="190" height="300" rx="6" fill="#1b2340" stroke={C} strokeOpacity=".5" />
      {[...Array(40)].map((_, i) => <rect key={i} x={12 + (i % 5) * 35} y={14 + Math.floor(i / 5) * 35} width="24" height="24" rx="3" fill="#ffe6a8" className="a-glow" style={{ animationDelay: `${((i * 37) % 11) * 0.5}s`, animationDuration: `${3 + (i % 4)}s` }} />)}
      <rect x="168" y="10" width="14" height="280" fill="#101828" /><rect x="170" y="14" width="10" height="16" fill={C} className="a-rise" style={{ '--dy': '240px', animationDuration: '7s' } as CSSProperties} /></g>
    <Gauge x={320} y={100} label="HVAC" v="22°C" c={C} /><Gauge x={430} y={100} label="POWER" v="68%" c={B} /><Gauge x={540} y={100} label="WATER" v="OK" c="#7CFFB2" />
    <g transform="translate(280 190)"><text fontSize="10" fill={I} fontFamily="Sora" letterSpacing="2">ENERGY</text>
      {[...Array(14)].map((_, i) => <rect key={i} x={i * 20} y={20} width="12" height="90" rx="2" fill={i % 3 ? B : C} className="a-bar" style={{ animationDelay: `${i * 0.12}s`, animationDuration: `${1.6 + (i % 3) * 0.5}s` }} />)}</g>
    <g transform="translate(290 320)"><circle r="14" fill="none" stroke={C} strokeWidth="2" /><g className="a-spin">{[0, 90, 180, 270].map((a) => <rect key={a} x="-2" y="-12" width="4" height="12" fill={C} transform={`rotate(${a})`} />)}</g><text x="26" y="4" fontSize="10" fill="#fff" fontFamily="Sora">PUMP · RUNNING</text></g>
  </>),
  'smart-home-automation': (<>
    <g transform="translate(40 70)"><path d="M0 110 L150 0 L300 110 V250 H0 Z" fill="#1b2340" stroke={C} strokeOpacity=".6" />
      {[[40, 130], [130, 130], [210, 130]].map(([x, y], i) => <rect key={i} x={x} y={y} width="50" height="50" rx="4" fill="#ffe6a8" className="a-glow" style={dl(i * 1.4)} />)}
      <rect x="125" y="190" width="50" height="60" fill="#101828" /></g>
    <g transform="translate(420 40)"><rect width="140" height="290" rx="22" fill="#101828" stroke="#fff" strokeOpacity=".4" strokeWidth="2" />
      {['Lights', 'Curtains', 'Climate', 'Security'].map((t, i) => <g key={t} transform={`translate(16 ${34 + i * 60})`}><rect width="108" height="44" rx="10" fill="#1b2340" /><text x="12" y="27" fontSize="11" fill="#fff" fontFamily="Sora">{t}</text>
        <rect x="70" y="14" width="30" height="16" rx="8" fill={S} /><circle cx="78" cy="22" r="6" fill="#fff" className="a-rise" style={{ '--dy': '0px', animation: `a-hop 4s ease-in-out ${i * 0.9}s infinite`, ['--dx' as string]: '14px' } as CSSProperties} /></g>)}</g>
    {[0, 1, 2].map((i) => <path key={i} d={`M360 ${150 - i * 14} q20 -${14 + i * 6} 40 0`} fill="none" stroke={C} strokeWidth="2" className="a-blink" style={dl(i * 0.4)} />)}
  </>),
  'guest-room-management-system': (<>
    <rect x="30" y="60" width="540" height="270" rx="10" fill="#1b2340" stroke={C} strokeOpacity=".5" />
    <rect x="70" y="220" width="220" height="70" rx="10" fill="#25446e" /><rect x="70" y="190" width="70" height="40" rx="10" fill="#e8eef6" fillOpacity=".8" />
    <g><circle cx="330" cy="110" r="50" fill="#ffe6a8" className="a-glow" /><circle cx="330" cy="110" r="10" fill="#ffd36b" /></g>
    <rect x="410" y="90" width="120" height="110" rx="4" fill="#b4bcff" /><rect x="410" y="90" width="60" height="110" fill="#26466f" className="a-fill" style={{ transformOrigin: 'left', animationDuration: '7s' }} />
    <g transform="translate(60 100)"><rect width="110" height="60" rx="6" fill="#101828" stroke={C} /><rect x="6" y="6" width="98" height="6" fill={B} className="a-blink" /><rect x="6" y="22" width="98" height="32" fill="#232a55" className="a-glow" /></g>
    <g transform="translate(250 220)"><rect x="150" y="-20" width="80" height="120" rx="12" fill="#101828" stroke="#fff" strokeOpacity=".4" />
      {['☀', '❄', '▤', '♪'].map((t, i) => <g key={i} transform={`translate(${160 + (i % 2) * 34} ${-8 + Math.floor(i / 2) * 44})`}><rect width="28" height="36" rx="6" fill={B} className="a-glow" style={dl(i * 1.2)} /><text x="14" y="23" textAnchor="middle" fontSize="13" fill="#fff">{t}</text></g>)}</g>
  </>),
  'lighting-and-dimming-control': (<>
    {[0, 1, 2, 3, 4, 5].map((i) => <g key={i}><polygon points={`${70 + i * 90},60 ${110 + i * 90},60 ${140 + i * 90},250 ${40 + i * 90},250`} fill="#ffe6a8" className="a-glow" style={{ ...dl(i * 0.35), opacity: 0.2 }} /><rect x={65 + i * 90} y="52" width="50" height="12" rx="6" fill="#ffd36b" /></g>)}
    <g className="a-walk"><circle cx="40" cy="262" r="9" fill="#e8eef6" /><rect x="32" y="272" width="16" height="36" rx="6" fill="#e8eef6" /></g>
    <g className="a-hue"><rect x="50" y="330" width="500" height="14" rx="7" fill="url(#rg)" /><defs><linearGradient id="rg"><stop offset="0" stopColor="#ff3d6e" /><stop offset=".5" stopColor="#a5b4fc" /><stop offset="1" stopColor="#7c5cff" /></linearGradient></defs></g>
    <text x="50" y="322" fontSize="10" fill={I} fontFamily="Sora" letterSpacing="2">DALI DIMMING · DMX / RGB</text>
  </>),
  'knx-automation': (<>
    <path d="M40 190 H560" stroke={S} strokeWidth="8" /><path d="M40 190 H560" stroke={C} strokeWidth="2" className="a-flow" />
    {['Sensor', 'Touch panel', 'Actuator', 'Dimmer', 'Gateway', 'App'].map((t, i) => <g key={t} transform={`translate(${60 + i * 90} ${i % 2 ? 230 : 100})`}>
      <line x1="30" x2="30" y1={i % 2 ? -40 : 60} y2={i % 2 ? 0 : 90} stroke={C} strokeOpacity=".6" />
      <rect width="60" height="60" rx="10" fill="#1b2340" stroke={C} className="" /><circle cx="30" cy="30" r="8" fill={B} className="a-glow" style={dl(i * 0.5)} />
      <text x="30" y="78" textAnchor="middle" fontSize="9" fill={I} fontFamily="Sora">{t}</text></g>)}
    {[0, 1, 2].map((i) => <rect key={i} x="40" y="185" width="22" height="10" rx="5" fill="#fff" className="a-hop" style={{ ['--dx' as string]: '500px', animationDuration: '5s', animationDelay: `${i * 1.6}s` } as CSSProperties} />)}
  </>),
  'knx-training': (<>
    {['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'].map((t, i) => <g key={t} transform={`translate(${40 + i * 106} 150)`}>
      <rect width="92" height="100" rx="10" fill="#1b2340" stroke={C} strokeOpacity=".5" /><text x="46" y="30" textAnchor="middle" fontSize="13" fill="#fff" fontFamily="Sora">{t}</text>
      <rect x="14" y="60" width="64" height="6" rx="3" fill="#ffffff18" /><rect x="14" y="60" width="64" height="6" rx="3" fill={C} className="a-fill" style={{ animationDelay: `${i * 0.8}s`, animationDuration: '5s' }} /></g>)}
    <g transform="translate(260 40)"><rect width="80" height="56" rx="6" fill="#101828" stroke={I} /><rect x="8" y="8" width="64" height="36" fill="#232a55" className="a-glow" /><rect x="-10" y="56" width="100" height="6" rx="3" fill={S} /></g>
    <g transform="translate(270 290)" className="a-pop"><circle r="28" cx="30" cy="30" fill={B} /><path d="M18 30 l9 9 l17 -19" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" /></g>
    <text x="300" y="360" textAnchor="middle" fontSize="10" fill={I} fontFamily="Sora" letterSpacing="3">KNX BASIC COURSE · 5 DAYS</text>
  </>),
}

export function ServiceScene({ slug, className = '' }: { slug: string; className?: string }) {
  return (
    <svg viewBox="0 0 600 380" className={`sv h-full w-full ${className}`} role="img" aria-label="Illustrative animation of the solution">
      <Bg />{scenes[slug] ?? null}
    </svg>
  )
}

/** Crossfades a photo with its animated scene automatically while on screen. */
export function MediaLoop({ image, alt, slug, kind = 'service', interval = 4200, className = '' }:
  { image: string; alt: string; slug: string; kind?: 'service' | 'product'; interval?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: '-10% 0px' })
  const [anim, setAnim] = useState(true)
  useEffect(() => {
    if (!inView || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setAnim((a) => !a), interval)
    return () => clearInterval(t)
  }, [inView, interval])
  return (
    <div ref={ref} className={`relative h-full w-full overflow-hidden ${className}`}>
      <img src={image} alt={alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1600ms] group-hover:scale-110" />
      <AnimatePresence>
        {anim && (
          <motion.div key="a" className="absolute inset-0 bg-midnight" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9 }}>
            {kind === 'service' ? <ServiceScene slug={slug} className="object-cover" /> : <ProductAnim slug={slug} />}
          </motion.div>
        )}
      </AnimatePresence>
      <span className="absolute bottom-3 right-3 rounded-full bg-midnight/70 px-2.5 py-1 text-[0.7rem] uppercase tracking-[0.18em] text-ice backdrop-blur">{anim ? 'Animation' : 'Photo'}</span>
    </div>
  )
}

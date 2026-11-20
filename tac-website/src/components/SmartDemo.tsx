import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Lightbulb, Snowflake, Blinds, ShieldCheck, Zap, SlidersHorizontal, Minus, Plus } from 'lucide-react'
import { Reveal, Words } from './ui'

type Key = 'lighting' | 'climate' | 'curtains' | 'security' | 'energy' | 'room'
const controls: { key: Key; label: string; icon: typeof Lightbulb; x: number; y: number }[] = [
  { key: 'lighting', label: 'Lighting', icon: Lightbulb, x: 50, y: 14 },
  { key: 'climate', label: 'Air Conditioning', icon: Snowflake, x: 18, y: 30 },
  { key: 'curtains', label: 'Curtains', icon: Blinds, x: 80, y: 40 },
  { key: 'security', label: 'Security', icon: ShieldCheck, x: 50, y: 82 },
  { key: 'energy', label: 'Energy', icon: Zap, x: 12, y: 74 },
  { key: 'room', label: 'Room Controls', icon: SlidersHorizontal, x: 34, y: 48 },
]
const scenes = {
  Welcome: { light: 80, temp: 23, curtain: 100, armed: false },
  Cinema: { light: 12, temp: 22, curtain: 0, armed: false },
  Sleep: { light: 0, temp: 21, curtain: 0, armed: true },
} as const

export default function SmartDemo() {
  const [active, setActive] = useState<Key>('lighting')
  const [light, setLight] = useState(70)
  const [temp, setTemp] = useState(23)
  const [curtain, setCurtain] = useState(30) // % open
  const [armed, setArmed] = useState(false)
  const [scene, setScene] = useState<string>('')
  const glow = light / 100
  const kwh = Math.max(0.6, 0.8 + (light / 100) * 0.9 + Math.max(0, 25 - temp) * 0.22 - (curtain / 100) * 0.1).toFixed(1)

  const apply = (n: keyof typeof scenes) => { const s = scenes[n]; setLight(s.light); setTemp(s.temp); setCurtain(s.curtain); setArmed(s.armed); setScene(n) }

  const Range = ({ v, set, label }: { v: number; set: (n: number) => void; label: string }) => (
    <label className="block">
      <span className="mb-3 flex justify-between text-sm text-silver">{label}<span className="text-white tabular-nums">{v}%</span></span>
      <input type="range" min={0} max={100} value={v} onChange={(e) => { set(+e.target.value); setScene('') }} className="w-full accent-[#00D5FF]" />
    </label>
  )

  return (
    <section className="relative overflow-hidden bg-deep py-24 md:py-36" id="experience">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="container-x relative">
        <span className="eyebrow">Smart Automation Experience</span>
        <Words text="ONE ROOM. EVERY SYSTEM. ONE TOUCH." className="h2 mt-5 max-w-4xl" />
        <Reveal><p className="mt-6 max-w-2xl text-silver">Select a control point to see how lighting, climate, curtains, security and energy respond. This is an interactive illustration of what an integrated automation system can do — not live data.</p></Reveal>

        <div className="mt-14 grid gap-8 lg:grid-cols-12">
          {/* ROOM */}
          <div className="min-w-0 lg:col-span-8">
            <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-white/10 bg-graphite" role="group" aria-label="Interactive smart room">
              <svg viewBox="0 0 800 500" className="absolute inset-0 h-full w-full" aria-hidden>
                <defs>
                  <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#13213a" /><stop offset="1" stopColor="#0d1a2e" /></linearGradient>
                  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5fb8ff" /><stop offset="1" stopColor="#d6f1ff" /></linearGradient>
                  <radialGradient id="beam" cx=".5" cy="0" r="1"><stop offset="0" stopColor="#ffe6a8" stopOpacity=".9" /><stop offset="1" stopColor="#ffe6a8" stopOpacity="0" /></radialGradient>
                </defs>
                <rect width="800" height="500" fill="url(#wall)" />
                {/* floor */}
                <polygon points="0,380 800,380 800,500 0,500" fill="#0a1424" />
                <path d="M0 380H800" stroke="#00D5FF" strokeOpacity=".25" />
                {[...Array(8)].map((_, i) => <path key={i} d={`M${i * 114} 380 L${i * 114 - (400 - i * 114) * 0.5} 500`} stroke="#fff" strokeOpacity=".04" />)}
                {/* window */}
                <rect x="470" y="70" width="270" height="240" rx="6" fill="url(#sky)" />
                <g opacity=".5"><rect x="500" y="200" width="18" height="110" fill="#6e8aa8" /><rect x="525" y="160" width="22" height="150" fill="#7a95b3" /><rect x="560" y="220" width="16" height="90" fill="#6e8aa8" /><rect x="590" y="130" width="26" height="180" fill="#7a95b3" /><rect x="630" y="190" width="20" height="120" fill="#6e8aa8" /><rect x="665" y="150" width="24" height="160" fill="#7a95b3" /></g>
                <path d="M470 190H740M605 70V310" stroke="#0b1728" strokeWidth="4" />
                <rect x="470" y="70" width="270" height="240" rx="6" fill="none" stroke="#a7b4c5" strokeWidth="4" />
                {/* curtains */}
                <motion.rect x="440" y="56" height="270" fill="#26466f" initial={false} animate={{ width: 150 * (1 - curtain / 100) + 14 }} transition={{ type: 'spring', stiffness: 80, damping: 18 }} />
                <motion.rect y="56" height="270" fill="#26466f" initial={false} animate={{ x: 770 - (150 * (1 - curtain / 100) + 14), width: 150 * (1 - curtain / 100) + 14 }} transition={{ type: 'spring', stiffness: 80, damping: 18 }} />
                <path d="M430 50H780" stroke="#a7b4c5" strokeWidth="5" />
                {/* sofa + table */}
                <rect x="190" y="320" width="300" height="70" rx="14" fill="#1d3558" /><rect x="190" y="290" width="300" height="42" rx="14" fill="#25446e" />
                <rect x="170" y="310" width="36" height="80" rx="12" fill="#1d3558" /><rect x="474" y="310" width="36" height="80" rx="12" fill="#1d3558" />
                <rect x="260" y="412" width="160" height="14" rx="4" fill="#0f1f38" stroke="#00D5FF" strokeOpacity=".3" />
                {/* AC unit */}
                <rect x="70" y="100" width="190" height="48" rx="10" fill="#e8eef6" /><rect x="82" y="132" width="166" height="6" rx="3" fill="#b9c6d6" />
                <text x="90" y="124" fontFamily="Sora" fontSize="18" fill="#07111f">{temp}°C</text>
                <motion.circle cx="238" cy="118" r="4" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} fill={temp < 24 ? '#00D5FF' : '#ffb347'} />
                {[0, 1, 2].map((i) => (
                  <motion.path key={i} d={`M${110 + i * 50} 150 q10 30 0 60 t0 60`} stroke="#00D5FF" strokeWidth="1.5" fill="none" strokeLinecap="round"
                    animate={{ opacity: [0, 0.7, 0], y: [0, 30] }} transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.5 }} style={{ opacity: 0.5 * (1.2 - (temp - 18) / 10) }} />
                ))}
                {/* ceiling lights */}
                {[230, 400, 570].map((x) => (
                  <g key={x}>
                    <polygon points={`${x - 20},40 ${x + 20},40 ${x + 120},380 ${x - 120},380`} fill="url(#beam)" style={{ opacity: glow * 0.55, transition: 'opacity .5s' }} />
                    <rect x={x - 22} y="30" width="44" height="12" rx="6" fill={light > 0 ? '#ffe6a8' : '#2b3a52'} style={{ filter: `drop-shadow(0 0 ${glow * 14}px #ffe6a8)` }} />
                  </g>
                ))}
                <rect width="800" height="500" fill="#07111f" style={{ opacity: 0.55 * (1 - glow) , transition: 'opacity .5s', pointerEvents: 'none' }} />
                {/* security */}
                <g transform="translate(380 395)" opacity="0">{/* spacer */}</g>
                <rect x="722" y="340" width="40" height="64" rx="8" fill="#0b1728" stroke={armed ? '#00D5FF' : '#65758b'} />
                <circle cx="742" cy="360" r="6" fill={armed ? '#00D5FF' : '#65758b'} className={armed ? 'pulse-dot' : ''} />
                <rect x="730" y="374" width="24" height="20" rx="3" fill={armed ? '#00d5ff33' : '#ffffff10'} />
              </svg>

              {controls.map((c) => {
                const on = active === c.key
                return (
                  <button key={c.key} onClick={() => setActive(c.key)} aria-pressed={on} aria-label={c.label}
                    className="group absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${c.x}%`, top: `${c.y}%` }}>
                    <span className={`absolute inset-0 rounded-full ${on ? 'bg-cyan/40 animate-ping' : ''}`} />
                    <span className={`relative grid h-11 w-11 place-items-center rounded-full border backdrop-blur transition ${on ? 'border-cyan bg-cyan text-midnight' : 'border-white/40 bg-midnight/60 text-white group-hover:border-cyan'}`}><c.icon size={18} /></span>
                    <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded bg-midnight/80 px-2 py-0.5 text-[0.7rem] tracking-wider opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">{c.label}</span>
                  </button>
                )
              })}
            </div>

            {/* mobile-friendly selector rail */}
            <div className="rail mt-4 flex gap-2 overflow-x-auto lg:hidden" role="tablist" aria-label="Control points">
              {controls.map((c) => (
                <button key={c.key} role="tab" aria-selected={active === c.key} onClick={() => setActive(c.key)}
                  className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs ${active === c.key ? 'border-cyan bg-cyan text-midnight' : 'border-white/20'}`}><c.icon size={14} />{c.label}</button>
              ))}
            </div>
          </div>

          {/* PANEL */}
          <div className="min-w-0 lg:col-span-4">
            <div className="glass rounded-3xl border border-white/10 p-7 min-h-[360px]" aria-live="polite">
              <AnimatePresence mode="wait">
                <motion.div key={active} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.3 }}>
                  {active === 'lighting' && (<><H icon={Lightbulb} t="Lighting" d="Dim, schedule or switch lighting by zone." /><Range v={light} set={setLight} label="Brightness" /></>)}
                  {active === 'climate' && (<><H icon={Snowflake} t="Air Conditioning" d="Set the room temperature from one interface." />
                    <div className="flex items-center justify-center gap-6 py-6">
                      <Btn onClick={() => { setTemp((t) => Math.max(16, t - 1)); setScene('') }} label="Decrease temperature"><Minus size={18} /></Btn>
                      <span className="font-display text-6xl font-light tabular-nums">{temp}<span className="text-2xl text-cyan">°C</span></span>
                      <Btn onClick={() => { setTemp((t) => Math.min(30, t + 1)); setScene('') }} label="Increase temperature"><Plus size={18} /></Btn>
                    </div></>)}
                  {active === 'curtains' && (<><H icon={Blinds} t="Curtains" d="Open and close curtains and blinds automatically." /><Range v={curtain} set={setCurtain} label="Curtains open" /></>)}
                  {active === 'security' && (<><H icon={ShieldCheck} t="Security" d="Unified security with real-time monitoring and alerts." />
                    <button onClick={() => setArmed(!armed)} className={`mt-2 w-full rounded-xl border py-4 text-sm transition ${armed ? 'border-cyan bg-cyan/10 text-cyan' : 'border-white/20'}`}>{armed ? 'System armed — tap to disarm' : 'System disarmed — tap to arm'}</button></>)}
                  {active === 'energy' && (<><H icon={Zap} t="Energy" d="Monitor and control energy use across devices." />
                    <div className="py-4"><div className="font-display text-5xl font-light tabular-nums">{kwh}<span className="ml-1 text-lg text-cyan">kW</span></div>
                      <div className="mt-4 h-2 overflow-hidden rounded bg-white/10"><motion.div className="h-full bg-gradient-to-r from-cyan to-azure" animate={{ width: `${Math.min(100, +kwh * 40)}%` }} /></div>
                      <p className="mt-3 text-xs text-slate">Illustrative figure responding to your settings.</p></div></>)}
                  {active === 'room' && (<><H icon={SlidersHorizontal} t="Room Controls" d="One touch sets lighting, climate, curtains and security together." />
                    <div className="grid gap-3">{(Object.keys(scenes) as (keyof typeof scenes)[]).map((n) => (
                      <button key={n} onClick={() => apply(n)} className={`rounded-xl border py-3.5 text-sm transition ${scene === n ? 'border-cyan bg-cyan text-midnight' : 'border-white/20 hover:border-cyan'}`}>{n} scene</button>))}</div></>)}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function H({ icon: I, t, d }: { icon: typeof Lightbulb; t: string; d: string }) {
  return <div className="mb-6"><div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-cyan/15 text-cyan"><I size={22} /></div><h3 className="font-display text-2xl">{t}</h3><p className="mt-2 text-sm text-silver">{d}</p></div>
}
function Btn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return <button onClick={onClick} aria-label={label} className="grid h-12 w-12 place-items-center rounded-full border border-white/25 transition hover:border-cyan hover:text-cyan">{children}</button>
}

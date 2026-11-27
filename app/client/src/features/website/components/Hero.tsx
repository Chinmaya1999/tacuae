import { useEffect, useRef, useState } from 'react'
import { animate, motion, useInView } from 'framer-motion'
import { Blinds, Lightbulb, Music, ShieldCheck, Snowflake, Zap } from 'lucide-react'
import { Magnetic } from '../../../shared/components/ui'
import { usePrefersReduced } from '../../../shared/lib/useReducedMotion'

const title = 'Intelligence built into every space.'
const CYAN = '#8b93ff'

type Key = 'lighting' | 'climate' | 'curtains' | 'security' | 'energy' | 'audio'
const nodes: { key: Key; label: string; icon: typeof Lightbulb }[] = [
  { key: 'lighting', label: 'Lighting', icon: Lightbulb },
  { key: 'climate', label: 'Climate', icon: Snowflake },
  { key: 'curtains', label: 'Curtains', icon: Blinds },
  { key: 'security', label: 'Security', icon: ShieldCheck },
  { key: 'energy', label: 'Energy', icon: Zap },
  { key: 'audio', label: 'Audio', icon: Music },
]

const scenes = [
  { name: 'Morning', time: 7, lit: 22, sky: 'linear-gradient(to top,#e8935e 0%,#7d6a8f 38%,#16335a 100%)', celestial: { x: 49, y: 60, moon: false },
    act: 'Curtains open · Lights fade up · Climate eases to 23°C', state: { lighting: '40%', climate: '23°C', curtains: 'Open', security: 'Disarmed', energy: 'Normal', audio: 'Ambient' } },
  { name: 'Day', time: 13, lit: 4, sky: 'linear-gradient(to top,#b4c0ff 0%,#3b8fe0 55%,#1d5fa8 100%)', celestial: { x: 60, y: 17, moon: false },
    act: 'Lights off · Climate holds 22°C · Security armed while away', state: { lighting: 'Off', climate: '22°C', curtains: 'Half', security: 'Armed', energy: 'Saving', audio: 'Off' } },
  { name: 'Evening', time: 19, lit: 72, sky: 'linear-gradient(to top,#f0985a 0%,#b04f6e 32%,#2a1b55 72%,#0f1636 100%)', celestial: { x: 82, y: 54, moon: false },
    act: 'Welcome scene · Curtains close · Lighting warms to 80%', state: { lighting: '80%', climate: '23°C', curtains: 'Closed', security: 'Disarmed', energy: 'Normal', audio: 'Playing' } },
  { name: 'Night', time: 23.5, lit: 36, sky: 'linear-gradient(to top,#0e2342 0%,#08142a 55%,#040a15 100%)', celestial: { x: 72, y: 18, moon: true },
    act: 'Night scene · Lights dim to 15% · System armed', state: { lighting: '15%', climate: '21°C', curtains: 'Closed', security: 'Armed', energy: 'Saver', audio: 'Off' } },
]

// Dubai-style skyline silhouette: [x, width, height]
const skyline: [number, number, number][] = [
  [0, 70, 90], [70, 50, 150], [120, 64, 110], [184, 44, 190], [228, 70, 120], [298, 56, 170], [354, 80, 100], [434, 52, 140],
  [486, 66, 210], [552, 60, 130], [612, 48, 100], [660, 70, 160], [730, 60, 120], [790, 84, 180], [874, 56, 110], [930, 70, 150],
  [1000, 52, 100], [1052, 58, 170], [1110, 66, 120], [1176, 50, 200], [1226, 74, 130], [1300, 60, 160], [1360, 80, 110],
]
const hash = (a: number, b: number) => (((a + 7) * 73856093) ^ ((b + 3) * 19349663)) >>> 0
const fmt = (t: number) => `${String(Math.floor(t % 24)).padStart(2, '0')}:${String(Math.floor((t % 1) * 60)).padStart(2, '0')}`

function Skyline({ lit }: { lit: number }) {
  return (
    <svg viewBox="0 0 1440 300" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 h-[34%] w-full" aria-hidden>
      <path d="M1010 300 L1018 120 L1024 40 L1029 120 L1038 300 Z" fill="#0a0f1f" />
      <path d="M0 300 V212 H1440 V300 Z" fill="#0a0f1f" />
      {skyline.map(([x, w, h], i) => (
        <g key={i}>
          <rect x={x} y={300 - h} width={w} height={h} fill="#111834" stroke="#2b3363" strokeOpacity=".5" />
          {Array.from({ length: Math.floor(h / 18) }).map((_, r) => Array.from({ length: Math.floor(w / 14) }).map((__, c) => {
            const hv = hash(i * 31 + r, c) % 100
            return <rect key={`${r}-${c}`} x={x + 6 + c * 14} y={300 - h + 8 + r * 18} width="6" height="8" rx="1" fill={hv % 3 ? '#ffe6a8' : '#c7d2fe'}
              style={{ opacity: hv < lit ? 0.85 : 0.05, transition: `opacity ${0.6 + (hv % 10) * 0.12}s ease ${(hv % 7) * 0.08}s` }} />
          }))}
        </g>
      ))}
    </svg>
  )
}

export default function Hero() {
  const reduced = usePrefersReduced()
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref)
  const [idx, setIdx] = useState(0)
  const [clock, setClock] = useState(scenes[0].time)
  const clockRef = useRef(scenes[0].time)
  const scene = scenes[idx]

  // auto-advance
  useEffect(() => {
    if (reduced || !inView) return
    const t = setTimeout(() => setIdx((i) => (i + 1) % scenes.length), 5600)
    return () => clearTimeout(t)
  }, [idx, reduced, inView])

  // smooth clock between scenes
  useEffect(() => {
    const from = clockRef.current; let to = scene.time
    if (to <= from % 24) to += 24
    const start = from % 24
    const c = animate(start, to, { duration: reduced ? 0 : 1.8, ease: [0.4, 0, 0.2, 1], onUpdate: (v) => { clockRef.current = v; setClock(v) } })
    return () => c.stop()
  }, [idx, reduced, scene.time])

  const R = 35.8
  return (
    <section ref={ref} className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-midnight" aria-label="Introduction">
      {/* sky layers */}
      {scenes.map((s, i) => <div key={s.name} className="absolute inset-0 -z-30 transition-opacity duration-[2200ms]" style={{ background: s.sky, opacity: i === idx ? 1 : 0 }} />)}
      <div className="absolute inset-0 -z-30 bg-midnight/10" />
      {/* sun / moon */}
      <motion.div className="absolute -z-10 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full" animate={{ left: `${scene.celestial.x}%`, top: `${scene.celestial.y}%` }} transition={{ duration: reduced ? 0 : 2.4, ease: [0.4, 0, 0.2, 1] }}
        style={{ background: scene.celestial.moon ? 'radial-gradient(circle,#f4f8ff 0 38%,rgba(210,225,255,.35) 40%,transparent 70%)' : 'radial-gradient(circle,#fff6d6 0 32%,rgba(255,214,120,.5) 40%,transparent 72%)' }} />
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,rgba(11,16,32,.92)_0%,rgba(11,16,32,.55)_40%,rgba(11,16,32,0)_72%)]" />
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-midnight/55 via-transparent to-transparent" />
      <Skyline lit={scene.lit} />

      <div className="container-x relative grid flex-1 items-center gap-5 pb-6 pt-24 sm:gap-8 sm:pb-8 sm:pt-32 lg:grid-cols-12 lg:pt-28">
        {/* copy */}
        <div className="lg:col-span-6">
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.8 }}
            className="mb-4 inline-flex w-fit items-center gap-2.5 rounded-full border border-accent/30 bg-midnight/55 px-3 py-1.5 backdrop-blur sm:mb-7 sm:gap-3 sm:px-4 sm:py-2">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="font-display text-[0.7rem] tracking-[0.14em] text-ice sm:text-[0.72rem] sm:tracking-[0.24em]">Engineering intelligent environments</span>
          </motion.div>
          <h1 className="display max-w-3xl !text-[2rem] sm:!text-[clamp(2.3rem,5.2vw,4.6rem)]" aria-label={title}>
            {title.split(' ').map((w, i) => (
              <span key={i} className="mr-[0.25em] inline-block overflow-hidden align-bottom pb-[0.08em]" aria-hidden>
                <motion.span className={`inline-block ${i >= 3 ? 'bg-gradient-to-r from-ice via-accent to-brand bg-clip-text text-transparent' : ''}`} initial={{ y: '110%' }} animate={{ y: 0 }}
                  transition={{ duration: 0.9, delay: 0.5 + i * 0.1, ease: [0.2, 0.7, 0.2, 1] }}>{w}</motion.span>
              </span>
            ))}
          </h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 1 }} className="mt-4 max-w-lg text-[0.95rem] leading-relaxed text-silver sm:mt-7 sm:text-base md:text-lg">
            Transforming the way people live, work and interact with intelligent buildings through advanced automation and integrated technology.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.7, duration: 0.8 }} className="mt-5 flex flex-wrap gap-3 sm:mt-9 sm:gap-4">
            <Magnetic to="/services">Explore Our Solutions</Magnetic>
            <Magnetic to="/about-us" variant="ghost">Discover TAC</Magnetic>
          </motion.div>
        </div>

        {/* automation dial */}
        <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, duration: 1.2, ease: [0.2, 0.7, 0.2, 1] }}
          className="relative mx-auto aspect-square w-full max-w-[330px] sm:max-w-[470px] lg:col-span-6 lg:w-[min(100%,calc(100svh-250px))] lg:max-w-[580px] lg:justify-self-end" role="img" aria-label={`Automation dial showing the ${scene.name} scene`}>
          {/* static dial art */}
          <svg viewBox="0 0 600 600" className="absolute inset-0 h-full w-full" aria-hidden>
            <g className="orbit-slow" style={{ transformOrigin: '300px 300px' }}>
              {Array.from({ length: 72 }).map((_, i) => {
                const a = (i / 72) * Math.PI * 2, long = i % 6 === 0
                return <line key={i} x1={300 + Math.cos(a) * (long ? 270 : 278)} y1={300 + Math.sin(a) * (long ? 270 : 278)} x2={300 + Math.cos(a) * 288} y2={300 + Math.sin(a) * 288} stroke="#c7d2fe" strokeOpacity={long ? 0.55 : 0.22} strokeWidth={long ? 1.6 : 1} />
              })}
            </g>
            <circle cx="300" cy="300" r="258" fill="none" stroke="#ffffff" strokeOpacity=".08" strokeWidth="6" />
            <circle cx="300" cy="300" r="258" fill="none" stroke={CYAN} strokeWidth="6" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - (clock % 24) / 24} transform="rotate(-90 300 300)" style={{ filter: 'drop-shadow(0 0 8px rgba(129,140,248,.7))' }} />
            <g className="orbit-back" style={{ transformOrigin: '300px 300px' }}><circle cx="300" cy="300" r="232" fill="none" stroke={CYAN} strokeOpacity=".25" strokeDasharray="2 10" /></g>
            <circle cx="300" cy="300" r="215" fill="none" stroke={CYAN} strokeOpacity=".18" />
          </svg>

          {/* rotating node ring with spokes */}
          <div className={`absolute inset-0 ${reduced ? '' : 'orbit'}`}>
            <svg viewBox="0 0 600 600" className="absolute inset-0 h-full w-full" aria-hidden>
              {nodes.map((_, i) => { const a = (i / nodes.length) * Math.PI * 2 - Math.PI / 2; return <line key={i} className="line-flow" x1={300 + Math.cos(a) * 125} y1={300 + Math.sin(a) * 125} x2={300 + Math.cos(a) * 215} y2={300 + Math.sin(a) * 215} stroke={CYAN} strokeOpacity=".55" strokeWidth="1.4" /> })}
            </svg>
            {nodes.map((n, i) => {
              const a = (i / nodes.length) * Math.PI * 2 - Math.PI / 2
              const on = !['Off', 'Disarmed', 'Normal'].includes(scene.state[n.key])
              return (
                <div key={n.key} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${50 + Math.cos(a) * R}%`, top: `${50 + Math.sin(a) * R}%` }}>
                  <div className={reduced ? '' : 'orbit-rev'}>
                    <div className={`flex flex-col items-center gap-1.5 transition-all duration-700 ${on ? 'scale-105' : 'opacity-75'}`}>
                      <span className={`grid h-11 w-11 place-items-center rounded-full border backdrop-blur transition-colors duration-700 sm:h-14 sm:w-14 ${on ? 'border-accent bg-accent/20 text-accent shadow-[0_0_28px_-4px_rgba(129,140,248,.7)]' : 'border-white/25 bg-midnight/70 text-white'}`}><n.icon size={20} /></span>
                      <span className="hidden whitespace-nowrap rounded-md bg-midnight/70 px-2 py-0.5 text-center backdrop-blur sm:block">
                        <span className="block font-display text-[0.7rem] tracking-[0.14em] text-ice">{n.label.toUpperCase()}</span>
                        <span className="block text-[0.72rem] text-white">{scene.state[n.key]}</span>
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* core */}
          <div className="absolute left-1/2 top-1/2 grid aspect-square w-[40%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-accent/40 bg-midnight text-center core-breathe">
            {!reduced && <span className="absolute inset-0 animate-ping rounded-full border border-accent/40 [animation-duration:3.6s]" />}
            <div>
              <div className="font-display text-[0.7rem] tracking-[0.3em] text-accent">KNX CORE</div>
              <div className="font-display text-4xl font-light tabular-nums text-white sm:text-5xl">{fmt(clock)}</div>
              <div className="mt-1 font-display text-sm uppercase tracking-[0.2em] text-ice">{scene.name}</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* scene control bar */}
      <div className="relative border-t border-white/10 bg-midnight/65 backdrop-blur-md">
        <div className="container-x grid gap-3 py-3.5 md:grid-cols-12 md:items-center">
          <div className="grid grid-cols-4 gap-2 md:col-span-6" role="tablist" aria-label="Automation scenes">
            {scenes.map((s, i) => (
              <button key={s.name} role="tab" aria-selected={i === idx} onClick={() => setIdx(i)}
                className={`relative overflow-hidden rounded-xl border px-1.5 py-2 text-center transition-colors sm:px-3 sm:text-left ${i === idx ? 'border-accent/70 bg-accent/10' : 'border-white/10 hover:border-white/30'}`}>
                <span className="block font-display text-[0.7rem] max-[359px]:text-[0.62rem] uppercase tracking-normal text-ice min-[360px]:tracking-[0.05em] sm:tracking-[0.16em]">{s.name}</span>
                <span className="block text-xs tabular-nums text-silver">{fmt(s.time)}</span>
                {i === idx && !reduced && <motion.span key={idx} className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-accent" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 5.6, ease: 'linear' }} />}
              </button>
            ))}
          </div>
          <p className="text-sm text-silver md:col-span-6" aria-live="off"><span className="mr-2 font-display text-[0.7rem] uppercase tracking-[0.18em] text-accent">Automation</span>{scene.act}</p>
        </div>
      </div>
    </section>
  )
}

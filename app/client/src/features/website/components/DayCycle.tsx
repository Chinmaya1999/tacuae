import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { Reveal, Words } from '../../../shared/components/ui'

const events = [
  { h: 6, t: 'Sunrise — curtains open automatically' }, { h: 7, t: 'Morning scene — lights fade up, air conditioning eases' },
  { h: 9, t: 'Everyone out — system armed, lights off' }, { h: 12, t: 'Midday — climate control maintains comfort' },
  { h: 17, t: 'Arrival — security disarmed, welcome scene' }, { h: 19, t: 'Dusk — curtains close, lighting adjusts' },
  { h: 22, t: 'Night scene — lights dim' }, { h: 23.5, t: 'Sleep — system armed, lights off' },
]
const fmt = (t: number) => `${String(Math.floor(t)).padStart(2, '0')}:${String(Math.floor((t % 1) * 60)).padStart(2, '0')}`
const mix = (a: number[], b: number[], k: number) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`

export default function DayCycle() {
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [t, setT] = useState(6.2)
  const [playing, setPlaying] = useState(!reduced)
  const last = useRef(0)
  const box = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const o = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.25 })
    if (box.current) o.observe(box.current)
    return () => o.disconnect()
  }, [])
  useEffect(() => {
    if (!playing || !visible) return
    let raf = 0
    const tick = (now: number) => {
      const dt = last.current ? (now - last.current) / 1000 : 0
      last.current = now
      setT((x) => (x + dt * 0.8) % 24) // 24h in ~30s
      raf = requestAnimationFrame(tick)
    }
    last.current = 0; raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, visible])

  const day = Math.max(0, Math.sin(((t - 6) / 12) * Math.PI))
  const home = (t >= 17 && t < 24) || t < 9
  const curtainsOpen = t >= 6 && t < 19
  const lights = home && (day < 0.4 || t < 7.5) && t < 23.5 && t >= 0
  const dim = t >= 22 || t < 6
  const ac = t >= 12 && t < 22
  const armed = !home || t >= 23.5 || t < 6
  const temp = ac ? 22 : 26
  const kw = (0.4 + (lights ? (dim ? 0.3 : 0.9) : 0) + (ac ? 1.4 : 0.1)).toFixed(1)
  const sunA = ((t - 6) / 12) * Math.PI, moonA = (((t + 6) % 24 - 6) / 12) * Math.PI
  const sky = mix([7, 17, 31], [95, 184, 255], day)
  const log = events.filter((e) => e.h <= t).slice(-3).reverse()

  return (
    <section ref={box} className="relative overflow-hidden bg-midnight py-24 md:py-36" id="day">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="container-x relative">
        <span className="eyebrow">Automation, Automatically</span>
        <Words text="A day in a smart building." className="h2 mt-5 max-w-3xl" />
        <Reveal><p className="mt-6 max-w-2xl text-silver">Watch an integrated system run a full day on its own — curtains, lighting, climate, security and energy responding without a single tap. An illustrative animation of what automation can do.</p></Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-8">
            <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-white/10" style={{ background: sky }}>
              <svg viewBox="0 0 800 500" className="absolute inset-0 h-full w-full" aria-label="Animated smart house through the day" role="img">
                {[...Array(24)].map((_, i) => <circle key={i} cx={(i * 97) % 800} cy={(i * 53) % 220} r="1.4" fill="#fff" opacity={(1 - day) * 0.8} />)}
                <circle cx={400 - Math.cos(sunA) * 340} cy={300 - Math.sin(sunA) * 250} r="30" fill="#ffd36b" opacity={t >= 5.5 && t <= 18.5 ? 1 : 0} />
                <circle cx={400 - Math.cos(moonA) * 340} cy={300 - Math.sin(moonA) * 250} r="20" fill="#e8eef6" opacity={t >= 17.5 || t <= 6.5 ? 0.9 : 0} />
                <rect y="400" width="800" height="100" fill="#0c1222" />
                {/* house */}
                <polygon points="150,200 400,90 650,200" fill="#1b2340" stroke="#8b93ff" strokeOpacity=".5" />
                <rect x="170" y="200" width="460" height="200" fill="#1b2340" stroke="#8b93ff" strokeOpacity=".5" />
                <rect x="210" y="235" width="180" height="120" rx="4" fill={lights ? '#ffe6a8' : '#232a55'} opacity={lights ? (dim ? 0.55 : 0.95) : 1} style={{ transition: 'all .6s' }} />
                <rect x="210" y="235" width={90 * (curtainsOpen ? 0.25 : 1)} height="120" fill="#26466f" style={{ transition: 'width 1.2s' }} />
                <rect x={390 - 90 * (curtainsOpen ? 0.25 : 1)} y="235" width={90 * (curtainsOpen ? 0.25 : 1)} height="120" fill="#26466f" style={{ transition: 'all 1.2s' }} />
                <rect x="430" y="235" width="160" height="120" rx="4" fill={lights ? '#ffe6a8' : '#232a55'} opacity={lights ? (dim ? 0.4 : 0.8) : 1} style={{ transition: 'all .6s' }} />
                <rect x="590" y="300" width="0" height="0" />
                <g transform="translate(300 365)"><rect width="40" height="35" fill="#101828" /></g>
                {lights && <ellipse cx="400" cy="300" rx="330" ry="150" fill="#ffe6a8" opacity={dim ? 0.05 : 0.12} />}
                {/* AC flow */}
                {ac && [0, 1, 2].map((i) => <path key={i} d={`M${450 + i * 40} 215 q8 12 0 24`} stroke="#8b93ff" strokeWidth="2" fill="none" className="a-blink" style={{ animationDelay: `${i * 0.4}s` }} />)}
                {/* security */}
                <g transform="translate(655 235)"><rect width="34" height="54" rx="7" fill="#101828" stroke={armed ? '#8b93ff' : '#65758b'} /><circle cx="17" cy="16" r="5" fill={armed ? '#8b93ff' : '#65758b'} className={armed ? 'a-blink' : ''} /></g>
                {/* person */}
                {home && !lights && <g />}
              </svg>
              <div className="absolute left-4 top-4 rounded-full bg-midnight/70 px-4 py-1.5 font-display text-sm tabular-nums backdrop-blur">{fmt(t)}</div>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <button onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause animation' : 'Play animation'} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/25 hover:border-accent hover:text-accent">{playing ? <Pause size={16} /> : <Play size={16} />}</button>
              <input type="range" min={0} max={23.99} step={0.05} value={t} aria-label="Time of day" onChange={(e) => { setT(+e.target.value); setPlaying(false) }} className="w-full accent-[#8b93ff]" />
            </div>
          </div>

          <div className="min-w-0 space-y-4 lg:col-span-4">
            <div className="grid grid-cols-2 gap-3">
              {[['Lighting', lights ? (dim ? 'Dimmed' : 'On') : 'Off'], ['Curtains', curtainsOpen ? 'Open' : 'Closed'], ['Climate', `${temp}°C · ${ac ? 'Cooling' : 'Idle'}`], ['Security', armed ? 'Armed' : 'Disarmed']].map(([k, v]) => (
                <div key={k} className="rounded-2xl border border-white/10 bg-white/[.03] p-4"><div className="text-[0.7rem] uppercase tracking-[0.18em] text-slate">{k}</div><div className="mt-1 font-display text-lg">{v}</div></div>
              ))}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
              <div className="flex justify-between text-[0.7rem] uppercase tracking-[0.18em] text-slate"><span>Energy (illustrative)</span><span className="tabular-nums text-accent">{kw} kW</span></div>
              <div className="mt-3 h-2 overflow-hidden rounded bg-white/10"><div className="h-full bg-gradient-to-r from-accent to-brand transition-all duration-700" style={{ width: `${Math.min(100, +kw * 38)}%` }} /></div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4" aria-live="off">
              <div className="mb-3 text-[0.7rem] uppercase tracking-[0.18em] text-slate">Automation log</div>
              <ul className="space-y-2.5 text-sm text-silver">{log.length ? log.map((e) => <li key={e.h} className="flex gap-3"><span className="tabular-nums text-accent">{fmt(e.h)}</span>{e.t}</li>) : <li>Waiting for sunrise…</li>}</ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

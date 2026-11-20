import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Lightbulb, Thermometer, Blinds, ShieldCheck, Zap, SlidersHorizontal, Minus, Plus, Lock, Unlock } from 'lucide-react'

type Key = 'lighting' | 'climate' | 'curtains' | 'security' | 'energy' | 'room'
interface State { light: number; curtain: number; temp: number; acOn: boolean; armed: boolean; scene: string; tv: boolean }

const SCENES: Record<string, Partial<State> & { blurb: string }> = {
  Welcome: { light: 80, curtain: 100, temp: 23, acOn: true, armed: false, tv: false, blurb: 'Lights up, curtains open, climate comfortable.' },
  Movie: { light: 14, curtain: 0, temp: 22, acOn: true, armed: false, tv: true, blurb: 'Lights dimmed, curtains closed, screen on.' },
  Sleep: { light: 0, curtain: 0, temp: 25, acOn: true, armed: true, tv: false, blurb: 'Everything off, curtains closed, perimeter armed.' },
  Away: { light: 0, curtain: 0, temp: 27, acOn: false, armed: true, tv: false, blurb: 'Lights and climate off, security armed.' },
}

const TABS: { key: Key; label: string; icon: typeof Lightbulb; x: number; y: number }[] = [
  { key: 'lighting', label: 'Lighting', icon: Lightbulb, x: 36, y: 14 },
  { key: 'climate', label: 'Air Conditioning', icon: Thermometer, x: 15, y: 24 },
  { key: 'curtains', label: 'Curtains', icon: Blinds, x: 76, y: 34 },
  { key: 'security', label: 'Security', icon: ShieldCheck, x: 40, y: 47 },
  { key: 'energy', label: 'Energy', icon: Zap, x: 88, y: 78 },
  { key: 'room', label: 'Room Controls', icon: SlidersHorizontal, x: 55, y: 53 },
]

export default function SmartHome() {
  const [active, setActive] = useState<Key>('lighting')
  const [s, setS] = useState<State>({ light: 70, curtain: 60, temp: 23, acOn: true, armed: false, scene: 'Welcome', tv: false })
  const set = (p: Partial<State>) => setS((o) => ({ ...o, ...p, scene: '' }))
  const L = s.light / 100
  const kw = useMemo(() => {
    const lighting = 0.06 + s.light * 0.0085
    const climate = s.acOn ? 0.7 + Math.max(0, 27 - s.temp) * 0.14 : 0.02
    const other = 0.28 + (s.tv ? 0.14 : 0) + (s.armed ? 0.04 : 0)
    return { lighting, climate, other, total: lighting + climate + other }
  }, [s])

  const open = s.curtain / 100
  const night = '#07101e'

  return (
    <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
      {/* ---------- scene ---------- */}
      <div className="relative self-start overflow-hidden rounded-3xl border border-white/10 bg-[#050b15] shadow-[0_40px_120px_-40px_rgba(0,213,255,.35)]">
        <svg viewBox="0 0 960 560" role="img" aria-label="Interactive illustration of a smart living room. Use the controls to change lighting, curtains, climate, security, energy and scenes." className="block h-auto w-full">
          <defs>
            <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#13243d" /><stop offset="1" stopColor="#0c1829" /></linearGradient>
            <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#101c2e" /><stop offset="1" stopColor="#070e19" /></linearGradient>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0a1c3a" /><stop offset="1" stopColor="#1f4f86" /></linearGradient>
            <radialGradient id="glow" cx=".5" cy="0" r="1"><stop offset="0" stopColor="#fff1cf" stopOpacity=".95" /><stop offset="1" stopColor="#ffd9a0" stopOpacity="0" /></radialGradient>
            <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff1cf" stopOpacity=".55" /><stop offset="1" stopColor="#fff1cf" stopOpacity="0" /></linearGradient>
            <radialGradient id="floorglow" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#ffe9bd" stopOpacity=".5" /><stop offset="1" stopColor="#ffe9bd" stopOpacity="0" /></radialGradient>
            <linearGradient id="cool" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#00d5ff" stopOpacity=".0" /><stop offset=".5" stopColor="#a5e8ff" stopOpacity=".8" /><stop offset="1" stopColor="#00d5ff" stopOpacity="0" /></linearGradient>
            <clipPath id="win"><rect x="610" y="96" width="290" height="270" rx="4" /></clipPath>
          </defs>

          {/* room shell */}
          <rect width="960" height="560" fill={night} />
          <rect x="0" y="0" width="960" height="410" fill="url(#wall)" />
          <rect x="0" y="410" width="960" height="150" fill="url(#floor)" />
          <path d="M0 410 H960" stroke="#1b2f4d" strokeWidth="2" />
          <rect x="0" y="0" width="960" height="26" fill="#0a1424" />
          <g stroke="#1a2c47" strokeWidth="1" opacity=".7">
            {[...Array(12)].map((_, i) => <path key={i} d={`M${i * 90 - 30} 560 L${480 + (i - 5.5) * 30} 410`} />)}
          </g>

          {/* window + night skyline + curtains */}
          <g>
            <rect x="598" y="84" width="314" height="294" rx="8" fill="#0a1424" stroke="#243a5c" strokeWidth="2" />
            <g clipPath="url(#win)">
              <rect x="610" y="96" width="290" height="270" fill="url(#sky)" />
              {[[620, 60, 44], [670, 110, 34], [712, 80, 52], [770, 130, 40], [816, 90, 46], [862, 150, 38]].map(([x, h, w], i) => (
                <g key={i}>
                  <rect x={x} y={366 - h * 1.6} width={w} height={h * 1.6} fill="#081426" />
                  {[...Array(5)].map((_, r) => <rect key={r} x={x + 6 + (r % 2) * 14} y={366 - h * 1.6 + 10 + r * 18} width="5" height="7" fill="#ffd88a" opacity={(i + r) % 3 === 0 ? 0.9 : 0.25} />)}
                </g>
              ))}
              <path d="M610 366 L900 250" stroke="#ffffff" strokeOpacity=".04" strokeWidth="60" />
            </g>
            <path d="M755 96 V366 M610 231 H900" stroke="#243a5c" strokeWidth="3" />
            {/* curtains */}
            <g clipPath="url(#win)">
              <rect x="610" y="96" width="150" height="270" fill="#27415f" style={{ transformBox: 'fill-box', transformOrigin: 'left center', transform: `scaleX(${1 - open * 0.84})`, transition: 'transform 1.1s cubic-bezier(.65,0,.35,1)' }} />
              <rect x="750" y="96" width="150" height="270" fill="#27415f" style={{ transformBox: 'fill-box', transformOrigin: 'right center', transform: `scaleX(${1 - open * 0.84})`, transition: 'transform 1.1s cubic-bezier(.65,0,.35,1)' }} />
              {/* folds */}
              {[...Array(7)].map((_, i) => (
                <rect key={i} x={612 + i * 8} y="96" width="3" height="270" fill="#0a1424" opacity=".35" style={{ transformBox: 'fill-box', transformOrigin: 'left center', transform: `scaleX(${1 - open * 0.84})`, transition: 'transform 1.1s cubic-bezier(.65,0,.35,1)' }} />
              ))}
            </g>
            <rect x="590" y="78" width="330" height="10" rx="5" fill="#33527a" />
          </g>

          {/* AC split unit */}
          <g>
            <rect x="70" y="86" width="250" height="62" rx="14" fill="#e9eff7" opacity=".92" />
            <rect x="82" y="128" width="226" height="10" rx="5" fill="#0b1728" opacity=".55" />
            <text x="96" y="114" fontFamily="Sora Variable, sans-serif" fontSize="22" fontWeight="600" fill={s.acOn ? '#0a6fb8' : '#98a4b3'}>{s.acOn ? `${s.temp}°C` : 'OFF'}</text>
            <circle cx="292" cy="106" r="4" fill={s.acOn ? '#00d5ff' : '#4a586b'} style={{ transition: 'fill .5s' }} />
            <g opacity={s.acOn ? 1 : 0} style={{ transition: 'opacity .8s' }}>
              {[0, 1, 2, 3].map((i) => (
                <path key={i} d={`M${110 + i * 55} 152 q 14 28 0 54 t 0 54`} fill="none" stroke="url(#cool)" strokeWidth="2.2" strokeLinecap="round"
                  strokeDasharray="14 12" style={{ animation: `flow ${1.6 + (27 - s.temp) * 0.12}s linear infinite`, animationDelay: `${i * 0.2}s` }} />
              ))}
            </g>
          </g>

          {/* TV */}
          <g>
            <rect x="96" y="238" width="236" height="132" rx="6" fill="#05080e" stroke="#1f3050" strokeWidth="3" />
            <rect x="102" y="244" width="224" height="120" rx="3" fill={s.tv ? '#1b6fd1' : '#080f1b'} style={{ transition: 'fill .8s' }} />
            {s.tv && <path d="M102 330 L180 270 L230 310 L270 280 L326 330 V364 H102Z" fill="#0b3b7a" opacity=".7" />}
            {s.tv && <circle cx="262" cy="272" r="12" fill="#a5e8ff" opacity=".8" />}
            <rect x="188" y="372" width="48" height="8" fill="#14223a" />
          </g>

          {/* sofa */}
          <g>
            <rect x="140" y="372" width="360" height="76" rx="20" fill="#16273f" />
            <rect x="120" y="396" width="52" height="70" rx="16" fill="#1c3252" />
            <rect x="470" y="396" width="52" height="70" rx="16" fill="#1c3252" />
            <rect x="160" y="404" width="150" height="50" rx="14" fill="#203a5e" />
            <rect x="326" y="404" width="150" height="50" rx="14" fill="#203a5e" />
            <rect x="130" y="466" width="400" height="10" rx="5" fill="#000" opacity=".35" />
          </g>

          {/* coffee table */}
          <rect x="250" y="486" width="170" height="14" rx="4" fill="#243b5e" />
          <rect x="270" y="500" width="6" height="26" fill="#1a2c47" /><rect x="394" y="500" width="6" height="26" fill="#1a2c47" />

          {/* door + security */}
          <g>
            <rect x="372" y="132" width="110" height="278" rx="3" fill="#0c1829" stroke="#243a5c" strokeWidth="3" />
            <rect x="384" y="146" width="86" height="250" fill="#0f2038" />
            <circle cx="458" cy="280" r="5" fill="#8ea2bd" />
            {/* lock status */}
            <g transform="translate(427 98)">
              <circle r="15" fill="#0b1728" stroke={s.armed ? '#00d5ff' : '#3a4d6a'} strokeWidth="2" style={{ transition: 'stroke .5s' }} />
              <path d={s.armed ? 'M-5 -1 v-4 a5 5 0 0 1 10 0 v4' : 'M-5 -1 v-4 a5 5 0 0 1 9 -2'} fill="none" stroke={s.armed ? '#00d5ff' : '#8ea2bd'} strokeWidth="2" strokeLinecap="round" style={{ transition: 'stroke .5s' }} />
              <rect x="-7" y="-1" width="14" height="10" rx="2" fill={s.armed ? '#00d5ff' : '#8ea2bd'} style={{ transition: 'fill .5s' }} />
            </g>
            {/* camera */}
            <g transform="translate(427 44)">
              <rect x="-12" y="-6" width="24" height="12" rx="6" fill="#d9e3f0" />
              <circle cx="0" cy="0" r="4" fill="#0b1728" />
              <circle cx="7" cy="0" r="1.8" fill={s.armed ? '#ff4d6a' : '#2a3a52'}>{s.armed && <animate attributeName="opacity" values="1;.2;1" dur="1.4s" repeatCount="indefinite" />}</circle>
              {s.armed && <path d="M0 8 L-60 140 H60Z" fill="#00d5ff" opacity=".05" />}
            </g>
          </g>

          {/* room-control touch panel */}
          <g>
            <rect x="514" y="236" width="56" height="86" rx="8" fill="#050b15" stroke="#2c4468" strokeWidth="2" />
            <rect x="520" y="244" width="44" height="70" rx="4" fill="#0a1d38" />
            {[0, 1, 2, 3].map((i) => <rect key={i} x="525" y={249 + i * 16} width="34" height="11" rx="3" fill={Object.keys(SCENES)[i] === s.scene ? '#00d5ff' : '#1b3558'} style={{ transition: 'fill .4s' }} />)}
          </g>

          {/* lighting: ambient + cones + pendant */}
          <g style={{ opacity: L, transition: 'opacity .9s ease' }}>
            <rect width="960" height="560" fill="#ffe3b3" opacity=".08" />
            {[190, 440, 700].map((x) => (
              <g key={x}>
                <path d={`M${x - 16} 26 L${x - 120} 410 H${x + 120} L${x + 16} 26Z`} fill="url(#cone)" />
                <ellipse cx={x} cy="470" rx="150" ry="34" fill="url(#floorglow)" />
              </g>
            ))}
            <ellipse cx="320" cy="300" rx="320" ry="190" fill="url(#glow)" opacity=".18" />
          </g>
          {[190, 440, 700].map((x) => (
            <g key={x}>
              <rect x={x - 18} y="24" width="36" height="7" rx="3" fill="#2a3b55" />
              <ellipse cx={x} cy="32" rx="14" ry="4" fill={L > 0.02 ? '#fff3d6' : '#3b4a63'} style={{ transition: 'fill .9s' }} />
            </g>
          ))}
          {/* floor lamp */}
          <g>
            <rect x="598" y="440" width="5" height="86" fill="#2a3b55" />
            <path d="M578 440 L624 440 L612 396 L590 396Z" fill={L > 0.02 ? '#ffe2a8' : '#2b3a52'} style={{ transition: 'fill .9s' }} />
            <ellipse cx="601" cy="528" rx="18" ry="4" fill="#2a3b55" />
          </g>

          {/* energy chip */}
          <g transform="translate(758 420)">
            <rect width="162" height="62" rx="12" fill="#06101d" stroke={active === 'energy' ? '#00d5ff' : '#1c3150'} strokeWidth="1.5" opacity=".92" style={{ transition: 'stroke .4s' }} />
            <text x="14" y="23" fontFamily="Inter Variable, sans-serif" fontSize="10" letterSpacing="2" fill="#7f93ad">LIVE LOAD</text>
            <text x="14" y="49" fontFamily="Sora Variable, sans-serif" fontSize="22" fontWeight="600" fill="#fff">{kw.total.toFixed(2)} <tspan fontSize="12" fill="#00d5ff">kW</tspan></text>
          </g>
        </svg>

        {/* hotspots */}
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            aria-label={`${t.label} controls`}
            aria-pressed={active === t.key}
            className="group absolute -translate-x-1/2 -translate-y-1/2 outline-none"
            style={{ left: `${t.x}%`, top: `${t.y}%` }}
          >
            <span className={`relative grid h-9 w-9 place-items-center rounded-full border backdrop-blur transition-all duration-300 md:h-11 md:w-11 ${active === t.key ? 'border-cyan bg-cyan text-midnight shadow-[0_0_30px_rgba(0,213,255,.7)]' : 'border-white/40 bg-midnight/60 text-white group-hover:border-cyan group-hover:text-cyan group-focus-visible:border-cyan'}`}>
              <t.icon size={16} />
              {active !== t.key && <span className="absolute inset-0 animate-ping rounded-full border border-cyan/50" style={{ animationDuration: '2.6s' }} />}
            </span>
            <span className="pointer-events-none absolute left-1/2 top-full mt-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-midnight/85 px-2.5 py-1 text-[0.7rem] font-medium uppercase tracking-widest text-ice md:block">{t.label}</span>
          </button>
        ))}
        <p className="pointer-events-none absolute bottom-3 left-4 text-[0.7rem] uppercase tracking-[0.2em] text-slate">Interactive illustration</p>
      </div>

      {/* ---------- panel ---------- */}
      <div className="flex flex-col rounded-3xl border border-white/10 bg-tech/80 p-5 backdrop-blur md:p-7">
        <div role="tablist" aria-label="Smart building controls" className="mb-6 grid grid-cols-3 gap-2">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={active === t.key} onClick={() => setActive(t.key)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border px-1 py-3 text-[0.7rem] font-medium uppercase tracking-wider transition ${active === t.key ? 'border-cyan bg-cyan/10 text-cyan' : 'border-white/10 text-silver hover:border-white/30 hover:text-white'}`}>
              <t.icon size={18} />{t.label.replace('Air Conditioning', 'Climate')}
            </button>
          ))}
        </div>

        <div className="relative min-h-[17rem] flex-1" role="tabpanel" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }}>
              {active === 'lighting' && (
                <Panel title="Lighting" sub="Dim from off to full brightness – the room responds instantly.">
                  <Slider label="Brightness" value={s.light} onChange={(v) => set({ light: v })} unit="%" />
                  <div className="mt-5 flex gap-2">
                    <Chip on={s.light === 0} onClick={() => set({ light: 0 })}>Off</Chip><Chip on={s.light === 40} onClick={() => set({ light: 40 })}>Ambient</Chip><Chip on={s.light === 100} onClick={() => set({ light: 100 })}>Full</Chip>
                  </div>
                </Panel>
              )}
              {active === 'climate' && (
                <Panel title="Air conditioning" sub="Set the temperature and see the airflow adjust.">
                  <div className="flex items-center justify-between">
                    <button aria-label="Lower temperature" onClick={() => set({ temp: Math.max(18, s.temp - 1), acOn: true })} className="grid h-12 w-12 place-items-center rounded-full border border-white/20 text-white transition hover:border-cyan hover:text-cyan"><Minus size={18} /></button>
                    <div className="text-center"><p className="font-display text-6xl font-semibold text-white">{s.acOn ? s.temp : '--'}<span className="text-2xl text-cyan">°C</span></p><p className="mt-1 text-xs uppercase tracking-widest text-slate">{s.acOn ? 'Cooling' : 'Off'}</p></div>
                    <button aria-label="Raise temperature" onClick={() => set({ temp: Math.min(30, s.temp + 1), acOn: true })} className="grid h-12 w-12 place-items-center rounded-full border border-white/20 text-white transition hover:border-cyan hover:text-cyan"><Plus size={18} /></button>
                  </div>
                  <div className="mt-6"><Chip on={s.acOn} onClick={() => set({ acOn: !s.acOn })}>{s.acOn ? 'Unit on' : 'Unit off'}</Chip></div>
                </Panel>
              )}
              {active === 'curtains' && (
                <Panel title="Curtains" sub="Open or close the curtains to bring in the skyline – or shut it out.">
                  <Slider label="Opening" value={s.curtain} onChange={(v) => set({ curtain: v })} unit="%" />
                  <div className="mt-5 flex gap-2"><Chip on={s.curtain === 0} onClick={() => set({ curtain: 0 })}>Close</Chip><Chip on={s.curtain === 50} onClick={() => set({ curtain: 50 })}>Half</Chip><Chip on={s.curtain === 100} onClick={() => set({ curtain: 100 })}>Open</Chip></div>
                </Panel>
              )}
              {active === 'security' && (
                <Panel title="Security" sub="Arm the perimeter – the door locks and the camera goes live.">
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-midnight/60 p-4">
                    <div className="flex items-center gap-3">{s.armed ? <Lock className="text-cyan" /> : <Unlock className="text-silver" />}<div><p className="font-medium text-white">{s.armed ? 'Armed' : 'Disarmed'}</p><p className="text-xs text-slate">Front door {s.armed ? 'locked' : 'unlocked'} · Camera {s.armed ? 'recording' : 'standby'}</p></div></div>
                    <button onClick={() => set({ armed: !s.armed })} aria-pressed={s.armed} className={`relative h-7 w-12 rounded-full transition ${s.armed ? 'bg-cyan' : 'bg-white/15'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${s.armed ? 'left-6' : 'left-1'}`} /></button>
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-slate">Connected systems can notify you immediately of suspicious activity.</p>
                </Panel>
              )}
              {active === 'energy' && (
                <Panel title="Energy" sub="Illustrative live load – change anything in the room and watch it respond.">
                  <p className="font-display text-5xl font-semibold text-white">{kw.total.toFixed(2)}<span className="ml-1 text-xl text-cyan">kW</span></p>
                  <div className="mt-5 space-y-3.5">
                    <Bar label="Lighting" v={kw.lighting} total={kw.total} /><Bar label="Climate" v={kw.climate} total={kw.total} /><Bar label="Other" v={kw.other} total={kw.total} />
                  </div>
                </Panel>
              )}
              {active === 'room' && (
                <Panel title="Room controls" sub="One touch sets lighting, curtains, climate and security together.">
                  <div className="grid grid-cols-2 gap-2.5">
                    {Object.entries(SCENES).map(([name, sc]) => (
                      <button key={name} onClick={() => { const { blurb: _b, ...rest } = sc; void _b; setS((o) => ({ ...o, ...rest, scene: name })) }}
                        className={`rounded-2xl border p-4 text-left transition ${s.scene === name ? 'border-cyan bg-cyan/10' : 'border-white/10 hover:border-white/30'}`}>
                        <p className="font-display font-medium text-white">{name}</p><p className="mt-1 text-xs leading-snug text-slate">{sc.blurb}</p>
                      </button>
                    ))}
                  </div>
                </Panel>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <p className="mt-6 border-t border-white/10 pt-4 text-[0.7rem] leading-relaxed text-slate">A conceptual demonstration of integrated building control. Values shown are illustrative and do not represent a specific TAC installation.</p>
      </div>
    </div>
  )
}

const Panel = ({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) => (
  <div><h3 className="font-display text-2xl font-medium text-white">{title}</h3><p className="mb-6 mt-2 text-sm leading-relaxed text-silver">{sub}</p>{children}</div>
)
const Chip = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick} aria-pressed={on} className={`rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-wider transition ${on ? 'border-cyan bg-cyan text-midnight' : 'border-white/20 text-silver hover:border-cyan hover:text-white'}`}>{children}</button>
)
function Slider({ label, value, onChange, unit }: { label: string; value: number; onChange: (v: number) => void; unit: string }) {
  return (
    <label className="block">
      <span className="mb-3 flex items-baseline justify-between text-xs uppercase tracking-widest text-slate">{label}<span className="font-display text-2xl normal-case tracking-normal text-white">{value}{unit}</span></span>
      <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(+e.target.value)} aria-label={label} />
    </label>
  )
}
const Bar = ({ label, v, total }: { label: string; v: number; total: number }) => (
  <div>
    <div className="mb-1.5 flex justify-between text-xs text-silver"><span>{label}</span><span>{v.toFixed(2)} kW</span></div>
    <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-intel to-cyan transition-all duration-700" style={{ width: `${(v / Math.max(total, 0.01)) * 100}%` }} /></div>
  </div>
)

// Smart Simulation Studio: operate devices and scenes in seven spaces, and compare two packages side by side.
import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { hasWebGL } from '../../../shared/lib/webgl'
import { Link } from 'react-router-dom'
import { Gamepad2, Loader2, Moon, Sun } from 'lucide-react'
import { useAuth } from '../../auth/lib/auth'
import { useSeo } from '../../../shared/lib/seo'
import { useQuoteEstimate, money, pretty, type HomeInput } from '../../quotations/lib/quote'
import { deviceById, roomTypeById, type PlacedDevice, type Room, type RoomType } from '../../../shared/data/catalog'
import { designFromPricing } from '../../quotations/components/Preview3D'
import { SCENES } from '../../studio/three/scenes'
import { useStudioUI } from '../../studio/three/store'
import { blankHome } from '../../quotations/lib/homeDraft'
import { Choice, card, field, small } from '../../quotations/components/ui'

const RoomScene = lazy(() => import('../../studio/three/RoomScene'))
const ExteriorScene = lazy(() => import('../../studio/three/ExteriorScene'))
const SPACES: RoomType[] = ['living', 'bedroom', 'kitchen', 'majlis', 'office', 'lobby', 'exterior']
const LEVELS = ['essential', 'comfort', 'luxury']
const FEATURED = ['welcome', 'movie', 'sleep', 'away', 'majlis', 'morning']
const noop = () => {}
const ZOOM = { n: 0, dir: 1 as const }

function Pane({ space, level, scene, onLevel }: { space: RoomType; level: string; scene: { id: string; n: number }; onLevel: (l: string) => void }) {
  const { user } = useAuth()
  const input: HomeInput = { ...blankHome().input, rooms: [{ id: 'sim', type: space, name: roomTypeById[space].label, adjustments: {} }], levels: space === 'exterior' ? { lighting: level, security: level } : { lighting: level, climate: level, curtains: level, audio: level, security: level }, control: 'panels' }
  const { pricing } = useQuoteEstimate('home', input, user?.id ?? '')
  const [room, setRoom] = useState<Room | null>(null), [sel, setSel] = useState('')
  const key = JSON.stringify(pricing?.rooms)
  useEffect(() => { if (pricing?.rooms) setRoom(designFromPricing(pricing.rooms).rooms[0]) }, [key]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { // apply the chosen scene to this room's devices
    const s = SCENES.find((x) => x.id === scene.id)
    if (s) setRoom((r) => r && { ...r, devices: r.devices.map((d, i) => ({ ...d, ...s.apply(d, deviceById[d.cat]?.kind, i) })) })
  }, [scene, room?.devices.length]) // eslint-disable-line react-hooks/exhaustive-deps
  const patch = (id: string, p: Partial<PlacedDevice>) => setRoom((r) => r && { ...r, devices: r.devices.map((d) => (d.id === id ? { ...d, ...p } : d)) })
  const toggle = useCallback((id: string) => { setSel(id); setRoom((r) => r && { ...r, devices: r.devices.map((d) => (d.id === id ? { ...d, on: !d.on } : d)) }) }, [])
  const chosen = room?.devices.find((d) => d.id === sel)
  return (
    <section className="min-w-0 space-y-3" aria-label={`${level} package`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <select aria-label="Package" value={level} onChange={(e) => onLevel(e.target.value)} className={`${field} !w-auto`}>{LEVELS.map((l) => <option key={l} value={l}>{pretty(l)} package</option>)}</select>
        <div className="font-display text-xl text-accent">{pricing?.totals ? money(pricing.totals.total) : <span className="text-sm text-silver">{pricing ? 'Sign in to see the price' : '…'}</span>}</div>
      </div>
      <div className="relative h-[440px] md:h-[600px] overflow-hidden rounded-3xl border border-white/10 bg-deep">
        {!room ? <Loader2 className="absolute left-1/2 top-1/2 animate-spin text-accent" /> : !hasWebGL() ? <p className="p-6 text-sm text-silver">3D is not available on this device. Use the device list below.</p> :
          <Suspense fallback={<Loader2 className="absolute left-1/2 top-1/2 animate-spin text-accent" />}>{space === 'exterior' ? <ExteriorScene devices={room.devices} /> : <RoomScene resetKey={0} zoom={ZOOM} room={room} readOnly onBegin={noop} onMove={noop} onToggle={toggle} onCapture={noop} />}</Suspense>}
        <span className="pointer-events-none absolute left-3 top-3 rounded-full border border-amber-300/40 bg-midnight/80 px-3 py-1 text-xs text-amber-300">Simulation · not connected to real devices</span>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">{room?.devices.map((d) => { const def = deviceById[d.cat]; return (
        <li key={d.id}><button onClick={() => toggle(d.id)} aria-pressed={d.on} className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs ${d.on ? 'border-accent/60 bg-accent/10' : 'border-white/10 text-slate'}`}><span>{def.name}</span><b>{d.on ? def.on : def.off}</b></button></li>) })}</ul>
      {chosen && ['light', 'ac', 'fan'].includes(deviceById[chosen.cat].kind) && <div className={`${card} space-y-3 !p-4 text-xs`}>
        <b>{deviceById[chosen.cat].name}</b>
        <label className="flex items-center gap-3">{deviceById[chosen.cat].kind === 'ac' ? 'Temperature' : 'Level'}<input type="range" className="flex-1 accent-accent" min={deviceById[chosen.cat].kind === 'ac' ? 16 : 5} max={deviceById[chosen.cat].kind === 'ac' ? 30 : 100} value={chosen.level ?? 80} onChange={(e) => patch(chosen.id, { on: true, level: Number(e.target.value) })} /><span className="w-10 tabular-nums">{chosen.level ?? 80}{deviceById[chosen.cat].kind === 'ac' ? '°C' : '%'}</span></label>
        {deviceById[chosen.cat].kind === 'light' && <div className="flex items-center gap-2">Colour temperature{([['Warm', '#ffb86b'], ['Neutral', '#fff1d6'], ['Cool', '#e0e4ff']] as const).map(([n, c]) => <button key={n} className={small} onClick={() => patch(chosen.id, { on: true, color: c })}><span className="mr-1.5 inline-block h-3 w-3 rounded-full align-middle" style={{ background: c }} />{n}</button>)}</div>}
      </div>}
    </section>
  )
}

export default function Simulation() {
  useSeo('3D Smart Simulation Studio | TAC UAE', 'Try lighting, climate, curtains and security scenes in interactive 3D rooms and compare automation packages.', '/simulation')
  const [space, setSpace] = useState<RoomType>('living'), [compare, setCompare] = useState(false), [a, setA] = useState('essential'), [b, setB] = useState('luxury')
  const [scene, setScene] = useState({ id: 'welcome', n: 0 }), [alarm, setAlarm] = useState(false), [call, setCall] = useState<'' | 'ringing' | 'answered'>('')
  const { night, setNight, cam, setCam } = useStudioUI()
  useEffect(() => { setCam('orbit'); setNight(true) }, [setCam, setNight])
  const run = (id: string) => { const s = SCENES.find((x) => x.id === id)!; setNight(s.night); setScene((x) => ({ id, n: x.n + 1 })) }
  return (
    <div className="container-x pb-24 pt-32">
      <h1 className="font-display text-3xl md:text-4xl">Smart Simulation Studio</h1>
      <p className="mt-2 text-sm text-silver">Click a device to operate it, run a scene, or compare two packages.</p>
      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{SPACES.map((s) => <Choice key={s} on={space === s} onClick={() => setSpace(s)}>{s === 'exterior' ? 'Villa exterior' : roomTypeById[s].label}</Choice>)}</div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {FEATURED.map((id) => { const s = SCENES.find((x) => x.id === id)!; return <button key={id} className={`${small} ${scene.id === id ? '!border-accent !text-accent' : ''}`} onClick={() => run(id)}>{s.label}</button> })}
        <span className="mx-2 hidden h-6 w-px bg-white/15 sm:block" />
        {space !== 'exterior' && <button className={`${small} !border-accent !bg-primary !font-semibold !text-white`} aria-pressed={cam === 'play'} onClick={() => setCam(cam === 'play' ? 'orbit' : 'play')}><Gamepad2 size={14} className="mr-1.5 inline" />{cam === 'play' ? 'Exit walk mode' : 'Walk inside (game mode)'}</button>}
        <button className={small} onClick={() => setNight(!night)} aria-pressed={night}>{night ? <Sun size={14} className="mr-1.5 inline" /> : <Moon size={14} className="mr-1.5 inline" />}{night ? 'Switch to day' : 'Switch to night'}</button>
        <button className={`${small} ${compare ? '!border-accent !text-accent' : ''}`} aria-pressed={compare} onClick={() => setCompare(!compare)}>Compare packages</button>
        <button className={small} onClick={() => setCall('ringing')}>Ring video intercom</button>
        <button className={`${small} ${alarm ? '!border-red-400 !text-red-300' : ''}`} onClick={() => setAlarm(!alarm)}>{alarm ? 'Silence alarm' : 'Trigger motion alarm'}</button>
      </div>
      {alarm && <p role="alert" className="mt-4 animate-pulse rounded-xl border border-red-400/50 bg-red-500/15 px-4 py-3 text-sm text-red-200">Simulated alert: motion detected. Siren on, cameras recording.</p>}
      {call && <div role="dialog" aria-label="Video intercom" className="mt-4 flex max-w-xl flex-wrap items-center gap-4 rounded-2xl border border-accent/40 bg-deep p-4"><img src="/images/site/security.jpg" alt="Simulated door camera" className="h-24 w-36 rounded-lg object-cover" /><div className="flex-1 text-sm"><b>{call === 'ringing' ? 'Visitor at the door' : 'Call connected — door unlocked'}</b><div className="text-xs text-slate">Simulated intercom</div></div>{call === 'ringing' && <button className="btn btn-primary !py-2" onClick={() => setCall('answered')}>Answer and open</button>}<button className={small} onClick={() => setCall('')}>Close</button></div>}
      <div className={`mt-6 grid gap-6 ${compare ? 'lg:grid-cols-2' : ''}`}>
        <Pane key={`a-${space}`} space={space} level={a} scene={scene} onLevel={setA} />
        {compare && <Pane key={`b-${space}`} space={space} level={b} scene={scene} onLevel={setB} />}
      </div>
      <p className="mt-4 text-xs text-slate">Indicative price for this single space, subject to site survey.</p>
      <div className="mt-6 flex flex-wrap gap-3"><Link to="/design-my-home" className="btn btn-primary">Design my smart home</Link><Link to="/book" className="btn btn-ghost">Talk to an expert</Link></div>
    </div>
  )
}

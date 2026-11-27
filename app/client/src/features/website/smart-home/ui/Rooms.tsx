// Room selector and manual controls for the chosen room. Every change shows in the 3D house at once.
import { Flame, Footprints, Droplets, Wind, Minus, Plus, Radio } from 'lucide-react'
import { useHome } from '../store'
import { DEVICES, ROOMS, type Device } from '../data/home'
import { occupancy } from '../engine/automation'
import { chip } from './shared'

const WORDS: Partial<Record<Device['kind'], [string, string]>> = { switch: ['Off', 'On'], lock: ['Unlocked', 'Locked'], door: ['Closed', 'Open'], arm: ['Disarmed', 'Armed'] }

const tile = 'flex min-h-[3.6rem] items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 py-1.5'

function Control({ d }: { d: Device }) {
  const v = useHome((s) => s.values[d.id]), set = useHome((s) => s.set), held = useHome((s) => d.id in s.held)
  const name = <span className="flex min-w-0 items-center gap-1.5"><span className="truncate">{d.name}</span>{held && <span title="Set by hand" className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />}</span>
  if (d.kind === 'light' || d.kind === 'curtain') return (
    <li className={`${tile} !flex-col !items-stretch !justify-center !gap-1`}><div className="flex items-center justify-between gap-2">{name}<button type="button" aria-label={`${d.name} ${v ? (d.kind === 'light' ? 'off' : 'close') : d.kind === 'light' ? 'on' : 'open'}`} onClick={() => set(d.id, v ? 0 : 100)} className={chip(v > 0)}>{d.kind === 'light' ? (v ? `${v}%` : 'Off') : v ? `${v}% open` : 'Closed'}</button></div>
      <input type="range" min={0} max={100} step={5} value={v} aria-label={`${d.name} level`} onChange={(e) => set(d.id, Number(e.target.value))} className="block w-full accent-[#8b93ff]" /></li>
  )
  if (d.kind === 'ac') return (
    <li className={tile}>{name}<span className="flex items-center gap-1"><button type="button" aria-label={`${d.name} cooler`} onClick={() => set(d.id, Math.max(16, (v || 24) - 1))} className={chip(false)}><Minus size={12} aria-hidden /></button><button type="button" aria-label={`${d.name} power`} onClick={() => set(d.id, v ? 0 : 23)} className={`${chip(v > 0)} w-14 tabular-nums`}>{v ? `${v}°C` : 'Off'}</button><button type="button" aria-label={`${d.name} warmer`} onClick={() => set(d.id, Math.min(30, (v || 22) + 1))} className={chip(false)}><Plus size={12} aria-hidden /></button></span></li>
  )
  if (d.kind === 'fan') return (
    <li className={tile}>{name}<span role="group" aria-label={`${d.name} speed`} className="flex gap-1">{[0, 1, 2, 3].map((n) => <button key={n} type="button" aria-pressed={v === n} onClick={() => set(d.id, n)} className={`${chip(v === n)} !px-2`}>{n || 'Off'}</button>)}</span></li>
  )
  const [off, on] = WORDS[d.kind]!
  return <li className={tile}>{name}<button type="button" aria-pressed={!!v} aria-label={`${d.name}: ${v ? on : off}`} onClick={() => set(d.id, v ? 0 : 1)} className={`${chip(!!v)} min-w-[5.2rem]`}>{v ? on : off}</button></li>
}

export default function Rooms() {
  const room = useHome((s) => s.room), pick = useHome((s) => s.pick), enter = useHome((s) => s.enter), trigger = useHome((s) => s.trigger)
  const family = useHome((s) => s.family), hazard = useHome((s) => s.hazard)
  const r = ROOMS.find((x) => x.id === room)!, busy = occupancy(family).has(room)
  return (
    <div className="space-y-3">
      <div role="group" aria-label="Rooms" className="rail flex gap-1.5 overflow-x-auto">{ROOMS.map((x) => <button key={x.id} type="button" aria-pressed={x.id === room} onClick={() => pick(x.id)} className={chip(x.id === room)}>{x.name}</button>)}</div>
      <ul className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">{DEVICES.filter((d) => d.room === room).map((d) => <Control key={d.id} d={d} />)}</ul>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`mr-1 text-[0.65rem] font-bold uppercase tracking-wider ${busy ? 'text-emerald-300' : 'text-slate'}`}>{r.name}: {busy ? 'occupied' : 'vacant'}</span>
        <button type="button" onClick={() => enter(room)} className={chip(false)}><Footprints size={13} aria-hidden />Walk in</button>
        {room === 'kitchen' && <><button type="button" onClick={() => trigger('smoke')} className={chip(hazard === 'smoke')}><Flame size={13} aria-hidden />Test smoke</button><button type="button" onClick={() => trigger('gas')} className={chip(hazard === 'gas')}><Wind size={13} aria-hidden />Test gas leak</button></>}
        {room === 'bath' && <button type="button" onClick={() => trigger('leak')} className={chip(hazard === 'leak')}><Droplets size={13} aria-hidden />Test water leak</button>}
        <span className="ml-auto hidden flex-wrap gap-2 text-[0.65rem] text-slate md:flex">{r.sensors.map((x) => <span key={x} className="flex items-center gap-1"><Radio size={10} aria-hidden className="text-emerald-300" />{x} sensor</span>)}</span>
      </div>
    </div>
  )
}

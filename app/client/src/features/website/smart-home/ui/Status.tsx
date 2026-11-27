// What the visitor needs at a glance (on the house), the activity list, and the home's settings.
import { useState } from 'react'
import { ChevronDown, CloudRain, CloudSnow, Flame, Gauge, ShieldCheck, ShieldOff, Sun, Wand2 } from 'lucide-react'
import { useHome } from '../store'
import { PEOPLE } from '../data/schedule'
import { roomName } from '../data/home'
import { OUTSIDE, clock, indoorTemp, loadKw, roomOf } from '../engine/automation'
import { chip, panel } from './shared'

export const WEATHER = [['sunny', 'Sunny', Sun], ['rainy', 'Rainy', CloudRain], ['hot', 'Hot', Flame], ['cold', 'Cold', CloudSnow]] as const

/** One compact line over the house: time, mode, temperatures and security. */
export function Glance() {
  const min = useHome((s) => s.min), weather = useHome((s) => s.weather), values = useHome((s) => s.values), mode = useHome((s) => s.mode)
  const [, label, Icon] = WEATHER.find((w) => w[0] === weather)!, armed = Boolean(values['security.armed'])
  return (
    <div className={`${panel} flex items-center gap-3 px-3.5 py-2`}>
      <span className="font-display text-xl font-bold tabular-nums" data-testid="home-clock">{clock(min)}</span>
      <span className="border-l border-white/15 pl-3 font-display text-sm font-bold" data-testid="home-mode">{mode}</span>
      <span className="hidden items-center gap-1.5 border-l border-white/15 pl-3 text-xs text-silver sm:flex"><Icon size={15} aria-label={label} className="text-amber-300" />{OUTSIDE[weather]}° out · {indoorTemp(values, weather)}° in</span>
      <span title={armed ? 'Security armed' : 'Security disarmed'} className={`hidden items-center border-l border-white/15 pl-3 sm:flex ${armed ? 'text-red-300' : 'text-emerald-300'}`}>{armed ? <ShieldCheck size={17} aria-label="Security armed" /> : <ShieldOff size={17} aria-label="Security disarmed" />}</span>
    </div>
  )
}

/** The latest event, with the full list on request. */
export function Activity() {
  const log = useHome((s) => s.log), [open, setOpen] = useState(false), last = log[0]
  return (
    <div className={`${panel} w-full max-w-xl`}>
      <ol aria-label="Activity feed" hidden={!open} className="max-h-48 space-y-1.5 overflow-y-auto border-b border-white/10 p-3 text-xs" data-lenis-prevent>
        {log.map((e) => <li key={e.key} className="flex gap-2"><time className="shrink-0 font-bold tabular-nums text-accent">{e.time}</time><span className="text-silver"><b className="mr-1 text-white/80">{e.source}</b>{e.text}</span></li>)}
      </ol>
      <button type="button" aria-label="Activity history" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs">
        <span className="pulse-dot h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" /><time className="font-bold tabular-nums text-accent">{last.time}</time><span className="min-w-0 flex-1 truncate text-silver">{last.text}</span>
        <span className="flex shrink-0 items-center gap-1 font-semibold">History<ChevronDown size={14} aria-hidden className={`transition ${open ? '' : 'rotate-180'}`} /></span>
      </button>
    </div>
  )
}

/** Safety alerts and manual overrides are always visible when they matter. */
export function Notices() {
  const hazard = useHome((s) => s.hazard), trigger = useHome((s) => s.trigger), overrides = useHome((s) => Object.keys(s.held).length), resume = useHome((s) => s.resume)
  return (
    <>
      {hazard && <div role="alert" className="rounded-xl border border-red-400/70 bg-red-950/90 px-3.5 py-2 text-xs font-semibold text-red-100 shadow-lift">Safety alert: {hazard === 'leak' ? 'water leak' : hazard === 'gas' ? 'gas leak' : 'smoke'} (simulated)<button type="button" onClick={() => trigger(null)} className="ml-3 underline">Clear</button></div>}
      {overrides > 0 && <div role="status" className="flex items-center gap-3 rounded-xl border border-amber-300/50 bg-midnight/90 px-3.5 py-2 text-xs text-amber-200 shadow-lift"><span>Manual override: {overrides} device{overrides > 1 ? 's' : ''}</span><button type="button" onClick={resume} className="font-bold underline">Resume automation</button></div>}
    </>
  )
}

/** Family, energy and the occupancy rule. */
export function HomeDetails() {
  const family = useHome((s) => s.family), values = useHome((s) => s.values), auto = useHome((s) => s.auto), delay = useHome((s) => s.delay), options = useHome((s) => s.options)
  const kw = loadKw(values)
  return (
    <div className="grid gap-3 text-xs md:grid-cols-[1.6fr_1fr_auto] md:items-center">
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-4">{family.map((p, i) => <li key={PEOPLE[i]} className="min-w-0"><span className="block truncate font-semibold">{PEOPLE[i]}</span><span className="block truncate text-slate">{p.pose === 'away' ? 'Out of home' : roomName(roomOf(p) ?? 'entrance')}</span></li>)}</ul>
      <div><div className="flex items-center justify-between text-silver"><span className="flex items-center gap-1.5"><Gauge size={13} aria-hidden />Energy now</span><b className="tabular-nums text-white">{kw.toFixed(2)} kW</b></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full transition-all duration-700 ${kw > 5 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${Math.min(100, kw * 11)}%` }} /></div></div>
      <div className="flex items-center gap-2">
        <button type="button" aria-pressed={auto} onClick={() => options({ auto: !auto })} className={chip(auto)}><Wand2 size={13} aria-hidden />Occupancy {auto ? 'on' : 'off'}</button>
        <label className="flex items-center gap-1 text-slate">after<select aria-label="Vacancy delay" value={delay} onChange={(e) => options({ delay: Number(e.target.value) })} className="rounded-md border border-white/15 bg-transparent px-1 py-1 text-white [&>option]:text-black">{[1, 5, 15, 30].map((m) => <option key={m} value={m}>{m} min</option>)}</select></label>
      </div>
    </div>
  )
}

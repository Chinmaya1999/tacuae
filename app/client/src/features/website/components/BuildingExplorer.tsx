// Pick a kind of building and switch its systems on: an isometric model drawn in SVG.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Building, Building2, Hotel, House, Lightbulb, Plane, ShieldCheck, ShoppingBag, SlidersHorizontal, Snowflake, Zap, type LucideIcon } from 'lucide-react'
import { services, serviceHref } from '../../../shared/data/content'
import SectionHeader from '../../../shared/components/SectionHeader'

// The building types TAC names on its website. The service suggestions are typical starting points.
type Kind = { id: string; name: string; icon: LucideIcon; w: number; d: number; floors: number; services: string[] }
const KINDS: Kind[] = [
  { id: 'hotel', name: 'Hotels', icon: Hotel, w: 150, d: 110, floors: 9, services: ['guest-room-management-system', 'building-management-system', 'lighting-and-dimming-control'] },
  { id: 'airport', name: 'Airports', icon: Plane, w: 270, d: 120, floors: 3, services: ['building-management-system', 'lighting-and-dimming-control', 'knx-automation'] },
  { id: 'mall', name: 'Malls', icon: ShoppingBag, w: 220, d: 170, floors: 4, services: ['building-management-system', 'lighting-and-dimming-control', 'knx-automation'] },
  { id: 'office', name: 'High-rise offices', icon: Building2, w: 112, d: 100, floors: 13, services: ['building-management-system', 'lighting-and-dimming-control', 'knx-automation'] },
  { id: 'villa', name: 'Villas', icon: House, w: 180, d: 130, floors: 2, services: ['smart-home-automation', 'knx-automation', 'lighting-and-dimming-control'] },
  { id: 'apartment', name: 'Apartments', icon: Building, w: 130, d: 110, floors: 7, services: ['smart-home-automation', 'knx-automation', 'lighting-and-dimming-control'] },
]
const LAYERS: [string, string, LucideIcon, string][] = [['light', 'Lighting', Lightbulb, '#ffd27a'], ['hvac', 'HVAC', Snowflake, '#5ec8ff'], ['security', 'Security', ShieldCheck, '#ff6b81'], ['energy', 'Power', Zap, '#5fe3a1'], ['control', 'Central control', SlidersHorizontal, '#b09cff']]
const C = 0.866, S = 0.5

function Model({ kind, on }: { kind: Kind; on: Set<string> }) {
  const { w, d, floors } = kind, h = Math.min(26, 250 / floors)
  const pt = (x: number, y: number, z: number) => `${300 + (x - y) * C},${352 + (x + y) * S - (w + d) * S * 0.5 - z}`
  const face = (pts: [number, number, number][]) => pts.map((p) => pt(...p)).join(' ')
  const top = floors * h, cols = Math.max(2, Math.round(w / 34)), side = Math.max(2, Math.round(d / 34))
  return (
    <svg viewBox="0 0 600 500" className="h-auto w-full" role="img" aria-label={`Model of a ${kind.name.toLowerCase().replace(/s$/, '')} with the selected systems highlighted`}>
      <ellipse cx="300" cy="396" rx="250" ry="70" fill="#4f46e5" opacity=".16" />
      <g key={kind.id} className="building-in">
        {Array.from({ length: floors }, (_, f) => {
          const z = f * h
          return (
            <g key={f}>
              <polygon points={face([[0, d, z], [w, d, z], [w, d, z + h], [0, d, z + h]])} fill="#232c55" stroke="#4a549a" strokeWidth=".7" />
              <polygon points={face([[w, 0, z], [w, d, z], [w, d, z + h], [w, 0, z + h]])} fill="#171e3f" stroke="#38417a" strokeWidth=".7" />
              {Array.from({ length: cols }, (_, c) => { const a = ((c + 0.2) / cols) * w, b = ((c + 0.8) / cols) * w, lit = on.has('light') && (f * 7 + c * 3) % 5 !== 0
                return <polygon key={c} points={face([[a, d, z + h * 0.25], [b, d, z + h * 0.25], [b, d, z + h * 0.78], [a, d, z + h * 0.78]])} fill={lit ? '#ffd27a' : '#0e1430'} style={{ transition: `fill .5s ${(f * 40 + c * 25) % 500}ms` }} /> })}
              {Array.from({ length: side }, (_, c) => { const a = ((c + 0.2) / side) * d, b = ((c + 0.8) / side) * d, lit = on.has('light') && (f * 3 + c * 5) % 4 !== 0
                return <polygon key={c} points={face([[w, a, z + h * 0.25], [w, b, z + h * 0.25], [w, b, z + h * 0.78], [w, a, z + h * 0.78]])} fill={lit ? '#e8ac52' : '#0a0f25'} style={{ transition: `fill .5s ${(f * 40 + c * 30) % 500}ms` }} /> })}
              <polyline points={face([[w * 0.04, d, z + h * 0.1], [w, d, z + h * 0.1], [w, d * 0.04, z + h * 0.1]])} fill="none" stroke="#5ec8ff" strokeWidth="2" className="a-flow" opacity={on.has('hvac') ? 1 : 0} style={{ transition: 'opacity .5s' }} />
            </g>
          )
        })}
        <polygon points={face([[0, 0, top], [w, 0, top], [w, d, top], [0, d, top]])} fill="#2f3868" stroke="#6b76c4" />
        <g opacity={on.has('energy') ? 1 : 0.12} style={{ transition: 'opacity .5s' }}>{[0.18, 0.46, 0.74].map((k) => <polygon key={k} points={face([[w * k, d * 0.2, top + 4], [w * (k + 0.2), d * 0.2, top + 4], [w * (k + 0.2), d * 0.7, top + 4], [w * k, d * 0.7, top + 4]])} fill="#1d6f68" stroke="#5fe3a1" />)}</g>
        <g opacity={on.has('security') ? 1 : 0} style={{ transition: 'opacity .5s' }}>{([[0, d, h], [w, d, h], [w, 0, h], [0, d, top], [w, d, top]] as [number, number, number][]).map((p, i) => { const [x, y] = pt(...p).split(',').map(Number); return <g key={i}><circle cx={x} cy={y} r="4.5" fill="#ff6b81" /><circle cx={x} cy={y} r="11" fill="none" stroke="#ff6b81" className="a-ripple" style={{ transformOrigin: `${x}px ${y}px`, animationDelay: `${i * 0.35}s` }} /></g> })}</g>
        {on.has('control') && ([[0, d, top * 0.5], [w / 2, d / 2, top], [w, d / 2, top * 0.3]] as [number, number, number][]).map((p, i) => { const [x, y] = pt(...p).split(',').map(Number); return <path key={i} d={`M${x} ${y} Q ${(x + 505) / 2} ${y - 90} 505 74`} fill="none" stroke="#b09cff" strokeWidth="1.6" className="a-flow" /> })}
      </g>
      <g opacity={on.has('control') ? 1 : 0} style={{ transition: 'opacity .5s' }}><rect x="462" y="44" width="86" height="58" rx="12" fill="#2a2466" stroke="#b09cff" />{[0, 1, 2].map((i) => <rect key={i} x={476 + i * 22} y={62 + (i % 2) * 8} width="12" height={26 - (i % 2) * 8} rx="3" fill="#b09cff" className="a-bar" style={{ animationDelay: `${i * 0.2}s`, transformBox: 'fill-box' }} />)}</g>
    </svg>
  )
}

export default function BuildingExplorer() {
  const [kind, setKind] = useState(KINDS[0]), [on, setOn] = useState(() => new Set(LAYERS.map((l) => l[0])))
  const toggle = (id: string) => setOn((prev) => { const next = new Set(prev); if (!next.delete(id)) next.add(id); return next })
  return (
    <section aria-labelledby="explorer" className="section relative overflow-hidden bg-midnight">
      <div aria-hidden className="aurora absolute inset-0" /><div aria-hidden className="grid-bg absolute inset-0 opacity-60" />
      <div className="container-x relative">
        <SectionHeader id="explorer" eyebrow="One platform, every building" title="Choose a building. Switch it on." text="See which systems typically fit your kind of property." />
        <div role="group" aria-label="Building type" className="rail flex gap-2 overflow-x-auto pb-1">
          {KINDS.map((k) => <button key={k.id} type="button" aria-pressed={k.id === kind.id} onClick={() => setKind(k)} className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${k.id === kind.id ? 'border-accent bg-primary text-white shadow-lg shadow-primary/30' : 'border-white/14 bg-white/[.04] text-silver hover:border-white/40 hover:text-white'}`}><k.icon size={16} aria-hidden />{k.name}</button>)}
        </div>
        <div className="mt-6 grid items-stretch gap-6 lg:grid-cols-12">
          <div className="surface flex flex-col justify-center p-3 sm:p-6 lg:col-span-8">
            <Model kind={kind} on={on} />
            <div role="group" aria-label="Building systems" className="mt-2 flex flex-wrap justify-center gap-2">
              {LAYERS.map(([id, name, Icon, color]) => <button key={id} type="button" aria-pressed={on.has(id)} onClick={() => toggle(id)} className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${on.has(id) ? 'border-white/40 bg-white/10 text-white' : 'border-white/10 text-slate'}`}><Icon size={14} aria-hidden style={{ color: on.has(id) ? color : undefined }} />{name}</button>)}
            </div>
          </div>
          <div className="flex flex-col justify-center lg:col-span-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">Typical systems for {kind.name.toLowerCase()}</p>
            <ul className="mt-4 space-y-3">{kind.services.map((slug) => { const s = services.find((x) => x.slug === slug)!; return (
              <li key={slug}><Link to={serviceHref(s)} className="group block rounded-2xl border border-white/10 bg-white/[.03] p-4 transition hover:-translate-y-0.5 hover:border-accent/60 hover:bg-white/[.07]"><span className="flex items-start justify-between gap-3 font-display font-bold">{s.title}<ArrowUpRight size={17} aria-hidden className="shrink-0 text-accent transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span><span className="mt-1 block text-sm text-silver">{s.short}</span></Link></li>) })}</ul>
          </div>
        </div>
      </div>
    </section>
  )
}

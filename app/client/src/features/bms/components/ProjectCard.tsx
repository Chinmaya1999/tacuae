import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { typeLabel, type Project } from '../data/bms'
import { useBuildingThumb } from './useBuildingThumb'

/** Little skyline: one bar per tower, as tall as it has floors. */
export function Skyline({ project }: { project: Project }) {
  const max = Math.max(...project.towers.map((t) => t.floors)), n = project.towers.length, bw = Math.min(26, 90 / n)
  return (
    <svg viewBox="0 0 100 50" className="w-full rounded-xl bg-[#131a2e]" role="img" aria-label={`${n} tower${n > 1 ? 's' : ''}, up to ${max} floors`}>
      <rect x="0" y="45" width="100" height="5" fill="#1c2442" />
      {project.towers.map((t, i) => { const h = 8 + (t.floors / max) * 32, x = 50 - (n * (bw + 3)) / 2 + i * (bw + 3) + 1.5
        return <g key={t.id}><rect x={x} y={45 - h} width={bw} height={h} rx="1" fill="#1d3354" stroke="#3b82c4" strokeWidth=".4" />
          {Array.from({ length: Math.min(t.floors, 14) }, (_, k) => <rect key={k} x={x + 1.5} y={45 - h + 2 + k * ((h - 4) / Math.min(t.floors, 14))} width={bw - 3} height=".7" fill="#5ec6ff" opacity=".35" />)}</g> })}
    </svg>
  )
}

export default function ProjectCard({ p }: { p: Project }) {
  const pic = useBuildingThumb(p), s = p.stats, pct = s && s.equipment ? Math.round((s.online / s.equipment) * 100) : 100
  return (
    <li className="group relative flex flex-col rounded-2xl border border-white/10 bg-white/[.03] p-4 transition hover:border-accent/40 hover:bg-white/[.05]">
      {pic ? <img src={pic} alt={`${p.name}: ${p.towers.length} tower${p.towers.length > 1 ? 's' : ''}, up to ${Math.max(...p.towers.map((t) => t.floors))} floors`} width={800} height={450} className="aspect-video w-full rounded-xl object-cover" draggable={false} /> : <Skyline project={p} />}
      <h3 className="mt-4 truncate font-display text-lg"><Link to={`/dashboard/projects/${p.id}`} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-accent">{p.name}</Link></h3>
      <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-silver"><MapPin size={13} className="shrink-0" />{p.location || typeLabel(p.type)}</p>
      {s && <>
        <p className="mt-3 text-sm text-slate">{s.towers} tower{s.towers > 1 ? 's' : ''} · {s.floors} floors{s.units ? ` · ${s.units} units` : ''} · {s.equipment} devices</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full border px-3 py-1 ${s.issues ? 'border-red-400/40 bg-red-500/10 text-red-300' : 'border-emerald-300/30 bg-emerald-400/10 text-emerald-300'}`}>{s.issues ? `${s.issues} active issue${s.issues > 1 ? 's' : ''}` : 'No active issues'}</span>
          <span className="rounded-full border border-white/15 px-3 py-1 text-silver">{pct}% online</span>
          {s.loadKw > 0 && <span className="rounded-full border border-white/15 px-3 py-1 text-silver">{s.loadKw} kW</span>}
        </div></>}
    </li>
  )
}

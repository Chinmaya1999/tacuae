import { Link } from 'react-router-dom'
import * as L from 'lucide-react'
import { groupColor, deviceById, statusLabel, statusStyle, type Design } from '../../../shared/data/catalog'

export const Icon = ({ name, size = 18, className = '' }: { name: string; size?: number; className?: string }) => {
  const C = (L as unknown as Record<string, L.LucideIcon>)[name] ?? L.Home
  return <C size={size} className={className} aria-hidden />
}
export const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '')
export const ago = (s?: string) => {
  if (!s) return ''
  const m = Math.round((Date.now() - Date.parse(s)) / 60000)
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : fmtDate(s)
}
export const Badge = ({ s }: { s: string }) => <span className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs ${statusStyle[s]}`}>{statusLabel[s] ?? s}</span>

const STEPS = [['draft', 'Design'], ['submitted', 'Sent'], ['quoted', 'Quote'], ['accepted', 'Done']] as const
/** Where the design is on its way to an accepted quotation. */
export function Steps({ status }: { status: string }) {
  const at = status === 'rejected' ? 2 : Math.max(0, STEPS.findIndex(([k]) => k === status))
  return (
    <ol className="flex items-center gap-1.5" aria-label={`Progress: ${statusLabel[status] ?? status}`}>
      {STEPS.map(([k, label], i) => (
        <li key={k} className="flex flex-1 items-center gap-1.5 last:flex-none">
          <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[0.6rem] ${i < at || (i === at && status === 'accepted') ? 'bg-cyan text-midnight' : i === at ? (status === 'rejected' ? 'bg-red-400 text-midnight' : 'border border-cyan text-cyan') : 'border border-white/20 text-slate'}`}>{i < at || (i === at && status === 'accepted') ? '✓' : i + 1}</span>
          <span className={`hidden text-[0.68rem] sm:inline ${i <= at ? 'text-silver' : 'text-slate'}`}>{status === 'rejected' && i === 2 ? 'Declined' : label}</span>
          {i < STEPS.length - 1 && <span className={`h-px flex-1 ${i < at ? 'bg-cyan/60' : 'bg-white/15'}`} />}
        </li>))}
    </ol>
  )
}

/** Miniature floor plan: each room as a block, each smart device as a coloured dot. */
export function PlanThumb({ design, className = '' }: { design: Pick<Design, 'rooms'>; className?: string }) {
  const rooms = design.rooms.slice(0, 6), n = Math.max(1, rooms.length), cols = Math.ceil(Math.sqrt(n)), rows = Math.ceil(n / cols)
  const cw = 100 / cols, ch = 56 / rows
  return (
    <svg viewBox="0 0 100 56" className={`w-full rounded-xl bg-[#0d1b2e] ${className}`} role="img" aria-label={`${design.rooms.length} room plan`}>
      {rooms.map((r, i) => {
        const w = r.w ?? 5, l = r.l ?? 4, s = Math.min((cw - 5) / w, (ch - 5) / l), rw = w * s, rl = l * s
        const ox = (i % cols) * cw + (cw - rw) / 2, oy = Math.floor(i / cols) * ch + (ch - rl) / 2
        return (
          <g key={r.id}>
            <rect x={ox} y={oy} width={rw} height={rl} rx="1" fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.28)" strokeWidth=".5" />
            {(r.furniture ?? []).map((f) => <rect key={f.id} x={ox + (f.x / 100) * rw - 1.2} y={oy + (f.y / 100) * rl - 0.8} width="2.4" height="1.6" rx=".4" fill="rgba(255,255,255,.14)" />)}
            {r.devices.map((d) => <circle key={d.id} cx={ox + (d.x / 100) * rw} cy={oy + (d.y / 100) * rl} r="1.1" fill={groupColor[deviceById[d.cat]?.group ?? 'Lighting']} opacity={d.on ? 1 : 0.4} />)}
          </g>)
      })}
    </svg>
  )
}

export function Stat({ icon, label, value, hint, to }: { icon: string; label: string; value: string | number; hint?: string; to?: string }) {
  const body = (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-white/10 bg-white/[.03] p-4 transition hover:border-cyan/40 hover:bg-white/[.05] sm:flex-row sm:items-start sm:gap-4 sm:p-5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan/10 text-cyan sm:h-11 sm:w-11"><Icon name={icon} size={20} /></span>
      <div className="min-w-0"><div className="truncate text-xs uppercase tracking-[0.14em] text-silver">{label}</div><div className="mt-1 whitespace-nowrap font-display text-lg tabular-nums sm:text-xl">{value}</div>{hint && <div className="mt-0.5 text-xs text-slate">{hint}</div>}</div>
    </div>)
  return to ? <Link to={to} className="block">{body}</Link> : body
}

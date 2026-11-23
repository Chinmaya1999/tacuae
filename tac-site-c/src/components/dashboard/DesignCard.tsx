import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { aed, type Design } from '../../data/catalog'
import { Badge, PlanThumb, Steps, ago } from './ui'

/** One design: floor-plan thumbnail, progress, price. The whole card opens the studio. */
export default function DesignCard({ d, builder, onDelete }: { d: Design; builder: boolean; onDelete?: (d: Design) => void }) {
  const deletable = d.status === 'draft' || d.status === 'rejected' || d.status === 'quoted'
  return (
    <li className="group relative flex flex-col rounded-2xl border border-white/10 bg-white/[.03] p-4 transition hover:border-cyan/40 hover:bg-white/[.05]">
      <PlanThumb design={d} />
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg"><Link to={`/dashboard/design/${d.id}`} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-cyan">{d.name}</Link></h3>
          <p className="truncate text-sm text-silver">{builder && (d.clientName || d.siteAddress) ? [d.clientName, d.siteAddress].filter(Boolean).join(' · ') : `${d.rooms.length} room${d.rooms.length !== 1 ? 's' : ''} · ${d.deviceCount} smart item${d.deviceCount !== 1 ? 's' : ''}`}</p>
        </div>
        <Badge s={d.status!} />
      </div>
      <div className="mt-4"><Steps status={d.status!} /></div>
      <div className="mt-4 flex items-end justify-between gap-3 text-sm">
        <div className="text-slate">Updated {ago(d.updatedAt)}</div>
        <div className="text-right">
          {d.quote ? <><div className="text-[0.65rem] uppercase tracking-wider text-cyan">Quote</div><div className="font-display text-lg text-cyan">{aed(d.quote.amount)}</div></>
            : d.estimate && d.estimate.total > 0 ? <><div className="text-[0.65rem] uppercase tracking-wider text-slate">Estimate</div><div className="font-display text-lg">{aed(d.estimate.total)}</div></> : null}
        </div>
      </div>
      {onDelete && deletable && <button onClick={() => onDelete(d)} aria-label={`Delete ${d.name}`} className="absolute right-3 top-3 z-10 rounded-full bg-midnight/80 p-2 text-slate opacity-0 backdrop-blur transition hover:text-red-300 focus-visible:opacity-100 group-hover:opacity-100"><Trash2 size={15} /></button>}
    </li>
  )
}

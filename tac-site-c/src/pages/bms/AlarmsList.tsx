import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { levelName, severityStyle, type Alarm, type Project } from '../../data/bms'
import { ago } from '../../components/dashboard/ui'

const order: Record<Alarm['severity'], number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
type Props = { items: Alarm[]; projects?: Project[]; onAck: (a: Alarm) => Promise<void>; onResolve: (a: Alarm, note: string) => Promise<void>; showProject?: boolean; empty?: string }

/** Alarm list with acknowledge → resolve (with a note) workflow. */
export default function AlarmsList({ items, projects, onAck, onResolve, showProject, empty = 'No alarms here.' }: Props) {
  const [resolving, setResolving] = useState<string | null>(null), [note, setNote] = useState(''), [busy, setBusy] = useState('')
  const sorted = [...items].sort((a, b) => (a.state === 'resolved' ? 1 : 0) - (b.state === 'resolved' ? 1 : 0) || order[a.severity] - order[b.severity] || b.raisedAt.localeCompare(a.raisedAt))
  const where = (a: Alarm) => { const t = projects?.find((p) => p.id === a.projectId)?.towers.find((x) => x.id === a.towerId); return t ? `${t.name} · ${levelName(a.level, t.floors)}` : `Level ${a.level}` }
  const run = async (id: string, fn: () => Promise<void>) => { setBusy(id); try { await fn() } finally { setBusy('') } }
  if (!sorted.length) return <p className="rounded-2xl border border-dashed border-white/20 p-10 text-center text-silver">{empty}</p>
  return (
    <ul className="space-y-3">{sorted.map((a) => (
      <li key={a.id} className={`rounded-2xl border bg-white/[.03] p-4 ${a.state === 'resolved' ? 'border-white/10 opacity-70' : a.severity === 'critical' ? 'border-red-400/40' : 'border-white/10'}`}>
        <div className="flex flex-wrap items-start gap-3">
          <span className={`rounded-full border px-3 py-1 text-xs capitalize ${severityStyle[a.severity]}`}>{a.severity}</span>
          <div className="min-w-[200px] flex-1">
            <div className="text-sm">{a.message}</div>
            <div className="mt-1 text-xs text-slate">{a.tag} · {a.module} · {where(a)}{showProject && a.projectName ? <> · <Link to={`/dashboard/projects/${a.projectId}`} className="text-cyan hover:underline">{a.projectName}</Link></> : null} · raised {ago(a.raisedAt)}</div>
            {a.ackBy && <div className="mt-1 text-xs text-slate">Acknowledged by {a.ackBy}{a.resolvedAt ? ` · resolved ${ago(a.resolvedAt)}` : ''}{a.note ? ` — “${a.note}”` : ''}</div>}
          </div>
          {a.state === 'active' && <button disabled={busy === a.id} onClick={() => run(a.id, () => onAck(a))} className="rounded-full border border-white/20 px-4 py-1.5 text-sm text-silver hover:border-cyan hover:text-cyan">Acknowledge</button>}
          {a.state !== 'resolved' && <button onClick={() => { setResolving(resolving === a.id ? null : a.id); setNote('') }} className="rounded-full border border-emerald-300/40 px-4 py-1.5 text-sm text-emerald-300 hover:bg-emerald-400/10">Resolve</button>}
          {a.state === 'resolved' && <span className="flex items-center gap-1.5 text-sm text-emerald-300"><Check size={14} />Resolved</span>}
        </div>
        {resolving === a.id && (
          <form className="mt-3 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); run(a.id, async () => { await onResolve(a, note); setResolving(null) }) }}>
            <label className="sr-only" htmlFor={`n-${a.id}`}>Resolution note</label>
            <input id={`n-${a.id}`} autoFocus maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was done? (optional)" className="min-w-[200px] flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-base outline-none focus:border-cyan" />
            <button className="btn btn-primary !px-5 !py-2" disabled={busy === a.id}>Mark resolved</button>
          </form>)}
      </li>))}</ul>
  )
}

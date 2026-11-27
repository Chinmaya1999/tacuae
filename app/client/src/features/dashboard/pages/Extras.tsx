// Dashboard: my appointments, and company team accounts for builders.
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { api } from '../../../shared/lib/api'
import { pretty } from '../../quotations/lib/quote'
import { Field, card, field, small } from '../../quotations/components/ui'

export type Booking = { id: string; type: string; date: string; slot: string; name: string; phone: string; email: string; notes: string; status: string }
export function Appointments() {
  const [items, setItems] = useState<Booking[] | null>(null), [err, setErr] = useState('')
  useEffect(() => { api<{ items: Booking[] }>('/api/appointments').then((d) => setItems(d.items)).catch((e) => setErr(e.message)) }, [])
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pr-14"><h1 className="font-display text-3xl">Appointments</h1><Link to="/book" className="btn btn-primary !py-2.5">Book a visit</Link></div>
      {err && <p role="alert" className="text-red-400">{err}</p>}
      {!items && !err && <Loader2 className="animate-spin text-accent" />}
      {items?.length === 0 && <p className="text-silver">Nothing booked yet.</p>}
      <ul className="space-y-3">{items?.map((a) => <li key={a.id} className={`${card} flex flex-wrap items-center gap-4`}><b>{pretty(a.type)}</b><span>{a.date} · {a.slot}</span><span className="ml-auto rounded-full border border-accent/40 px-3 py-0.5 text-xs text-accent">{pretty(a.status)}</span></li>)}</ul>
    </div>
  )
}

type Member = { id: string; name: string; email: string; teamRole: string; active: boolean }
export function Team() {
  const [data, setData] = useState<{ owner: { name: string; email: string; company: string }; members: Member[]; canManage: boolean } | null>(null)
  const [f, setF] = useState({ name: '', email: '', teamRole: 'procurement' }), [msg, setMsg] = useState(''), [err, setErr] = useState('')
  const load = useCallback(() => api<NonNullable<typeof data>>('/api/team').then(setData).catch((e) => setErr(e.message)), [])
  useEffect(() => { load() }, [load])
  const add = async (e: FormEvent) => {
    e.preventDefault(); setErr(''); setMsg('')
    try { const d = await api<{ password: string }>('/api/team', { method: 'POST', body: f }); setMsg(`${f.email} added. Temporary password (shown once): ${d.password}`); setF({ ...f, name: '', email: '' }); load() } catch (x) { setErr((x as Error).message) }
  }
  const patch = (id: string, body: object) => api(`/api/team/${id}`, { method: 'PATCH', body }).then(load).catch((e) => setErr(e.message))
  if (!data) return err ? <p role="alert" className="text-red-400">{err}</p> : <Loader2 className="animate-spin text-accent" />
  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-3xl">Company team</h1><p className="mt-2 text-sm text-silver">Owner: everything. Procurement: edit, share and accept quotations. Viewer: read and comment.</p></div>
      <ul className="space-y-3"><li className={`${card} flex flex-wrap gap-3`}><b>{data.owner.name}</b><span className="text-silver">{data.owner.email}</span><span className="ml-auto text-accent">Owner</span></li>
        {data.members.map((m) => <li key={m.id} className={`${card} flex flex-wrap items-center gap-3`}><b>{m.name}</b><span className="text-silver">{m.email}</span>
          {data.canManage ? <span className="ml-auto flex gap-2"><select aria-label={`Role of ${m.name}`} className={`${field} !w-auto`} value={m.teamRole} onChange={(e) => patch(m.id, { teamRole: e.target.value })}><option value="procurement">Procurement</option><option value="viewer">Viewer</option></select><button className={small} onClick={() => patch(m.id, { active: !m.active })}>{m.active ? 'Disable' : 'Enable'}</button></span> : <span className="ml-auto text-accent">{pretty(m.teamRole)}</span>}</li>)}</ul>
      {data.canManage && <form onSubmit={add} className={`${card} grid items-end gap-3 sm:grid-cols-[1fr_1fr_180px_auto]`}>
        <Field name="Name"><input required className={field} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field name="Email"><input required type="email" className={field} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field name="Role"><select className={field} value={f.teamRole} onChange={(e) => setF({ ...f, teamRole: e.target.value })}><option value="procurement">Procurement</option><option value="viewer">Viewer</option></select></Field>
        <button className="btn btn-primary !py-2.5">Add member</button></form>}
      {msg && <p role="status" className="rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{msg}</p>}
      {err && <p role="alert" className="text-red-400">{err}</p>}
    </div>
  )
}

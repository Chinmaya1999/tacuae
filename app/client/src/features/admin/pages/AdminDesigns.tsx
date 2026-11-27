import { useCallback, useEffect, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import * as L from 'lucide-react'
import { api } from '../../../shared/lib/api'
import { aed, bill, groupColor, statusLabel, statusStyle, type Design } from '../../../shared/data/catalog'
import Studio3D from '../../studio/three/Studio3D'
import CostPanel from '../../studio/components/CostPanel'

type AD = Design & { owner: { id: string; name: string; email: string; role: string; company: string }; adminNote: string; submittedAt?: string }
const inputCls = 'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate focus:border-accent'
const fmt = (s?: string | null) => (s ? new Date(s).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '')
const FILTERS = [['submitted', 'Awaiting quote'], ['quoted', 'Quoted'], ['accepted', 'Accepted'], ['rejected', 'Declined'], ['all', 'All sent designs']] as const

export default function DesignsAdmin({ onChange }: { onChange: () => void }) {
  const [status, setStatus] = useState<string>('submitted'), [items, setItems] = useState<AD[] | null>(null), [open, setOpen] = useState<string | null>(null), [err, setErr] = useState('')
  const load = useCallback(() => api<{ items: AD[] }>(`/api/admin/designs?status=${status}`).then((d) => { setItems(d.items); setErr('') }).catch((e) => setErr(e.message)), [status])
  useEffect(() => { setItems(null); load() }, [load])
  const sel = items?.find((d) => d.id === open)
  if (sel) return <Detail d={sel} back={() => { setOpen(null); load(); onChange() }} />
  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-3xl">Room designs</h1><p className="mt-2 max-w-2xl text-sm text-silver">Designs customers and builders sent from their virtual playground. Open one to see every feature they chose, then send a quotation.</p></div>
      <div className="flex flex-wrap gap-2">{FILTERS.map(([v, l]) => <button key={v} onClick={() => setStatus(v)} className={`rounded-full border px-4 py-2 text-sm ${status === v ? 'border-accent bg-accent/15 text-accent' : 'border-white/15 text-silver'}`}>{l}</button>)}</div>
      {err && <p role="alert" className="text-red-400">{err}</p>}
      {!items && !err && <Loader2 className="animate-spin text-accent" />}
      {items?.length === 0 && <p className="rounded-2xl border border-dashed border-white/20 p-10 text-center text-silver">Nothing here.</p>}
      <ul className="space-y-3">{items?.map((d) => (
        <li key={d.id}><button onClick={() => setOpen(d.id!)} className="flex w-full flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/[.03] p-5 text-left transition hover:border-accent/50">
          <div className="min-w-0 flex-1"><div className="font-display text-lg">{d.name}</div>
            <div className="text-sm text-silver">{d.owner.name} <span className="text-slate">· {d.owner.role}{d.owner.company ? ` · ${d.owner.company}` : ''}</span></div>
            {d.clientName && <div className="text-xs text-slate">Client: {d.clientName}{d.siteAddress ? ` · ${d.siteAddress}` : ''}</div>}</div>
          <div className="text-sm text-slate">{d.rooms.length} rooms · {d.deviceCount} items<br />{fmt(d.submittedAt || d.updatedAt)}</div>
          {d.quote && <div className="font-display text-accent">{aed(d.quote.amount)}</div>}
          <span className={`rounded-full border px-3 py-1 text-xs ${statusStyle[d.status!]}`}>{statusLabel[d.status!]}</span></button></li>))}</ul>
    </div>
  )
}

function Detail({ d, back }: { d: AD; back: () => void }) {
  const [amount, setAmount] = useState(d.quote ? String(d.quote.amount) : d.estimate && d.estimate.total > 0 ? String(d.estimate.total) : ''), [note, setNote] = useState(d.quote?.note ?? ''), [adminNote, setAdminNote] = useState(d.adminNote ?? '')
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null), [cur, setCur] = useState(d)
  const items = bill(cur.rooms), canQuote = ['submitted', 'quoted', 'rejected'].includes(cur.status!)
  const send = async () => {
    setBusy(true); setMsg(null)
    try { const r = await api<{ item: AD }>(`/api/admin/designs/${d.id}/quote`, { method: 'POST', body: { amount: Number(amount), note } }); setCur(r.item); setMsg({ ok: true, t: 'Quotation sent. The customer can now see it in their dashboard.' }) }
    catch (e) { setMsg({ ok: false, t: (e as Error).message }) } finally { setBusy(false) }
  }
  const saveNote = async () => { await api(`/api/admin/designs/${d.id}`, { method: 'PATCH', body: { adminNote } }).then(() => setMsg({ ok: true, t: 'Internal note saved.' })).catch((e) => setMsg({ ok: false, t: e.message })) }
  return (
    <div className="space-y-6">
      <button onClick={back} className="text-sm text-silver hover:text-accent">← All designs</button>
      <div className="flex flex-wrap items-center gap-3"><h1 className="font-display text-3xl">{d.name}</h1><span className={`rounded-full border px-3 py-1 text-xs ${statusStyle[cur.status!]}`}>{statusLabel[cur.status!]}</span></div>
      <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[.03] p-5 text-sm sm:grid-cols-2 xl:grid-cols-4">
        <div><div className="text-xs uppercase tracking-wider text-slate">From</div>{d.owner.name} ({d.owner.role})</div>
        <div><div className="text-xs uppercase tracking-wider text-slate">Contact</div><a className="text-accent hover:underline" href={`mailto:${d.owner.email}`}>{d.owner.email}</a></div>
        <div><div className="text-xs uppercase tracking-wider text-slate">Client / site</div>{[d.clientName, d.siteAddress].filter(Boolean).join(' · ') || '—'}</div>
        <div><div className="text-xs uppercase tracking-wider text-slate">Property</div><span className="capitalize">{d.property ?? 'apartment'}</span></div>
        <div><div className="text-xs uppercase tracking-wider text-slate">Sent</div>{fmt(d.submittedAt || d.updatedAt)}</div>
        {d.notes && <div className="sm:col-span-2 xl:col-span-4"><div className="text-xs uppercase tracking-wider text-slate">Customer notes</div><p className="whitespace-pre-wrap">{d.notes}</p></div>}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-3"><h2 className="text-xs uppercase tracking-[0.16em] text-silver">Their virtual rooms (tap devices to preview)</h2><Studio3D design={cur} readOnly /></div>
        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
            <h2 className="mb-4 text-xs uppercase tracking-[0.16em] text-silver">Features requested · {cur.deviceCount}</h2>
            <ul className="space-y-2 text-sm">{items.map((it) => { const Ic = (L as unknown as Record<string, L.LucideIcon>)[it.device.icon] ?? L.Home; return (
              <li key={it.device.id} className="flex items-start gap-3"><span style={{ color: groupColor[it.device.group] }}><Ic size={16} /></span><span className="min-w-0 flex-1">{it.device.name}<span className="block text-xs text-slate">{[...it.rooms].join(', ')}</span></span><span className="tabular-nums text-silver">×{it.qty}</span></li>) })}</ul>
            <hr className="my-4 border-white/10" />
            <h3 className="mb-2 text-xs uppercase tracking-wider text-slate">Per room</h3>
            <ul className="space-y-1 text-sm text-silver">{cur.rooms.map((r) => <li key={r.id} className="flex justify-between"><span>{r.name}</span><span className="tabular-nums">{r.devices.length} items</span></li>)}</ul>
          </section>
          {cur.estimate && <CostPanel e={cur.estimate} />}
          <section className="rounded-2xl border border-accent/30 bg-accent/[.04] p-5">
            <h2 className="mb-4 text-xs uppercase tracking-[0.16em] text-accent">Quotation</h2>
            {canQuote ? <div className="space-y-3">
              <div><label htmlFor="amt" className="mb-2 block text-xs uppercase tracking-wider text-silver">Total price (AED)</label><input id="amt" type="number" min="0" step="0.01" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} /></div>
              <div><label htmlFor="qn" className="mb-2 block text-xs uppercase tracking-wider text-silver">Message to customer</label><textarea id="qn" rows={4} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What is included, lead time, validity…" className={inputCls} /></div>
              <button disabled={busy || !(Number(amount) > 0)} onClick={send} className="btn btn-primary w-full justify-center disabled:opacity-50">{busy ? 'Sending…' : cur.status === 'quoted' ? 'Update quotation' : 'Send quotation'}</button></div>
              : <p className="text-sm text-silver">{cur.quote ? `${aed(cur.quote.amount)} — ${statusLabel[cur.status!].toLowerCase()} by the customer.` : 'This design is not awaiting a quotation.'}</p>}
            {msg && <p role="alert" className={`mt-3 text-sm ${msg.ok ? 'text-emerald-300' : 'text-red-400'}`}>{msg.ok && <Check size={14} className="mr-1 inline" />}{msg.t}</p>}
          </section>
          <section><label htmlFor="an" className="mb-2 block text-xs uppercase tracking-wider text-slate">Internal note (customer cannot see)</label>
            <textarea id="an" rows={3} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} className={inputCls} /><button onClick={saveNote} className="mt-2 text-sm text-accent hover:underline">Save note</button></section>
        </div>
      </div>
    </div>
  )
}

// Sales console: quotation inbox, assignment, adjustments, discount approval, review and final issue.
import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Download, Loader2, Printer } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { day, downloadBoq, money, type Quote, type QuoteStatus } from '../lib/quote'
import { downloadXlsx } from '../lib/xlsx'
import { Comments, Field, QuoteDocument, StatusPill, card, field, small, statusText } from '../components/quote/ui'
import { Versions } from './dashboard/Quotations'

const STATUSES: QuoteStatus[] = ['shared', 'revision_requested', 'reviewed', 'final', 'accepted', 'survey', 'draft']
type Inbox = { items: Quote[]; summary: Record<string, { count: number; value: number }>; team: { name: string; email: string; role: string }[] }

export default function QuotationsAdmin() {
  const [data, setData] = useState<Inbox | null>(null), [status, setStatus] = useState(''), [mine, setMine] = useState(false), [open, setOpen] = useState<string | null>(null), [err, setErr] = useState('')
  const load = useCallback(() => api<Inbox>(`/api/sales/quotations?${new URLSearchParams({ status, assigned: mine ? 'me' : '' })}`).then((d) => { setData(d); setErr('') }).catch((e) => setErr(e.message)), [status, mine])
  useEffect(() => { load() }, [load, open])
  if (open) return <Detail id={open} team={data?.team ?? []} back={() => setOpen(null)} />
  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-3xl">Quotations</h1><p className="mt-2 text-sm text-silver">Leads from the configurators. A customer’s draft appears here once they share it or ask for a final quotation.</p></div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{(['revision_requested', 'shared', 'final', 'accepted'] as QuoteStatus[]).map((s) => <div key={s} className={card}><div className="text-xs uppercase tracking-[0.14em] text-silver">{statusText(s)}</div><div className="mt-1 font-display text-3xl tabular-nums">{data?.summary[s]?.count ?? 0}</div><div className="text-xs text-slate">{money(data?.summary[s]?.value ?? 0)}</div></div>)}</div>
      <div className="flex flex-wrap items-center gap-3">
        <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} className={`${field} !w-auto`}><option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{statusText(s)}</option>)}</select>
        <label className="flex items-center gap-2 text-sm text-silver"><input type="checkbox" className="h-4 w-4 accent-cyan" checked={mine} onChange={(e) => setMine(e.target.checked)} />Assigned to me</label>
      </div>
      {err && <p role="alert" className="text-red-400">{err}</p>}
      {!data && !err && <Loader2 className="animate-spin text-cyan" />}
      {data?.items.length === 0 && <p className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-silver">No quotations match.</p>}
      <ul className="space-y-3">{data?.items.map((q) => <li key={q.id}><button onClick={() => setOpen(q.id)} className={`${card} flex w-full flex-wrap items-center gap-x-4 gap-y-2 text-left hover:border-cyan/50`}>
        <StatusPill s={q.status} />{q.needsApproval && <span className="rounded-full bg-amber-300 px-2 py-0.5 text-xs font-medium text-midnight">Discount approval</span>}
        <span className="font-display">{q.name}</span><span className="text-sm text-silver">{q.owner?.name}{q.owner?.company ? ` · ${q.owner.company}` : ''}</span><span className="text-xs text-slate">{q.ref} · {q.kind}</span>
        <span className="ml-auto tabular-nums text-cyan">{money(q.total)}</span><span className="text-xs text-slate">{q.assignedTo || 'Unassigned'} · {day(q.updatedAt)}</span></button></li>)}</ul>
    </div>
  )
}

function Detail({ id, team, back }: { id: string; team: Inbox['team']; back: () => void }) {
  const { user } = useAuth()
  const [q, setQ] = useState<Quote | null>(null), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const [pct, setPct] = useState(''), [qty, setQty] = useState<Record<string, number>>({}), [note, setNote] = useState(''), [survey, setSurvey] = useState('')
  const url = `/api/sales/quotations/${id}`
  const apply = (item: Quote) => { setQ(item); setPct(String(item.discount?.approval === 'pending' ? item.discount.pct : item.pricing.totals?.discountPct ?? 0)); setQty({}); setNote(item.staffNote ?? '') }
  const load = useCallback(() => api<{ item: Quote }>(url).then((d) => apply(d.item)).catch((e) => setErr(e.message)), [url])
  useEffect(() => { load() }, [load])
  const send = async (path: string, body: unknown = {}, method = 'POST') => {
    setBusy(true); setErr('')
    try { apply((await api<{ item: Quote }>(url + path, { method, body })).item) } catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }
  if (!q) return err ? <p role="alert" className="text-red-400">{err}</p> : <Loader2 className="animate-spin text-cyan" />
  const adjustable = ['draft', 'shared', 'revision_requested', 'reviewed'].includes(q.status)
  const pending = q.discount?.approval === 'pending'
  return (
    <div className="space-y-6">
      <button onClick={back} className="no-print inline-flex items-center gap-2 text-sm text-silver hover:text-cyan"><ArrowLeft size={15} />All quotations</button>
      <div className="flex flex-wrap items-center gap-3"><h1 className="font-display text-3xl">{q.name}</h1><StatusPill s={q.status} /><span className="text-sm text-slate">{q.ref} · v{q.version} · {q.segment} price list</span></div>
      <p className="text-sm text-silver">{q.owner?.name} · <a className="text-cyan hover:underline" href={`mailto:${q.owner?.email}`}>{q.owner?.email}</a>{q.owner?.phone && <> · <a className="text-cyan hover:underline" href={`tel:${q.owner.phone.replace(/\s/g, '')}`}>{q.owner.phone}</a></>}{q.owner?.company && ` · ${q.owner.company}`}</p>
      {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
      {pending && <div className="no-print flex flex-wrap items-center gap-3 rounded-xl border border-amber-300/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">{q.discount?.requestedBy} requested a {q.discount?.pct}% discount. It is not applied until an admin approves.
        {user?.role === 'admin' && <><button className={small} disabled={busy} onClick={() => send('/discount-decision', { approve: true })}>Approve</button><button className={small} disabled={busy} onClick={() => send('/discount-decision', { approve: false })}>Decline</button></>}</div>}
      <div className={`${card} no-print grid gap-4 lg:grid-cols-3`}>
        <Field name="Assigned to"><select className={field} value={q.assignedTo ?? ''} disabled={busy} onChange={(e) => send('', { assignedTo: e.target.value }, 'PATCH')}><option value="">Unassigned</option>{team.map((u) => <option key={u.email} value={u.email}>{u.name} ({u.role})</option>)}</select></Field>
        <div className="lg:col-span-2"><Field name="Internal note (never shown to the customer)"><div className="flex gap-2"><input className={field} maxLength={3000} value={note} onChange={(e) => setNote(e.target.value)} /><button className={small} disabled={busy || note === (q.staffNote ?? '')} onClick={() => send('', { staffNote: note }, 'PATCH')}>Save</button></div></Field></div>
        {adjustable && <><Field name="Discount %"><input type="number" min={0} max={100} step={0.5} className={field} value={pct} onChange={(e) => setPct(e.target.value)} /></Field>
          <div className="flex items-end gap-2 lg:col-span-2"><button className={small} disabled={busy} onClick={() => send('/adjust', { discountPct: Number(pct), quantities: qty })}>Apply discount and quantity changes</button><span className="text-xs text-slate">Edit quantities in the table below (0 removes a line).</span></div></>}
        <div className="flex flex-wrap items-center gap-2 lg:col-span-3">
          {['draft', 'shared', 'revision_requested'].includes(q.status) && <button className="btn btn-primary !py-2" disabled={busy} onClick={() => send('/review')}>Mark as TAC reviewed</button>}
          {q.status === 'reviewed' && <button className="btn btn-primary !py-2" disabled={busy || pending} onClick={() => confirm(`Issue the final quotation for ${money(q.total)}?`) && send('/finalize')}>Issue final quotation</button>}
          {q.status === 'accepted' && <><input aria-label="Survey date" type="date" className={`${field} !w-auto`} value={survey} onChange={(e) => setSurvey(e.target.value)} /><button className="btn btn-primary !py-2" disabled={busy || !survey} onClick={() => send('/survey', { date: survey })}>Schedule site survey</button></>}
          <button className={small} onClick={() => window.print()}><Printer size={14} className="mr-1.5 inline" />Print / PDF</button>
          <button className={small} onClick={() => downloadXlsx(q)}><Download size={14} className="mr-1.5 inline" />BOQ (Excel)</button>
          <a className={small} href={`/proposal/${q.id}?staff=1`} target="_blank" rel="noopener">Proposal (PDF)</a>
          <button className={small} onClick={() => downloadBoq(q.ref, q.pricing)}><Download size={14} className="mr-1.5 inline" />BOQ (CSV)</button>
        </div>
      </div>
      <QuoteDocument q={q} edit={adjustable ? { values: qty, set: (k, n) => setQty((x) => ({ ...x, [k]: n })) } : undefined} />
      <Comments items={q.comments} onSend={(text) => send('/comments', { text })} />
      <Versions q={q} />
    </div>
  )
}

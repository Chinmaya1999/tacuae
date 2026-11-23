import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { Check, ClipboardList, Loader2, LogOut, Plus, Save, Send, Sparkles, Trash2, Undo2 } from 'lucide-react'
import { homeFor, useAuth } from '../lib/auth'
import { api } from '../lib/api'
import { aed, emptyDesign, propertyTypes, statusLabel, statusStyle, type Design } from '../data/catalog'
import Designer from '../components/studio/Designer'
import Studio3D from '../components/studio3d/Studio3D'
import CostPanel from '../components/studio/CostPanel'

const inputCls = 'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate focus:border-cyan'
const fmt = (s?: string) => (s ? new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '')
export const Badge = ({ s }: { s: string }) => <span className={`rounded-full border px-3 py-1 text-xs ${statusStyle[s]}`}>{statusLabel[s] ?? s}</span>

export default function Dashboard() {
  const { user, loading, logout } = useAuth()
  useEffect(() => {
    document.title = 'My dashboard | TAC UAE'
    const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex, nofollow'; document.head.appendChild(m)
    return () => m.remove()
  }, [])
  if (loading) return <div className="grid min-h-screen place-items-center bg-midnight"><Loader2 className="animate-spin text-cyan" /></div>
  if (!user) return <Navigate to="/login?next=/dashboard" replace />
  if (user.role === 'admin') return <Navigate to={homeFor('admin')} replace />
  const builder = user.role === 'builder'
  return (
    <div className="min-h-screen bg-midnight text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-deep/90 backdrop-blur">
        <div className="container-x flex items-center justify-between py-3">
          <Link to="/dashboard" className="flex items-center gap-3"><img src="/images/site/logo-dark.png" alt="TAC" className="h-9 w-auto" />
            <span className="hidden rounded-full border border-cyan/40 px-3 py-1 text-xs uppercase tracking-wider text-cyan sm:inline">{builder ? 'Builder' : 'Customer'}</span></Link>
          <div className="flex items-center gap-5 text-sm"><span className="hidden text-silver sm:inline">{user.name}</span>
            <a href="/" className="text-silver hover:text-cyan">Website</a>
            <button onClick={() => logout()} className="flex items-center gap-2 text-silver hover:text-cyan"><LogOut size={16} />Sign out</button></div>
        </div>
      </header>
      <main className="container-x py-8">
        <Routes>
          <Route index element={<List builder={builder} name={user.name} />} />
          <Route path="design/:id" element={<Studio builder={builder} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function List({ builder, name }: { builder: boolean; name: string }) {
  const [items, setItems] = useState<Design[] | null>(null), [err, setErr] = useState(''), [q, setQ] = useState('')
  const load = useCallback(() => api<{ items: Design[] }>('/api/designs').then((d) => setItems(d.items)).catch((e) => setErr(e.message)), [])
  useEffect(() => { load() }, [load])
  const del = async (d: Design) => { if (!confirm(`Delete “${d.name}”?`)) return; await api(`/api/designs/${d.id}`, { method: 'DELETE' }).then(load).catch((e) => alert(e.message)) }
  const shown = useMemo(() => (items ?? []).filter((d) => !q || [d.name, d.clientName, d.siteAddress].join(' ').toLowerCase().includes(q.toLowerCase())), [items, q])
  const quoted = (items ?? []).filter((d) => d.status === 'quoted').length
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">{builder ? 'Builder dashboard' : 'Customer dashboard'}</p>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl">Hello, {name.split(' ')[0]}</h1>
          <p className="mt-2 max-w-xl text-silver">{builder ? 'Design smart homes for your clients, send them to TAC and receive a quotation per project.' : 'Build your dream smart home room by room, then send it to TAC for a quotation.'}</p></div>
        <Link to="/dashboard/design/new" className="btn btn-primary"><Plus size={18} />New design</Link>
      </div>

      <ol className="grid gap-3 sm:grid-cols-3">
        {[['1', 'Design', 'Place lights, AC, curtains, security and more in a virtual room.'], ['2', 'Send to TAC', 'Our engineers review exactly what you picked.'], ['3', 'Get your quote', 'Price appears here. Accept it or ask for changes.']].map(([n, t, d]) => (
          <li key={n} className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><span className="grid h-7 w-7 place-items-center rounded-full bg-cyan/15 text-sm text-cyan">{n}</span><div className="mt-3 font-display">{t}</div><p className="mt-1 text-sm text-silver">{d}</p></li>))}
      </ol>
      {quoted > 0 && <p role="status" className="rounded-xl border border-cyan/40 bg-cyan/10 px-4 py-3 text-sm text-cyan"><Sparkles size={15} className="mr-2 inline" />You have {quoted} quotation{quoted > 1 ? 's' : ''} waiting for your decision.</p>}

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-xl">{builder ? 'Client projects' : 'My designs'}</h2>
          {(items?.length ?? 0) > 4 && <input aria-label="Search designs" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className={`${inputCls} !w-60 !py-2`} />}</div>
        {err && <p role="alert" className="text-red-400">{err}</p>}
        {!items && !err && <Loader2 className="animate-spin text-cyan" />}
        {items && items.length === 0 && (
          <div className="rounded-3xl border border-dashed border-white/20 p-12 text-center"><ClipboardList className="mx-auto mb-3 text-slate" /><p className="text-silver">No designs yet.</p><Link to="/dashboard/design/new" className="btn btn-primary mt-5">Start your first design</Link></div>)}
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((d) => (
            <li key={d.id} className="flex flex-col rounded-2xl border border-white/10 bg-white/[.03] p-5">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-display text-lg">{d.name}</h3>
                {builder && (d.clientName || d.siteAddress) && <p className="truncate text-sm text-silver">{[d.clientName, d.siteAddress].filter(Boolean).join(' · ')}</p>}</div><Badge s={d.status!} /></div>
              <p className="mt-3 text-sm text-slate">{d.rooms.length} room{d.rooms.length !== 1 && 's'} · {d.deviceCount} smart item{d.deviceCount !== 1 && 's'} · updated {fmt(d.updatedAt)}</p>
              {d.quote ? <p className="mt-3 rounded-xl bg-cyan/10 px-4 py-3 font-display text-xl text-cyan">{aed(d.quote.amount)}</p> : d.estimate && d.estimate.total > 0 && <p className="mt-3 text-sm text-silver">Estimate <span className="font-display text-white">{aed(d.estimate.total)}</span></p>}
              <div className="mt-auto flex items-center gap-4 pt-5 text-sm"><Link to={`/dashboard/design/${d.id}`} className="btn btn-ghost !px-5 !py-2">{d.status === 'draft' ? 'Continue' : 'Open'}</Link>
                {(d.status === 'draft' || d.status === 'rejected' || d.status === 'quoted') && <button onClick={() => del(d)} className="ml-auto text-slate hover:text-red-300" aria-label={`Delete ${d.name}`}><Trash2 size={16} /></button>}</div>
            </li>))}
        </ul>
      </section>
    </div>
  )
}

function Studio({ builder }: { builder: boolean }) {
  const { id } = useParams(), nav = useNavigate()
  const [view, setView] = useState<'3d' | '2d'>('3d'), [d, setD] = useState<Design | null>(null), [dirty, setDirty] = useState(false), [busy, setBusy] = useState(''), [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)
  useEffect(() => {
    if (id === 'new') { setD(emptyDesign()); return }
    api<{ item: Design }>(`/api/designs/${id}`).then((r) => setD(r.item)).catch(() => nav('/dashboard', { replace: true }))
  }, [id, nav])
  useEffect(() => { // warn before losing unsaved work
    if (!dirty) return
    const f = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', f); return () => window.removeEventListener('beforeunload', f)
  }, [dirty])
  if (!d) return <Loader2 className="animate-spin text-cyan" />
  const locked = d.status !== undefined && d.status !== 'draft'
  const change = (n: Design) => { setD(n); setDirty(true); setMsg(null) }
  const field = (k: 'name' | 'clientName' | 'siteAddress' | 'notes') => ({ value: d[k], disabled: locked, onChange: (e: { target: { value: string } }) => change({ ...d, [k]: e.target.value }) })

  const run = async (label: string, fn: () => Promise<Design | void>, okText: string) => {
    setBusy(label); setMsg(null)
    try { const r = await fn(); if (r) { setD(r); if (id === 'new' && r.id) nav(`/dashboard/design/${r.id}`, { replace: true }) } setDirty(false); setMsg({ ok: true, t: okText }) } catch (e) { setMsg({ ok: false, t: (e as Error).message }) } finally { setBusy('') }
  }
  const persist = async (): Promise<Design> => {
    const body = { name: d.name, property: d.property, clientName: d.clientName, siteAddress: d.siteAddress, notes: d.notes, rooms: d.rooms }
    if (d.id) return (await api<{ item: Design }>(`/api/designs/${d.id}`, { method: 'PUT', body })).item
    return (await api<{ item: Design }>('/api/designs', { method: 'POST', body })).item
  }
  const post = async (action: string, body?: unknown) => (await api<{ item: Design }>(`/api/designs/${d.id}/${action}`, { method: 'POST', body })).item
  const total = d.rooms.reduce((n, r) => n + r.devices.length, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Link to="/dashboard" className="text-sm text-silver hover:text-cyan">← All designs</Link>
          <div className="mt-2 flex flex-wrap items-center gap-3"><h1 className="font-display text-2xl sm:text-3xl">Design studio</h1>{d.status && <Badge s={d.status} />}{dirty && <span className="text-xs text-amber-300">Unsaved changes</span>}</div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {!locked && <>
            <button disabled={!!busy || !dirty && !!d.id} onClick={() => run('save', persist, 'Saved as draft.')} className="btn btn-ghost disabled:opacity-50">{busy === 'save' ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}Save</button>
            <button disabled={!!busy || total === 0} onClick={() => run('send', async () => { const s = await persist(); return (await api<{ item: Design }>(`/api/designs/${s.id}/submit`, { method: 'POST' })).item }, 'Sent to TAC! We will review and send you a quotation here.')} className="btn btn-primary disabled:opacity-50">{busy === 'send' ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}Send to TAC for quote</button></>}
          {locked && d.status !== 'accepted' && <button disabled={!!busy} onClick={() => run('withdraw', () => post('withdraw'), 'Moved back to drafts — you can edit it now.')} className="btn btn-ghost"><Undo2 size={16} />{d.status === 'submitted' ? 'Withdraw to edit' : 'Edit design'}</button>}
        </div>
      </div>
      {msg && <p role="alert" className={`fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border px-4 py-3 text-sm shadow-2xl ${msg.ok ? 'border-emerald-300/40 bg-[#0c2a22] text-emerald-300' : 'border-red-400/40 bg-[#2a1216] text-red-300'}`}>{msg.ok && <Check size={15} className="mr-2 inline" />}{msg.t}</p>}

      {d.quote && (
        <div className="rounded-3xl border border-cyan/40 bg-gradient-to-br from-cyan/10 to-transparent p-6">
          <p className="eyebrow">Quotation from TAC</p>
          <div className="mt-3 font-display text-4xl text-cyan">{aed(d.quote.amount)}</div>
          {d.quote.note && <p className="mt-3 max-w-2xl whitespace-pre-wrap text-silver">{d.quote.note}</p>}
          <p className="mt-2 text-xs text-slate">Issued {fmt(d.quote.at)}</p>
          {d.status === 'quoted' && <div className="mt-5 flex flex-wrap gap-3">
            <button disabled={!!busy} onClick={() => run('acc', () => post('respond', { accept: true }), 'Quotation accepted. TAC will contact you to proceed.')} className="btn btn-primary"><Check size={16} />Accept quotation</button>
            <button disabled={!!busy} onClick={() => run('dec', () => post('respond', { accept: false }), 'Quotation declined. You can edit the design and send it again.')} className="btn btn-ghost">Decline</button></div>}
        </div>)}
      {d.status === 'submitted' && <p className="rounded-xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">Your design is with the TAC team. You will see the price here once it is ready.</p>}

      <div className={`grid gap-4 ${builder ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        <Field label="Design name"><input maxLength={100} className={inputCls} {...field('name')} /></Field>
        {builder && <Field label="Client name"><input maxLength={120} className={inputCls} {...field('clientName')} /></Field>}
        {builder && <Field label="Project / site address"><input maxLength={200} className={inputCls} {...field('siteAddress')} /></Field>}
        {!builder && <Field label="Notes for TAC (optional)"><input maxLength={3000} placeholder="Budget, timeline, preferences…" className={inputCls} {...field('notes')} /></Field>}
      </div>
      {builder && <Field label="Notes for TAC (optional)"><textarea rows={2} maxLength={3000} placeholder="Unit count, handover date, preferences…" className={inputCls} {...field('notes')} /></Field>}

      <Field label="Property type"><select disabled={locked} value={d.property ?? 'apartment'} onChange={(e) => change({ ...d, property: e.target.value as Design['property'] })} className={inputCls}>{propertyTypes.map((p) => <option key={p.id} value={p.id} className="bg-deep">{p.label}</option>)}</select></Field>
      <div className="flex items-center gap-2" role="group" aria-label="Designer view">
        {([['3d', '3D studio'], ['2d', 'Quick 2D plan']] as const).map(([v, l]) => <button key={v} onClick={() => setView(v)} aria-pressed={view === v} className={`rounded-full border px-4 py-2 text-sm ${view === v ? 'border-cyan bg-cyan/15 text-cyan' : 'border-white/15 text-silver'}`}>{l}</button>)}
      </div>
      {view === '3d' ? <Studio3D design={d} onChange={change} readOnly={locked} /> : <Designer design={d} onChange={change} readOnly={locked} />}
      {locked && d.estimate && <div className="max-w-md"><CostPanel e={d.estimate} /></div>}
    </div>
  )
}
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (<div><label className="mb-2 block text-xs uppercase tracking-[0.15em] text-silver">{label}{children}</label></div>)

import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check, ChevronDown, Info, Loader2, Save, Send, Undo2, X } from 'lucide-react'
import { api } from '../../lib/api'
import { aed, emptyDesign, propertyTypes, type Design } from '../../data/catalog'
import { designFor } from '../../data/templates'
import Designer from '../../components/studio/Designer'
import Studio3D from '../../components/studio3d/Studio3D'
import { Badge, fmtDate } from '../../components/dashboard/ui'
import { useDesigns } from './useDesigns'
import SendDialog from './SendDialog'

const field = 'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate focus:border-cyan disabled:opacity-60'
const TIPS_KEY = 'tac-studio-tips'
const tipsSeen = () => { try { return localStorage.getItem(TIPS_KEY) === '1' } catch { return false } }
const body = (d: Design) => ({ name: d.name, property: d.property, clientName: d.clientName, siteAddress: d.siteAddress, notes: d.notes, rooms: d.rooms })

export default function Studio({ builder }: { builder: boolean }) {
  const { id } = useParams(), nav = useNavigate(), [params] = useSearchParams(), { reload } = useDesigns()
  const [d, setD] = useState<Design | null>(null), [dirty, setDirty] = useState(false), [view, setView] = useState<'3d' | '2d'>('3d')
  const [save, setSave] = useState<{ s: 'idle' | 'saving' | 'saved'; at?: string }>({ s: 'idle' }), [busy, setBusy] = useState('')
  const [toast, setToast] = useState<{ ok: boolean; t: string } | null>(null), [details, setDetails] = useState(false), [sending, setSending] = useState(false), [tips, setTips] = useState(!tipsSeen())
  const ver = useRef(0)

  useEffect(() => { document.title = 'Design studio | TAC UAE' }, [])
  useEffect(() => {
    if (id === 'new') { setD(designFor(params) ?? emptyDesign()); setDirty(false); setDetails(builder); return }
    if (d?.id === id) return // we just created it: keep local state
    api<{ item: Design }>(`/api/designs/${id}`).then((r) => setD(r.item)).catch(() => nav('/dashboard', { replace: true }))
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (toast?.ok) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t) } }, [toast])
  useEffect(() => {
    if (!dirty) return
    const f = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', f); return () => window.removeEventListener('beforeunload', f)
  }, [dirty])

  const locked = !!d?.status && d.status !== 'draft'
  const change = useCallback((n: Design) => { ver.current++; setD(n); setDirty(true); setToast(null) }, [])
  const create = async (x: Design) => (await api<{ item: Design }>('/api/designs', { method: 'POST', body: body(x) })).item
  const update = async (x: Design) => (await api<{ item: Design }>(`/api/designs/${x.id}`, { method: 'PUT', body: body(x) })).item

  // Auto-save: existing drafts are saved 2.5 s after the last change. A new design is created by the first manual Save.
  useEffect(() => {
    if (!dirty || !d?.id || locked) return
    const v = ver.current, snapshot = d
    const t = setTimeout(async () => {
      setSave({ s: 'saving' })
      try {
        const s = await update(snapshot)
        setD((cur) => (cur ? { ...cur, estimate: s.estimate, updatedAt: s.updatedAt } : cur)) // never overwrite newer local edits
        if (ver.current === v) setDirty(false)
        setSave({ s: 'saved', at: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) })
      } catch { setSave({ s: 'idle' }); setToast({ ok: false, t: 'Auto-save failed. Check your connection and press Save.' }) }
    }, 2500)
    return () => clearTimeout(t)
  }, [d, dirty, locked]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!d) return <div className="grid min-h-screen place-items-center bg-midnight"><Loader2 className="animate-spin text-cyan" /></div>

  const total = d.rooms.reduce((n, r) => n + r.devices.length, 0)
  const afterCreate = (s: Design) => { if (id === 'new') nav(`/dashboard/design/${s.id}`, { replace: true }) }
  const saveNow = async () => {
    setBusy('save'); setSave({ s: 'saving' })
    try {
      const v = ver.current, s = d.id ? await update(d) : await create(d)
      setD((cur) => (cur ? { ...cur, id: s.id, estimate: s.estimate, updatedAt: s.updatedAt, status: s.status } : cur))
      if (ver.current === v) setDirty(false)
      setSave({ s: 'saved', at: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) }); setToast({ ok: true, t: 'Saved.' }); afterCreate(s); reload()
    } catch (e) { setSave({ s: 'idle' }); setToast({ ok: false, t: (e as Error).message }) } finally { setBusy('') }
  }
  const sendToTac = async (notes: string) => {
    const saved = d.id ? await update({ ...d, notes }) : await create({ ...d, notes })
    const r = await api<{ item: Design }>(`/api/designs/${saved.id}/submit`, { method: 'POST' })
    setD(r.item); setDirty(false); await reload(); afterCreate(r.item)
  }
  const act = async (label: string, action: string, payload?: unknown, ok?: string) => {
    setBusy(label)
    try { const r = await api<{ item: Design }>(`/api/designs/${d.id}/${action}`, { method: 'POST', body: payload }); setD(r.item); setToast({ ok: true, t: ok ?? 'Done.' }); reload() } catch (e) { setToast({ ok: false, t: (e as Error).message }) } finally { setBusy('') }
  }
  const status = dirty ? (d.id ? 'Unsaved changes' : 'Not saved yet') : save.s === 'saving' ? 'Saving…' : save.s === 'saved' ? `Saved ${save.at}` : d.id ? 'All changes saved' : ''
  const set = (k: 'name' | 'clientName' | 'siteAddress' | 'notes') => ({ value: d[k], disabled: locked, onChange: (e: { target: { value: string } }) => change({ ...d, [k]: e.target.value }) })

  return (
    <div className="min-h-screen bg-midnight text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-deep/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1700px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 lg:px-6">
          <Link to="/dashboard" aria-label="Back to dashboard" className="rounded-full p-2 text-silver hover:bg-white/5 hover:text-cyan"><ArrowLeft size={20} /></Link>
          <div className="min-w-0 flex-1 basis-52">
            <input aria-label="Design name" maxLength={100} {...set('name')} className="w-full truncate rounded-md bg-transparent px-1 font-display text-lg outline-none ring-cyan/60 focus:ring-1 sm:text-xl" />
            <div className="flex items-center gap-2 px-1 text-xs text-slate">{d.status && <Badge s={d.status} />}<span role="status" className={dirty ? 'text-amber-300' : ''}>{status}</span></div>
          </div>
          <button onClick={() => setDetails(!details)} aria-expanded={details} className="flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-sm text-silver hover:text-white">Details<ChevronDown size={15} className={`transition ${details ? 'rotate-180' : ''}`} /></button>
          <div className="flex rounded-full border border-white/15 p-0.5" role="group" aria-label="Designer view">{([['3d', '3D'], ['2d', '2D']] as const).map(([v, l]) => <button key={v} onClick={() => setView(v)} aria-pressed={view === v} className={`rounded-full px-3.5 py-1.5 text-sm ${view === v ? 'bg-cyan/20 text-cyan' : 'text-silver'}`}>{l}</button>)}</div>
          {!locked && <>
            <button onClick={saveNow} disabled={!!busy || (!dirty && !!d.id)} className="btn btn-ghost !px-5 !py-2.5 disabled:opacity-50">{busy === 'save' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}Save</button>
            <button onClick={() => setSending(true)} disabled={total === 0} title={total === 0 ? 'Add at least one smart device first' : undefined} className="btn btn-primary !px-5 !py-2.5 disabled:opacity-50"><Send size={16} />Review &amp; send</button></>}
          {locked && d.status !== 'accepted' && <button disabled={!!busy} onClick={() => act('withdraw', 'withdraw', undefined, 'Moved back to drafts — you can edit now.')} className="btn btn-ghost !px-5 !py-2.5"><Undo2 size={16} />{d.status === 'submitted' ? 'Withdraw to edit' : 'Edit design'}</button>}
        </div>
      </header>

      <main className="mx-auto max-w-[1700px] space-y-4 px-4 py-5 lg:px-6">
        {d.quote && (
          <section aria-label="Quotation" className="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-3xl border border-cyan/40 bg-gradient-to-br from-cyan/10 to-transparent p-5 sm:p-6">
            <div><p className="eyebrow">Quotation from TAC</p><div className="mt-2 font-display text-4xl text-cyan">{aed(d.quote.amount)}</div><p className="mt-1 text-xs text-slate">Issued {fmtDate(d.quote.at)} · incl. installation &amp; VAT unless stated</p></div>
            {d.quote.note && <p className="min-w-[200px] flex-1 whitespace-pre-wrap text-silver">{d.quote.note}</p>}
            {d.status === 'quoted' && <div className="flex flex-wrap gap-3"><button disabled={!!busy} onClick={() => act('acc', 'respond', { accept: true }, 'Quotation accepted. TAC will contact you to proceed.')} className="btn btn-primary"><Check size={16} />Accept quotation</button><button disabled={!!busy} onClick={() => act('dec', 'respond', { accept: false }, 'Quotation declined. You can edit the design and send it again.')} className="btn btn-ghost">Decline</button></div>}
            {d.status === 'accepted' && <p className="font-display text-emerald-300">✓ Accepted — TAC will be in touch.</p>}
          </section>)}
        {d.status === 'submitted' && <p className="rounded-xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">Your design is with the TAC team. The price will appear here once it is ready — you can still look around your rooms.</p>}

        {details && (
          <section aria-label="Project details" className="grid gap-4 rounded-2xl border border-white/10 bg-white/[.03] p-5 md:grid-cols-2 xl:grid-cols-4">
            <label className="block text-xs uppercase tracking-[0.15em] text-silver">Property type<select disabled={locked} value={d.property ?? 'apartment'} onChange={(e) => change({ ...d, property: e.target.value as Design['property'] })} className={`${field} mt-2`}>{propertyTypes.map((p) => <option key={p.id} value={p.id} className="bg-deep">{p.label}</option>)}</select></label>
            {builder && <label className="block text-xs uppercase tracking-[0.15em] text-silver">Client name<input maxLength={120} className={`${field} mt-2`} {...set('clientName')} /></label>}
            {builder && <label className="block text-xs uppercase tracking-[0.15em] text-silver">Project / site address<input maxLength={200} className={`${field} mt-2`} {...set('siteAddress')} /></label>}
            <label className="block text-xs uppercase tracking-[0.15em] text-silver md:col-span-2">Notes for TAC<input maxLength={3000} placeholder="Budget, timeline, preferences…" className={`${field} mt-2`} {...set('notes')} /></label>
          </section>)}

        {tips && !locked && view === '3d' && (
          <aside className="flex items-start gap-3 rounded-2xl border border-cyan/25 bg-cyan/[.06] p-4 text-sm" aria-label="Tips">
            <Info size={18} className="mt-0.5 shrink-0 text-cyan" />
            <ol className="flex-1 list-inside list-decimal space-y-0.5 text-silver"><li><b className="text-white">Add</b> a device or furniture from the left.</li><li><b className="text-white">Click</b> a device in the room to switch it on, <b className="text-white">drag</b> to move it.</li><li>Try the <b className="text-white">scenes</b> under the room, then <b className="text-white">Review &amp; send</b>.</li></ol>
            <button onClick={() => { setTips(false); try { localStorage.setItem(TIPS_KEY, '1') } catch { /* private mode */ } }} aria-label="Dismiss tips" className="rounded-full p-1 text-slate hover:text-white"><X size={16} /></button>
          </aside>)}

        {view === '3d' ? <Studio3D design={d} onChange={change} readOnly={locked} /> : <Designer design={d} onChange={change} readOnly={locked} />}
      </main>

      {toast && <p role="alert" className={`fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border px-4 py-3 text-sm shadow-2xl ${toast.ok ? 'border-emerald-300/40 bg-[#0c2a22] text-emerald-300' : 'border-red-400/40 bg-[#2a1216] text-red-300'}`}>{toast.t}</p>}
      {sending && <SendDialog design={d} builder={builder} onClose={() => setSending(false)} onSend={sendToTac} />}
    </div>
  )
}

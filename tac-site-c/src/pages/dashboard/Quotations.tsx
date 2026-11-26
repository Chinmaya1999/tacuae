// Owner's quotations: list, detail, secure sharing, versions and the customer's actions.
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Copy, Download, Loader2, Mail, MessageCircle, Pencil, Printer, Share2, Trash2 } from 'lucide-react'
import { api } from '../../lib/api'
import { day, downloadBoq, money, type Quote } from '../../lib/quote'
import { useDemo } from '../../lib/demo'
import { downloadXlsx } from '../../lib/xlsx'
import SmartScore from '../../components/demo/SmartScore'
import { Comments, QuoteDocument, StatusPill, card, field, small } from '../../components/quote/ui'

export function QuotationList({ builder }: { builder: boolean }) {
  const [items, setItems] = useState<Quote[] | null>(null), [err, setErr] = useState('')
  useEffect(() => { api<{ items: Quote[] }>('/api/quotations').then((d) => setItems(d.items)).catch((e) => setErr(e.message)) }, [])
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-3xl">Quotations</h1>
        <div className="flex flex-wrap gap-2">{builder && <Link to="/project-quote" className="btn btn-primary !py-2.5">New project quote</Link>}<Link to="/design-my-home" className={`btn !py-2.5 ${builder ? 'btn-ghost' : 'btn-primary'}`}>Design a smart home</Link></div></div>
      {err && <p role="alert" className="text-red-400">{err}</p>}
      {!items && !err && <Loader2 className="animate-spin text-cyan" />}
      {items?.length === 0 && <p className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-silver">No quotations yet. Configure a home or project to create your first one.</p>}
      <ul className="space-y-3">{items?.map((q) => (
        <li key={q.id}><Link to={`/dashboard/quotations/${q.id}`} className={`${card} flex flex-wrap items-center gap-x-4 gap-y-2 hover:border-cyan/50`}>
          <StatusPill s={q.status} /><span className="font-display text-lg">{q.name}</span><span className="text-xs text-slate">{q.ref} · v{q.version} · {q.kind === 'project' ? 'Project' : 'Home'}</span>
          <span className="ml-auto tabular-nums text-cyan">{money(q.total)}</span><span className="w-full text-xs text-slate sm:w-auto">{day(q.updatedAt)}</span></Link></li>))}</ul>
    </div>
  )
}

export function QuotationDetail() {
  const { id } = useParams(), nav = useNavigate()
  const [q, setQ] = useState<Quote | null>(null), [err, setErr] = useState(''), [busy, setBusy] = useState(false), [link, setLink] = useState(''), [copied, setCopied] = useState(false), demo = useDemo()
  const url = `/api/quotations/${id}`
  const load = useCallback(() => api<{ item: Quote }>(url).then((d) => setQ(d.item)).catch((e) => setErr(e.message)), [url])
  useEffect(() => { setQ(null); setLink(''); setErr(''); window.scrollTo(0, 0); load() }, [load]) // arriving from a long configurator page
  const run = async (fn: () => Promise<void>) => { setBusy(true); setErr(''); try { await fn() } catch (e) { setErr((e as Error).message); load() } finally { setBusy(false) } }
  const post = (path: string, body?: unknown) => run(async () => setQ((await api<{ item: Quote }>(url + path, { method: 'POST', body: body ?? {} })).item))

  if (!q) return err ? <p role="alert" className="text-red-400">{err}</p> : <Loader2 className="animate-spin text-cyan" />
  const editable = !['accepted', 'survey'].includes(q.status)
  const share = () => {
    if (q.shared && !confirm('Create a new link? The previous link will stop working.')) return
    run(async () => { const d = await api<{ path: string; item: Quote }>(`${url}/share`, { method: 'POST', body: {} }); setQ(d.item); setLink(location.origin + d.path); setCopied(false) })
  }
  const message = encodeURIComponent(`My Total Automation quotation ${q.ref}: ${link}`)
  return (
    <div className="space-y-6">
      <Link to="/dashboard/quotations" className="no-print inline-flex items-center gap-2 text-sm text-silver hover:text-cyan"><ArrowLeft size={15} />All quotations</Link>
      <div className="flex flex-wrap items-center gap-3"><h1 className="font-display text-3xl">{q.name}</h1><StatusPill s={q.status} /><span className="text-sm text-slate">{q.ref} · version {q.version}</span></div>
      <div className="no-print flex flex-wrap gap-2">
        {q.status === 'final' && !q.expired && <button className="btn btn-primary !py-2" disabled={busy} onClick={() => confirm(`Accept this final quotation for ${money(q.total)}?`) && post('/accept')}>Accept quotation</button>}
        {['draft', 'shared'].includes(q.status) && <button className="btn btn-primary !py-2" disabled={busy} onClick={() => post('/request-review')}>Request final quotation</button>}
        {['reviewed', 'final'].includes(q.status) && <button className={small} disabled={busy} onClick={() => { const text = prompt('What should TAC change?'); if (text !== null) post('/request-review', { text: text || 'Please reissue this quotation.' }) }}>{q.expired ? 'Ask TAC to reissue' : 'Request changes'}</button>}
        {editable && <Link className={small} to={`${q.kind === 'project' ? '/project-quote' : '/design-my-home'}?quote=${q.id}`}><Pencil size={14} className="mr-1.5 inline" />Edit configuration</Link>}
        {editable && <button className={small} disabled={busy} onClick={share}><Share2 size={14} className="mr-1.5 inline" />{q.shared ? 'New share link' : 'Share'}</button>}
        {q.shared && <button className={small} disabled={busy} onClick={() => run(async () => { setQ((await api<{ item: Quote }>(`${url}/share`, { method: 'DELETE' })).item); setLink('') })}>Turn link off</button>}
        <button className={small} disabled={busy} onClick={() => run(async () => nav(`/dashboard/quotations/${(await api<{ item: Quote }>(`${url}/duplicate`, { method: 'POST', body: {} })).item.id}`))}><Copy size={14} className="mr-1.5 inline" />Duplicate</button>
        <button className={small} onClick={() => window.print()}><Printer size={14} className="mr-1.5 inline" />Print / save PDF</button>
        <button className={small} onClick={() => downloadXlsx(q)}><Download size={14} className="mr-1.5 inline" />BOQ (Excel)</button>
        <button className={small} onClick={() => downloadBoq(q.ref, q.pricing)}><Download size={14} className="mr-1.5 inline" />BOQ (CSV)</button>
        <Link className={small} to={`/proposal/${q.id}`} target="_blank">Branded proposal (PDF)</Link>
        {demo && ['accepted', 'survey'].includes(q.status) && !q.deposit && <button className="btn btn-primary !py-2" disabled={busy} onClick={() => confirm('DEMO PAYMENT: no card is needed and no money moves. Record a simulated deposit?') && post('/demo-deposit')}>Pay deposit (demo)</button>}
        {q.status === 'draft' && <button className={small} disabled={busy} onClick={() => confirm('Delete this draft quotation?') && run(async () => { await api(url, { method: 'DELETE' }); nav('/dashboard/quotations') })}><Trash2 size={14} className="mr-1.5 inline" />Delete</button>}
      </div>
      {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
      {link && <div className={`${card} no-print space-y-3`}>
        <p className="text-sm text-silver">Anyone with this link can view and comment (not edit) for 30 days. Copy it now — it is not shown again.</p>
        <input readOnly aria-label="Share link" value={link} onFocus={(e) => e.target.select()} className={field} />
        <div className="flex flex-wrap gap-2">
          <button className={small} onClick={() => navigator.clipboard?.writeText(link).then(() => setCopied(true))}><Copy size={14} className="mr-1.5 inline" />{copied ? 'Copied' : 'Copy link'}</button>
          <a className={small} href={`https://wa.me/?text=${message}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={14} className="mr-1.5 inline" />WhatsApp</a>
          <a className={small} href={`mailto:?subject=${encodeURIComponent(`Quotation ${q.ref}`)}&body=${message}`}><Mail size={14} className="mr-1.5 inline" />Email</a>
        </div>
      </div>}
      {q.deposit && <p role="status" className="rounded-xl border border-amber-300/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">Simulated deposit of {money(q.deposit.amount)} ({q.deposit.pct}%) recorded. No money was taken.</p>}
      <QuoteDocument q={q} />
      <div className="no-print max-w-md"><SmartScore smart={q.smart} /></div>
      <Comments items={q.comments} onSend={(text) => api<{ item: Quote }>(`${url}/comments`, { method: 'POST', body: { text } }).then((d) => setQ(d.item)).catch((e) => setErr(e.message))} />
      <Versions q={q} />
    </div>
  )
}

export function Versions({ q }: { q: Quote }) {
  const versions = q.versions ?? []
  const [other, setOther] = useState<number | null>(null)
  const now = versions.at(-1), old = versions.find((v) => v.version === other)
  const ids = old && now ? [...new Map([...old.lines, ...now.lines].map((l) => [l.productId, l.name]))] : []
  const qty = (v: NonNullable<typeof old>, id: string) => v.lines.find((l) => l.productId === id)?.qty ?? 0
  return (
    <section className={`${card} no-print`} aria-label="Version history">
      <h3 className="mb-3 text-xs uppercase tracking-[0.14em] text-silver">Version history</h3>
      <ul className="space-y-2 text-sm">{[...versions].reverse().map((v) => <li key={v.version} className="flex flex-wrap items-center gap-x-4 gap-y-1"><b>v{v.version}</b><span>{v.note}</span><span className="text-xs text-slate">{v.author} · {new Date(v.at).toLocaleString('en-GB')}</span><span className="ml-auto tabular-nums">{money(v.total)}</span>
        {v.version !== now?.version && <button className="text-cyan hover:underline" onClick={() => setOther(other === v.version ? null : v.version)}>{other === v.version ? 'Close' : 'Compare'}</button>}</li>)}</ul>
      {old && now && <table className="mt-4 w-full text-left text-sm"><thead className="text-xs uppercase tracking-wider text-slate"><tr><th className="py-1">Item</th><th className="text-right">v{old.version}</th><th className="text-right">v{now.version}</th></tr></thead>
        <tbody>{ids.map(([pid, name]) => <tr key={pid} className={`border-t border-white/10 ${qty(old, pid) !== qty(now, pid) ? 'text-amber-200' : 'text-silver'}`}><td className="py-1">{name}</td><td className="text-right tabular-nums">{qty(old, pid)}</td><td className="text-right tabular-nums">{qty(now, pid)}</td></tr>)}
          <tr className="border-t border-white/10 font-medium"><td className="py-1">Total</td><td className="text-right tabular-nums">{money(old.total)}</td><td className="text-right tabular-nums">{money(now.total)}</td></tr></tbody></table>}
    </section>
  )
}

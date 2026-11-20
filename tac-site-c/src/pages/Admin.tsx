import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { BarChart3, Check, Download, FileText, Inbox, KeyRound, Loader2, LogOut, Search, Trash2 } from 'lucide-react'
import { products, projects } from '../data/content'
import type { Overrides } from '../lib/useContent'

type Status = 'new' | 'contacted' | 'closed'
type Enquiry = { id: string; at: string; name: string; company: string; email: string; phone: string; service: string; projectType: string; message: string; status: Status; note: string }
type Stats = { total: number; new: number; contacted: number; closed: number; last7: number; daily: { date: string; count: number }[]; byService: { service: string; count: number }[]; mail: boolean }

async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const r = await fetch(`/api/admin${path}`, {
    method: opts.method ?? 'GET', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'tac-admin' },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  })
  const data = await r.json().catch(() => ({}))
  if (r.status === 401 && path !== '/login') window.dispatchEvent(new Event('tac-signout'))
  if (!r.ok) throw new Error(data.error || 'Request failed')
  return data
}

const STATUS_STYLE: Record<Status, string> = { new: 'bg-cyan/15 text-cyan border-cyan/40', contacted: 'bg-amber-400/10 text-amber-300 border-amber-300/40', closed: 'bg-white/5 text-silver border-white/20' }
const fmtDate = (s: string) => new Date(s).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const inputCls = 'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate focus:border-cyan'

export default function Admin() {
  const [auth, setAuth] = useState<'loading' | 'out' | 'in'>('loading')
  useEffect(() => {
    document.title = 'Admin | TAC UAE'
    let m = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    if (!m) { m = document.createElement('meta'); m.name = 'robots'; document.head.appendChild(m) }
    m.content = 'noindex, nofollow'
    api('/me').then(() => setAuth('in')).catch(() => setAuth('out'))
    const out = () => setAuth('out')
    window.addEventListener('tac-signout', out)
    return () => { window.removeEventListener('tac-signout', out); m?.remove() }
  }, [])
  return (
    <div className="min-h-screen bg-midnight text-white">
      {auth === 'loading' ? <div className="grid min-h-screen place-items-center"><Loader2 className="animate-spin text-cyan" /></div>
        : auth === 'out' ? <Login onDone={() => setAuth('in')} /> : <Dashboard onOut={() => setAuth('out')} />}
    </div>
  )
}

function Login({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('')
    try { await api('/login', { method: 'POST', body: { password: pw } }); onDone() } catch (x) { setErr((x as Error).message) } finally { setBusy(false) }
  }
  return (
    <div className="relative grid min-h-screen place-items-center px-5">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <form onSubmit={submit} className="glass relative w-full max-w-sm rounded-3xl border border-white/10 p-8">
        <img src="/images/site/logo-dark.png" alt="TAC" className="mb-6 h-10 w-auto" />
        <h1 className="font-display text-2xl">Admin dashboard</h1>
        <p className="mt-1 text-sm text-silver">Sign in to manage enquiries and site content.</p>
        <label htmlFor="pw" className="mb-2 mt-7 block text-xs uppercase tracking-[0.15em] text-silver">Password</label>
        <input id="pw" type="password" autoComplete="current-password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} className={inputCls} aria-invalid={!!err} />
        {err && <p role="alert" className="mt-3 text-sm text-red-400">{err}</p>}
        <button className="btn btn-primary mt-6 w-full justify-center disabled:opacity-60" disabled={busy || !pw}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  )
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'enquiries', label: 'Enquiries', icon: Inbox },
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'security', label: 'Security', icon: KeyRound },
] as const

function Dashboard({ onOut }: { onOut: () => void }) {
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>('overview')
  const [stats, setStats] = useState<Stats | null>(null)
  const loadStats = useCallback(() => api<Stats>('/stats').then(setStats).catch(() => {}), [])
  useEffect(() => { loadStats(); const t = setInterval(() => document.visibilityState === 'visible' && loadStats(), 30000); return () => clearInterval(t) }, [loadStats])
  const logout = async () => { await api('/logout', { method: 'POST' }).catch(() => {}); onOut() }

  return (
    <div className="lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-white/10 bg-deep lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-4 lg:block lg:py-7">
          <img src="/images/site/logo-dark.png" alt="TAC" className="h-9 w-auto" />
          <button onClick={logout} className="flex items-center gap-2 text-sm text-silver hover:text-cyan lg:mt-8"><LogOut size={16} />Sign out</button>
        </div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1 lg:px-4">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} aria-current={tab === t.id ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm transition lg:w-full ${tab === t.id ? 'bg-cyan/15 text-cyan' : 'text-silver hover:bg-white/5 hover:text-white'}`}>
              <t.icon size={17} />{t.label}
              {t.id === 'enquiries' && !!stats?.new && <span className="ml-auto rounded-full bg-cyan px-2 py-0.5 text-[0.7rem] font-medium text-midnight">{stats.new}</span>}
            </button>
          ))}
        </nav>
        <a href="/" target="_blank" rel="noopener" className="hidden px-8 py-6 text-sm text-slate hover:text-cyan lg:block">View website ↗</a>
      </aside>
      <main className="min-w-0 px-5 py-8 lg:px-10">
        {tab === 'overview' && <Overview stats={stats} go={setTab} />}
        {tab === 'enquiries' && <Enquiries onChange={loadStats} />}
        {tab === 'content' && <Content />}
        {tab === 'security' && <Security />}
      </main>
    </div>
  )
}

const Card = ({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><div className="text-xs uppercase tracking-[0.16em] text-silver">{label}</div><div className={`mt-2 font-display text-4xl font-light tabular-nums ${accent ? 'text-cyan' : ''}`}>{value}</div></div>
)

function Overview({ stats, go }: { stats: Stats | null; go: (t: 'enquiries') => void }) {
  if (!stats) return <Loader2 className="animate-spin text-cyan" />
  const max = Math.max(1, ...stats.daily.map((d) => d.count))
  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl">Overview</h1>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Card label="New enquiries" value={stats.new} accent /><Card label="Last 7 days" value={stats.last7} /><Card label="Total" value={stats.total} /><Card label="Closed" value={stats.closed} />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-white/10 bg-white/[.03] p-6 xl:col-span-2">
          <h2 className="mb-6 text-xs uppercase tracking-[0.16em] text-silver">Enquiries — last 14 days</h2>
          <div className="flex h-44 items-end gap-1.5 sm:gap-2" role="img" aria-label="Bar chart of enquiries per day for the last 14 days">
            {stats.daily.map((d) => (
              <div key={d.date} className="group flex flex-1 flex-col items-center justify-end gap-2" title={`${d.date}: ${d.count}`}>
                <span className="text-[0.7rem] tabular-nums text-silver">{d.count || ''}</span>
                <div className="w-full rounded-t bg-gradient-to-t from-azure to-cyan transition-all" style={{ height: `${Math.max(d.count ? 8 : 2, (d.count / max) * 120)}px`, opacity: d.count ? 1 : 0.25 }} />
                <span className="text-[0.7rem] text-slate">{d.date.slice(8)}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[.03] p-6">
          <h2 className="mb-4 text-xs uppercase tracking-[0.16em] text-silver">By service</h2>
          {stats.byService.length ? <ul className="space-y-3 text-sm">{stats.byService.map((s) => <li key={s.service} className="flex justify-between gap-3"><span className="truncate text-silver">{s.service}</span><span className="tabular-nums">{s.count}</span></li>)}</ul> : <p className="text-sm text-slate">No enquiries yet.</p>}
        </section>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <button className="btn btn-primary" onClick={() => go('enquiries')}>Open enquiries</button>
        <span className={stats.mail ? 'text-emerald-300' : 'text-amber-300'}>{stats.mail ? '● Email notifications on' : '● Email notifications off — set SMTP_* env vars to also receive enquiries by email'}</span>
      </div>
    </div>
  )
}

function Enquiries({ onChange }: { onChange: () => void }) {
  const [items, setItems] = useState<Enquiry[] | null>(null)
  const [status, setStatus] = useState(''), [q, setQ] = useState(''), [open, setOpen] = useState<string | null>(null), [err, setErr] = useState('')
  const qs = useMemo(() => new URLSearchParams({ ...(status && { status }), ...(q && { q }) }).toString(), [status, q])
  const load = useCallback(() => api<{ items: Enquiry[] }>(`/enquiries?${qs}`).then((d) => setItems(d.items)).catch((e) => setErr(e.message)), [qs])
  useEffect(() => { const t = setTimeout(load, q ? 250 : 0); return () => clearTimeout(t) }, [load, q])
  useEffect(() => { const t = setInterval(() => document.visibilityState === 'visible' && load(), 30000); return () => clearInterval(t) }, [load])

  const patch = async (id: string, body: Partial<Enquiry>) => { const r = await api<{ item: Enquiry }>(`/enquiries/${id}`, { method: 'PATCH', body }); setItems((l) => l?.map((x) => (x.id === id ? r.item : x)) ?? null); onChange() }
  const del = async (e: Enquiry) => { if (!confirm(`Delete the enquiry from ${e.name}? This cannot be undone.`)) return; await api(`/enquiries/${e.id}`, { method: 'DELETE' }); setItems((l) => l?.filter((x) => x.id !== e.id) ?? null); onChange() }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4"><h1 className="font-display text-3xl">Enquiries</h1>
        <a className="btn btn-ghost !py-2.5" href={`/api/admin/enquiries.csv?${qs}`}><Download size={16} />Export CSV</a></div>
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" /><input aria-label="Search enquiries" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, message…" className={`${inputCls} !pl-11`} /></div>
        <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputCls} !w-auto`}><option value="">All statuses</option><option value="new">New</option><option value="contacted">Contacted</option><option value="closed">Closed</option></select>
      </div>
      {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
      {!items ? <Loader2 className="animate-spin text-cyan" /> : items.length === 0 ? <p className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-silver">No enquiries match.</p> : (
        <ul className="space-y-3">
          {items.map((e) => (
            <li key={e.id} className="rounded-2xl border border-white/10 bg-white/[.03]">
              <button onClick={() => setOpen(open === e.id ? null : e.id)} aria-expanded={open === e.id} className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 text-left">
                <span className={`rounded-full border px-3 py-0.5 text-xs uppercase tracking-wider ${STATUS_STYLE[e.status]}`}>{e.status}</span>
                <span className="font-display text-lg">{e.name}</span><span className="text-sm text-silver">{e.company}</span>
                <span className="ml-auto text-xs text-slate">{fmtDate(e.at)}</span>
              </button>
              {open === e.id && (
                <div className="space-y-5 border-t border-white/10 px-5 py-5">
                  <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div><dt className="text-xs uppercase tracking-wider text-slate">Email</dt><dd><a className="text-cyan hover:underline" href={`mailto:${e.email}`}>{e.email}</a></dd></div>
                    <div><dt className="text-xs uppercase tracking-wider text-slate">Phone</dt><dd>{e.phone ? <a className="text-cyan hover:underline" href={`tel:${e.phone.replace(/\s/g, '')}`}>{e.phone}</a> : '—'}</dd></div>
                    <div><dt className="text-xs uppercase tracking-wider text-slate">Service</dt><dd>{e.service || '—'}</dd></div>
                    <div><dt className="text-xs uppercase tracking-wider text-slate">Project type</dt><dd>{e.projectType || '—'}</dd></div>
                  </dl>
                  <p className="whitespace-pre-wrap rounded-xl bg-midnight/60 p-4 text-silver">{e.message}</p>
                  <NoteBox e={e} save={(note) => patch(e.id, { note })} />
                  <div className="flex flex-wrap items-center gap-2">
                    {(['new', 'contacted', 'closed'] as Status[]).map((s) => <button key={s} onClick={() => patch(e.id, { status: s })} className={`rounded-full border px-4 py-2 text-xs uppercase tracking-wider transition ${e.status === s ? STATUS_STYLE[s] : 'border-white/15 text-silver hover:border-white/40'}`}>Mark {s}</button>)}
                    <button onClick={() => del(e)} className="ml-auto flex items-center gap-2 rounded-full border border-red-400/40 px-4 py-2 text-xs uppercase tracking-wider text-red-300 hover:bg-red-400/10"><Trash2 size={14} />Delete</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function NoteBox({ e, save }: { e: Enquiry; save: (n: string) => Promise<void> }) {
  const [v, setV] = useState(e.note), [saved, setSaved] = useState(false)
  return (
    <div><label className="mb-2 block text-xs uppercase tracking-wider text-slate" htmlFor={`n-${e.id}`}>Internal note</label>
      <textarea id={`n-${e.id}`} rows={2} value={v} onChange={(x) => { setV(x.target.value); setSaved(false) }} className={inputCls} placeholder="e.g. Called on Sunday, sending a quotation…" />
      <button className="mt-2 flex items-center gap-2 text-sm text-cyan hover:underline disabled:opacity-50" disabled={v === e.note && !saved} onClick={async () => { await save(v); setSaved(true) }}>{saved ? <><Check size={14} />Saved</> : 'Save note'}</button></div>
  )
}

function Content() {
  const [type, setType] = useState<'products' | 'projects'>('products')
  const [ov, setOv] = useState<Overrides | null>(null)
  useEffect(() => { fetch('/api/content', { cache: 'no-store' }).then((r) => r.json()).then(setOv).catch(() => setOv({})) }, [])
  const list = type === 'products' ? products.map((p) => ({ slug: p.slug, name: p.name, image: p.image })) : projects.map((p) => ({ slug: p.slug, name: p.name, image: p.image }))
  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-3xl">Site content</h1>
        <p className="mt-2 max-w-2xl text-sm text-silver">Add a description to appear on each product or project page of the website. Leave empty to show no extra text. Only add information TAC has verified.</p></div>
      <div className="flex gap-2">{(['products', 'projects'] as const).map((t) => <button key={t} onClick={() => setType(t)} className={`rounded-full border px-5 py-2 text-sm capitalize ${type === t ? 'border-cyan bg-cyan/15 text-cyan' : 'border-white/15 text-silver'}`}>{t}</button>)}</div>
      {!ov ? <Loader2 className="animate-spin text-cyan" /> : <ul className="grid gap-4 xl:grid-cols-2">{list.map((it) => <ContentItem key={type + it.slug} type={type} it={it} initial={ov[type]?.[it.slug] ?? ''} />)}</ul>}
    </div>
  )
}
function ContentItem({ type, it, initial }: { type: string; it: { slug: string; name: string; image: string }; initial: string }) {
  const [v, setV] = useState(initial), [base, setBase] = useState(initial), [state, setState] = useState<'' | 'saving' | 'saved' | 'err'>('')
  useEffect(() => { setV(initial); setBase(initial) }, [initial])
  const save = async () => { setState('saving'); try { await api(`/content/${type}/${it.slug}`, { method: 'PUT', body: { description: v } }); setBase(v.trim()); setState('saved') } catch { setState('err') } }
  return (
    <li className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
      <div className="mb-4 flex items-center gap-4"><img src={it.image} alt="" className="h-14 w-14 rounded-lg object-cover" /><div><div className="font-display">{it.name}</div><a className="text-xs text-cyan hover:underline" href={`/${type}/${it.slug}`} target="_blank" rel="noopener">View page ↗</a></div></div>
      <label className="sr-only" htmlFor={`c-${it.slug}`}>Description for {it.name}</label>
      <textarea id={`c-${it.slug}`} rows={4} maxLength={3000} value={v} onChange={(e) => { setV(e.target.value); setState('') }} className={inputCls} placeholder="Description shown on the page…" />
      <div className="mt-3 flex items-center gap-4 text-sm"><button className="btn btn-primary !px-5 !py-2 disabled:opacity-50" disabled={v.trim() === base || state === 'saving'} onClick={save}>{state === 'saving' ? 'Saving…' : 'Save'}</button>
        {state === 'saved' && <span className="flex items-center gap-1 text-emerald-300"><Check size={14} />Published</span>}{state === 'err' && <span className="text-red-400">Failed to save</span>}<span className="ml-auto text-xs text-slate">{v.length}/3000</span></div>
    </li>
  )
}

function Security() {
  const [cur, setCur] = useState(''), [nw, setNw] = useState(''), [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)
  const submit = async (e: FormEvent) => { e.preventDefault(); setMsg(null); try { await api('/password', { method: 'POST', body: { current: cur, next: nw } }); setMsg({ ok: true, t: 'Password updated. Other signed-in sessions have been signed out.' }); setCur(''); setNw('') } catch (x) { setMsg({ ok: false, t: (x as Error).message }) } }
  return (
    <form onSubmit={submit} className="max-w-md space-y-5"><h1 className="font-display text-3xl">Security</h1>
      <div><label htmlFor="cp" className="mb-2 block text-xs uppercase tracking-wider text-silver">Current password</label><input id="cp" type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} className={inputCls} /></div>
      <div><label htmlFor="np" className="mb-2 block text-xs uppercase tracking-wider text-silver">New password (min 10 characters)</label><input id="np" type="password" autoComplete="new-password" value={nw} onChange={(e) => setNw(e.target.value)} className={inputCls} /></div>
      {msg && <p role="alert" className={`text-sm ${msg.ok ? 'text-emerald-300' : 'text-red-400'}`}>{msg.t}</p>}
      <button className="btn btn-primary disabled:opacity-60" disabled={!cur || nw.length < 10}>Change password</button></form>
  )
}

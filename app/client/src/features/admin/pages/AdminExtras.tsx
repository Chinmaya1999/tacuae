// Admin: analytics, bookings and the integration log.
import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { api } from '../../../shared/lib/api'
import { money, pretty } from '../../quotations/lib/quote'
import { useDemo } from '../../demo/lib/demo'
import { card, field } from '../../quotations/components/ui'
import type { Booking } from '../../dashboard/pages/Extras'

type Row = { name: string; n: number; value?: number }
type Data = { funnel: Row[]; average: number; pipeline: number; wonValue: number; conversion: number; products: Row[]; kinds: Row[]; bookings: Row[] }
const Bars = ({ title, rows }: { title: string; rows: Row[] }) => {
  const max = Math.max(1, ...rows.map((r) => r.n))
  return <section className={card}><h2 className="mb-4 text-xs uppercase tracking-[0.16em] text-silver">{title}</h2>
    <ul className="space-y-3 text-sm">{rows.map((r) => <li key={r.name}><div className="flex justify-between gap-3"><span>{pretty(r.name)}</span><span className="tabular-nums text-silver">{r.n}{r.value !== undefined && ` · ${money(r.value)}`}</span></div><div className="mt-1 h-2 rounded bg-white/5"><div className="h-full rounded bg-gradient-to-r from-brand to-accent" style={{ width: `${(r.n / max) * 100}%` }} /></div></li>)}{!rows.length && <li className="text-slate">No data yet.</li>}</ul></section>
}
export function Analytics() {
  const [d, setD] = useState<Data | null>(null), [err, setErr] = useState(''), demo = useDemo()
  useEffect(() => { api<Data>('/api/admin/analytics').then(setD).catch((e) => setErr(e.message)) }, [])
  if (!d) return err ? <p role="alert" className="text-red-400">{err}</p> : <Loader2 className="animate-spin text-accent" />
  return (
    <div className="space-y-6"><div><h1 className="font-display text-3xl">Analytics</h1>{demo && <p className="mt-1 text-sm text-amber-300">Demonstration data.</p>}</div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{([['Pipeline value', money(d.pipeline)], ['Accepted value', money(d.wonValue)], ['Average quotation', money(d.average)], ['Conversion (sent → accepted)', `${d.conversion}%`]] as const).map(([k, v]) => <div key={k} className={card}><div className="text-xs uppercase tracking-[0.14em] text-silver">{k}</div><div className="mt-2 font-display text-2xl tabular-nums text-accent">{v}</div></div>)}</div>
      <div className="grid gap-4 xl:grid-cols-2"><Bars title="Funnel" rows={d.funnel} /><Bars title="Popular products (quoted quantity)" rows={d.products} /><Bars title="Quotations by type" rows={d.kinds} /><Bars title="Bookings" rows={d.bookings} /></div>
    </div>
  )
}
export function Bookings() {
  const [items, setItems] = useState<Booking[] | null>(null), [err, setErr] = useState('')
  const load = useCallback(() => api<{ items: Booking[] }>('/api/sales/appointments').then((d) => setItems(d.items)).catch((e) => setErr(e.message)), [])
  useEffect(() => { load() }, [load])
  return (
    <div className="space-y-6"><h1 className="font-display text-3xl">Bookings</h1>{err && <p role="alert" className="text-red-400">{err}</p>}{!items && !err && <Loader2 className="animate-spin text-accent" />}{items?.length === 0 && <p className="text-silver">No bookings yet.</p>}
      <ul className="space-y-3">{items?.map((a) => <li key={a.id} className={`${card} flex flex-wrap items-center gap-x-4 gap-y-2 text-sm`}><b>{pretty(a.type)}</b><span>{a.date} · {a.slot}</span><span>{a.name} · <a className="text-accent" href={`tel:${a.phone.replace(/\s/g, '')}`}>{a.phone}</a></span>{a.notes && <span className="text-slate">{a.notes}</span>}
        <select aria-label={`Status of ${a.name}`} className={`${field} !ml-auto !w-auto`} value={a.status} onChange={(e) => api(`/api/sales/appointments/${a.id}`, { method: 'PATCH', body: { status: e.target.value } }).then(load).catch((x) => setErr(x.message))}>{['requested', 'confirmed', 'done', 'cancelled'].map((s) => <option key={s} value={s}>{pretty(s)}</option>)}</select></li>)}</ul></div>
  )
}
type Out = { id: string; channel: string; to: string; summary: string; at: string }
const CHANNELS: [string, string, string][] = [['crm', 'CRM', 'Zoho / HubSpot / Salesforce / Odoo — to be chosen'], ['whatsapp', 'WhatsApp Business', 'Number and API account needed'], ['email', 'Email', 'SMTP settings'], ['sms', 'SMS gateway', 'Provider needed'], ['calendar', 'Calendar', 'Google / Microsoft — to be chosen'], ['payment', 'Payment gateway', 'Network International / Telr / Stripe — to be chosen'], ['analytics', 'GA4, Meta Pixel, Tag Manager', 'Account IDs needed']]
export function Integrations() {
  const [d, setD] = useState<{ demo: boolean; items: Out[] } | null>(null), [ch, setCh] = useState(''), [err, setErr] = useState('')
  useEffect(() => { api<{ demo: boolean; items: Out[] }>('/api/admin/outbox').then(setD).catch((e) => setErr(e.message)) }, [])
  if (!d) return err ? <p role="alert" className="text-red-400">{err}</p> : <Loader2 className="animate-spin text-accent" />
  return (
    <div className="space-y-6"><div><h1 className="font-display text-3xl">Integrations</h1><p className="mt-2 text-sm text-amber-300">No external service is connected. {d.demo ? 'The log below shows what WOULD be sent.' : ''}</p></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{CHANNELS.map(([id, name, need]) => <button key={id} onClick={() => setCh(ch === id ? '' : id)} aria-pressed={ch === id} className={`${card} text-left ${ch === id ? '!border-accent' : ''}`}><b>{name}</b><div className="mt-1 text-xs text-slate">{need}</div><div className="mt-3 text-xs text-amber-300">{d.demo && id !== 'analytics' ? `Simulated · ${d.items.filter((o) => o.channel === id).length} messages` : 'Not connected'}</div></button>)}</div>
      <ul className="space-y-2 text-sm">{d.items.filter((o) => !ch || o.channel === ch).map((o) => <li key={o.id} className="flex flex-wrap gap-x-4 gap-y-1 border-b border-white/10 pb-2"><span className="rounded-full border border-amber-300/40 px-2 text-xs text-amber-300">Simulated</span><b className="uppercase">{o.channel}</b><span className="text-silver">{o.to}</span><span>{o.summary}</span><span className="ml-auto text-xs text-slate">{new Date(o.at).toLocaleString('en-GB')}</span></li>)}{!d.items.length && <li className="text-slate">Nothing yet.</li>}</ul>
    </div>
  )
}

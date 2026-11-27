import { useState, type FormEvent } from 'react'
import { useAuth } from '../../auth/lib/auth'
import { useSeo } from '../../../shared/lib/seo'
import { api } from '../../../shared/lib/api'
import { Choice, Field, card, field } from '../../quotations/components/ui'
import { pretty } from '../../quotations/lib/quote'
import { company } from '../../../shared/data/content'

export const BOOKING_TYPES = ['callback', 'video consultation', 'showroom visit', 'site survey']
export default function Booking() {
  useSeo('Talk to an expert | TAC UAE', 'Book a callback, video consultation, showroom visit or site survey with Total Automation.', '/book')
  const { user } = useAuth()
  const [f, setF] = useState({ type: 'callback', date: '', slot: '11:00', name: '', phone: '', email: '', notes: '', website: '' })
  const [done, setDone] = useState(false), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const v = { ...f, name: f.name || user?.name || '', email: f.email || user?.email || '', phone: f.phone || user?.phone || '' }
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('')
    try { await api('/api/appointments', { method: 'POST', body: v }); setDone(true) } catch (x) { setErr((x as Error).message) } finally { setBusy(false) }
  }
  const today = new Date().toISOString().slice(0, 10)
  return (
    <div className="container-x pb-24 pt-32">
      <h1 className="font-display text-3xl md:text-4xl">Talk to an expert</h1>
      <p className="mt-2 text-sm text-silver">Or call us on <a className="text-cyan" href={company.phoneHref}>{company.phone}</a>.</p>
      {done ? <div role="status" className={`${card} mt-8 max-w-xl`}><p className="font-display text-xl">Request received</p><p className="mt-2 text-silver">TAC will confirm your {f.type} on {f.date} at {f.slot}.</p></div> :
        <form onSubmit={submit} className={`${card} mt-8 max-w-2xl space-y-5`}>
          <div className="grid gap-2 sm:grid-cols-2">{BOOKING_TYPES.map((t) => <Choice key={t} on={f.type === t} onClick={() => setF({ ...f, type: t })}>{pretty(t)}</Choice>)}</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="Date"><input required type="date" min={today} className={field} value={f.date} onChange={set('date')} /></Field>
            <Field name="Time"><select className={field} value={f.slot} onChange={set('slot')}>{['09:00', '11:00', '13:00', '15:00', '17:00'].map((s) => <option key={s}>{s}</option>)}</select></Field>
            <Field name="Your name"><input required className={field} value={v.name} onChange={set('name')} /></Field>
            <Field name="Phone"><input required type="tel" className={field} value={v.phone} onChange={set('phone')} /></Field>
            <Field name="Email (optional)"><input type="email" className={field} value={v.email} onChange={set('email')} /></Field>
          </div>
          <Field name="Notes"><textarea rows={3} maxLength={1000} className={field} value={f.notes} onChange={set('notes')} /></Field>
          <input tabIndex={-1} autoComplete="off" aria-hidden className="hidden" name="website" value={f.website} onChange={set('website')} />
          {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
          <button className="btn btn-primary disabled:opacity-60" disabled={busy}>Request booking</button>
        </form>}
    </div>
  )
}

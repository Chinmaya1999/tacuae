import { useRef, useState, type FormEvent } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { services } from '../../../shared/data/content'

const projectTypes = ['Residential villa', 'Apartment complex', 'Hotel / hospitality', 'Commercial / office', 'Education', 'Retail / mall', 'Other']
type F = { name: string; company: string; email: string; phone: string; service: string; projectType: string; message: string; website: string }
const empty: F = { name: '', company: '', email: '', phone: '', service: '', projectType: '', message: '', website: '' }

export default function ContactForm({ dark = true }: { dark?: boolean }) {
  const [f, setF] = useState<F>(empty)
  const [err, setErr] = useState<Partial<Record<keyof F, string>>>({})
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'fail'>('idle')
  const opened = useRef(Date.now())

  const validate = () => {
    const e: typeof err = {}
    if (f.name.trim().length < 2) e.name = 'Please enter your full name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Please enter a valid email address.'
    if (f.phone && !/^[+\d][\d\s()-]{6,}$/.test(f.phone)) e.phone = 'Please enter a valid phone number.'
    if (f.message.trim().length < 10) e.message = 'Please tell us a little about your project (min 10 characters).'
    setErr(e)
    return Object.keys(e).length === 0
  }

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    setState('sending')
    try {
      const r = await fetch('/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...f, elapsed: Date.now() - opened.current }) })
      if (!r.ok) throw new Error()
      setState('ok'); setF(empty)
    } catch { setState('fail') }
  }

  const base = `w-full rounded-xl border px-4 py-3.5 text-sm outline-none transition focus:border-cyan ${dark ? 'bg-white/5 border-white/15 text-white placeholder:text-slate' : 'bg-white border-slate/30 text-midnight'}`
  const set = (k: keyof F) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  const field = (k: keyof F, label: string, type = 'text', req = false) => (
    <div>
      <label htmlFor={`f-${k}`} className="mb-2 block text-xs uppercase tracking-[0.15em] text-silver">{label}{req && ' *'}</label>
      <input id={`f-${k}`} name={k} type={type} value={f[k]} onChange={set(k)} className={base} aria-invalid={!!err[k]} aria-describedby={err[k] ? `e-${k}` : undefined} autoComplete={k === 'name' ? 'name' : k === 'email' ? 'email' : k === 'phone' ? 'tel' : k === 'company' ? 'organization' : 'off'} />
      {err[k] && <p id={`e-${k}`} role="alert" className="mt-1.5 text-xs text-red-400">{err[k]}</p>}
    </div>
  )

  if (state === 'ok') return (
    <div role="status" className={`rounded-2xl border p-10 text-center ${dark ? 'border-cyan/30 bg-cyan/5' : 'border-azure/30 bg-white'}`}>
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-cyan text-midnight"><Check /></div>
      <h3 className="font-display text-2xl">Thank you — we’ve received your enquiry.</h3>
      <p className="mt-2 text-silver">Our team will get back to you shortly.</p>
      <button className="mt-6 text-cyan link-u" onClick={() => setState('idle')}>Send another enquiry</button>
    </div>
  )

  return (
    <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
      {field('name', 'Full Name', 'text', true)}
      {field('company', 'Company Name')}
      {field('email', 'Email', 'email', true)}
      {field('phone', 'Phone Number', 'tel')}
      <div>
        <label htmlFor="f-service" className="mb-2 block text-xs uppercase tracking-[0.15em] text-silver">Service Interested In</label>
        <select id="f-service" value={f.service} onChange={set('service')} className={base}>
          <option value="">Select a service</option>
          {services.map((s) => <option key={s.slug} value={s.title}>{s.title}</option>)}
          <option value="Products">Products</option>
        </select>
      </div>
      <div>
        <label htmlFor="f-pt" className="mb-2 block text-xs uppercase tracking-[0.15em] text-silver">Project Type</label>
        <select id="f-pt" value={f.projectType} onChange={set('projectType')} className={base}>
          <option value="">Select a project type</option>
          {projectTypes.map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="f-message" className="mb-2 block text-xs uppercase tracking-[0.15em] text-silver">Message *</label>
        <textarea id="f-message" rows={5} value={f.message} onChange={set('message')} className={base} aria-invalid={!!err.message} aria-describedby={err.message ? 'e-message' : undefined} />
        {err.message && <p id="e-message" role="alert" className="mt-1.5 text-xs text-red-400">{err.message}</p>}
      </div>
      {/* honeypot */}
      <div className="absolute -left-[9999px]" aria-hidden>
        <label>Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} /></label>
      </div>
      <div className="sm:col-span-2 flex flex-wrap items-center gap-4">
        <button className="btn btn-primary disabled:opacity-60" disabled={state === 'sending'}>
          {state === 'sending' ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : 'Send Enquiry'}
        </button>
        {state === 'fail' && <p role="alert" className="text-sm text-red-400">Something went wrong. Please try again, or email info@tacuae.com / call +971 4 3926860.</p>}
      </div>
    </form>
  )
}

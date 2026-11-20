import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Loader2, Send } from 'lucide-react'
import { company, services } from '../data/content'

const SERVICE_OPTIONS = [...services.map((s) => s.title), 'Products / KNX equipment', 'Other']
const PROJECT_TYPES = ['Villa / Residential', 'Apartment complex', 'Hotel / Hospitality', 'Commercial / High-rise office', 'Mall / Retail', 'Airport / Infrastructure', 'Education', 'Other']

type Status = 'idle' | 'sending' | 'ok' | 'error'
interface Values { name: string; company: string; email: string; phone: string; service: string; projectType: string; message: string }
const empty: Values = { name: '', company: '', email: '', phone: '', service: '', projectType: '', message: '' }

function validate(v: Values) {
  const e: Partial<Record<keyof Values, string>> = {}
  if (v.name.trim().length < 2) e.name = 'Please enter your full name.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = 'Please enter a valid email address.'
  if (v.phone.trim() && !/^[+()\d\s-]{6,20}$/.test(v.phone.trim())) e.phone = 'Use digits, spaces, + or - only.'
  if (v.message.trim().length < 10) e.message = 'Tell us a little about your project (min. 10 characters).'
  return e
}

export default function EnquiryForm({ compact = false }: { compact?: boolean }) {
  const [params] = useSearchParams()
  const [v, setV] = useState<Values>(empty)
  const [err, setErr] = useState<Partial<Record<keyof Values, string>>>({})
  const [status, setStatus] = useState<Status>('idle')
  const [msg, setMsg] = useState('')
  const honey = useRef<HTMLInputElement>(null)
  const born = useRef(Date.now())

  useEffect(() => {
    const s = params.get('service')
    if (s) setV((o) => ({ ...o, service: SERVICE_OPTIONS.find((x) => x.toLowerCase().includes(s.toLowerCase())) ?? o.service }))
  }, [params])

  const on = (k: keyof Values) => (e: { target: { value: string } }) => {
    setV((o) => ({ ...o, [k]: e.target.value }))
    if (err[k]) setErr((o) => ({ ...o, [k]: undefined }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const found = validate(v); setErr(found)
    if (Object.keys(found).length) { (document.querySelector('[aria-invalid="true"]') as HTMLElement | null)?.focus(); return }
    setStatus('sending'); setMsg('')
    try {
      const r = await fetch('/api/enquiry', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...v, website: honey.current?.value ?? '', elapsed: Date.now() - born.current }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data.error || 'Something went wrong.')
      setStatus('ok'); setV(empty)
    } catch (ex) {
      setStatus('error'); setMsg(ex instanceof Error && ex.message !== 'Failed to fetch' ? ex.message : 'We could not send your enquiry right now.')
    }
  }

  const f = (k: keyof Values, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, required = false) => (
    <div>
      <label htmlFor={`f-${k}`} className="mb-2 block text-xs font-medium uppercase tracking-widest text-silver">{label}{required && <span className="text-cyan"> *</span>}</label>
      <input id={`f-${k}`} name={k} value={v[k]} onChange={on(k)} className="field" aria-invalid={!!err[k]} aria-describedby={err[k] ? `e-${k}` : undefined} required={required} {...props} />
      {err[k] && <p id={`e-${k}`} role="alert" className="mt-1.5 text-xs text-[#ff8da0]">{err[k]}</p>}
    </div>
  )

  return (
    <form onSubmit={submit} noValidate className="relative">
      <AnimatePresence mode="wait">
        {status === 'ok' ? (
          <motion.div key="ok" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} role="status" className="grid min-h-[26rem] place-items-center rounded-2xl border border-cyan/30 bg-cyan/5 p-10 text-center">
            <div>
              <CheckCircle2 className="mx-auto mb-5 text-cyan" size={48} />
              <h3 className="font-display text-2xl font-medium text-white">Thank you – your enquiry is on its way.</h3>
              <p className="mx-auto mt-3 max-w-sm text-sm text-silver">Our team will get back to you shortly. For anything urgent, call <a className="text-cyan" href={company.phoneHref}>{company.phone}</a>.</p>
              <button type="button" onClick={() => setStatus('idle')} className="link-arrow mt-6">Send another enquiry</button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="form" initial={false} className="space-y-5">
            <div className={`grid gap-5 ${compact ? '' : 'md:grid-cols-2'}`}>
              {f('name', 'Full name', { autoComplete: 'name', placeholder: 'Your full name' }, true)}
              {f('company', 'Company name', { autoComplete: 'organization', placeholder: 'Company (optional)' })}
              {f('email', 'Email', { type: 'email', autoComplete: 'email', placeholder: 'you@company.com' }, true)}
              {f('phone', 'Phone number', { type: 'tel', autoComplete: 'tel', placeholder: '+971 …' })}
              <div>
                <label htmlFor="f-service" className="mb-2 block text-xs font-medium uppercase tracking-widest text-silver">Service interested in</label>
                <select id="f-service" className="field" value={v.service} onChange={on('service')}>
                  <option value="">Select a service</option>{SERVICE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="f-type" className="mb-2 block text-xs font-medium uppercase tracking-widest text-silver">Project type</label>
                <select id="f-type" className="field" value={v.projectType} onChange={on('projectType')}>
                  <option value="">Select a project type</option>{PROJECT_TYPES.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="f-message" className="mb-2 block text-xs font-medium uppercase tracking-widest text-silver">Message <span className="text-cyan">*</span></label>
              <textarea id="f-message" rows={5} value={v.message} onChange={on('message')} className="field resize-y" placeholder="Tell us about your project…" aria-invalid={!!err.message} aria-describedby={err.message ? 'e-message' : undefined} required />
              {err.message && <p id="e-message" role="alert" className="mt-1.5 text-xs text-[#ff8da0]">{err.message}</p>}
            </div>
            {/* spam protection: honeypot (hidden from people) + minimum fill time + server-side rate limiting */}
            <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden"><label>Website<input ref={honey} tabIndex={-1} autoComplete="off" name="website" /></label></div>

            <div aria-live="polite">
              {status === 'error' && (
                <p role="alert" className="flex items-start gap-3 rounded-xl border border-[#ff6b81]/40 bg-[#ff6b81]/10 p-4 text-sm text-[#ffb3c0]">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                  <span>{msg} Please try again, or email <a className="underline" href={`mailto:${company.email}`}>{company.email}</a> / call <a className="underline" href={company.phoneHref}>{company.phone}</a>.</span>
                </p>
              )}
            </div>
            <button type="submit" disabled={status === 'sending'} className="btn btn-primary disabled:opacity-60">
              {status === 'sending' ? <><Loader2 size={16} className="animate-spin" />Sending…</> : <>Send enquiry <Send size={16} /></>}
            </button>
            <p className="text-xs text-slate">Your details are used only to respond to your enquiry. See our <a className="underline hover:text-cyan" href="/privacy-policy">Privacy Policy</a>.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  )
}

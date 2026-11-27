// A quotation opened from a secure link: view, preview, comment and request changes without an account.
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Loader2, Printer } from 'lucide-react'
import { api } from '../../../shared/lib/api'
import type { Quote } from '../lib/quote'
import { Comments, Field, QuoteDocument, StatusPill, card, field, small } from '../components/ui'
import Preview3D from '../components/Preview3D'

export default function SharedQuote() {
  const { token } = useParams()
  const [q, setQ] = useState<Quote | null>(null), [err, setErr] = useState(''), [preview, setPreview] = useState(false)
  const [name, setName] = useState(''), [text, setText] = useState(''), [change, setChange] = useState(false), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false)
  useEffect(() => {
    document.title = 'Shared quotation | TAC UAE'
    const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex, nofollow'; document.head.appendChild(m)
    api<{ item: Quote }>(`/api/shared/${token}`).then((d) => setQ(d.item)).catch((e) => setErr(e.message))
    return () => m.remove()
  }, [token])
  const send = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg('')
    try { setQ((await api<{ item: Quote }>(`/api/shared/${token}/comments`, { method: 'POST', body: { name, text, requestChanges: change } })).item); setText(''); setChange(false); setMsg('Sent.') } catch (x) { setMsg((x as Error).message) } finally { setBusy(false) }
  }
  return (
    <div className="min-h-screen bg-midnight px-4 py-8 text-white">
      <div className="mx-auto max-w-[1100px] space-y-6">
        <Link to="/"><img src="/images/site/logo-dark.png" alt="TAC — Total Automation" className="h-10 w-auto" /></Link>
        {err ? <p role="alert" className="text-red-400">{err}</p> : !q ? <Loader2 className="animate-spin text-accent" /> : <>
          <div className="flex flex-wrap items-center gap-3"><h1 className="font-display text-3xl">{q.name}</h1><StatusPill s={q.status} /></div>
          <p className="text-sm text-slate">{q.ref} · version {q.version} · prepared for {q.preparedFor}</p>
          <div className="no-print flex flex-wrap gap-2"><Link className={small} to={`/q/${token}/proposal`}>Branded proposal</Link><button className={small} onClick={() => window.print()}><Printer size={14} className="mr-1.5 inline" />Print / save PDF</button>
            {q.kind === 'home' && q.pricing.rooms && <button className={small} aria-pressed={preview} onClick={() => setPreview(!preview)}>{preview ? 'Hide 3D preview' : 'Open the 3D simulation'}</button>}</div>
          {preview && q.pricing.rooms && <Preview3D rooms={q.pricing.rooms} />}
          <QuoteDocument q={q} />
          <Comments items={q.comments} />
          <form onSubmit={send} className={`${card} no-print max-w-xl space-y-3`}>
            <Field name="Your name"><input required maxLength={80} className={field} value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field name="Comment"><textarea required rows={3} maxLength={1500} className={field} value={text} onChange={(e) => setText(e.target.value)} /></Field>
            {['shared', 'reviewed', 'final'].includes(q.status) && <label className="flex items-center gap-3 text-sm"><input type="checkbox" className="h-4 w-4 accent-accent" checked={change} onChange={(e) => setChange(e.target.checked)} />I am requesting changes to this quotation</label>}
            <button className="btn btn-primary disabled:opacity-60" disabled={busy || name.trim().length < 2 || !text.trim()}>Send</button>
            {msg && <p role="status" className="text-sm text-silver">{msg}</p>}
          </form>
        </>}
      </div>
    </div>
  )
}

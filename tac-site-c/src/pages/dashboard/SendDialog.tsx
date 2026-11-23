import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Loader2, Send, X } from 'lucide-react'
import { aed, type Design } from '../../data/catalog'
import { useEstimate } from '../../lib/products'

type Props = { design: Design; builder: boolean; onClose: () => void; onSend: (notes: string) => Promise<void> }

/** Last step before TAC sees the design: summary, estimate, optional message. */
export default function SendDialog({ design, builder, onClose, onSend }: Props) {
  const [notes, setNotes] = useState(design.notes), [phase, setPhase] = useState<'review' | 'sending' | 'sent'>('review'), [err, setErr] = useState('')
  const est = useEstimate(design.rooms, design.estimate), first = useRef<HTMLButtonElement>(null)
  useEffect(() => { first.current?.focus() }, [])
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && phase !== 'sending' && onClose()
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [phase, onClose])
  const items = design.rooms.reduce((n, r) => n + r.devices.length, 0)
  const go = async () => { setPhase('sending'); setErr(''); try { await onSend(notes); setPhase('sent') } catch (e) { setErr((e as Error).message); setPhase('review') } }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && phase !== 'sending' && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="send-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-deep p-6 shadow-2xl sm:p-8">
        {phase === 'sent' ? (
          <div className="text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-cyan text-midnight"><Check size={26} /></div>
            <h2 id="send-title" className="mt-5 font-display text-2xl">Sent to TAC</h2>
            <p className="mt-2 text-silver">Our engineers will review your design and prepare a quotation. You will find the price here in your dashboard.</p>
            <ol className="mx-auto mt-6 max-w-xs space-y-2 text-left text-sm text-silver"><li>✓ Design received</li><li className="text-slate">② TAC reviews your rooms</li><li className="text-slate">③ Your quote appears under “Quotes”</li></ol>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center"><Link to="/dashboard" className="btn btn-primary justify-center">Back to dashboard</Link><button onClick={onClose} className="btn btn-ghost justify-center">View my design</button></div>
          </div>
        ) : (<>
          <div className="flex items-start justify-between gap-4"><div><h2 id="send-title" className="font-display text-2xl">Review &amp; send</h2><p className="mt-1 text-sm text-silver">TAC will see exactly what you built and reply with a quotation.</p></div>
            <button ref={first} onClick={onClose} disabled={phase === 'sending'} aria-label="Close" className="rounded-full p-2 text-silver hover:bg-white/5"><X size={18} /></button></div>
          <dl className="mt-6 grid grid-cols-3 gap-3 text-center">{[['Rooms', design.rooms.length], ['Smart items', items], ['Property', design.property ?? 'apartment']].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-white/10 bg-white/[.03] p-3"><dt className="text-[0.65rem] uppercase tracking-wider text-slate">{k}</dt><dd className="mt-1 font-display capitalize">{v}</dd></div>))}</dl>
          <ul className="mt-4 space-y-1.5 text-sm">{design.rooms.map((r) => <li key={r.id} className="flex justify-between text-silver"><span>{r.name}</span><span className="tabular-nums text-slate">{r.devices.length} items</span></li>)}</ul>
          <div className="mt-5 rounded-2xl border border-cyan/30 bg-cyan/[.06] p-4"><div className="flex items-baseline justify-between"><span className="text-xs uppercase tracking-[0.14em] text-silver">Estimated cost</span><span className="font-display text-2xl text-cyan">{est ? aed(est.total) : '…'}</span></div>
            <p className="mt-1 text-xs text-slate">Includes installation and 5% VAT. This is an estimate — TAC confirms the final price in the quotation.</p></div>
          {builder && !design.clientName && <p className="mt-3 text-xs text-amber-300">Tip: add the client name under “Details” so TAC knows which project this is for.</p>}
          <label className="mt-5 block text-xs uppercase tracking-[0.15em] text-silver">Message to TAC (optional)
            <textarea rows={3} maxLength={3000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Budget, timeline, anything we should know…" className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base normal-case tracking-normal text-white outline-none placeholder:text-slate focus:border-cyan" /></label>
          {err && <p role="alert" className="mt-3 text-sm text-red-400">{err}</p>}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button onClick={onClose} disabled={phase === 'sending'} className="btn btn-ghost justify-center">Keep editing</button>
            <button onClick={go} disabled={phase === 'sending'} className="btn btn-primary justify-center disabled:opacity-60">{phase === 'sending' ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}Send to TAC</button></div>
        </>)}
      </div>
    </div>
  )
}

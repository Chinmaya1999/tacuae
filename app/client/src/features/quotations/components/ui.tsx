import { useState, type ReactNode } from 'react'
import { money, day, pretty, type Fx, type Pricing, type Quote, type QuoteStatus } from '../lib/quote'

export const field = 'w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate focus:border-accent [&>option]:bg-deep'
export const label = 'mb-1.5 block text-xs uppercase tracking-[0.14em] text-silver'
export const card = 'rounded-2xl border border-white/10 bg-white/[.03] p-5'
export const small = 'rounded-full border border-white/20 px-4 py-2 text-sm text-silver transition hover:border-accent hover:text-accent disabled:opacity-40'

export const Field = ({ name, children }: { name: string; children: ReactNode }) => <label className="block"><span className={label}>{name}</span>{children}</label>

export const Choice = ({ on, onClick, children, className = '' }: { on: boolean; onClick: () => void; children: ReactNode; className?: string }) => (
  <button type="button" aria-pressed={on} onClick={onClick} className={`rounded-xl border px-4 py-3 text-left text-sm transition ${on ? 'border-accent bg-accent/10 text-white' : 'border-white/15 text-silver hover:border-white/40'} ${className}`}>{children}</button>
)

export function Stepper({ value, onChange, label: l, min = 0, max = 99 }: { value: number; onChange: (n: number) => void; label: string; min?: number; max?: number }) {
  const b = 'grid h-8 w-8 place-items-center rounded-lg border border-white/15 text-silver hover:border-accent hover:text-accent disabled:opacity-30'
  return <span className="inline-flex items-center gap-2"><button type="button" className={b} disabled={value <= min} onClick={() => onChange(value - 1)} aria-label={`Fewer: ${l}`}>−</button><span className="w-6 text-center tabular-nums">{value}</span><button type="button" className={b} disabled={value >= max} onClick={() => onChange(value + 1)} aria-label={`More: ${l}`}>+</button></span>
}

const STATUS: Record<QuoteStatus, [string, string]> = {
  draft: ['Draft', 'border-white/20 text-silver'], shared: ['Shared', 'border-brand/50 text-ice'], revision_requested: ['With TAC / revision', 'border-amber-300/40 text-amber-300'],
  reviewed: ['TAC reviewed', 'border-accent/40 text-accent'], final: ['Final quotation', 'border-accent bg-accent/15 text-accent'], accepted: ['Accepted', 'border-emerald-300/40 text-emerald-300'], survey: ['Site survey', 'border-emerald-300/40 text-emerald-300'],
}
export const statusText = (s: QuoteStatus) => STATUS[s][0]
export const StatusPill = ({ s }: { s: QuoteStatus }) => <span className={`whitespace-nowrap rounded-full border px-3 py-0.5 text-xs ${STATUS[s][1]}`}>{STATUS[s][0]}</span>

export function Warnings({ w }: { w: Pricing['warnings'] }) {
  const list = [
    w.unmapped.length && `TAC will quote separately: ${w.unmapped.map(pretty).join(', ')}.`,
    w.unpriced.length && `No price yet (not included): ${w.unpriced.join(', ')}.`,
    w.incompatible.length && `Check with TAC — not available in the chosen wiring type: ${w.incompatible.join(', ')}.`,
  ].filter(Boolean)
  return list.length ? <ul role="status" className="space-y-1 rounded-xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-xs text-amber-200">{list.map((t) => <li key={String(t)}>{t}</li>)}</ul> : null
}

/** Totals breakdown, with optional USD / EUR display when TAC has set exchange rates. */
export function PriceSummary({ pricing, fx }: { pricing: Pricing | null; fx?: Fx }) {
  const [cur, setCur] = useState<'AED' | 'USD' | 'EUR'>('AED')
  if (!pricing) return <p className="text-sm text-slate">Calculating…</p>
  const t = pricing.totals
  const devices = pricing.lines.reduce((n, l) => n + l.qty, 0)
  if (pricing.hidden || !t) return (
    <div className="space-y-3"><p className="font-display text-xl">{devices} smart devices selected</p><p className="text-sm text-silver">Sign in to see the indicative price for this design.</p><Warnings w={pricing.warnings} /></div>
  )
  const rate = cur === 'AED' ? 1 : fx?.[cur] || 1
  const m = (f: number) => money(f, cur, rate)
  const currencies = (['AED', 'USD', 'EUR'] as const).filter((c) => c === 'AED' || fx?.[c])
  const rows: [string, number][] = [['Devices', t.devices], ['Accessories', t.accessories], ['Cabling allowance', t.cabling], ['Installation', t.installation], ['Programming', t.programming], ['Commissioning', t.commissioning]]
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div><div className="text-xs uppercase tracking-[0.14em] text-silver">Total incl. VAT</div><div aria-live="polite" className="mt-1 font-display text-3xl tabular-nums text-accent">{m(t.total)}</div></div>
        {currencies.length > 1 && <select aria-label="Display currency" value={cur} onChange={(e) => setCur(e.target.value as typeof cur)} className={`${field} !w-auto no-print`}>{currencies.map((c) => <option key={c}>{c}</option>)}</select>}
      </div>
      {cur !== 'AED' && <p className="text-xs text-slate">Converted for display only{fx?.asOf ? ` (rate as of ${fx.asOf})` : ''}. Quotations are in AED.</p>}
      <dl className="space-y-1 text-sm">
        {rows.filter(([, v]) => v > 0).map(([k, v]) => <div key={k} className="flex justify-between gap-3 text-silver"><dt>{k}</dt><dd className="tabular-nums">{m(v)}</dd></div>)}
        <div className="flex justify-between gap-3 border-t border-white/10 pt-1"><dt>Subtotal</dt><dd className="tabular-nums">{m(t.subtotal)}</dd></div>
        {t.volumeDiscount > 0 && <div className="flex justify-between gap-3 text-emerald-300"><dt>Volume discount ({t.volumeDiscountPct}%)</dt><dd className="tabular-nums">−{m(t.volumeDiscount)}</dd></div>}
        {t.discount > 0 && <div className="flex justify-between gap-3 text-emerald-300"><dt>Discount ({t.discountPct}%)</dt><dd className="tabular-nums">−{m(t.discount)}</dd></div>}
        {t.amc > 0 && <div className="flex justify-between gap-3 text-silver"><dt>Annual maintenance (first year)</dt><dd className="tabular-nums">{m(t.amc)}</dd></div>}
        <div className="flex justify-between gap-3 text-silver"><dt>VAT {Math.round((pricing.charges?.vatRate ?? 0.05) * 100)}%</dt><dd className="tabular-nums">{m(t.vat)}</dd></div>
      </dl>
      {pricing.metrics && pricing.metrics.units > 0 && <dl className="grid grid-cols-2 gap-2 text-sm"><div className="rounded-xl bg-midnight/60 p-3"><dt className="text-xs text-slate">Per unit ({pricing.metrics.units})</dt><dd className="tabular-nums">{m(pricing.metrics.costPerUnit ?? 0)}</dd></div><div className="rounded-xl bg-midnight/60 p-3"><dt className="text-xs text-slate">Per sq ft</dt><dd className="tabular-nums">{pricing.metrics.costPerSqft ? m(pricing.metrics.costPerSqft) : 'Add unit areas'}</dd></div></dl>}
      <Warnings w={pricing.warnings} />
    </div>
  )
}

export function BomTable({ pricing, edit }: { pricing: Pricing; edit?: { values: Record<string, number>; set: (id: string, n: number) => void } }) {
  const priced = !pricing.hidden
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="bg-white/[.04] text-xs uppercase tracking-wider text-slate"><tr><th className="p-3">Item</th><th className="p-3 text-right">Qty</th>{priced && <><th className="p-3 text-right">Unit</th><th className="p-3 text-right">Install / unit</th><th className="p-3 text-right">Line (ex VAT)</th></>}</tr></thead>
        <tbody>{pricing.lines.map((l) => (
          <tr key={l.productId} className="border-t border-white/10">
            <td className="p-3"><div>{l.name}</div><div className="text-xs text-slate">{l.group}</div></td>
            <td className="p-3 text-right tabular-nums">{edit ? <input aria-label={`Quantity of ${l.name}`} type="number" min={0} step={1} value={edit.values[l.productId] ?? l.qty} onChange={(e) => edit.set(l.productId, Math.max(0, Math.round(Number(e.target.value))))} className={`${field} !w-24 text-right`} /> : l.qty}</td>
            {priced && <><td className="p-3 text-right tabular-nums text-silver">{money((l.unit ?? 0) + (l.accessory ?? 0))}</td><td className="p-3 text-right tabular-nums text-silver">{money(l.install ?? 0)}</td><td className="p-3 text-right tabular-nums">{money(((l.unit ?? 0) + (l.accessory ?? 0) + (l.install ?? 0)) * l.qty)}</td></>}
          </tr>))}</tbody>
      </table>
    </div>
  )
}

/** The quotation as the customer, a link recipient and TAC all see it. Printable (browser "Save as PDF"). */
export function QuoteDocument({ q, edit }: { q: Quote; edit?: Parameters<typeof BomTable>[0]['edit'] }) {
  const p = q.input?.project
  return (
    <div className="space-y-5">
      <div className={`rounded-xl border px-4 py-3 text-sm ${q.indicative ? 'border-amber-300/40 bg-amber-400/10 text-amber-200' : 'border-accent/40 bg-accent/10 text-ice'}`}>
        {q.indicative ? 'Indicative quotation — subject to site survey.' : 'Final quotation issued by TAC.'}
        {q.validUntil && <> Valid until <b>{day(q.validUntil)}</b>{q.expired && ' (expired)'}.</>}
        {q.trn ? <> TAC TRN: {q.trn}.</> : null}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-5">
          <p className="text-sm text-silver">{q.kind === 'project'
            ? [p?.name, pretty(p?.type ?? ''), p?.location, p?.stage, p?.handover && `handover ${day(p.handover)}`, pretty(q.input.connectivity)].filter(Boolean).join(' · ')
            : [pretty(q.input.homeType), q.input.areaSqft ? `${q.input.areaSqft} sq ft` : '', pretty(q.input.connectivity), q.input.community, q.input.emirate, q.input.timeline].filter(Boolean).join(' · ')}</p>
          {p?.buildingSystems && <p className="whitespace-pre-wrap text-sm text-silver"><b className="text-white">Building systems for TAC to quote:</b> {p.buildingSystems}</p>}
          {!!q.pricing.unitTypes?.length && <div className={card}><h3 className="mb-2 text-xs uppercase tracking-[0.14em] text-silver">Unit mix (before project discount and VAT)</h3><ul className="space-y-1 text-sm">{q.pricing.unitTypes.map((u) => <li key={u.id} className="flex justify-between gap-3"><span>{u.quantity} × {u.name}{u.phase && <span className="text-slate"> · {u.phase}</span>}</span><span className="tabular-nums text-silver">{u.subtotal !== undefined && money(u.subtotal)}</span></li>)}</ul>
            {!!q.pricing.phases?.length && <ul className="mt-3 space-y-1 border-t border-white/10 pt-3 text-sm">{q.pricing.phases.map((x) => <li key={x.name} className="flex justify-between"><span>Phase: {x.name}</span><span className="tabular-nums">{money(x.subtotal)}</span></li>)}</ul>}</div>}
          <BomTable pricing={q.pricing} edit={edit} />
        </div>
        <aside className={`${card} h-fit`}><PriceSummary pricing={q.pricing} fx={q.fx} /></aside>
      </div>
      {(q.terms || q.exclusions) && <div className="space-y-2 text-xs text-slate">{q.terms && <p className="whitespace-pre-wrap">{q.terms}</p>}{q.exclusions && <p className="whitespace-pre-wrap">Exclusions: {q.exclusions}</p>}</div>}
    </div>
  )
}

export function Comments({ items, onSend }: { items: Quote['comments']; onSend?: (text: string) => Promise<unknown> }) {
  const [text, setText] = useState(''), [busy, setBusy] = useState(false)
  return (
    <section className={`${card} no-print`} aria-label="Messages">
      <h3 className="mb-3 text-xs uppercase tracking-[0.14em] text-silver">Messages</h3>
      <ul className="space-y-3 text-sm">{items.map((c, i) => <li key={i} className="rounded-xl bg-midnight/60 p-3"><div className="text-xs text-slate">{c.by}{c.staff && ' · TAC'} · {new Date(c.at).toLocaleString('en-GB')}</div><p className="mt-1 whitespace-pre-wrap">{c.text}</p></li>)}{!items.length && <li className="text-slate">No messages yet.</li>}</ul>
      {onSend && <form className="mt-3 flex gap-2" onSubmit={async (e) => { e.preventDefault(); setBusy(true); try { await onSend(text); setText('') } finally { setBusy(false) } }}>
        <input aria-label="Write a message" value={text} maxLength={1500} onChange={(e) => setText(e.target.value)} placeholder="Write a message…" className={field} /><button className={small} disabled={busy || !text.trim()}>Send</button></form>}
    </section>
  )
}

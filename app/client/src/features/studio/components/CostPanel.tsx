import { useState } from 'react'
import { aed, groupColor, type Estimate, type Group } from '../../../shared/data/catalog'

/** Itemised cost estimate: by item, room and category. Clearly labelled as an estimate. */
export default function CostPanel({ e, compact = false }: { e: Estimate | null; compact?: boolean }) {
  const [tab, setTab] = useState<'items' | 'rooms' | 'cats'>('items')
  if (!e) return <p className="text-sm text-slate">Calculating…</p>
  const empty = e.items.length === 0
  return (
    <section aria-label="Cost estimate" className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
      <div className="flex items-baseline justify-between"><h3 className="text-xs uppercase tracking-[0.16em] text-silver">Estimated cost</h3><span className="rounded-full border border-amber-300/40 px-2 py-0.5 text-[0.65rem] text-amber-300">Estimate</span></div>
      <div className="mt-2 font-display text-3xl tabular-nums text-accent">{aed(e.total)}</div>
      <p className="text-xs text-slate">incl. {Math.round(e.vatRate * 100)}% VAT · final price is confirmed in TAC’s quotation</p>
      {!empty && <>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between text-silver"><dt>Smart devices</dt><dd className="tabular-nums">{aed(e.devices)}</dd></div>
          <div className="flex justify-between text-silver"><dt>Installation &amp; wiring</dt><dd className="tabular-nums">{aed(e.installation)}</dd></div>
          <div className="flex justify-between text-silver"><dt>VAT ({Math.round(e.vatRate * 100)}%)</dt><dd className="tabular-nums">{aed(e.vat)}</dd></div>
        </dl>
        {!compact && <>
          <div className="mt-4 flex gap-1.5 text-xs">{([['items', 'Products'], ['rooms', 'By room'], ['cats', 'By category']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`rounded-full border px-3 py-1 ${tab === k ? 'border-accent bg-accent/15 text-accent' : 'border-white/15 text-silver'}`}>{l}</button>))}</div>
          <ul className="mt-3 max-h-60 space-y-2 overflow-y-auto pr-1 text-sm">
            {tab === 'items' && e.items.map((i) => <li key={i.id} className="flex justify-between gap-3"><span className="min-w-0 truncate" style={{ color: groupColor[i.group as Group] }}>{i.name} <span className="text-slate">×{i.qty}</span></span><span className="shrink-0 whitespace-nowrap tabular-nums text-silver">{aed(i.subtotal + i.install)}</span></li>)}
            {tab === 'rooms' && e.byRoom.map((r) => <li key={r.id} className="flex justify-between gap-3"><span className="truncate">{r.room} <span className="text-slate">· {r.qty} items</span></span><span className="shrink-0 whitespace-nowrap tabular-nums text-silver">{aed(r.total)}</span></li>)}
            {tab === 'cats' && e.byCategory.map((c) => <li key={c.group} className="flex justify-between gap-3"><span style={{ color: groupColor[c.group as Group] }}>{c.group} <span className="text-slate">· {c.qty}</span></span><span className="shrink-0 whitespace-nowrap tabular-nums text-silver">{aed(c.total)}</span></li>)}
          </ul></>}
        {e.unpriced.length > 0 && <p className="mt-3 text-xs text-amber-300">Some items have no price yet and are not included; TAC will price them in the quotation.</p>}
      </>}
      {empty && <p className="mt-3 text-sm text-slate">Add smart devices to see the estimate.</p>}
    </section>
  )
}

// Pricing admin: rates, tiers and discount limits; package rules; audit log. No code changes needed to reprice.
import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { api } from '../../../shared/lib/api'
import { pretty } from '../../quotations/lib/quote'
import { roomTypes } from '../../../shared/data/catalog'
import type { Product } from '../../../shared/lib/products'
import { Field, card, field, small } from '../../quotations/components/ui'

type Rule = { key: string; roomType: string; category: string; level: string; items: { productId: string; qty: number }[]; starter?: boolean }
type Settings = {
  publicEstimates: boolean; cablingPct: { wired: number; wireless: number }; programmingPerDevice: number; commissioningPerUnit: number
  marginPct: { retail: number; trade: number; partner: number }; amcPct: number; volumeTiers: { minUnits: number; discountPct: number }[]
  salesDiscountLimitPct: number; maxDiscountPct: number; depositPct: number; smart: { kwhPerSqft: number; tariff: number; saving: Record<'lighting' | 'climate' | 'curtains' | 'energy', number> }; validityDays: number; trn: string; terms: string; exclusions: string
  fx: { USD: number | null; EUR: number | null; asOf: string }; popularLevel: string; bestValueLevel: string
}
type Data = { settings: Settings; rules: Rule[]; audit: { at: string; by: string; action: string; target: string }[] }
const LEVELS = ['essential', 'comfort', 'luxury'], CONTROLS = ['app', 'voice', 'panels', 'all']
const CATS = ['lighting', 'climate', 'curtains', 'security', 'audio', 'energy', 'gate', 'controls']
const roomLabel = (t: string) => (t === '*' ? 'Any room' : t === 'property' ? 'Whole home' : roomTypes.find((r) => r.id === t)?.label ?? t)

export default function PricingAdmin() {
  const [data, setData] = useState<Data | null>(null), [products, setProducts] = useState<Product[]>([]), [err, setErr] = useState(''), [tab, setTab] = useState<'settings' | 'rules' | 'audit'>('settings')
  const load = useCallback(() => Promise.all([api<Data>('/api/admin/pricing'), api<{ items: Product[] }>('/api/admin/products')]).then(([d, p]) => { setData(d); setProducts(p.items) }).catch((e) => setErr(e.message)), [])
  useEffect(() => { load() }, [load])
  if (!data) return err ? <p role="alert" className="text-red-400">{err}</p> : <Loader2 className="animate-spin text-cyan" />
  const starters = data.rules.filter((r) => r.starter).length
  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-3xl">Pricing &amp; packages</h1><p className="mt-2 max-w-2xl text-sm text-silver">Changes apply to new quotations and new versions only. Quotations already issued keep their prices.</p></div>
      {starters > 0 && <p role="status" className="rounded-xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">{starters} package rules are still starter placeholders. Check them, and the product prices, before showing prices to guests.</p>}
      <div className="flex gap-2">{(['settings', 'rules', 'audit'] as const).map((t) => <button key={t} onClick={() => setTab(t)} className={`rounded-full border px-5 py-2 text-sm ${tab === t ? 'border-cyan bg-cyan/15 text-cyan' : 'border-white/15 text-silver'}`}>{{ settings: 'Rates & discounts', rules: 'Package rules', audit: 'Audit log' }[t]}</button>)}</div>
      {tab === 'settings' && <SettingsForm initial={data.settings} done={load} />}
      {tab === 'rules' && <Rules rules={data.rules} products={products} done={load} />}
      {tab === 'audit' && <ul className="space-y-2 text-sm">{data.audit.map((a, i) => <li key={i} className="flex flex-wrap gap-x-4 border-b border-white/10 pb-2"><span className="text-slate">{new Date(a.at).toLocaleString('en-GB')}</span><span>{a.action}</span><span className="text-silver">{a.target}</span><span className="ml-auto text-slate">{a.by}</span></li>)}{!data.audit.length && <li className="text-slate">Nothing recorded yet.</li>}</ul>}
    </div>
  )
}

function SettingsForm({ initial, done }: { initial: Settings; done: () => void }) {
  const [s, setS] = useState(initial), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false)
  const set = (p: Partial<Settings>) => { setS({ ...s, ...p }); setMsg('') }
  const num = (name: string, value: number, on: (n: number) => void, step = 0.01) => <Field name={name}><input type="number" min={0} step={step} className={field} value={value} onChange={(e) => on(Number(e.target.value))} /></Field>
  const save = async () => {
    setBusy(true); setMsg('')
    try { await api('/api/admin/pricing/settings', { method: 'PUT', body: s }); setMsg('Saved.'); done() } catch (e) { setMsg((e as Error).message) } finally { setBusy(false) }
  }
  return (
    <div className="space-y-5">
      <label className={`${card} flex items-start gap-3 text-sm`}><input type="checkbox" className="mt-1 h-4 w-4 accent-cyan" checked={s.publicEstimates} onChange={(e) => set({ publicEstimates: e.target.checked })} /><span><b>Show indicative prices to guests</b><span className="block text-silver">When off, visitors can configure and see device quantities; prices appear after sign-in.</span></span></label>
      <div className={`${card} grid gap-4 sm:grid-cols-2 lg:grid-cols-3`}>
        {num('Cabling allowance — wired (%)', s.cablingPct.wired, (n) => set({ cablingPct: { ...s.cablingPct, wired: n } }))}
        {num('Cabling allowance — wireless (%)', s.cablingPct.wireless, (n) => set({ cablingPct: { ...s.cablingPct, wireless: n } }))}
        {num('Programming per device (AED)', s.programmingPerDevice, (n) => set({ programmingPerDevice: n }))}
        {num('Commissioning per home / unit (AED)', s.commissioningPerUnit, (n) => set({ commissioningPerUnit: n }))}
        {(['retail', 'trade', 'partner'] as const).map((k) => <div key={k}>{num(`Margin — ${k} (%)`, s.marginPct[k], (n) => set({ marginPct: { ...s.marginPct, [k]: n } }))}</div>)}
        {num('Annual maintenance (% of devices, 0 = not offered)', s.amcPct, (n) => set({ amcPct: n }))}
        {num('Sales discount limit without approval (%)', s.salesDiscountLimitPct, (n) => set({ salesDiscountLimitPct: n }))}
        {num('Maximum discount for anyone (%)', s.maxDiscountPct, (n) => set({ maxDiscountPct: n }))}
        {num('Quotation validity (days)', s.validityDays, (n) => set({ validityDays: n }), 1)}
        <Field name="TAC TRN (15 digits)"><input className={field} maxLength={15} value={s.trn} onChange={(e) => set({ trn: e.target.value })} /></Field>
        {(['USD', 'EUR'] as const).map((c) => <Field key={c} name={`1 AED in ${c} (empty = hide)`}><input type="number" min={0} step="any" className={field} value={s.fx[c] ?? ''} onChange={(e) => set({ fx: { ...s.fx, [c]: e.target.value === '' ? null : Number(e.target.value) } })} /></Field>)}
        <Field name="Exchange rate date / source"><input className={field} maxLength={40} value={s.fx.asOf} onChange={(e) => set({ fx: { ...s.fx, asOf: e.target.value } })} /></Field>
        {([['popularLevel', '“Most popular” tag'], ['bestValueLevel', '“Best value” tag']] as const).map(([k, n]) => <Field key={k} name={n}><select className={field} value={s[k]} onChange={(e) => set({ [k]: e.target.value })}><option value="">No tag</option>{LEVELS.map((l) => <option key={l} value={l}>{pretty(l)}</option>)}</select></Field>)}
      </div>
      <div className={`${card} grid gap-4 sm:grid-cols-2 lg:grid-cols-3`}>
        <h3 className="text-xs uppercase tracking-[0.14em] text-silver sm:col-span-2 lg:col-span-3">Smart Score savings assumptions (illustrative)</h3>
        {num('kWh per sq ft per month', s.smart.kwhPerSqft, (n) => set({ smart: { ...s.smart, kwhPerSqft: n } }))}
        {num('Electricity tariff (AED / kWh)', s.smart.tariff, (n) => set({ smart: { ...s.smart, tariff: n } }))}
        {(['lighting', 'climate', 'curtains', 'energy'] as const).map((k) => <div key={k}>{num(`Saving from ${k} (%)`, s.smart.saving[k], (n) => set({ smart: { ...s.smart, saving: { ...s.smart.saving, [k]: n } } }))}</div>)}
        {num('Deposit % (demo payments)', s.depositPct, (n) => set({ depositPct: n }))}
      </div>
      <div className={card}><h3 className="mb-3 text-xs uppercase tracking-[0.14em] text-silver">Volume discount tiers (by number of units)</h3>
        <ul className="space-y-2">{s.volumeTiers.map((t, i) => { const upd = (p: Partial<typeof t>) => set({ volumeTiers: s.volumeTiers.map((x, j) => (j === i ? { ...x, ...p } : x)) }); return <li key={i} className="flex flex-wrap items-center gap-3 text-sm">From <input aria-label="Minimum units" type="number" min={1} className={`${field} !w-28`} value={t.minUnits} onChange={(e) => upd({ minUnits: Number(e.target.value) })} /> units: <input aria-label="Discount percent" type="number" min={0} max={100} className={`${field} !w-24`} value={t.discountPct} onChange={(e) => upd({ discountPct: Number(e.target.value) })} /> % <button aria-label="Remove tier" className="text-slate hover:text-red-300" onClick={() => set({ volumeTiers: s.volumeTiers.filter((_, j) => j !== i) })}><Trash2 size={15} /></button></li> })}</ul>
        <button className={`${small} mt-3`} disabled={s.volumeTiers.length >= 12} onClick={() => set({ volumeTiers: [...s.volumeTiers, { minUnits: (s.volumeTiers.at(-1)?.minUnits ?? 0) + 10, discountPct: 0 }] })}><Plus size={14} className="mr-1 inline" />Add tier</button></div>
      <div className={`${card} grid gap-4 lg:grid-cols-2`}>
        <Field name="Terms shown on quotations"><textarea rows={4} className={field} value={s.terms} onChange={(e) => set({ terms: e.target.value })} /></Field>
        <Field name="Exclusions"><textarea rows={4} className={field} value={s.exclusions} onChange={(e) => set({ exclusions: e.target.value })} /></Field>
      </div>
      <div className="flex items-center gap-4"><button className="btn btn-primary disabled:opacity-60" disabled={busy} onClick={save}>Save settings</button>{msg && <span role="status" className="text-sm text-silver">{msg}</span>}</div>
    </div>
  )
}

function Rules({ rules, products, done }: { rules: Rule[]; products: Product[]; done: () => void }) {
  const empty = { key: '', roomType: '*', category: 'lighting', level: 'essential', items: [] as Rule['items'] }
  const [draft, setDraft] = useState<Rule>(empty), [msg, setMsg] = useState(''), [cat, setCat] = useState('lighting')
  const name = (id: string) => products.find((p) => p.id === id)?.name ?? id
  const set = (p: Partial<Rule>) => { setDraft({ ...draft, ...p }); setMsg('') }
  const existing = rules.find((r) => r.roomType === draft.roomType && r.category === draft.category && r.level === draft.level)
  const save = async () => { try { await api('/api/admin/pricing/rules', { method: 'PUT', body: draft }); setMsg('Published.'); setCat(draft.category); done() } catch (e) { setMsg((e as Error).message) } }
  const del = async (r: Rule) => { if (!confirm(`Delete the rule for ${roomLabel(r.roomType)} · ${r.category} · ${r.level}?`)) return; try { await api(`/api/admin/pricing/rules?key=${encodeURIComponent(r.key)}`, { method: 'DELETE' }); done() } catch (e) { setMsg((e as Error).message) } }
  return (
    <div className="space-y-5">
      <p className="text-sm text-silver">A rule says which products one answer adds. A rule for a specific room replaces the “Any room” rule. A rule with no products means “nothing at this level”.</p>
      <div className={`${card} space-y-4`}>
        <h3 className="font-display">{existing ? 'Edit rule' : 'New rule'}</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field name="Category"><select className={field} value={draft.category} onChange={(e) => { const c = e.target.value; set({ category: c, level: c === 'controls' ? 'app' : 'essential', roomType: c === 'controls' ? 'property' : draft.roomType }) }}>{CATS.map((c) => <option key={c} value={c}>{pretty(c)}</option>)}</select></Field>
          <Field name="Applies to"><select className={field} value={draft.roomType} disabled={draft.category === 'controls'} onChange={(e) => set({ roomType: e.target.value })}>{['*', 'property', ...roomTypes.map((r) => r.id)].map((t) => <option key={t} value={t}>{roomLabel(t)}</option>)}</select></Field>
          <Field name={draft.category === 'controls' ? 'Control choice' : 'Package level'}><select className={field} value={draft.level} onChange={(e) => set({ level: e.target.value })}>{(draft.category === 'controls' ? CONTROLS : LEVELS).map((l) => <option key={l} value={l}>{pretty(l)}</option>)}</select></Field>
        </div>
        {existing && <button className="text-sm text-cyan hover:underline" onClick={() => set({ items: existing.items.map((i) => ({ ...i })) })}>Load the current products of this rule</button>}
        <ul className="space-y-2">{draft.items.map((i) => <li key={i.productId} className="flex items-center gap-3 text-sm"><input aria-label={`Quantity of ${name(i.productId)}`} type="number" min={1} max={100} className={`${field} !w-20`} value={i.qty} onChange={(e) => set({ items: draft.items.map((x) => (x.productId === i.productId ? { ...x, qty: Number(e.target.value) } : x)) })} />× {name(i.productId)}<button aria-label="Remove product" className="ml-auto text-slate hover:text-red-300" onClick={() => set({ items: draft.items.filter((x) => x.productId !== i.productId) })}><Trash2 size={15} /></button></li>)}</ul>
        <select aria-label="Add product to rule" className={`${field} max-w-xs`} value="" onChange={(e) => e.target.value && set({ items: [...draft.items, { productId: e.target.value, qty: 1 }] })}><option value="">+ Add product…</option>{products.filter((p) => !draft.items.some((i) => i.productId === p.id)).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <div className="flex items-center gap-4"><button className="btn btn-primary !py-2" onClick={save}>Publish rule</button><button className="text-sm text-slate hover:text-cyan" onClick={() => { setDraft(empty); setMsg('') }}>Clear</button>{msg && <span role="status" className="text-sm text-silver">{msg}</span>}</div>
      </div>
      <div className="flex flex-wrap gap-2">{CATS.map((c) => <button key={c} onClick={() => setCat(c)} className={`rounded-full border px-4 py-1.5 text-sm ${cat === c ? 'border-cyan bg-cyan/15 text-cyan' : 'border-white/15 text-silver'}`}>{pretty(c)} ({rules.filter((r) => r.category === c).length})</button>)}</div>
      <ul className="space-y-2">{rules.filter((r) => r.category === cat).map((r) => <li key={r.key} className={`${card} flex flex-wrap items-center gap-x-4 gap-y-1 !p-4 text-sm`}><b>{roomLabel(r.roomType)}</b><span className="text-cyan">{pretty(r.level)}</span><span className="text-silver">{r.items.map((i) => `${i.qty} × ${name(i.productId)}`).join(', ') || 'Nothing'}</span>{r.starter && <span className="rounded-full border border-amber-300/40 px-2 text-xs text-amber-300">Starter</span>}
        <span className="ml-auto flex gap-3"><button className="text-cyan hover:underline" onClick={() => { setDraft({ ...r, items: r.items.map((i) => ({ ...i })) }); setMsg(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Edit</button><button className="text-slate hover:text-red-300" onClick={() => del(r)}>Delete</button></span></li>)}
        {!rules.some((r) => r.category === cat) && <li className="text-sm text-amber-300">No rules: choosing this category shows “TAC will quote separately”.</li>}</ul>
    </div>
  )
}

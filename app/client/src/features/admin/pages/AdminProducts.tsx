import { useCallback, useEffect, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import ProductForm from '../../demo/components/ProductForm'
import { api } from '../../../shared/lib/api'
import { groupColor, type Group } from '../../../shared/data/catalog'
import type { Product } from '../../../shared/lib/products'

const num = 'w-28 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-right text-sm tabular-nums text-white outline-none focus:border-accent'

export default function ProductsAdmin() {
  const [items, setItems] = useState<Product[] | null>(null), [err, setErr] = useState('')
  const [edit, setEdit] = useState<Product | 'new' | null>(null)
  const load = useCallback(() => api<{ items: Product[] }>('/api/admin/products').then((d) => setItems(d.items)).catch((e) => setErr(e.message)), [])
  useEffect(() => { load() }, [load])
  const unpriced = items?.filter((p) => p.active && !(p.unitPrice > 0)).length ?? 0
  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-3xl">Products &amp; prices</h1>
        <p className="mt-2 max-w-2xl text-sm text-silver">Prices here drive the customer’s live estimate (AED, before 5% VAT). Installation and accessories are charged per unit. A trade or partner price of 0 means the retail price applies. Customers see these as <b>estimates</b> until you send a quotation.</p></div>
      <button className="btn btn-primary !py-2.5" onClick={() => setEdit('new')}>New product</button>
      {edit && <ProductForm key={edit === 'new' ? 'new' : edit.id} product={edit === 'new' ? null : edit} close={() => setEdit(null)} saved={() => { setEdit(null); load() }} />}
      {unpriced > 0 && <p role="status" className="rounded-xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">{unpriced} active product{unpriced > 1 && 's have'} no price. The starter prices were placeholders — please review every row.</p>}
      {err && <p role="alert" className="text-red-400">{err}</p>}
      {!items && !err && <Loader2 className="animate-spin text-accent" />}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="bg-white/[.04] text-xs uppercase tracking-wider text-slate"><tr><th className="p-4">Product</th><th>Retail price</th><th>Install / unit</th><th>Trade</th><th>Partner</th><th>Accessories</th><th>Connectivity</th><th>Active</th><th /></tr></thead>
          <tbody>{items?.map((p) => <Row key={p.id} p={p} onSaved={load} onEdit={() => { setEdit(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />)}</tbody>
        </table>
      </div>
    </div>
  )
}

function Row({ p, onSaved, onEdit }: { p: Product; onSaved: () => void; onEdit: () => void }) {
  const [unit, setUnit] = useState(String(p.unitPrice)), [inst, setInst] = useState(String(p.installPrice)), [active, setActive] = useState(p.active), [state, setState] = useState<'' | 'saving' | 'saved' | 'err'>('')
  const [trade, setTrade] = useState(String(p.prices?.trade ?? 0)), [partner, setPartner] = useState(String(p.prices?.partner ?? 0)), [acc, setAcc] = useState(String(p.accessoryPrice ?? 0))
  const extra = Number(trade) !== (p.prices?.trade ?? 0) || Number(partner) !== (p.prices?.partner ?? 0) || Number(acc) !== (p.accessoryPrice ?? 0)
  const dirty = extra || Number(unit) !== p.unitPrice || Number(inst) !== p.installPrice || active !== p.active
  const save = async () => {
    setState('saving')
    try { await api(`/api/admin/products/${p.id}`, { method: 'PUT', body: { unitPrice: Number(unit), installPrice: Number(inst), tradePrice: Number(trade), partnerPrice: Number(partner), accessoryPrice: Number(acc), active } }); setState('saved'); onSaved() } catch { setState('err') }
  }
  return (
    <tr className="border-t border-white/10">
      <td className="p-4"><div style={{ color: groupColor[p.group as Group] }}>{p.name}</div><div className="text-xs text-slate">{p.group} · {p.sku || 'no SKU'} · {p.protocol}</div><button onClick={onEdit} className="text-xs text-accent hover:underline">Details</button></td>
      <td><input aria-label={`Unit price of ${p.name}`} type="number" min="0" step="0.01" inputMode="decimal" value={unit} onChange={(e) => { setUnit(e.target.value); setState('') }} className={num} /></td>
      <td><input aria-label={`Installation price of ${p.name}`} type="number" min="0" step="0.01" inputMode="decimal" value={inst} onChange={(e) => { setInst(e.target.value); setState('') }} className={num} /></td>
      {([['Trade price', trade, setTrade], ['Partner price', partner, setPartner], ['Accessory price', acc, setAcc]] as const).map(([n, v, on]) => <td key={n}><input aria-label={`${n} of ${p.name}`} type="number" min="0" step="0.01" inputMode="decimal" value={v} onChange={(e) => { on(e.target.value); setState('') }} className={num} /></td>)}
      <td className="text-silver">{p.connectivity.join(' / ') || '—'}</td>
      <td><input aria-label={`${p.name} active`} type="checkbox" checked={active} onChange={(e) => { setActive(e.target.checked); setState('') }} className="h-4 w-4 accent-accent" /></td>
      <td className="pr-4 text-right"><button disabled={!dirty || state === 'saving'} onClick={save} className="text-sm text-accent hover:underline disabled:opacity-40">{state === 'saving' ? 'Saving…' : 'Save'}</button>
        {state === 'saved' && !dirty && <Check size={14} className="ml-2 inline text-emerald-300" />}{state === 'err' && <span className="ml-2 text-red-400">Failed</span>}</td>
    </tr>
  )
}

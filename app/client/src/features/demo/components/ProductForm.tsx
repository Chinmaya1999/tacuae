import { useState, type FormEvent } from 'react'
import { api } from '../../../shared/lib/api'
import type { Product } from '../../../shared/lib/products'
import { Field, card, field, small } from '../../quotations/components/ui'

const GROUPS = ['Lighting', 'Air Conditioning', 'Curtains', 'Security', 'Energy', 'Room Controls']
export default function ProductForm({ product, close, saved }: { product: Product | null; close: () => void; saved: () => void }) {
  const [f, setF] = useState({ name: product?.name ?? '', group: product?.group ?? 'Lighting', sku: product?.sku ?? '', protocol: product?.protocol ?? '', specs: product?.specs ?? '', desc: product?.desc ?? '', imageUrl: product?.imageUrl ?? '', datasheetUrl: product?.datasheetUrl ?? '', model3d: product?.model3d ?? '', unitPrice: '0', installPrice: '0' })
  const [err, setErr] = useState('')
  const input = (k: keyof typeof f, name: string, extra: object = {}) => <Field name={name}><input className={field} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} {...extra} /></Field>
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr('')
    const { unitPrice, installPrice, group, ...rest } = f
    try {
      await api(product ? `/api/admin/products/${product.id}` : '/api/admin/products', { method: product ? 'PUT' : 'POST', body: product ? rest : { ...rest, group, unitPrice: Number(unitPrice), installPrice: Number(installPrice) } })
      saved()
    } catch (x) { setErr((x as Error).message) }
  }
  return (
    <form onSubmit={submit} className={`${card} grid gap-3 sm:grid-cols-2 lg:grid-cols-3`}>
      {input('name', 'Name', { required: true })}
      <Field name="Category"><select className={field} disabled={!!product} value={f.group} onChange={(e) => setF({ ...f, group: e.target.value })}>{GROUPS.map((g) => <option key={g}>{g}</option>)}</select></Field>
      {input('sku', 'SKU')}{input('protocol', 'Protocol')}{input('specs', 'Specifications')}{input('desc', 'Description')}
      {input('imageUrl', 'Image link')}{input('datasheetUrl', 'Datasheet link')}{input('model3d', '3D model link (GLB)')}
      {!product && <>{input('unitPrice', 'Retail price (AED)', { type: 'number', min: 0, step: '0.01' })}{input('installPrice', 'Installation (AED)', { type: 'number', min: 0, step: '0.01' })}</>}
      {product?.imageUrl && <img src={product.imageUrl} alt={product.name} className="h-20 rounded-lg object-cover" />}
      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3"><button className="btn btn-primary !py-2">{product ? 'Save details' : 'Create product'}</button><button type="button" className={small} onClick={close}>Cancel</button>{err && <span role="alert" className="text-sm text-red-400">{err}</span>}</div>
    </form>
  )
}

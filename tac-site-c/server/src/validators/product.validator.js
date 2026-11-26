import { clean, multiline } from '../utils/sanitize.js'
import ApiError from '../utils/ApiError.js'

const CONN = ['wired', 'wireless']
const price = (v, label) => {
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0 || n > 1e7) throw new ApiError(400, `${label} must be a number between 0 and 10,000,000.`)
  return Math.round(n * 100) / 100
}
const link = (v, label) => {
  const s = clean(v, 300)
  if (s && !/^(https:\/\/|\/(?!\/))/.test(s)) throw new ApiError(400, `${label} must be an https:// link or a site path starting with /.`)
  return s
}
export function validateProductCreate({ body: b = {} }) {
  const name = clean(b.name, 80), group = clean(b.group, 40)
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
  if (name.length < 2 || !id || !group) throw new ApiError(400, 'Enter a product name and category.')
  const { set } = validateProductPatch({ params: { id }, body: { unitPrice: 0, installPrice: 0, connectivity: CONN, ...b, active: b.active !== false } })
  return { protocol: '', specs: '', desc: '', ...set, id, name, group }
}
export function validateProductPatch({ params, body: b = {} }) {
  if (!/^[a-z0-9-]{1,40}$/.test(params.id)) throw new ApiError(400, 'Invalid product.')
  const set = {}
  if (b.unitPrice !== undefined) set.unitPrice = price(b.unitPrice, 'Price')
  if (b.installPrice !== undefined) set.installPrice = price(b.installPrice, 'Installation price')
  if (b.accessoryPrice !== undefined) set.accessoryPrice = price(b.accessoryPrice, 'Accessory price')
  // 0 = no separate price for that segment (retail applies)
  if (b.tradePrice !== undefined) set['prices.trade'] = price(b.tradePrice, 'Trade price')
  if (b.partnerPrice !== undefined) set['prices.partner'] = price(b.partnerPrice, 'Partner price')
  if (b.name !== undefined && clean(b.name, 80).length >= 2) set.name = clean(b.name, 80)
  if (b.sku !== undefined) set.sku = clean(b.sku, 60)
  for (const [k, label] of [['imageUrl', 'Image'], ['datasheetUrl', 'Datasheet'], ['model3d', '3D model']]) if (b[k] !== undefined) set[k] = link(b[k], label)
  if (b.active !== undefined) set.active = Boolean(b.active)
  if (b.connectivity !== undefined) set.connectivity = (Array.isArray(b.connectivity) ? b.connectivity : []).filter((c) => CONN.includes(c))
  if (b.protocol !== undefined) set.protocol = clean(b.protocol, 60)
  if (b.specs !== undefined) set.specs = clean(b.specs, 200)
  if (b.desc !== undefined) set.desc = multiline(b.desc, 400)
  return { id: params.id, set }
}

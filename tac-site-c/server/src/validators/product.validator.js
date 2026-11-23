import { clean, multiline } from '../utils/sanitize.js'
import ApiError from '../utils/ApiError.js'

const CONN = ['wired', 'wireless']
const price = (v, label) => {
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0 || n > 1e7) throw new ApiError(400, `${label} must be a number between 0 and 10,000,000.`)
  return Math.round(n * 100) / 100
}
export function validateProductPatch({ params, body: b = {} }) {
  if (!/^[a-z0-9-]{1,40}$/.test(params.id)) throw new ApiError(400, 'Invalid product.')
  const set = {}
  if (b.unitPrice !== undefined) set.unitPrice = price(b.unitPrice, 'Price')
  if (b.installPrice !== undefined) set.installPrice = price(b.installPrice, 'Installation price')
  if (b.active !== undefined) set.active = Boolean(b.active)
  if (b.connectivity !== undefined) set.connectivity = (Array.isArray(b.connectivity) ? b.connectivity : []).filter((c) => CONN.includes(c))
  if (b.protocol !== undefined) set.protocol = clean(b.protocol, 60)
  if (b.specs !== undefined) set.specs = clean(b.specs, 200)
  if (b.desc !== undefined) set.desc = multiline(b.desc, 400)
  return { id: params.id, set }
}

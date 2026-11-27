import { CONTENT_TYPES, ENQUIRY_STATUS } from '../constants/index.js'
import { clean, isEmail, multiline } from '../utils/sanitize.js'
import ApiError from '../utils/ApiError.js'

/** Bots submit instantly: reject forms sent in under 2.5 seconds. */
export const tooFast = (req, res, next) => (typeof req.body?.elapsed === 'number' && req.body.elapsed < 2500 ? res.status(400).json({ ok: false }) : next())

export function validateEnquiry({ body: b = {} }) {
  const d = { name: clean(b.name, 120), company: clean(b.company, 120), email: clean(b.email, 160), phone: clean(b.phone, 40),
    service: clean(b.service, 120), projectType: clean(b.projectType, 80), message: multiline(b.message, 4000) }
  if (d.name.length < 2 || !isEmail(d.email) || d.message.length < 10) throw new ApiError(400, 'Invalid input')
  return d
}
export function validateEnquiryPatch({ body: b = {} }) {
  const p = {}
  if (b.status !== undefined) { if (!ENQUIRY_STATUS.includes(b.status)) throw new ApiError(400, 'Invalid status.'); p.status = b.status }
  if (b.note !== undefined) p.note = String(b.note).slice(0, 2000)
  return p
}
export function validateContent({ params, body }) {
  if (!CONTENT_TYPES.includes(params.type) || !/^[a-z0-9-]{1,80}$/.test(params.slug)) throw new ApiError(400, 'Invalid content item.')
  return { type: params.type, slug: params.slug, text: multiline(body?.description, 3000) }
}

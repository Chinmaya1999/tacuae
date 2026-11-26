import { clean, isEmail, multiline } from '../utils/sanitize.js'
import { TEAM_ROLES } from '../services/team.service.js'
import ApiError from '../utils/ApiError.js'

const bad = (m) => new ApiError(400, m)
export const BOOKING_TYPES = ['callback', 'video consultation', 'showroom visit', 'site survey']
export const SLOTS = ['09:00', '11:00', '13:00', '15:00', '17:00']
const uaeMobile = (v) => {
  const s = String(v ?? '').replace(/[\s-]/g, '').replace(/^0(?=5)/, '+971')
  if (!/^\+9715\d{8}$/.test(s)) throw bad('Enter a UAE mobile number, e.g. 050 123 4567.')
  return s
}
export const validatePhone = ({ body: b = {} }) => ({ phone: uaeMobile(b.phone) })
export const validateOtp = ({ body: b = {} }) => ({ phone: uaeMobile(b.phone), code: String(b.code ?? '') })
export function validateProvider({ body: b = {} }) {
  if (!['google', 'apple'].includes(b.provider)) throw bad('Unknown sign-in provider.')
  return { provider: b.provider }
}
export function validateBooking({ body: b = {} }) {
  const d = { type: BOOKING_TYPES.includes(b.type) ? b.type : null, date: String(b.date ?? ''), slot: SLOTS.includes(b.slot) ? b.slot : null, name: clean(b.name, 100), phone: clean(b.phone, 40), email: clean(b.email, 160), notes: multiline(b.notes, 1000) }
  if (!d.type || !d.slot) throw bad('Choose what you need and a time.')
  const t = /^\d{4}-\d{2}-\d{2}$/.test(d.date) ? Date.parse(d.date) : NaN
  if (!(t >= Date.now() - 86400_000 && t <= Date.now() + 365 * 86400_000)) throw bad('Choose a date within the next year.')
  if (d.name.length < 2 || d.phone.replace(/\D/g, '').length < 7) throw bad('Enter your name and phone number.')
  if (d.email && !isEmail(d.email)) throw bad('Check the email address.')
  return d
}
export function validateBookingStatus({ body: b = {} }) {
  if (!['requested', 'confirmed', 'done', 'cancelled'].includes(b.status)) throw bad('Invalid status.')
  return { status: b.status }
}
export function validateMember({ body: b = {} }) {
  const name = clean(b.name, 100), email = clean(b.email, 160).toLowerCase()
  if (name.length < 2 || !isEmail(email) || !TEAM_ROLES.includes(b.teamRole)) throw bad('Enter a name, a valid email and a role.')
  return { name, email, teamRole: b.teamRole }
}
export function validateMemberPatch({ body: b = {} }) {
  const s = {}
  if (b.teamRole !== undefined) { if (!TEAM_ROLES.includes(b.teamRole)) throw bad('Invalid role.'); s.teamRole = b.teamRole }
  if (b.active !== undefined) s.active = Boolean(b.active)
  return s
}

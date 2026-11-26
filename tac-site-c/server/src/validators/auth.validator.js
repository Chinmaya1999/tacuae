import { SECTORS, SELF_ROLES } from '../constants/index.js'
import { clean, isEmail } from '../utils/sanitize.js'
import ApiError from '../utils/ApiError.js'

const bad = (m) => new ApiError(400, m)

export function validateRegister({ body: b = {} }) {
  const name = clean(b.name, 120), email = clean(b.email, 160).toLowerCase()
  if (name.length < 2 || !isEmail(email)) throw bad('Please enter your name and a valid email.')
  if (typeof b.password !== 'string' || b.password.length < 8 || b.password.length > 200) throw bad('Password must be at least 8 characters.')
  const role = SELF_ROLES.includes(b.role) ? b.role : 'customer'
  // business details are optional at sign-up (TAC verifies them before trade pricing), but must be well-formed
  const trn = clean(b.trn, 20).replaceAll(' ', '')
  if (role === 'builder' && trn && !/^\d{15}$/.test(trn)) throw bad('A UAE TRN has 15 digits.')
  const business = role === 'builder' ? { tradeLicence: clean(b.tradeLicence, 60), trn, sector: SECTORS.includes(b.sector) ? b.sector : 'other' } : null
  return { name, email, password: b.password, role, company: clean(b.company, 120), phone: clean(b.phone, 40), business }
}
export const validateLogin = ({ body: b = {} }) => ({ email: clean(b.email, 160).toLowerCase(), password: typeof b.password === 'string' ? b.password : '' })
export function validatePasswordChange({ body: b = {} }) {
  if (typeof b.next !== 'string' || b.next.length < 8 || b.next.length > 200) throw bad('New password must be at least 8 characters.')
  return { current: typeof b.current === 'string' ? b.current : '', next: b.next }
}

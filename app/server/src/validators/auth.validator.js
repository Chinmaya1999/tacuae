import { SECTORS, SELF_ROLES } from '../constants/index.js'
import { clean, isEmail } from '../utils/sanitize.js'
import ApiError from '../utils/ApiError.js'

const bad = (m) => new ApiError(400, m)

const COMMON = new Set(['password', 'password1', 'password12', 'password123', 'password1234', 'passw0rd', '12345678', '123456789', '1234567890', '11111111', '00000000', 'qwerty123', 'qwertyuiop', 'abc12345', 'iloveyou', 'welcome1', 'welcome123', 'admin123', 'admin1234'])
const guessable = (pw, email = '') => COMMON.has(pw.toLowerCase()) || /^(.)\1+$/.test(pw) || (email && [email, email.split('@')[0]].includes(pw.toLowerCase()))
const tooCommon = 'That password is too easy to guess. Choose another one.'

export function validateRegister({ body: b = {} }) {
  const name = clean(b.name, 120), email = clean(b.email, 160).toLowerCase()
  if (name.length < 2 || !isEmail(email)) throw bad('Please enter your name and a valid email.')
  if (typeof b.password !== 'string' || b.password.length < 8 || b.password.length > 200) throw bad('Password must be at least 8 characters.')
  if (guessable(b.password, email)) throw bad(tooCommon)
  const role = SELF_ROLES.includes(b.role) ? b.role : 'customer'
  // business details are optional at sign-up (TAC verifies them before trade pricing), but must be well-formed
  const trn = clean(b.trn, 20).replaceAll(' ', '')
  if (role === 'builder' && trn && !/^\d{15}$/.test(trn)) throw bad('A UAE TRN has 15 digits.')
  const business = role === 'builder' ? { tradeLicence: clean(b.tradeLicence, 60), trn, sector: SECTORS.includes(b.sector) ? b.sector : 'other' } : null
  return { name, email, password: b.password, role, company: clean(b.company, 120), phone: clean(b.phone, 40), business }
}
export const validateLogin = ({ body: b = {} }) => ({ email: clean(b.email, 160).toLowerCase(), password: typeof b.password === 'string' ? b.password : '' })
export function validateGoogle({ body: b = {} }) {
  if (typeof b.credential !== 'string' || !b.credential || b.credential.length > 4096) throw bad('Google sign-in failed. Please try again.')
  return { credential: b.credential, role: SELF_ROLES.includes(b.role) ? b.role : 'customer' }
}
export function validatePhoneToken({ body: b = {} }) {
  if (typeof b.credential !== 'string' || !b.credential || b.credential.length > 4096) throw bad('Mobile verification failed. Please request a new code.')
  const name = clean(b.name, 120), email = clean(b.email, 160).toLowerCase()
  if ((name || email) && (name.length < 2 || !isEmail(email))) throw bad('Please enter your name and a valid email.')
  return { credential: b.credential, name, email, role: SELF_ROLES.includes(b.role) ? b.role : 'customer' }
}
/** Only these fields are self-editable: email, role, verification and price tier can never be set here. */
export function validateProfile({ body: b = {} }) {
  const name = clean(b.name, 120), phone = clean(b.phone, 40)
  if (name.length < 2) throw bad('Please enter your name.')
  if (phone && !/^\+?[\d\s()-]{6,}$/.test(phone)) throw bad('Please enter a valid phone number.')
  const trn = clean(b.trn, 20).replaceAll(' ', '')
  if (trn && !/^\d{15}$/.test(trn)) throw bad('A UAE TRN has 15 digits.')
  return { name, phone, company: clean(b.company, 120), business: { tradeLicence: clean(b.tradeLicence, 60), trn, sector: SECTORS.includes(b.sector) ? b.sector : 'other' } }
}
export function validatePasswordChange({ body: b = {} }) {
  if (typeof b.next !== 'string' || b.next.length < 8 || b.next.length > 200) throw bad('New password must be at least 8 characters.')
  if (guessable(b.next)) throw bad(tooCommon)
  return { current: typeof b.current === 'string' ? b.current : '', next: b.next }
}

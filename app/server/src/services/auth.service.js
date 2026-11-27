import crypto from 'node:crypto'
import { env } from '../config/env.js'
import { mongoEnabled } from '../config/database.js'
import * as User from '../models/user.model.js'
import { SELF_ROLES } from '../constants/index.js'
import { clean } from '../utils/sanitize.js'
import ApiError from '../utils/ApiError.js'

// ---- password hashing (scrypt, async so it never blocks the event loop) ----
const scrypt = (pw, salt) => new Promise((res, rej) => crypto.scrypt(pw, salt, 64, (e, k) => (e ? rej(e) : res(k))))
export async function hashPassword(pw) {
  const salt = crypto.randomBytes(16)
  return `${salt.toString('hex')}:${(await scrypt(String(pw), salt)).toString('hex')}`
}
export async function verifyPassword(pw, stored) {
  const [s, h] = String(stored).split(':')
  if (!s || !h) return false
  const a = await scrypt(String(pw), Buffer.from(s, 'hex')), b = Buffer.from(h, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export const publicUser = (u) => ({ id: String(u._id), name: u.name, email: u.email, role: u.role, company: u.company || '', phone: u.phone || '', active: u.active !== false, createdAt: u.createdAt,
  business: u.business || null, verified: u.verified === true, priceTier: u.priceTier || 'retail', teamRole: u.teamRole || '', google: Boolean(u.googleSub), verifiedPhone: u.verifiedPhone || '' })

export async function register({ name, email, password, role, company, phone, business }) {
  const now = new Date().toISOString()
  const doc = { name, email, role, company, phone, ...(role === 'builder' ? { business, verified: false, priceTier: 'retail' } : {}), active: true, hash: await hashPassword(password), pwChangedAt: now, createdAt: now }
  try { return await User.insert(doc) } catch (e) {
    if (e.code === 11000) throw new ApiError(409, 'An account with this email already exists.')
    throw e
  }
}

export async function login(email, password) {
  const u = await User.findByEmail(email)
  const ok = u ? await verifyPassword(password, u.hash) : (await verifyPassword('x', '00:00'), false) // equal work either way
  if (!u || !ok) throw new ApiError(401, 'Incorrect email or password.')
  if (u.active === false) throw new ApiError(401, 'This account has been disabled.')
  return u
}

/**
 * Signs in with verified Google claims, creating a customer or builder account on first use.
 * Staff accounts are password-only. An existing password account is linked only when Google is authoritative for the
 * address (Gmail or Google Workspace). Linking replaces the password, because sign-up never proved who owned the email.
 */
export async function googleSignIn(claims, role) {
  const email = String(claims.email).trim().toLowerCase()
  const known = await User.findByGoogleSub(claims.sub)
  const u = known || (await User.findByEmail(email))
  if (!u) {
    const now = new Date().toISOString()
    const name = clean(claims.name, 120) || email.split('@')[0]
    const extra = role === 'builder' ? { business: { tradeLicence: '', trn: '', sector: 'other' }, verified: false, priceTier: 'retail' } : {}
    const doc = { name, email, role, company: '', phone: '', ...extra, googleSub: claims.sub, active: true, hash: await unusableHash(), pwChangedAt: now, createdAt: now }
    return User.insert(doc)
  }
  if (!SELF_ROLES.includes(u.role)) throw new ApiError(403, 'TAC staff accounts sign in with email and password.')
  if (u.active === false) throw new ApiError(401, 'This account has been disabled.')
  if (known) return u
  const authoritative = email.endsWith('@gmail.com') || Boolean(claims.hd)
  if (u.googleSub || !authoritative) throw new ApiError(409, 'An account with this email already exists. Sign in with your password.')
  // a number added before the email owner was proven must not keep access
  const set = { googleSub: claims.sub, verifiedPhone: null, hash: await unusableHash(), pwChangedAt: new Date().toISOString() }
  await User.setFields(u._id, set)
  return { ...u, ...set }
}
/**
 * Signs in with a number proven by SMS. Only an account that verified this same number matches: phone numbers typed
 * into a profile are never trusted. Returns null when new details (name and email) are needed to create the account.
 */
export async function phoneSignIn(phone, { name, email, role }) {
  const u = await User.findByPhone(phone)
  if (u) {
    if (!SELF_ROLES.includes(u.role)) throw new ApiError(403, 'TAC staff accounts sign in with email and password.')
    if (u.active === false) throw new ApiError(401, 'This account has been disabled.')
    return u
  }
  if (!name || !email) return null
  const exists = new ApiError(409, 'An account with this email already exists. Sign in to it, then add your mobile number in My profile.')
  if (await User.findByEmail(email)) throw exists
  const now = new Date().toISOString()
  const extra = role === 'builder' ? { business: { tradeLicence: '', trn: '', sector: 'other' }, verified: false, priceTier: 'retail' } : {}
  const doc = { name, email, role, company: '', phone, ...extra, verifiedPhone: phone, active: true, hash: await unusableHash(), pwChangedAt: now, createdAt: now }
  try { return await User.insert(doc) } catch (e) { if (e.code === 11000) throw exists; throw e }
}

/** Adds (or replaces) the signed-in user's sign-in number. */
export async function linkPhone(user, phone) {
  const taken = new ApiError(409, 'This mobile number is already used by another account.')
  const other = await User.findByPhone(phone)
  if (other && String(other._id) !== String(user._id)) throw taken
  const set = { verifiedPhone: phone, phone: user.phone || phone }
  try { await User.setFields(user._id, set) } catch (e) { if (e.code === 11000) throw taken; throw e }
  return { ...user, ...set }
}
const unusableHash = () => hashPassword(crypto.randomBytes(32).toString('hex'))

/**
 * Updates the signed-in user's own details. Team members cannot change company details (those belong to the owner).
 * A verified builder who changes company details loses verification and trade pricing until TAC checks them again.
 */
export async function updateProfile(user, { name, phone, company, business }) {
  const set = { name, phone }
  if (!user.companyOwnerId) {
    set.company = company
    if (user.role === 'builder') {
      set.business = business
      const changed = company !== (user.company || '') || ['tradeLicence', 'trn'].some((k) => business[k] !== (user.business?.[k] || ''))
      if (changed && user.verified) Object.assign(set, { verified: false, priceTier: 'retail' })
    }
  }
  await User.setFields(user._id, set)
  return { ...user, ...set }
}

export async function changePassword(user, current, next) {
  if (!(await verifyPassword(current, user.hash))) throw new ApiError(400, 'Current password is incorrect.')
  const set = { hash: await hashPassword(next), pwChangedAt: new Date().toISOString() }
  await User.setFields(user._id, set) // changing pwChangedAt signs every other session out
  return { ...user, ...set }
}

/** Creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD when none exists. Returns details to print once. */
export async function ensureAdmin() {
  if (!mongoEnabled || (await User.findAdmin())) return null
  const pw = env.adminPassword || crypto.randomBytes(9).toString('base64url')
  const now = new Date().toISOString()
  await User.upsertAdmin(env.adminEmail, { role: 'admin', active: true, hash: await hashPassword(pw), pwChangedAt: now },
    { name: 'TAC Admin', company: 'TAC UAE', phone: '', createdAt: now })
  return { email: env.adminEmail, password: env.adminPassword ? null : pw }
}

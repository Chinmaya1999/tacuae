import crypto from 'node:crypto'
import { env } from '../config/env.js'
import { mongoEnabled } from '../config/database.js'
import * as User from '../models/user.model.js'
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
  business: u.business || null, verified: u.verified === true, priceTier: u.priceTier || 'retail', teamRole: u.teamRole || '' })

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

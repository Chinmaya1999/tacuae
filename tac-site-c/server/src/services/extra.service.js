// Bookings, notifications, analytics, the simulated integration log, and DEMO-ONLY sign-in.
import crypto from 'node:crypto'
import { collection, toObjectId } from '../config/database.js'
import { COLLECTIONS } from '../constants/index.js'
import { env } from '../config/env.js'
import * as User from '../models/user.model.js'
import { hashPassword } from './auth.service.js'
import { companyId } from './team.service.js'
import { emit } from './events.service.js'
import ApiError from '../utils/ApiError.js'

const col = (n) => collection(COLLECTIONS[n])
const out = ({ _id, userId, readBy, ...d }) => ({ id: String(_id), ...d })

// ---------- bookings ----------
export async function book(user, data) {
  const doc = { ...data, userId: user ? companyId(user) : null, status: 'requested', createdAt: new Date().toISOString() }
  await (await col('appointments')).insertOne(doc)
  emit('appointment.new', doc)
}
export const myBookings = async (user) => (await (await col('appointments')).find({ userId: companyId(user) }).sort({ date: 1 }).limit(100).toArray()).map(out)
export const allBookings = async () => (await (await col('appointments')).find({}).sort({ createdAt: -1 }).limit(300).toArray()).map(out)
export async function setBooking(id, status) {
  const _id = toObjectId(id), c = await col('appointments'), a = _id && (await c.findOne({ _id }))
  if (!a) throw new ApiError(404, 'Booking not found.')
  await c.updateOne({ _id }, { $set: { status } })
  if (status === 'confirmed' && a.status !== 'confirmed') emit('appointment.confirmed', a)
}

// ---------- notifications (each reader has their own read state) ----------
const audience = (user) => (user.role === 'admin' || user.role === 'sales' ? 'staff' : String(companyId(user)))
export async function notifications(user) {
  const me = String(user._id)
  const items = await (await col('notifications')).find({ to: audience(user) }).sort({ at: -1 }).limit(30).toArray()
  return { items: items.map((n) => ({ ...out(n), read: n.readBy.includes(me) })), unread: items.filter((n) => !n.readBy.includes(me)).length }
}
export const readAll = async (user) => (await col('notifications')).updateMany({ to: audience(user) }, { $addToSet: { readBy: String(user._id) } })

// ---------- analytics ----------
export async function analytics() {
  const quotes = await col('quotes')
  const [counters, status, products, kinds, bookings, leads] = await Promise.all([
    (await col('counters')).find({}).toArray(),
    quotes.aggregate([{ $group: { _id: '$status', n: { $sum: 1 }, value: { $sum: '$pricing.totals.total' } } }]).toArray(),
    quotes.aggregate([{ $unwind: '$pricing.lines' }, { $group: { _id: '$pricing.lines.name', qty: { $sum: '$pricing.lines.qty' } } }, { $sort: { qty: -1 } }, { $limit: 8 }]).toArray(),
    quotes.aggregate([{ $group: { _id: '$kind', n: { $sum: 1 }, value: { $sum: '$pricing.totals.total' } } }]).toArray(),
    (await col('appointments')).aggregate([{ $group: { _id: '$type', n: { $sum: 1 } } }]).toArray(),
    quotes.countDocuments({ released: true }),
  ])
  const total = status.reduce((n, s) => n + s.n, 0), value = status.reduce((n, s) => n + s.value, 0)
  const won = status.filter((s) => ['accepted', 'survey'].includes(s._id))
  const accepted = won.reduce((n, s) => n + s.n, 0)
  return {
    funnel: [['Configurator opened', counters.find((c) => c._id === 'configurator_opened')?.n || 0], ['Quotations saved', total], ['Sent to TAC / shared', leads], ['Accepted', accepted]].map(([name, n]) => ({ name, n })),
    average: total ? Math.round(value / total) : 0, pipeline: value, wonValue: won.reduce((n, s) => n + s.value, 0), conversion: leads ? Math.round((accepted / leads) * 100) : 0,
    products: products.map((p) => ({ name: p._id, n: p.qty })), kinds: kinds.map((k) => ({ name: k._id === 'project' ? 'Projects (B2B)' : 'Homes (B2C)', n: k.n, value: k.value })),
    bookings: bookings.map((b) => ({ name: b._id, n: b.n })),
  }
}
export const outbox = async () => (await (await col('outbox')).find({}).sort({ at: -1 }).limit(200).toArray()).map(out)

// ---------- DEMO ONLY sign-in: only ever opens accounts flagged demo:true, never a real one ----------
export function requireDemo() { if (!env.demoMode) throw new ApiError(404, 'Not found') }
const codes = new Map() // phone → { code, expires, tries }
export function requestOtp(phone) {
  requireDemo()
  const code = String(crypto.randomInt(100000, 1000000))
  if (codes.size > 500) codes.clear()
  codes.set(phone, { code, expires: Date.now() + 5 * 60_000, tries: 0 })
  return { demoCode: code } // a real SMS gateway would send this instead
}
async function demoAccount(email, name, phone = '') {
  const found = await User.findDemo({ email })
  if (found) { if (found.active === false) throw new ApiError(401, 'This account has been disabled.'); return found }
  const at = new Date().toISOString()
  return User.insert({ name, email, role: 'customer', company: '', phone, demo: true, active: true, hash: await hashPassword(crypto.randomBytes(24).toString('hex')), pwChangedAt: at, createdAt: at })
}
export async function verifyOtp(phone, code) {
  requireDemo()
  const c = codes.get(phone)
  if (!c || c.expires < Date.now() || ++c.tries > 5 || c.code !== code) throw new ApiError(401, 'That code is not correct or has expired.')
  codes.delete(phone)
  return demoAccount(`otp-${phone.replace(/\D/g, '')}@demo.invalid`, `Mobile user ${phone.slice(-4)}`, phone)
}
export function socialSignIn(provider) {
  requireDemo()
  return demoAccount(`${provider}-user@demo.invalid`, `${provider === 'apple' ? 'Apple' : 'Google'} demo user`)
}

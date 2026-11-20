import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { dataDir, read, write, exists } from './db.mjs'

const SESSION_MS = 8 * 3600 * 1000

// --- signing secret (generated once, kept in data/) ---
const secretPath = path.join(dataDir, 'secret.key')
if (!fs.existsSync(secretPath)) fs.writeFileSync(secretPath, crypto.randomBytes(48).toString('hex'), { mode: 0o600 })
const secret = process.env.SESSION_SECRET || fs.readFileSync(secretPath, 'utf8')

// --- password hashing (scrypt) ---
export function hashPassword(pw) {
  const salt = crypto.randomBytes(16)
  const hash = crypto.scryptSync(pw, salt, 64)
  return `${salt.toString('hex')}:${hash.toString('hex')}`
}
export function verifyPassword(pw, stored) {
  const [s, h] = String(stored).split(':')
  if (!s || !h) return false
  const a = crypto.scryptSync(String(pw), Buffer.from(s, 'hex'), 64), b = Buffer.from(h, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

/** Create the admin account on first run. Returns the generated password (once) if one was created. */
export function ensureAdmin() {
  if (exists('admin.json')) return null
  const given = process.env.ADMIN_PASSWORD
  const pw = given || crypto.randomBytes(9).toString('base64url')
  write('admin.json', { user: 'admin', hash: hashPassword(pw), changedAt: new Date().toISOString() })
  return given ? null : pw
}
export const admin = () => read('admin.json', null)
export function setPassword(pw) { const a = admin(); write('admin.json', { ...a, hash: hashPassword(pw), changedAt: new Date().toISOString() }) }

// --- stateless signed session cookie ---
const b64 = (b) => Buffer.from(b).toString('base64url')
const sign = (p) => crypto.createHmac('sha256', secret).update(p).digest('base64url')
export function makeToken(pwChangedAt) {
  const p = b64(JSON.stringify({ exp: Date.now() + SESSION_MS, v: pwChangedAt }))
  return `${p}.${sign(p)}`
}
export function readToken(tok) {
  if (!tok) return null
  const [p, s] = tok.split('.')
  if (!p || !s) return null
  const good = sign(p)
  if (s.length !== good.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(good))) return null
  try {
    const d = JSON.parse(Buffer.from(p, 'base64url').toString())
    if (d.exp < Date.now()) return null
    if (d.v !== admin()?.changedAt) return null // password changed => old sessions die
    return d
  } catch { return null }
}
export const parseCookies = (h = '') => Object.fromEntries(h.split(';').map((c) => c.trim().split('=')).filter((x) => x[0]).map(([k, ...v]) => [k, v.join('=')]))
export const cookieOpts = (secure) => `Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_MS / 1000}${secure ? '; Secure' : ''}`

// --- simple sliding-window limiter ---
export function limiter(max, windowMs) {
  const hits = new Map()
  return (key) => {
    const now = Date.now(), arr = (hits.get(key) || []).filter((t) => now - t < windowMs)
    arr.push(now); hits.set(key, arr)
    return arr.length > max
  }
}

// Signed session cookie: { uid, role, v (password version), sid (revoked on sign-out), exp }.
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { env } from '../config/env.js'
import { SESSION_COOKIE, SESSION_MS } from '../constants/index.js'

let secret = null
function getSecret() {
  if (secret) return secret
  if (env.sessionSecret) return (secret = env.sessionSecret)
  fs.mkdirSync(env.dataDir, { recursive: true, mode: 0o700 })
  const p = path.join(env.dataDir, 'secret.key') // generated once, kept in the data volume
  if (!fs.existsSync(p)) fs.writeFileSync(p, crypto.randomBytes(48).toString('hex'), { mode: 0o600 })
  return (secret = fs.readFileSync(p, 'utf8'))
}
const b64 = (b) => Buffer.from(b).toString('base64url')
const sign = (p) => crypto.createHmac('sha256', getSecret()).update(p).digest('base64url')

export function generateToken(user) {
  const p = b64(JSON.stringify({ uid: String(user._id), role: user.role, v: user.pwChangedAt, sid: crypto.randomBytes(12).toString('base64url'), exp: Date.now() + SESSION_MS }))
  return `${p}.${sign(p)}`
}
export function verifyToken(tok) {
  if (!tok) return null
  const [p, s] = tok.split('.')
  if (!p || !s) return null
  const good = sign(p)
  const a = Buffer.from(s), b = Buffer.from(good) // compare byte lengths: non-ASCII input must not throw
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const d = JSON.parse(Buffer.from(p, 'base64url').toString())
    return d.exp > Date.now() ? d : null
  } catch { return null }
}
export const parseCookies = (h = '') => Object.fromEntries(h.split(';').map((c) => c.trim().split('=')).filter((x) => x[0]).map(([k, ...v]) => [k, v.join('=')]))
export const sessionCookie = (token, secure) => `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_MS / 1000}${secure ? '; Secure' : ''}`
export const clearSessionCookie = (secure) => `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? '; Secure' : ''}`

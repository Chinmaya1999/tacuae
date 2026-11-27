// Verifies a Google Sign-In ID token (an RS256 JWT) against Google's published keys. No client secret is involved.
import crypto from 'node:crypto'
import ApiError from '../../utils/ApiError.js'

const CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs'
const ISSUERS = ['accounts.google.com', 'https://accounts.google.com']
const SKEW = 60 // seconds of clock difference tolerated

/** Looks up public keys in a JWK set, cached for as long as the response allows. */
export function jwkSource(url) {
  let keys = new Map(), expires = 0, fetched = 0
  return async (kid) => {
    const now = Date.now()
    // refresh when stale, or for an unknown key id (Google rotates keys) at most once a minute
    if (now > expires || (!keys.has(kid) && now - fetched > 60_000)) {
      const r = await fetch(url, { signal: AbortSignal.timeout(8000) }).catch(() => null)
      if (!r?.ok) throw new ApiError(503, 'Sign-in is temporarily unavailable. Please try again.')
      keys = new Map((await r.json()).keys.map((k) => [k.kid, crypto.createPublicKey({ key: k, format: 'jwk' })]))
      fetched = now
      expires = now + (Number(/max-age=(\d+)/.exec(r.headers.get('cache-control') ?? '')?.[1]) || 3600) * 1000
    }
    return keys.get(kid)
  }
}
const googleKey = jwkSource(CERTS_URL)

const decode = (s) => { try { return JSON.parse(Buffer.from(s, 'base64url').toString()) } catch { return null } }

/** Claims of an unexpired RS256 JWT signed by a key from `getKey`, or null. The caller checks issuer and audience. */
export async function verifyJwt(token, getKey) {
  const [h, p, s, extra] = String(token).split('.')
  const head = decode(h ?? ''), c = decode(p ?? '')
  if (!s || extra !== undefined || head?.alg !== 'RS256' || !c) return null
  const key = await getKey(head.kid)
  if (!key || !crypto.verify('RSA-SHA256', Buffer.from(`${h}.${p}`), key, Buffer.from(s, 'base64url'))) return null
  const now = Date.now() / 1000
  return c.exp > now - SKEW && !(c.iat > now + SKEW) ? c : null
}

/** Returns the token's claims, or throws 401 unless Google signed it for this client and it is still valid. */
export async function verifyIdToken(token, clientId, getKey = googleKey) {
  const bad = new ApiError(401, 'Google sign-in failed. Please try again.')
  const c = await verifyJwt(token, getKey)
  if (!c || !clientId || c.aud !== clientId || !ISSUERS.includes(c.iss)) throw bad
  if (!c.sub || !c.email || c.email_verified !== true) throw bad
  return c
}

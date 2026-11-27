// Google ID token checks, using a locally generated key in place of Google's.
import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { verifyIdToken } from '../../src/integrations/google/idToken.js'

const pair = () => crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
const google = pair(), attacker = pair()
const CLIENT = 'test.apps.googleusercontent.com', now = Math.floor(Date.now() / 1000)
const claims = { iss: 'https://accounts.google.com', aud: CLIENT, sub: '123', email: 'sam@gmail.com', email_verified: true, iat: now, exp: now + 3600 }
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
const make = (over = {}, { key = google.privateKey, alg = 'RS256' } = {}) => {
  const body = `${b64({ alg, kid: 'k1' })}.${b64({ ...claims, ...over })}`
  return `${body}.${crypto.sign('RSA-SHA256', Buffer.from(body), key).toString('base64url')}`
}
const verify = (t, client = CLIENT) => verifyIdToken(t, client, async (kid) => (kid === 'k1' ? google.publicKey : undefined))

test('accepts a valid Google token', async () => {
  assert.equal((await verify(make())).email, 'sam@gmail.com')
})
test('rejects forged, foreign, expired and unverified tokens', async () => {
  const [h, , s] = make().split('.')
  const cases = {
    signature: make({}, { key: attacker.privateKey }),
    tampered: `${h}.${b64({ ...claims, email: 'admin@tacuae.com' })}.${s}`,
    algorithm: make({}, { alg: 'none' }),
    audience: make({ aud: 'other.apps.googleusercontent.com' }),
    issuer: make({ iss: 'https://evil.example' }),
    expired: make({ exp: now - 3600 }),
    unverified: make({ email_verified: false }),
    garbage: 'not-a-token',
  }
  for (const [name, t] of Object.entries(cases)) await assert.rejects(verify(t), { status: 401 }, name)
  await assert.rejects(verify(make(), ''), { status: 401 })
})

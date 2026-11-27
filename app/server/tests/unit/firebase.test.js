// Firebase phone token checks, using a locally generated key in place of Google's.
import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { verifyPhoneToken } from '../../src/integrations/firebase/idToken.js'

const real = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }), other = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
const now = Math.floor(Date.now() / 1000), project = 'tac-test'
const claims = { aud: project, iss: `https://securetoken.google.com/${project}`, sub: 'u1', phone_number: '+919876543210', firebase: { sign_in_provider: 'phone' }, auth_time: now, iat: now, exp: now + 3600 }
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
const make = (over = {}, key = real.privateKey) => {
  const body = `${b64({ alg: 'RS256', kid: 'k' })}.${b64({ ...claims, ...over })}`
  return `${body}.${crypto.sign('RSA-SHA256', Buffer.from(body), key).toString('base64url')}`
}
const verify = (t, id = project) => verifyPhoneToken(t, id, async () => real.publicKey)

test('accepts a Firebase phone token and returns the number', async () => {
  assert.equal(await verify(make()), '+919876543210')
})
test('rejects forged, foreign, stale and non-phone Firebase tokens', async () => {
  const cases = {
    signature: make({}, other.privateKey), audience: make({ aud: 'x' }), issuer: make({ iss: 'https://securetoken.google.com/x' }),
    expired: make({ exp: now - 3600 }), stale: make({ auth_time: now - 3600 }), provider: make({ firebase: { sign_in_provider: 'password' } }),
    noPhone: make({ phone_number: undefined }), garbage: 'abc',
  }
  for (const [name, t] of Object.entries(cases)) await assert.rejects(verify(t), { status: 401 }, name)
  await assert.rejects(verify(make(), ''), { status: 401 })
})

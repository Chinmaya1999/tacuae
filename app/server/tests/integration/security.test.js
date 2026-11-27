// Headers, throttling and session revocation, against a real disposable MongoDB where accounts are needed.
import test from 'node:test'
import assert from 'node:assert/strict'
import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'

const raw = process.env.TEST_MONGODB_URI || ''
const enabled = /\/[^/?]*test[^/?]*(\?|$)/i.test(raw)

test('headers, login throttling, logout revocation, password rules', { skip: !enabled && 'set TEST_MONGODB_URI to run' }, async (t) => {
  const uri = raw.replace(/\/([^/?]*test[^/?]*)(\?|$)/i, '/$1_security$2') // its own database: test files run in parallel
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tac-s-'))
  Object.assign(process.env, { DATA_DIR: dir, MONGODB_URI: uri })
  const { createApp } = await import('../../src/app.js')
  const { getDb, closeDb } = await import('../../src/config/database.js')
  const server = createApp().listen(0)
  await new Promise((r) => server.once('listening', r))
  const base = `http://127.0.0.1:${server.address().port}/api`
  t.after(async () => { server.close(); await (await getDb()).dropDatabase(); await closeDb(); fs.rmSync(dir, { recursive: true, force: true }) })
  const call = (p, { method = 'GET', body, cookie } = {}) => fetch(base + p, { method, headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'tac-admin', ...(cookie ? { cookie } : {}) }, body: body && JSON.stringify(body) })
  const cookieOf = (r) => r.headers.get('set-cookie').split(';')[0]
  const me = async (cookie) => (await (await call('/account/me', { cookie })).json()).user

  const head = await call('/account/me')
  assert.match(head.headers.get('content-security-policy'), /default-src 'self'.*object-src 'none'/)
  assert.equal(head.headers.get('x-content-type-options'), 'nosniff')
  assert.equal(head.headers.get('cache-control'), 'no-store')

  const weak = await call('/account/register', { method: 'POST', body: { name: 'Weak', email: 'weak@x.co', password: 'password123' } })
  assert.equal(weak.status, 400)
  const reg = await call('/account/register', { method: 'POST', body: { name: 'Ann', email: 'ann@x.co', password: 'sunny-harbor-42' } })
  const first = cookieOf(reg)
  const second = cookieOf(await call('/account/login', { method: 'POST', body: { email: 'ann@x.co', password: 'sunny-harbor-42' } }))
  assert.ok(await me(first))
  const cookie = async (remember) => (await call('/account/login', { method: 'POST', body: { email: 'ann@x.co', password: 'sunny-harbor-42', remember } })).headers.get('set-cookie')
  assert.match(await cookie(true), /Max-Age=2592000/)
  assert.doesNotMatch(await cookie(false), /Max-Age/, 'without "remember me" the cookie ends with the browser session')
  await call('/account/logout', { method: 'POST', cookie: first })
  assert.equal(await me(first), null, 'a copied cookie stops working after sign-out')
  assert.ok(await me(second), 'other devices stay signed in')
  assert.equal(await me(`${second.split('.')[0]}.${'é'.repeat(43)}`), null, 'a garbage signature is rejected, not a crash')

  let last
  for (let i = 0; i < 21; i++) last = await call('/account/login', { method: 'POST', body: { email: 'victim@x.co', password: `guess-${i}` } })
  assert.equal(last.status, 429)
})

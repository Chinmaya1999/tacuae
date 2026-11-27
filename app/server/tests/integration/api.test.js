// Boots the real app (no MongoDB configured) and checks the public API and access control.
import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'tac-test-'))
delete process.env.MONGODB_URI
const { createApp } = await import('../../src/app.js')

let server, base
const json = { 'Content-Type': 'application/json', 'X-Requested-With': 'tac-admin' }
before(() => new Promise((r) => { server = createApp().listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r() }) }))
after(() => { server.close(); fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true }) })

test('GET /api/content returns the editable content', async () => {
  const r = await fetch(`${base}/api/content`)
  assert.equal(r.status, 200)
  assert.deepEqual(await r.json(), { products: {}, projects: {} })
})
test('POST /api/enquiry validates input', async () => {
  const r = await fetch(`${base}/api/enquiry`, { method: 'POST', headers: json, body: JSON.stringify({ name: 'A', email: 'bad', message: 'x' }) })
  assert.equal(r.status, 400)
})
test('POST /api/enquiry saves a valid enquiry and the honeypot is ignored', async () => {
  const ok = await fetch(`${base}/api/enquiry`, { method: 'POST', headers: json, body: JSON.stringify({ name: 'Sam', email: 's@x.co', message: 'I need a smart home', elapsed: 9000 }) })
  assert.equal(ok.status, 200)
  const bot = await fetch(`${base}/api/enquiry`, { method: 'POST', headers: json, body: JSON.stringify({ website: 'spam' }) })
  assert.equal((await bot.json()).ok, true)
})
test('too-fast submissions are rejected', async () => {
  const r = await fetch(`${base}/api/enquiry`, { method: 'POST', headers: json, body: JSON.stringify({ name: 'Sam', email: 's@x.co', message: 'I need a smart home', elapsed: 100 }) })
  assert.equal(r.status, 400)
})
test('protected routes reject anonymous users and missing CSRF header', async () => {
  assert.equal((await fetch(`${base}/api/admin/stats`)).status, 401)
  assert.equal((await fetch(`${base}/api/designs`)).status, 401)
  const me = await fetch(`${base}/api/account/me`)
  assert.equal(me.status, 200); assert.equal((await me.json()).user, null) // signed out: normal answer, no console error
  const noHeader = await fetch(`${base}/api/account/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
  assert.equal(noHeader.status, 403)
})
test('building-management API requires a signed-in builder or admin', async () => {
  for (const path of ['/api/bms/catalog', '/api/bms/overview', '/api/bms/alarms', '/api/bms/projects/abc/live']) assert.equal((await fetch(`${base}${path}`)).status, 401, path)
  const post = await fetch(`${base}/api/bms/projects`, { method: 'POST', headers: json, body: JSON.stringify({ name: 'X', towers: [{}] }) })
  assert.equal(post.status, 401)
})
test('login without a database answers 503 as JSON, not a stack trace', async () => {
  const r = await fetch(`${base}/api/account/login`, { method: 'POST', headers: json, body: JSON.stringify({ email: 'a@b.co', password: 'password1' }) })
  assert.equal(r.status, 503)
  assert.equal((await r.json()).ok, false)
})
test('unknown API routes return JSON 404; malformed JSON returns 400', async () => {
  assert.equal((await fetch(`${base}/api/nope`)).status, 404)
  const r = await fetch(`${base}/api/enquiry`, { method: 'POST', headers: json, body: '{bad' })
  assert.equal(r.status, 400)
})
test('simulated sign-in does not exist unless the server runs in demo mode', async () => {
  for (const [url, body] of [['/api/demo/social', { provider: 'google' }], ['/api/demo/otp/request', { phone: '0501234567' }], ['/api/demo/otp/verify', { phone: '0501234567', code: '123456' }]]) {
    const r = await fetch(`${base}${url}`, { method: 'POST', headers: json, body: JSON.stringify(body) })
    assert.equal(r.status, 404, url)
  }
  assert.equal((await (await fetch(`${base}/api/demo/config`)).json()).demo, false)
})

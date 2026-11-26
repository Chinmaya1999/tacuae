// Demo-mode features against a real, disposable MongoDB (see quotes.test.js).
import test from 'node:test'
import assert from 'node:assert/strict'
import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const raw = process.env.TEST_MONGODB_URI || ''
const enabled = /\/[^/?]*test[^/?]*(\?|$)/i.test(raw)

test('demo seed, simulated sign-in, team roles, bookings, notifications, deposit', { skip: !enabled && 'set TEST_MONGODB_URI to run' }, async (t) => {
  const uri = raw.replace(/\/([^/?]*test[^/?]*)(\?|$)/i, '/$1_demo$2') // its own database: test files run in parallel
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tac-d-'))
  Object.assign(process.env, { DATA_DIR: dir, MONGODB_URI: uri, DEMO_MODE: 'true' })
  const seed = fileURLToPath(new URL('../../scripts/seed-demo.mjs', import.meta.url))
  const run = spawnSync(process.execPath, [seed, '--reset'], { env: process.env, encoding: 'utf8' })
  assert.equal(run.status, 0, run.stderr)
  const refused = spawnSync(process.execPath, [seed], { env: { ...process.env, MONGODB_URI: raw.replace(/\/[^/?]+(\?|$)/, '/production$1') } })
  assert.equal(refused.status, 1, 'the seed must refuse a non-demo database')

  const { createApp } = await import('../../src/app.js')
  const { getDb, closeDb } = await import('../../src/config/database.js')
  const server = createApp().listen(0)
  await new Promise((r) => server.once('listening', r))
  const base = `http://127.0.0.1:${server.address().port}/api`
  t.after(async () => { server.close(); await (await getDb()).dropDatabase(); await closeDb(); fs.rmSync(dir, { recursive: true, force: true }) })
  const client = () => {
    let cookie = ''
    return async (method, url, body, expect = 200) => {
      const r = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'tac-admin', cookie }, body: body && JSON.stringify(body) })
      const set = r.headers.get('set-cookie'); if (set) cookie = set.split(';')[0]
      const data = await r.json()
      assert.equal(r.status, expect, `${method} ${url} → ${r.status} ${data.error || ''}`)
      return data
    }
  }
  const login = async (email) => { const c = client(); await c('POST', '/account/login', { email, password: 'Demo@12345' }); return c }
  const [admin, sales, customer, builder, procurement] = await Promise.all(['admin', 'sales', 'customer', 'builder', 'procurement'].map((n) => login(`${n}@demo.tac`)))

  // simulated sign-in only ever reaches demo accounts
  const g = client(); assert.equal((await g('POST', '/demo/social', { provider: 'google' })).user.email, 'google-user@demo.invalid')
  const m = client(), { demoCode } = await m('POST', '/demo/otp/request', { phone: '050 123 4567' })
  await m('POST', '/demo/otp/verify', { phone: '0501234567', code: '000000' }, 401)
  assert.equal((await m('POST', '/demo/otp/verify', { phone: '0501234567', code: demoCode })).user.role, 'customer')
  await m('POST', '/demo/otp/verify', { phone: '0501234567', code: demoCode }, 401)

  // team: shares the company's quotations and price list, limited by role
  const mine = (await builder('GET', '/quotations')).items
  assert.deepEqual((await procurement('GET', '/quotations')).items.map((q) => q.id).sort(), mine.map((q) => q.id).sort())
  assert.equal((await procurement('POST', '/configurator/estimate', { kind: 'home', input: {} })).pricing.segment, 'trade')
  const added = await builder('POST', '/team', { name: 'Vera', email: 'vera@demo.tac', teamRole: 'viewer' })
  const viewer = client(); await viewer('POST', '/account/login', { email: 'vera@demo.tac', password: added.password })
  await viewer('GET', `/quotations/${mine[0].id}`)
  await viewer('POST', `/quotations/${mine[0].id}/comments`, { text: 'Looks fine' })
  await viewer('POST', `/quotations/${mine[0].id}/share`, {}, 403)
  await viewer('POST', `/quotations/${mine[0].id}/accept`, {}, 403)
  await viewer('POST', `/quotations/${mine[0].id}/duplicate`, {}, 403)
  await procurement('POST', `/quotations/${mine.find((q) => !['accepted', 'survey'].includes(q.status)).id}/share`)
  await procurement('POST', '/team', { name: 'No', email: 'no@demo.tac', teamRole: 'viewer' }, 403)
  await customer('GET', `/quotations/${mine[0].id}`, undefined, 404)
  await customer('GET', '/team', undefined, 403)

  // deposit: accepted quotations only, once
  const all = (await customer('GET', '/quotations')).items, final = all.find((q) => q.status === 'final')
  await customer('POST', `/quotations/${final.id}/demo-deposit`, {}, 409)
  await customer('POST', `/quotations/${final.id}/accept`)
  assert.equal((await customer('POST', `/quotations/${final.id}/demo-deposit`)).item.deposit.status, 'simulated')
  await customer('POST', `/quotations/${final.id}/demo-deposit`, {}, 409)

  // bookings, notifications, outbox, analytics, catalogue
  const date = new Date(Date.now() + 3 * 86400_000).toISOString().slice(0, 10)
  await client()('POST', '/appointments', { type: 'callback', date, slot: '09:00', name: 'Guest', phone: '0501112222' })
  await client()('POST', '/appointments', { type: 'callback', date: '2001-01-01', slot: '09:00', name: 'Guest', phone: '0501112222' }, 400)
  await customer('GET', '/sales/appointments', undefined, 403)
  const booking = (await sales('GET', '/sales/appointments')).items.find((a) => a.name === 'Omar Customer')
  await sales('PATCH', `/sales/appointments/${booking.id}`, { status: 'confirmed' })
  await new Promise((r) => setTimeout(r, 500))
  const n = await customer('GET', '/notifications')
  assert.ok(n.unread > 0); await customer('POST', '/notifications/read'); assert.equal((await customer('GET', '/notifications')).unread, 0)
  assert.ok((await sales('GET', '/notifications')).items.length > 0)
  await sales('GET', '/admin/outbox', undefined, 403)
  const outbox = (await admin('GET', '/admin/outbox')).items
  assert.ok(['crm', 'whatsapp', 'payment', 'calendar'].every((c) => outbox.some((o) => o.channel === c && o.status === 'simulated')))
  assert.ok((await admin('GET', '/admin/analytics')).funnel[1].n >= 4)
  await admin('POST', '/admin/products', { name: 'Test sensor', group: 'Security', unitPrice: 10 })
  await admin('POST', '/admin/products', { name: 'Test sensor', group: 'Security' }, 409)
  await admin('PUT', '/admin/products/test-sensor', { datasheetUrl: 'javascript:alert(1)' }, 400)
})

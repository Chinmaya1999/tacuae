// End-to-end quotation lifecycle against a REAL MongoDB. Runs only when TEST_MONGODB_URI points at a
// disposable database (its name must contain "test"; it is dropped before and after).
//   TEST_MONGODB_URI=mongodb://127.0.0.1:27017/tac_test npm test
import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'

const uri = process.env.TEST_MONGODB_URI || ''
const enabled = /\/[^/?]*test[^/?]*(\?|$)/i.test(uri)

test('quotation lifecycle, permissions and price snapshots', { skip: !enabled && 'set TEST_MONGODB_URI to run' }, async (t) => {
  process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'tac-q-'))
  process.env.MONGODB_URI = uri
  process.env.ADMIN_EMAIL = 'admin@test.local'; process.env.ADMIN_PASSWORD = 'admin-password-1'
  const { createApp } = await import('../../src/app.js')
  const { getDb, closeDb } = await import('../../src/config/database.js')
  await (await getDb()).dropDatabase(); await closeDb(); await getDb() // fresh database with indexes
  const { ensureAdmin } = await import('../../src/services/auth.service.js')
  const { ensureProducts } = await import('../../src/services/product.service.js')
  const { ensurePricing } = await import('../../src/services/pricing.service.js')
  await ensureAdmin(); await ensureProducts(); await ensurePricing()

  const server = createApp().listen(0)
  await new Promise((r) => server.once('listening', r))
  const base = `http://127.0.0.1:${server.address().port}/api`
  t.after(async () => { server.close(); await (await getDb()).dropDatabase(); await closeDb(); fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true }) })

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
  const guest = client(), admin = client(), alice = client(), bob = client(), sales = client(), builder = client()
  await admin('POST', '/account/login', { email: 'admin@test.local', password: 'admin-password-1' })
  const reg = (c, email, role, extra = {}) => c('POST', '/account/register', { name: email.split('@')[0], email, password: 'password-123', role, ...extra })
  await reg(alice, 'alice@test.local', 'customer'); await reg(bob, 'bob@test.local', 'customer')
  const salesId = (await reg(sales, 'sally@test.local', 'customer')).user.id
  const builderId = (await reg(builder, 'build@test.local', 'builder', { trn: '100000000000003' })).user.id
  await admin('PATCH', `/admin/users/${salesId}`, { role: 'sales' })

  const input = { homeType: 'apartment-2', connectivity: 'wired', levels: { lighting: 'comfort', security: 'essential' }, control: 'app', rooms: [{ id: 'r1', type: 'bedroom', name: 'Bedroom' }] }

  // guest: quantities only until the admin publishes prices
  const hidden = await guest('POST', '/configurator/estimate', { kind: 'home', input })
  assert.equal(hidden.pricing.hidden, true); assert.equal(hidden.pricing.totals, undefined)
  assert.ok((await guest('GET', '/configurator/options')).products.every((p) => p.price === undefined))
  await guest('POST', '/quotations', { kind: 'home', input }, 401)
  await admin('PUT', '/admin/pricing/settings', { publicEstimates: true, salesDiscountLimitPct: 5, maxDiscountPct: 30 })
  assert.ok((await guest('POST', '/configurator/estimate', { kind: 'home', input })).pricing.totals.total > 0)
  await alice('PUT', '/admin/pricing/settings', { vatRate: 0 }, 403)

  // create, ownership, privacy of drafts
  const { item: q } = await alice('POST', '/quotations', { kind: 'home', input, name: 'My flat' })
  assert.equal(q.status, 'draft'); assert.equal(q.indicative, true)
  await bob('GET', `/quotations/${q.id}`, undefined, 404)
  await sales('GET', `/sales/quotations/${q.id}`, undefined, 404)
  assert.equal((await sales('GET', '/sales/quotations')).items.length, 0)
  await alice('GET', '/sales/quotations', undefined, 403)

  // catalogue price change must not alter the issued quotation
  await admin('PUT', '/admin/products/dali-dimming', { unitPrice: 9999, tradePrice: 100 })
  assert.equal((await alice('GET', `/quotations/${q.id}`)).item.total, q.total)
  assert.ok((await alice('GET', '/products')).items.every((p) => p.prices === undefined))

  // secure link: view and comment without an account; revocable
  const share = await alice('POST', `/quotations/${q.id}/share`)
  const seen = (await guest('GET', `/shared/${share.token}`)).item
  assert.equal(seen.total, q.total); assert.equal(seen.id, undefined); assert.equal(seen.versions, undefined)
  await guest('GET', `/shared/${'a'.repeat(32)}`, undefined, 404)
  await guest('POST', `/shared/${share.token}/comments`, { name: 'Dad', text: 'Add curtains', requestChanges: true })
  assert.equal((await alice('GET', `/quotations/${q.id}`)).item.status, 'revision_requested')

  // sales: discount above limit needs admin approval and is not applied meanwhile
  const s = `/sales/quotations/${q.id}`
  await sales('POST', `${s}/adjust`, { discountPct: 50 }, 400)
  const pending = (await sales('POST', `${s}/adjust`, { discountPct: 20 })).item
  assert.equal(pending.discount.approval, 'pending'); assert.equal(pending.total, q.total)
  assert.equal((await alice('GET', `/quotations/${q.id}`)).item.discount.pct, 0)
  await sales('POST', `${s}/discount-decision`, { approve: true }, 403)
  await sales('POST', `${s}/review`)
  await sales('POST', `${s}/finalize`, {}, 409)
  assert.equal((await sales('POST', `${s}/adjust`, { discountPct: 20 })).item.version, pending.version) // no-op
  const approved = (await admin('POST', `${s}/discount-decision`, { approve: true })).item
  assert.ok(approved.total < q.total); assert.equal(approved.pricing.totals.discountPct, 20)

  // finalise, accept, survey (a price change needs a fresh review)
  await alice('POST', `/quotations/${q.id}/accept`, {}, 409)
  await sales('POST', `${s}/finalize`, {}, 409)
  await sales('POST', `${s}/review`)
  const final = (await sales('POST', `${s}/finalize`)).item
  assert.equal(final.status, 'final'); assert.equal(final.indicative, false); assert.equal(final.total, approved.total)
  await bob('POST', `/quotations/${q.id}/accept`, {}, 404)
  assert.equal((await alice('POST', `/quotations/${q.id}/accept`)).item.status, 'accepted')
  await alice('PUT', `/quotations/${q.id}`, { input }, 409)
  await sales('POST', `${s}/adjust`, { discountPct: 0 }, 409)
  assert.equal((await sales('POST', `${s}/survey`, { date: '2027-01-10' })).item.status, 'survey')
  await alice('DELETE', `/quotations/${q.id}/share`)
  await guest('GET', `/shared/${share.token}`, undefined, 404)

  // editing a configuration creates a new version at current prices
  const copy = (await alice('POST', `/quotations/${q.id}/duplicate`)).item
  assert.ok(copy.total > q.total)
  const v2 = (await alice('PUT', `/quotations/${copy.id}`, { input: { ...input, levels: { lighting: 'essential' } }, note: 'Cheaper' })).item
  assert.equal(v2.version, 2); assert.equal(v2.versions[0].total, copy.total)
  await alice('DELETE', `/quotations/${copy.id}`)

  // builder: trade price only after verification; project quote and scenarios
  const project = { project: { name: 'Marina Tower', type: 'residential-tower' }, connectivity: 'wired', unitTypes: [{ id: 'a', name: '2BR', quantity: 120, areaSqft: 1100, config: input }], common: [{ productId: 'camera', qty: 8 }] }
  const retail = (await builder('POST', '/configurator/estimate', { kind: 'project', input: project })).pricing
  await admin('PATCH', `/admin/users/${builderId}`, { verified: true, priceTier: 'trade' })
  const trade = (await builder('POST', '/configurator/estimate', { kind: 'project', input: project })).pricing
  assert.equal(trade.segment, 'trade'); assert.ok(trade.totals.total < retail.totals.total)
  const cmp = await builder('POST', '/configurator/compare', { input: project, scenarios: [{ name: 'E', level: 'essential' }, { name: 'L', level: 'luxury' }] })
  assert.ok(cmp.scenarios[1].pricing.totals.total > cmp.scenarios[0].pricing.totals.total)
  assert.equal((await builder('POST', '/quotations', { kind: 'project', input: project })).item.pricing.metrics.units, 120)

  const audit = (await admin('GET', '/admin/pricing')).audit.map((a) => a.action)
  for (const a of ['pricing.settings', 'product.update', 'quote.discount.approve', 'quote.finalize', 'user.update']) assert.ok(audit.includes(a), a)
  await admin('PUT', '/admin/pricing/rules', { roomType: '*', category: 'gate', level: 'essential', items: [{ productId: 'nope', qty: 1 }] }, 400)
  await admin('PUT', '/admin/pricing/rules', { roomType: 'property', category: 'gate', level: 'essential', items: [{ productId: 'smart-plug', qty: 1 }] })
  await admin('DELETE', '/admin/pricing/rules?key=property:gate:essential')
})

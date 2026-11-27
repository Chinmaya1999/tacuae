import test from 'node:test'
import assert from 'node:assert/strict'
import { findRule, priceHome, priceProject, compareScenarios, repriceLines, resolveUnit, tierDiscountPct, totals, unitPrices, toFils } from '../../src/services/pricing.engine.js'
import { DEFAULT_SETTINGS, STARTER_RULES } from '../../src/constants/pricing.js'
import { PRODUCT_SEED } from '../../src/constants/products.js'
import { cleanHome, cleanProject, validateRule, validateSettings } from '../../src/validators/pricing.validator.js'
import { segmentFor, withoutPrices } from '../../src/services/pricing.service.js'
import { validateAdjust } from '../../src/validators/quote.validator.js'
import { ALLOWED, assertAllowed, isExpired, quoteOut } from '../../src/services/quote.service.js'

const products = [
  { id: 'dim', name: 'Dimmer', group: 'Lighting', unitPrice: 100, installPrice: 20, accessoryPrice: 10, connectivity: ['wired'], prices: { trade: 80 } },
  { id: 'key', name: 'Keypad', group: 'Room Controls', unitPrice: 50, installPrice: 5, connectivity: ['wired', 'wireless'] },
]
const rules = [
  { roomType: '*', category: 'lighting', level: 'comfort', items: [{ productId: 'key', qty: 1 }] },
  { roomType: 'bedroom', category: 'lighting', level: 'comfort', items: [{ productId: 'dim', qty: 2 }, { productId: 'key', qty: 1 }] },
  { roomType: 'property', category: 'controls', level: 'app', items: [{ productId: 'key', qty: 1 }] },
]
const settings = { ...DEFAULT_SETTINGS }
const ctx = { products, rules, settings, segment: 'retail' }
const bedroom = { id: 'r1', type: 'bedroom', name: 'Bedroom', adjustments: {} }
const home = { rooms: [bedroom], levels: { lighting: 'comfort' }, connectivity: 'wired' }

test('a room-specific rule beats the any-room rule; property scope never falls back', () => {
  assert.equal(findRule(rules, 'bedroom', 'lighting', 'comfort').items.length, 2)
  assert.equal(findRule(rules, 'kitchen', 'lighting', 'comfort').items.length, 1)
  assert.equal(findRule(rules, 'property', 'lighting', 'comfort'), undefined)
})
test('home price: devices + accessories + installation + VAT, one line per product', () => {
  const p = priceHome({ ...home, control: 'app' }, ctx)
  assert.deepEqual(p.lines.map((l) => [l.productId, l.qty]), [['dim', 2], ['key', 2]])
  assert.equal(p.totals.devices, 30000); assert.equal(p.totals.accessories, 2000); assert.equal(p.totals.installation, 5000)
  assert.equal(p.totals.subtotal, 37000); assert.equal(p.totals.vat, 1850); assert.equal(p.totals.total, 38850)
})
test('cabling, programming, commissioning, margin and AMC are applied from settings', () => {
  const s = { ...settings, cablingPct: { wired: 10, wireless: 0 }, programmingPerDevice: 2, commissioningPerUnit: 100, marginPct: { retail: 10 }, amcPct: 5 }
  const t = priceHome({ ...home, amc: true }, { ...ctx, settings: s }).totals
  assert.equal(t.devices, 27500) // (2×100 + 1×50) × 1.1
  assert.equal(t.accessories, 2200); assert.equal(t.cabling, 2970); assert.equal(t.programming, 600); assert.equal(t.commissioning, 10000); assert.equal(t.amc, 1375)
  assert.equal(t.taxable, t.subtotal + 1375); assert.equal(t.total, t.taxable + Math.round(t.taxable * 0.05))
})
test('trade price list applies when present and falls back to retail', () => {
  assert.equal(unitPrices(products[0], 'trade', settings).unit, 8000)
  assert.equal(unitPrices(products[1], 'trade', settings).unit, 5000)
})
test('segment price lists unlock only for verified business accounts', () => {
  assert.equal(segmentFor({ role: 'builder', verified: false, priceTier: 'partner' }), 'retail')
  assert.equal(segmentFor({ role: 'builder', verified: true, priceTier: 'trade' }), 'trade')
  assert.equal(segmentFor({ role: 'customer', verified: true, priceTier: 'trade' }), 'retail')
  assert.equal(segmentFor(null), 'retail')
})
test('per-room adjustments add and remove devices and never go negative', () => {
  const r = resolveUnit({ ...home, rooms: [{ ...bedroom, adjustments: { dim: -10, key: 2 } }] }, rules)
  assert.deepEqual(r.rooms[0].items, [{ productId: 'key', qty: 3 }])
})
test('categories without a rule and unpriced / missing products are reported, not silently free', () => {
  const p = priceHome({ ...home, levels: { lighting: 'comfort', gate: 'luxury' }, rooms: [{ ...bedroom, adjustments: { ghost: 1 } }] }, { ...ctx, products: [{ ...products[0], unitPrice: 0 }, products[1]] })
  assert.deepEqual(p.warnings.unmapped, ['gate']); assert.deepEqual(p.warnings.unpriced.sort(), ['Dimmer', 'ghost'])
})
test('products that do not support the chosen connectivity are flagged', () => {
  assert.deepEqual(priceHome({ ...home, connectivity: 'wireless' }, ctx).warnings.incompatible, ['Dimmer'])
})
test('volume tiers take the best tier reached', () => {
  const tiers = [{ minUnits: 10, discountPct: 3 }, { minUnits: 100, discountPct: 8 }]
  assert.equal(tierDiscountPct(tiers, 9), 0); assert.equal(tierDiscountPct(tiers, 10), 3); assert.equal(tierDiscountPct(tiers, 500), 8)
})

const project = { connectivity: 'wired', common: [{ productId: 'key', qty: 4 }], unitTypes: [
  { id: 'a', name: '2BR', quantity: 120, areaSqft: 1000, phase: 'Tower A', config: home },
  { id: 'b', name: '3BR', quantity: 40, areaSqft: 1500, phase: 'Tower B', config: home },
] }
test('project: one template multiplied by quantity, with common areas, tiers, metrics and phases', () => {
  const p = priceProject(project, { ...ctx, settings: { ...settings, volumeTiers: [{ minUnits: 100, discountPct: 10 }] } })
  assert.deepEqual(p.lines.map((l) => [l.productId, l.qty]), [['dim', 320], ['key', 164]])
  assert.equal(p.metrics.units, 160); assert.equal(p.metrics.areaSqft, 180000)
  assert.equal(p.totals.volumeDiscount, Math.round(p.totals.subtotal / 10))
  assert.equal(p.metrics.costPerUnit, Math.round(p.totals.total / 160))
  assert.equal(p.unitTypes[0].subtotal, p.unitTypes[0].perUnit * 120)
  assert.deepEqual(p.phases.map((x) => x.name), ['Tower A', 'Tower B'])
})
test('scenarios override level and connectivity without changing the input', () => {
  const before = JSON.stringify(project)
  const [a, b] = compareScenarios(project, ctx, [{ name: 'Comfort', level: 'comfort' }, { name: 'Wireless', connectivity: 'wireless' }])
  assert.ok(a.pricing.totals.total > 0); assert.deepEqual(b.pricing.warnings.incompatible, ['Dimmer']); assert.equal(JSON.stringify(project), before)
})
test('repricing a snapshot uses stored unit prices, applies discount and removes zero lines', () => {
  const p = priceHome(home, ctx)
  const r = repriceLines(p, { key: 0 }, 10)
  assert.deepEqual(r.lines.map((l) => l.productId), ['dim'])
  assert.equal(r.totals.discount, Math.round(r.totals.subtotal * 0.1)); assert.equal(p.lines.length, 2)
})
test('removing an unpriced line clears its warning; a missing product stays flagged', () => {
  const p = priceHome({ ...home, rooms: [{ ...bedroom, adjustments: { ghost: 1 } }] }, { ...ctx, products: [{ ...products[0], unitPrice: 0 }, products[1]] })
  assert.deepEqual(repriceLines(p, { dim: 0 }).warnings.unpriced, ['ghost'])
})
test('money is integer fils: no floating point drift', () => {
  const t = totals([{ unit: toFils(0.1), accessory: 0, install: toFils(0.2), qty: 3 }], { vatRate: 0.05 })
  assert.equal(t.subtotal, 90); assert.ok(Object.values(t).every((v) => Number.isInteger(v)))
})
test('hidden pricing keeps quantities and removes every amount', () => {
  const h = withoutPrices(priceProject(project, ctx))
  assert.ok(h.hidden && h.lines.length); assert.doesNotMatch(JSON.stringify(h), /"(unit|total|totals|subtotal|perUnit|costPerUnit|charges)"/)
})
test('performance: a 2,000-unit, 20-template project prices in under 300 ms', () => {
  const rooms = Array.from({ length: 15 }, (_, i) => ({ id: `r${i}`, type: 'bedroom', name: 'R', adjustments: {} }))
  const levels = { lighting: 'luxury', climate: 'luxury', curtains: 'luxury', security: 'luxury', audio: 'luxury', energy: 'luxury' }
  const big = { connectivity: 'wired', common: [], unitTypes: Array.from({ length: 20 }, (_, i) => ({ id: `u${i}`, name: 'U', quantity: 100, areaSqft: 900, config: { rooms, levels, control: 'all' } })) }
  const t = performance.now()
  const p = priceProject(big, { products: PRODUCT_SEED, rules: STARTER_RULES, settings, segment: 'retail' })
  assert.ok(performance.now() - t < 300); assert.equal(p.metrics.units, 2000)
})
test('starter rules: unique keys, known products', () => {
  const ids = new Set(PRODUCT_SEED.map((p) => p.id))
  assert.equal(new Set(STARTER_RULES.map((r) => `${r.roomType}:${r.category}:${r.level}`)).size, STARTER_RULES.length)
  assert.ok(STARTER_RULES.every((r) => r.items.every((i) => ids.has(i.productId))))
})
test('invalid quantities, rates, rules and discounts are rejected', () => {
  const unit = (quantity) => ({ unitTypes: [{ quantity, config: {} }] })
  for (const q of [0, -1, 1.5, 'x', 2001]) assert.throws(() => cleanProject(unit(q)), { status: 400 })
  assert.throws(() => cleanProject({ unitTypes: [{ quantity: 1500, config: {} }, { quantity: 600, config: {} }] }), { status: 400 })
  assert.throws(() => validateSettings({ body: { programmingPerDevice: -5 } }), { status: 400 })
  assert.throws(() => validateSettings({ body: { trn: '123' } }), { status: 400 })
  assert.throws(() => validateSettings({ body: { volumeTiers: [{ minUnits: 5, discountPct: 1 }, { minUnits: 5, discountPct: 2 }] } }), { status: 400 })
  assert.throws(() => validateRule({ body: { roomType: '*', category: 'lighting', level: 'comfort', items: [{ productId: 'dim', qty: 1 }, { productId: 'dim', qty: 2 }] } }), { status: 400 })
  assert.throws(() => validateAdjust({ body: { discountPct: -1 } }), { status: 400 })
  assert.throws(() => validateAdjust({ body: { quantities: { dim: -2 } } }), { status: 400 })
})
test('configurator input is rebuilt: unknown fields dropped, duplicate room ids separated', () => {
  const h = cleanHome({ price: 1, levels: { lighting: 'comfort', hack: 'x' }, rooms: [{ id: 'a', type: 'zzz' }, { id: 'a' }] })
  assert.equal(h.price, undefined); assert.deepEqual(h.levels, { lighting: 'comfort' }); assert.notEqual(h.rooms[0].id, h.rooms[1].id); assert.equal(h.rooms[0].type, 'other')
})
test('quotation state rules and expiry', () => {
  assert.doesNotThrow(() => assertAllowed('finalize', { status: 'reviewed' }))
  for (const s of ['draft', 'shared', 'final', 'accepted']) assert.throws(() => assertAllowed('finalize', { status: s }), { status: 409 })
  assert.deepEqual(ALLOWED.accept, ['final']); assert.ok(!ALLOWED.edit.includes('accepted'))
  assert.equal(isExpired({ validUntil: '2000-01-01' }), true); assert.equal(isExpired({}), false)
})
test('recipients and owners never receive staff-only fields', () => {
  const q = { _id: 'x', status: 'shared', pricing: priceHome(home, ctx), input: home, discount: { pct: 30, approval: 'pending', requestedBy: 's@tac' }, staffNote: 'secret', ownerEmail: 'o@x', ownerPhone: '1', comments: [], versions: [] }
  for (const audience of ['owner', 'recipient']) assert.doesNotMatch(JSON.stringify(quoteOut(q, audience)), /secret|s@tac|o@x|pending|"pct":30/)
  assert.match(JSON.stringify(quoteOut(q, 'staff')), /secret/)
})

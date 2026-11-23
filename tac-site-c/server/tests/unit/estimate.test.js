import test from 'node:test'
import assert from 'node:assert/strict'
import { computeEstimate } from '../../src/services/estimate.service.js'
import { validateDesign } from '../../src/validators/design.validator.js'
import { validateProductPatch } from '../../src/validators/product.validator.js'

const products = [
  { id: 'a', name: 'A', group: 'Lighting', unitPrice: 100, installPrice: 20 },
  { id: 'b', name: 'B', group: 'Security', unitPrice: 0, installPrice: 0 },
]
const rooms = [
  { id: 'r1', name: 'Bedroom', devices: [{ cat: 'a' }, { cat: 'a' }, { cat: 'b' }] },
  { id: 'r2', name: 'Hall', devices: [{ cat: 'a' }, { cat: 'zzz' }] },
]
test('estimate: totals, VAT, per-room and per-category breakdown', () => {
  const e = computeEstimate(rooms, products)
  assert.equal(e.devices, 300); assert.equal(e.installation, 60); assert.equal(e.subtotal, 360)
  assert.equal(e.vat, 18); assert.equal(e.total, 378)
  assert.equal(e.byRoom[0].total, 240); assert.equal(e.byRoom[1].total, 120)
  assert.equal(e.byCategory.find((c) => c.group === 'Lighting').qty, 3)
  assert.equal(e.items.find((i) => i.id === 'a').qty, 3)
})
test('estimate: unpriced and unknown products are flagged, not silently free', () => {
  assert.deepEqual(computeEstimate(rooms, products).unpriced.sort(), ['b', 'zzz'])
})
test('design: room size, colours, furniture and device level are sanitised', () => {
  const d = validateDesign({ body: { property: 'castle', rooms: [{ type: 'master', w: 99, l: 1, h: 3, wall: 'red', floor: '#ABCDEF',
    furniture: [{ type: 'bed', x: 10, y: 20, rot: 90 }, { type: 'laser', x: 1, y: 1 }], devices: [{ cat: 'ceiling-light', level: 500, color: '#FF00AA' }] }] } })
  assert.equal(d.property, 'apartment')
  const r = d.rooms[0]
  assert.equal(r.w, 20); assert.equal(r.l, 2); assert.equal(r.wall, '#d9dee7'); assert.equal(r.floor, '#abcdef')
  assert.equal(r.furniture.length, 1); assert.equal(r.devices[0].level, 100); assert.equal(r.devices[0].color, '#ff00aa')
})
test('product patch: rejects negative or absurd prices', () => {
  assert.throws(() => validateProductPatch({ params: { id: 'ceiling-light' }, body: { unitPrice: -1 } }), { status: 400 })
  assert.deepEqual(validateProductPatch({ params: { id: 'ceiling-light' }, body: { unitPrice: '12.345', connectivity: ['wired', 'x'] } }).set, { unitPrice: 12.35, connectivity: ['wired'] })
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { validateDesign, validateQuote } from '../../src/validators/design.validator.js'
import { validateEnquiry } from '../../src/validators/enquiry.validator.js'
import { validateRegister } from '../../src/validators/auth.validator.js'
import { csvCell } from '../../src/utils/csv.js'
import { hashPassword, verifyPassword } from '../../src/services/auth.service.js'

test('design: rebuilds shape, drops unknown devices, clamps coordinates', () => {
  const d = validateDesign({ body: { name: ' Villa\n', rooms: [{ id: 'r', type: 'hacker', name: 'X', devices: [{ id: 'a', cat: 'smart-ac', x: 500, y: -5, on: 1 }, { id: 'b', cat: '<script>' }] }] } })
  assert.equal(d.name, 'Villa')
  assert.equal(d.rooms[0].type, 'other')
  assert.deepEqual(d.rooms[0].devices, [{ id: 'a', cat: 'smart-ac', x: 100, y: 0, on: true, level: 100, color: '' }])
})
test('quote: rejects non-positive and absurd amounts, rounds to cents', () => {
  assert.throws(() => validateQuote({ body: { amount: 0 } }), { status: 400 })
  assert.throws(() => validateQuote({ body: { amount: 'abc' } }), { status: 400 })
  assert.equal(validateQuote({ body: { amount: '12.345' } }).amount, 12.35)
})
test('enquiry: needs name, valid email and a real message', () => {
  assert.throws(() => validateEnquiry({ body: { name: 'A', email: 'x', message: 'hi' } }), { status: 400 })
  assert.equal(validateEnquiry({ body: { name: 'Sam', email: 's@x.co', message: 'I need a smart home' } }).name, 'Sam')
})
test('register: anyone may be customer/builder, never admin', () => {
  const base = { name: 'Sam', email: 'S@X.co', password: 'password1' }
  assert.equal(validateRegister({ body: { ...base, role: 'admin' } }).role, 'customer')
  assert.equal(validateRegister({ body: { ...base, role: 'builder' } }).role, 'builder')
  assert.equal(validateRegister({ body: base }).email, 's@x.co')
  assert.throws(() => validateRegister({ body: { ...base, password: 'short' } }), { status: 400 })
})
test('csv: neutralises spreadsheet formulas and escapes quotes', () => {
  assert.equal(csvCell('=1+1'), `"'=1+1"`)
  assert.equal(csvCell('say "hi"'), '"say ""hi"""')
})
test('password hashing round-trips and rejects wrong passwords', async () => {
  const h = await hashPassword('correct horse')
  assert.equal(await verifyPassword('correct horse', h), true)
  assert.equal(await verifyPassword('wrong', h), false)
})

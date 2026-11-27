import test from 'node:test'
import assert from 'node:assert/strict'
import { validatePhone } from '../../src/validators/extra.validator.js'

const read = (phone) => validatePhone({ body: { phone } }).phone

test('accepts UAE and Indian mobile numbers in common formats', () => {
  for (const v of ['050 123 4567', '+971 50 123 4567', '971501234567', '00971501234567']) assert.equal(read(v), '+971501234567', v)
  for (const v of ['98765 43210', '+91 98765-43210', '919876543210', '0091 9876543210']) assert.equal(read(v), '+919876543210', v)
  assert.equal(read('9123456789'), '+919123456789') // a local number that happens to start with 91
})
test('rejects other and malformed numbers', () => {
  for (const v of ['', '12345', '+91 12345 67890', '+91 98765 4321', '+1 202 555 0100', '04 123 4567', 'abc']) assert.throws(() => read(v), { status: 400 }, v)
})

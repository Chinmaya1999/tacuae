// The pipeline's error counter: a wrong count would hide broken releases.
import test from 'node:test'
import assert from 'node:assert/strict'
import { count } from '../../../scripts/ci/parsers.mjs'
import { summarise } from '../../../scripts/ci/summary.mjs'

test('counts failing tests, type errors and vulnerabilities', () => {
  const xml = '<testsuites><testcase name="ok"/><testcase name="bad &amp; broken"><failure>x</failure></testcase><testcase name="later"><skipped/></testcase></testsuites>'
  assert.deepEqual(count('junit', { report: xml, output: '', status: 1 }), { total: 3, errors: 1, skipped: 1, details: ['bad & broken'] })
  assert.equal(count('tsc', { output: 'a.ts(1,1): error TS1: x\nb.ts(2,2): error TS2: y', status: 2 }).errors, 2)
  assert.equal(count('audit', { output: JSON.stringify({ vulnerabilities: { a: { name: 'a', severity: 'high' }, b: { name: 'b', severity: 'low' } } }), status: 1 }).errors, 1)
})
test('a crash or a missing result never looks like success', () => {
  assert.equal(count('junit', { report: null, output: 'boom', status: 1 }).errors, 1)
  assert.equal(count('junit', { report: '<testsuites/>', output: '', status: 1 }).errors, 1)
  const s = summarise([{ id: 'unit', title: 'Unit', errors: 0, details: [] }], ['unit', 'e2e'])
  assert.equal(s.total, 1)
  assert.match(s.markdown, /did not finish/)
})

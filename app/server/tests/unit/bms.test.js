import test from 'node:test'
import assert from 'node:assert/strict'
import { history, simulate } from '../../src/services/bms.simulation.js'
import { defaultEquipment, levelName } from '../../src/services/bms.layout.js'
import { validateEquipment, validateProject } from '../../src/validators/bms.validator.js'
import { EQUIPMENT, MODULES, equipmentDef } from '../../src/constants/bms.js'

const T = 1_800_000_000_000
test('catalogue: every type belongs to a known module and has a primary reading', () => {
  const mods = new Set(MODULES.map((m) => m.id))
  for (const e of EQUIPMENT) { assert.ok(mods.has(e.module), e.id); assert.ok(e.readings.some((r) => r.primary), `${e.id} needs a primary reading`) }
  assert.ok(equipmentDef['fire-panel'].safety && equipmentDef.elevator.safety, 'fire + lifts are status-only')
})
test('simulation is deterministic and returns every reading', () => {
  const eq = { id: 'abc', type: 'ahu', tag: 'AHU-T1-01' }
  assert.deepEqual(simulate(eq, {}, T), simulate(eq, {}, T))
  const s = simulate(eq, {}, T)
  assert.deepEqual(Object.keys(s.values).sort(), ['fan', 'filter', 'supply'])
  assert.ok(['online', 'warning', 'alarm', 'fault', 'offline'].includes(s.status))
})
test('simulation: an offline unit reports no values and a communication alarm; faults raise alerts', () => {
  let off = null, fault = null
  for (let i = 0; i < 3000 && !(off && fault); i++) { const s = simulate({ id: `e${i}`, type: 'pump', tag: 'P' }, {}, T); if (s.status === 'offline') off = s; if (s.status === 'fault') fault = s }
  assert.ok(off && fault)
  assert.ok(Object.values(off.values).every((v) => v === null)); assert.equal(off.alerts[0].code, 'offline')
  assert.equal(fault.alerts[0].code, 'fault')
})
test('simulation: fire and lift faults are critical', () => {
  for (let i = 0; i < 3000; i++) { const s = simulate({ id: `f${i}`, type: 'smoke-detector', tag: 'SD' }, {}, T); if (s.status === 'fault') return assert.equal(s.alerts[0].severity, 'critical') }
  assert.fail('no fault found')
})
test('elevator stays inside the building; solar is zero at night', () => {
  for (let i = 0; i < 50; i++) { const v = simulate({ id: 'lift', type: 'elevator', tag: 'L' }, { floors: 12 }, T + i * 7000).values.floor; if (v !== null) assert.ok(v >= 0 && v <= 11) }
  const night = Date.UTC(2026, 0, 1, 21, 0, 0) // 01:00 Dubai
  assert.equal(simulate({ id: 'pv', type: 'solar-inverter', tag: 'PV' }, {}, night).values.kw === 0 || simulate({ id: 'pv', type: 'solar-inverter', tag: 'PV' }, {}, night).status !== 'online', true)
})
test('history returns the requested number of points per reading', () => {
  const h = history({ id: 'x', type: 'chiller' }, {}, 24, 12, T)
  assert.equal(h.load.length, 12); assert.ok(h.load.every((p) => typeof p.v === 'number'))
})
test('default layout: each floor has HVAC/lighting/fire, plant is on ground/roof, basements get water + EV', () => {
  const p = { towers: [{ id: 'a', floors: 5, basements: 1 }] }
  const eq = defaultEquipment(p), at = (l, t) => eq.filter((e) => e.level === l && e.type === t).length
  for (let l = 0; l < 5; l++) { assert.equal(at(l, 'ahu'), 1); assert.equal(at(l, 'smoke-detector'), 2) }
  assert.equal(at(0, 'lt-panel'), 1); assert.equal(at(5, 'chiller'), 2); assert.equal(at(-1, 'pump'), 2); assert.equal(at(-1, 'ev-charger'), 2)
  assert.ok(eq.every((e) => e.x >= 0 && e.x <= 100 && e.y >= 0 && e.y <= 100))
})
test('level names', () => { assert.deepEqual([-2, 0, 3, 10].map((l) => levelName(l, 10)), ['B2', 'Ground', 'Floor 3', 'Roof']) })
test('project validation clamps sizes and requires a tower and name', () => {
  const v = validateProject({ body: { name: ' Marina Tower ', type: 'spaceport', towers: [{ floors: 999, unitsPerFloor: -3, basements: 99 }] } })
  assert.equal(v.name, 'Marina Tower'); assert.equal(v.type, 'residential'); assert.deepEqual(v.towers[0], { name: 'Tower 1', floors: 80, unitsPerFloor: 0, basements: 6 }); assert.equal(v.autoPlace, true)
  assert.throws(() => validateProject({ body: { name: 'x', towers: [{}] } }), { status: 400 })
  assert.throws(() => validateProject({ body: { name: 'Fine', towers: [] } }), { status: 400 })
})
test('equipment validation rejects unknown types and clamps position', () => {
  assert.throws(() => validateEquipment({ body: { type: 'rocket', towerId: 'a' } }), { status: 400 })
  const v = validateEquipment({ body: { type: 'pump', towerId: 'a', level: -50, x: 500, y: -5 } })
  assert.equal(v.level, -6); assert.equal(v.x, 100); assert.equal(v.y, 0)
})

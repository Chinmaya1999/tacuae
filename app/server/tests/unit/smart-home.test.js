// The homepage smart-home simulation: schedule, weather, occupancy, moods, safety and voice commands.
import test from 'node:test'
import assert from 'node:assert/strict'
import { DEVICES, ROOMS, VIEWS, deviceById } from '../../../client/src/features/website/smart-home/data/home.ts'
import { MOODS, NIGHT, SCENES, SCHEDULE } from '../../../client/src/features/website/smart-home/data/schedule.ts'
import { apply, clock, hazardRules, loadKw, occupancy, occupancyRules, roomOf, stateAt, weatherRules } from '../../../client/src/features/website/smart-home/engine/automation.ts'
import { pushOut } from '../../../client/src/features/studio/three/play.ts'
import { parseCommand } from '../../../client/src/features/website/smart-home/engine/voice.ts'

const run = (text) => parseCommand(text, NIGHT)

test('every schedule, mood and weather rule refers to real devices', () => {
  const sets = [NIGHT, ...SCHEDULE.map((r) => r.set), ...MOODS.map((m) => m.set), ...['sunny', 'rainy', 'hot', 'cold'].map((w) => weatherRules(w, 720, new Set(['living', 'master'])).set), ...['smoke', 'gas', 'leak'].map((h) => hazardRules(h).set)]
  for (const set of sets) for (const id of Object.keys(set)) assert.ok(deviceById.has(id), id)
  assert.deepEqual([...SCHEDULE].sort((a, b) => a.at - b.at), SCHEDULE, 'the schedule is in time order')
  assert.equal(MOODS.length, 8)
  for (const r of ROOMS) assert.ok(DEVICES.some((d) => d.room === r.id) || r.sensors.length, r.id)
  assert.equal(VIEWS.length, 8)
})
test('the day replays correctly at any time', () => {
  assert.equal(stateAt(clockMin(6, 2)).values['master.curtain'], 100)
  const away = stateAt(clockMin(9, 0))
  assert.deepEqual([away.mode, away.values['security.armed'], away.values['living.light'], away.values['garage.door']], ['Away', 1, 0, 0])
  assert.equal(stateAt(clockMin(17, 31)).values['entrance.lock'], 0)
  assert.deepEqual([stateAt(clockMin(23, 0)).mode, stateAt(clockMin(3, 0)).mode], ['Sleep', 'Sleep'])
  assert.equal(clock(clockMin(8, 31)), '08:31')
})
const clockMin = (h, m) => h * 60 + m

test('each family position is inside a room, or out of the house', () => {
  for (const [name, family] of Object.entries(SCENES)) for (const p of family) assert.equal(roomOf(p) === null, p.pose === 'away', `${name} ${JSON.stringify(p)}`)
  assert.equal(occupancy(SCENES.away).size, 0)
})
test('manual changes are protected from automation', () => {
  const r = apply(NIGHT, { 'master.ac': 18, 'kids.ac': 18 }, { 'master.ac': 999 })
  assert.deepEqual([r.values['master.ac'], r.values['kids.ac'], r.changed], [24, 18, ['kids.ac']])
})
test('weather rules protect the home', () => {
  assert.equal(weatherRules('rainy', 780, new Set()).set['garden.irrigation'], 0)
  assert.equal(weatherRules('hot', 780, new Set(['living'])).set['living.ac'], 22)
  assert.equal(weatherRules('hot', 780, new Set()).set['living.ac'], undefined, 'no cooling for an empty house')
  assert.equal(weatherRules('cold', 780, new Set(['living'])).set['living.ac'], 25)
})
test('lights follow people, after the chosen delay', () => {
  const values = { ...NIGHT, 'kitchen.light': 0 }
  const enter = occupancyRules(new Set(), new Set(['kitchen']), {}, 1200, 5, values)
  assert.equal(enter.set['kitchen.light'], 60)
  const leave = occupancyRules(new Set(['kitchen']), new Set(), {}, 1200, 5, { ...values, 'kitchen.light': 60 })
  assert.equal(leave.set['kitchen.light'], undefined, 'not before the delay')
  assert.equal(leave.set['security.armed'], 1, 'an empty house is armed')
  const later = occupancyRules(new Set(), new Set(), leave.emptySince, 1206, 5, { ...values, 'kitchen.light': 60 })
  assert.equal(later.set['kitchen.light'], 0)
})
test('hazards and energy', () => {
  assert.deepEqual([hazardRules('smoke').set['entrance.lock'], hazardRules('gas').set['kitchen.oven'], hazardRules('leak').set['bath.heater']], [0, 0, 0])
  assert.ok(loadKw({ ...NIGHT, 'kitchen.oven': 1 }) - loadKw(NIGHT) > 1.7)
})
test('voice commands from the brief are understood', () => {
  assert.equal(run('Hey Home, turn on the living room lights.').set['living.light'], 90)
  assert.deepEqual(run('Set bedroom temperature to 23 degrees.').set, { 'master.ac': 23 })
  assert.ok(Object.values(run('Close all curtains.').set).every((v) => v === 0))
  assert.equal(run('Activate movie mode.').mood, 'movie')
  const off = run('Switch off all lights.').set
  assert.ok(Object.keys(off).length === DEVICES.filter((d) => d.kind === 'light').length && Object.values(off).every((v) => v === 0))
  assert.deepEqual(run('Open the garage.').set, { 'garage.door': 1 })
  assert.deepEqual(run('Turn on garden lights.').set, { 'garden.light': 90 })
  assert.equal(run('Activate sleep mode.').mood, 'sleep')
  assert.equal(run('Good morning.').set['kitchen.coffee'], 1)
})
test('voice never unlocks or disarms, and ignores nonsense', () => {
  for (const s of ['unlock the front door', 'open the front door', 'disarm the alarm']) assert.equal(run(s).set, undefined, s)
  assert.equal(run('what is the meaning of life'), null)
  assert.equal(run('  '), null)
})

test('the walking player cannot pass through furniture', () => {
  const sofa = { x: 0, z: 0, w: 2, d: 1, rot: 0 }
  assert.deepEqual(pushOut(0, 0.4, sofa, 0.2), [0, 0.7])
  assert.deepEqual(pushOut(3, 3, sofa, 0.2), [3, 3])
  const [x, z] = pushOut(0.45, 0, { ...sofa, rot: Math.PI / 2 }, 0.2)
  assert.ok(Math.abs(x - 0.7) < 1e-9 && Math.abs(z) < 1e-9, 'rotated furniture blocks along its turned side')
})

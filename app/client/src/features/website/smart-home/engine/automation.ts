// Pure automation rules: no browser, no state of its own, so every rule is unit tested.
import { DEVICES, ROOMS, deviceById, roomName, type RoomId } from '../data/home.ts'
import { NIGHT, SCENES, SCHEDULE, type Family, type Routine, type SceneKey, type Spot, type Values } from '../data/schedule.ts'

export type Weather = 'sunny' | 'rainy' | 'hot' | 'cold'
export const OUTSIDE: Record<Weather, number> = { sunny: 31, rainy: 26, hot: 44, cold: 14 }
export const clock = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(Math.floor(min % 60)).padStart(2, '0')}`
export const isDark = (min: number) => min < 6 * 60 + 15 || min >= 18 * 60 + 30

/** The home as the schedule leaves it at a given minute of the day. */
export function stateAt(min: number): { values: Values; scene: SceneKey; mode: string } {
  let values = { ...NIGHT }, scene: SceneKey = 'sleeping', mode = 'Sleep'
  for (const r of SCHEDULE) { if (r.at > min) break; values = { ...values, ...r.set }; scene = r.scene ?? scene; mode = r.mode ?? mode }
  return { values, scene, mode }
}
export const nextRoutine = (min: number): Routine => SCHEDULE.find((r) => r.at > min) ?? SCHEDULE[0]

/** Which room a person is in (null when out of the house). */
export function roomOf(p: Spot): RoomId | null {
  if (p.pose === 'away') return null
  return ROOMS.find((r) => r.id !== 'entrance' && Math.abs(p.x - r.at[0]) <= r.size[0] / 2 && Math.abs(p.z - r.at[1]) <= r.size[1] / 2)?.id ?? null
}
export const occupancy = (family: Family) => new Set(family.map(roomOf).filter((r): r is RoomId => r !== null))
export const sceneFamily = (key: SceneKey): Family => SCENES[key]

/** Applies changes, leaving alone anything a person has just set by hand. */
export function apply(values: Values, changes: Values, held: Record<string, number> = {}): { values: Values; changed: string[] } {
  const next = { ...values }, changed: string[] = []
  for (const [id, v] of Object.entries(changes)) if (!(id in held) && deviceById.has(id) && next[id] !== v) { next[id] = v; changed.push(id) }
  return { values: next, changed }
}

/** What the weather asks of the house, given who is where. */
export function weatherRules(weather: Weather, min: number, rooms: Set<RoomId>): { set: Values; notes: string[] } {
  const day = !isDark(min), set: Values = {}, comfort = (t: number) => { for (const r of ['living', 'master', 'kids'] as const) if (rooms.has(r)) set[`${r}.ac`] = t }
  if (weather === 'rainy') {
    Object.assign(set, { 'garden.irrigation': 0, 'living.curtain': 0, 'master.curtain': 0, 'kids.curtain': 0 })
    if (day) set['garden.light'] = 50
    return { set, notes: ['Rain detected: irrigation paused', 'Motorised windows and curtains closed', 'Residents notified of the weather change'] }
  }
  if (weather === 'hot') {
    comfort(22); Object.assign(set, { 'living.curtain': 15, 'master.curtain': 15, 'kids.curtain': 15 }); if (rooms.has('living')) set['living.fan'] = 2
    return { set, notes: ['44°C outside: curtains close against the sun', rooms.size ? 'Occupied rooms cooled to 22°C' : 'Nobody home: cooling stays off to save energy'] }
  }
  if (weather === 'cold') {
    comfort(25); set['living.fan'] = 0; if (day) Object.assign(set, { 'living.curtain': 100, 'master.curtain': 100, 'kids.curtain': 100 })
    return { set, notes: ['14°C outside: heating comfort set to 25°C', day ? 'Curtains open to gain warmth from the sun' : 'Curtains stay closed to keep warmth in'] }
  }
  if (day) Object.assign(set, { 'living.curtain': 75, 'living.light': 0, 'kitchen.light': rooms.has('kitchen') ? 35 : 0 })
  return { set, notes: day ? ['Sunny: curtains let daylight in, indoor lights lowered'] : ['Clear night: no change needed'] }
}

/** Lights follow people: on when someone enters a dark room, off after it has been empty for `delay` minutes. */
export function occupancyRules(before: Set<RoomId>, now: Set<RoomId>, emptySince: Record<string, number>, min: number, delay: number, values: Values) {
  const set: Values = {}, notes: string[] = [], since = { ...emptySince }
  for (const room of now) {
    delete since[room]
    if (!before.has(room) && isDark(min) && values[`${room}.light`] === 0) { set[`${room}.light`] = 60; notes.push(`Motion in ${roomName(room)}: lights on`) }
  }
  for (const room of before) if (!now.has(room)) since[room] = min
  for (const [room, from] of Object.entries(since)) {
    if ((min - from + 1440) % 1440 < delay) continue
    delete since[room]
    const off = DEVICES.filter((x) => x.room === room && (x.kind === 'light' || x.kind === 'ac' || x.kind === 'fan') && values[x.id] > 0 && x.room !== 'garden')
    if (off.length) { for (const x of off) set[x.id] = 0; notes.push(`${roomName(room as RoomId)} empty for ${delay} min: lights and climate off`) }
  }
  if (before.size && !now.size) { Object.assign(set, { 'entrance.lock': 1, 'security.armed': 1 }); notes.push('Everyone has left: doors locked and alarm armed') }
  return { set, notes, emptySince: since }
}

export type Hazard = 'smoke' | 'gas' | 'leak'
export function hazardRules(h: Hazard): { set: Values; notes: string[] } {
  if (h === 'leak') return { set: { 'bath.heater': 0, 'bath.light': 100 }, notes: ['Water leak sensed: supply valve closed', 'Water heater switched off', 'Residents alerted'] }
  const lights = Object.fromEntries(DEVICES.filter((x) => x.kind === 'light').map((x) => [x.id, 100]))
  return {
    set: { ...lights, 'entrance.lock': 0, 'kitchen.oven': 0, 'kitchen.coffee': 0, 'kitchen.exhaust': h === 'smoke' ? 0 : 1, 'living.ac': 0, 'master.ac': 0, 'kids.ac': 0 },
    notes: h === 'smoke' ? ['Smoke detected: siren and all lights on', 'Exit door unlocked, ventilation stopped'] : ['Gas leak detected: gas valve closed', 'Oven off, exhaust running, exit door unlocked'],
  }
}

/** Current electrical load in kilowatts. */
export function loadKw(values: Values) {
  const watts = DEVICES.reduce((sum, x) => {
    const v = values[x.id] ?? 0
    const share = x.kind === 'light' ? v / 100 : x.kind === 'ac' ? (v ? 1 : 0) : x.kind === 'fan' ? v / 3 : x.kind === 'switch' || x.kind === 'arm' || x.kind === 'lock' ? (v || x.kind === 'lock' ? 1 : 0) : 0
    return sum + x.watts * share
  }, 0)
  return Math.round(watts / 10) / 100
}
export function indoorTemp(values: Values, weather: Weather) {
  const set = ['living.ac', 'master.ac', 'kids.ac'].map((k) => values[k]).filter(Boolean)
  return set.length ? Math.round(set.reduce((a, b) => a + b, 0) / set.length) : Math.round(OUTSIDE[weather] * 0.35 + 17)
}

// The simulation's single source of truth. The 3D house and every panel read from here.
import { create } from 'zustand'
import { deviceById, roomName, type RoomId, type View } from './data/home'
import { MOODS, PEOPLE, SCHEDULE, type Family, type Values } from './data/schedule'
import { apply, clock, hazardRules, nextRoutine, occupancy, occupancyRules, sceneFamily, stateAt, weatherRules, type Hazard, type Weather } from './engine/automation'
import { parseCommand } from './engine/voice'

export type Entry = { key: number; time: string; source: string; text: string }
export type Speed = 'story' | 'live'
type State = {
  min: number; weather: Weather; values: Values; family: Family; mode: string; playing: boolean; speed: Speed
  held: Record<string, number>; log: Entry[]; room: RoomId; view: View; hazard: Hazard | null
  auto: boolean; delay: number; emptySince: Record<string, number>
  flash: { rooms: RoomId[]; key: number }; heard: { said: string; intent: string; reply: string } | null; say: { who: number; text: string; key: number } | null
}
type Actions = {
  step: () => void; setTime: (min: number) => void; set: (id: string, v: number) => void; resume: () => void; mood: (id: string) => void; weatherTo: (w: Weather) => void
  command: (said: string) => string; enter: (room: RoomId) => void; trigger: (h: Hazard | null) => void; pick: (room: RoomId) => void; look: (view: View) => void
  options: (o: Partial<Pick<State, 'playing' | 'speed' | 'auto' | 'delay'>>) => void
}

const HOLD = 90 // simulated minutes a manual change is protected from automation
let serial = 0
const entry = (min: number, source: string, text: string): Entry => ({ key: ++serial, time: clock(min), source, text })
const push = (log: Entry[], ...add: Entry[]) => [...add.reverse(), ...log].slice(0, 40)
const flashOf = (ids: string[]) => ({ rooms: [...new Set(ids.map((i) => deviceById.get(i)!.room))], key: ++serial })
const VIEW_FOR: Partial<Record<RoomId, View>> = { living: 'living', kitchen: 'kitchen', master: 'bedroom', garden: 'garden', security: 'security', entrance: 'entrance' }
const start = stateAt(6 * 60)

export const useHome = create<State & Actions>()((set, get) => {
  /** Moves people, then lets occupancy and weather react. */
  const settle = (s: State, next: Partial<State>, log: Entry[]) => {
    const merged = { ...s, ...next }
    if (!merged.auto || merged.hazard) return { ...next, log }
    const o = occupancyRules(occupancy(s.family), occupancy(merged.family), merged.emptySince, merged.min, merged.delay, merged.values)
    const r = apply(merged.values, o.set, merged.held)
    return { ...next, values: r.values, emptySince: o.emptySince, log: push(log, ...o.notes.map((n) => entry(merged.min, 'Occupancy', n))), ...(r.changed.length ? { flash: flashOf(r.changed) } : {}) }
  }
  const release = (held: Record<string, number>, min: number) => Object.fromEntries(Object.entries(held).filter(([, until]) => min < until))

  return {
    min: 6 * 60, weather: 'sunny', values: start.values, family: sceneFamily(start.scene), mode: start.mode, playing: true, speed: 'story',
    held: {}, log: [entry(6 * 60, 'Schedule', SCHEDULE[0].text)], room: 'living', view: 'cutaway', hazard: null, auto: true, delay: 5, emptySince: {}, flash: { rooms: [], key: 0 }, heard: null, say: null,

    step: () => {
      const s = get()
      if (s.hazard) return
      const routine = nextRoutine(s.min)
      const min = s.speed === 'story' ? routine.at : (s.min + 1) % 1440
      const due = s.speed === 'story' ? routine : SCHEDULE.find((r) => r.at === min)
      const held = release(s.held, min)
      if (!due) return set((cur) => settle({ ...cur, held }, { min, held }, cur.log))
      const base = apply(s.values, due.set, held)
      const family = due.scene ? sceneFamily(due.scene) : s.family
      const weather = weatherRules(s.weather, min, occupancy(family))
      const rained = s.weather === 'sunny' ? { values: base.values, changed: [] } : apply(base.values, weather.set, held)
      const text = s.weather === 'rainy' && due.set['garden.irrigation'] ? 'Scheduled irrigation skipped because it is raining' : due.text
      set(settle({ ...s, held }, { min, held, values: rained.values, family, mode: due.mode ?? s.mode, say: null, flash: flashOf([...base.changed, ...rained.changed]) }, push(s.log, entry(min, 'Schedule', text))))
    },
    setTime: (min) => {
      const s = get(), at = stateAt(min), weather = s.weather === 'sunny' ? null : weatherRules(s.weather, min, occupancy(sceneFamily(at.scene)))
      set({ min, values: { ...at.values, ...weather?.set }, family: sceneFamily(at.scene), mode: at.mode, held: {}, emptySince: {}, hazard: null, playing: false, say: null, log: push(s.log, entry(min, 'Clock', `Time moved to ${clock(min)}: ${at.mode} state`)) })
    },
    set: (id, v) => {
      const s = get(), d = deviceById.get(id)!
      const word = d.kind === 'light' || d.kind === 'curtain' ? `${v}%` : d.kind === 'ac' ? (v ? `${v}°C` : 'off') : d.kind === 'fan' ? (v ? `speed ${v}` : 'off') : d.kind === 'lock' ? (v ? 'locked' : 'unlocked') : d.kind === 'door' ? (v ? 'opening' : 'closing') : d.kind === 'arm' ? (v ? 'armed' : 'disarmed') : v ? 'on' : 'off'
      set({ values: { ...s.values, [id]: v }, held: { ...s.held, [id]: s.min + HOLD }, playing: false, heard: null, flash: flashOf([id]), log: push(s.log, entry(s.min, 'Manual', `${roomName(d.room)} · ${d.name}: ${word}`)) })
    },
    resume: () => set((s) => ({ held: {}, log: push(s.log, entry(s.min, 'System', 'Manual override cleared: automation resumed')) })),
    mood: (id) => {
      const s = get(), m = MOODS.find((x) => x.id === id)!, r = apply(s.values, m.set)
      const family = m.scene ? sceneFamily(m.scene) : s.family
      set(settle(s, { values: r.values, family, mode: `${m.name} mode`, held: {}, hazard: null, playing: false, flash: flashOf(Object.keys(m.set)) }, push(s.log, entry(s.min, 'Mood', `${m.name}: ${m.text}`))))
    },
    weatherTo: (weather) => {
      const s = get(), w = weatherRules(weather, s.min, occupancy(s.family)), r = apply(s.values, w.set, s.held)
      set({ weather, values: r.values, playing: false, flash: flashOf(Object.keys(w.set)), log: push(s.log, ...w.notes.map((n) => entry(s.min, 'Climate', n))) })
    },
    command: (said) => {
      const c = parseCommand(said, get().values)
      const reply = c?.reply ?? 'I did not understand that. Try “movie mode” or “turn off all lights”.'
      set({ heard: { said, intent: c?.intent ?? 'Not recognised', reply }, say: { who: 1, text: said, key: ++serial }, playing: false })
      if (c?.mood) get().mood(c.mood)
      else if (c?.set) set((s) => ({ values: { ...s.values, ...c.set }, held: { ...s.held, ...Object.fromEntries(Object.keys(c.set!).map((k) => [k, s.min + HOLD])) }, flash: flashOf(Object.keys(c.set!)), hazard: null }))
      set((s) => ({ log: push(s.log, entry(s.min, 'Voice', `“${said}” → ${reply}`)) }))
      return reply
    },
    enter: (room) => {
      const s = get(), spot = { living: [0, 1], kitchen: [-4.3, -2.2], dining: [-4.9, 0.2], master: [2.8, -2], kids: [4.8, 2.6], bath: [0.6, -2.2], garage: [-8.2, 2.6], garden: [-2.5, 5.9], security: [-1.6, -2.4], entrance: [1.6, 4.4] }[room] as [number, number]
      const family = [...s.family] as Family
      family[0] = { x: spot[0], z: spot[1], pose: 'stand' }
      set(settle(s, { family, playing: false, room }, push(s.log, entry(s.min, 'Sensor', `${PEOPLE[0]} walks to ${roomName(room)}`))))
    },
    trigger: (hazard) => {
      const s = get()
      if (!hazard) { const at = stateAt(s.min); return set({ hazard: null, values: at.values, log: push(s.log, entry(s.min, 'Safety', 'Alert cleared: home back to normal')) }) }
      const h = hazardRules(hazard)
      set({ hazard, values: { ...s.values, ...h.set }, playing: false, flash: flashOf(Object.keys(h.set)), log: push(s.log, ...h.notes.map((n) => entry(s.min, 'Safety', n))) })
    },
    pick: (room) => set({ room, view: VIEW_FOR[room] ?? 'cutaway' }),
    look: (view) => set({ view }),
    options: (o) => set(o),
  }
})

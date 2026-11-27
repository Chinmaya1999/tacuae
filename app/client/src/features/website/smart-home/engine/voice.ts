// Turns a typed or spoken sentence into a change to the simulated home.
import { DEVICES, deviceById, roomName, type RoomId } from '../data/home.ts'
import { MOODS, type Values } from '../data/schedule.ts'

export type Command = { intent: string; reply: string; set?: Values; mood?: string }

const ROOM_WORDS: [RegExp, RoomId][] = [
  [/\b(living|lounge|hall)\b/, 'living'], [/\bkitchen\b/, 'kitchen'], [/\bdining\b/, 'dining'], [/\b(kids?|child\w*|childrens?)\b/, 'kids'], [/\b(bath\w*|washroom|toilet)\b/, 'bath'],
  [/\b(master|bedroom|our room)\b/, 'master'], [/\bgarage\b/, 'garage'], [/\b(garden|outdoor|outside|yard)\b/, 'garden'], [/\b(entrance|porch|front)\b/, 'entrance'],
]
const ids = (test: (d: (typeof DEVICES)[number]) => boolean, v: number): Values => Object.fromEntries(DEVICES.filter(test).map((d) => [d.id, v]))

export function parseCommand(input: string, now: Values): Command | null {
  const s = input.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/^(hey|ok|okay|hi) (home|tac)\s*/, '')
  if (!s) return null
  const has = (re: RegExp) => re.test(s)
  const room = ROOM_WORDS.find(([re]) => re.test(s))?.[1]
  const off = has(/\b(off|stop|close|shut)\b/)
  const mood = (id: string): Command => { const m = MOODS.find((x) => x.id === id)!; return { intent: `${m.name} mode`, mood: id, reply: `${m.name} mode activated.` } }
  const one = (id: string, v: number, reply: string): Command => ({ intent: deviceById.get(id)!.name, set: { [id]: v }, reply })

  if (has(/\bunlock\b|\bopen (the )?(front )?door\b|\bdisarm\b/)) return { intent: 'Security', reply: 'For safety I do not unlock or disarm by voice. Please use the manual control.' }
  if (has(/\bgood morning|wake( us)? up\b/)) return { intent: 'Good morning', set: { 'master.curtain': 100, 'kids.curtain': 100, 'living.curtain': 100, 'master.light': 35, 'kitchen.light': 80, 'kitchen.coffee': 1, 'security.armed': 0 }, reply: 'Good morning. Curtains are opening and coffee is on the way.' }
  if (has(/\bgood night|bed ?time|going to (bed|sleep)|sleep mode\b/)) return mood('sleep')
  if (has(/\b(i am|im|we are|were) (back|home)\b|\bwelcome\b/)) return mood('welcome')
  if (has(/\bleaving|good ?bye|going out|away mode\b/)) return { intent: 'Away mode', set: { ...ids((d) => d.kind === 'light' || d.kind === 'ac' || d.kind === 'fan', 0), 'living.tv': 0, 'living.speaker': 0, 'entrance.lock': 1, 'security.armed': 1, 'garage.door': 0 }, reply: 'See you soon. The home is secured.' }
  const named = MOODS.find((m) => s.includes(m.id))
  if (named && (has(/\b(mode|time|scene|activate|start)\b/) || s === named.id)) return mood(named.id)

  if (has(/\bgarage\b/) && has(/\b(open|close|shut)\b/)) return one('garage.door', off ? 0 : 1, `${off ? 'Closing' : 'Opening'} the garage.`)
  if (has(/\bgate\b/)) return one('garden.gate', off ? 0 : 1, `${off ? 'Closing' : 'Opening'} the gate.`)
  if (has(/\b(irrigation|sprinklers?|water (the )?(garden|plants))\b/)) return one('garden.irrigation', off ? 0 : 1, `Irrigation ${off ? 'off' : 'on'}.`)
  if (has(/\block\b/)) return one('entrance.lock', 1, 'The front door is locked.')
  if (has(/\barm\b/)) return one('security.armed', 1, 'Security system armed.')
  if (has(/\b(curtains?|blinds?)\b/)) {
    const only = room && deviceById.has(`${room}.curtain`) ? room : undefined, v = off ? 0 : 100
    return { intent: 'Curtains', set: ids((d) => d.kind === 'curtain' && (!only || d.room === only), v), reply: `${off ? 'Closing' : 'Opening'} ${only ? `the ${roomName(only).toLowerCase()}` : 'all'} curtains.` }
  }
  const degrees = /\b(1[6-9]|2\d|30)\b/.exec(s)
  if (degrees && has(/\b(ac|temperature|degrees?|cool\w*|set)\b/)) {
    const only = room && deviceById.has(`${room}.ac`) ? room : undefined, t = Number(degrees[1])
    return { intent: 'Temperature', set: ids((d) => d.kind === 'ac' && (!only || d.room === only), t), reply: `${only ? roomName(only) : 'All rooms'} set to ${t} degrees.` }
  }
  if (has(/\b(too hot|im hot|i am hot|cooler)\b/)) { const t = Math.max(16, (now['living.ac'] || 25) - 2); return one('living.ac', t, `Cooling the living room to ${t} degrees.`) }
  if (has(/\b(too cold|im cold|i am cold|warmer)\b/)) { const t = Math.min(30, (now['living.ac'] || 23) + 2); return one('living.ac', t, `Warming the living room to ${t} degrees.`) }
  if (has(/\b(ac|air con\w*|cooling)\b/)) { const t = room && deviceById.has(`${room}.ac`) ? room : 'living'; return one(`${t}.ac`, off ? 0 : 23, `${roomName(t)} air conditioning ${off ? 'off' : 'on'}.`) }
  if (has(/\bfan\b/) && !has(/\bexhaust\b/)) { const t = room === 'master' ? 'master' : 'living'; return one(`${t}.fan`, off ? 0 : has(/\b(high|fast|full)\b/) ? 3 : 2, `Fan ${off ? 'off' : 'on'}.`) }
  if (has(/\bexhaust\b/)) { const t = room === 'bath' ? 'bath' : 'kitchen'; return one(`${t}.exhaust`, off ? 0 : 1, `Exhaust ${off ? 'off' : 'on'}.`) }
  if (has(/\b(tv|television)\b/)) return one('living.tv', off ? 0 : 1, `TV ${off ? 'off' : 'on'}.`)
  if (has(/\b(music|speakers?)\b/)) return one('living.speaker', off ? 0 : 1, off ? 'Music stopped.' : 'Playing music.')
  if (has(/\bcoffee\b/)) return one('kitchen.coffee', off ? 0 : 1, off ? 'Coffee machine off.' : 'Making your coffee.')
  if (has(/\boven\b/)) return one('kitchen.oven', off ? 0 : 1, `Oven ${off ? 'off' : 'on'}.`)
  if (has(/\b(water )?heater|hot water\b/)) return one('bath.heater', off ? 0 : 1, `Water heater ${off ? 'off' : 'on'}.`)
  if (has(/\b(light|lights|lamps?|dim|bright\w*)\b/)) {
    const only = room && deviceById.has(`${room}.light`) ? room : undefined, level = has(/\bdim\b/) ? 20 : off ? 0 : 90
    return { intent: 'Lights', set: ids((d) => d.kind === 'light' && (!only || d.room === only), level), reply: `${only ? roomName(only) : 'All'} lights ${level === 0 ? 'off' : level === 20 ? 'dimmed' : 'on'}.` }
  }
  return null
}

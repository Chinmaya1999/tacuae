// The family's day: scheduled automations, where everyone is, and mood presets.
import { DEVICES } from './home.ts'

export type Values = Record<string, number>
export type Pose = 'stand' | 'sit' | 'sleep' | 'away'
export type Spot = { x: number; z: number; y?: number; face?: number; pose: Pose }
/** Order: father, mother, daughter, son. */
export type Family = [Spot, Spot, Spot, Spot]
export const PEOPLE = ['Omar (dad)', 'Sara (mum)', 'Lina', 'Adam']

const stand = (x: number, z: number, face = 0): Spot => ({ x, z, pose: 'stand', face })
const sit = (x: number, z: number, face = 0): Spot => ({ x, z, pose: 'sit', face })
const bed = (x: number, z: number, y = 0.62): Spot => ({ x, z, y, pose: 'sleep' })
const away: Spot = { x: 1.6, z: 4.9, pose: 'away' }

export const SCENES = {
  sleeping: [bed(3.85, -3.75), bed(4.75, -3.75), bed(3.5, 1.3, 0.52), bed(6.1, 1.3, 0.52)],
  waking: [stand(2.6, -2.2, 0.4), sit(5.5, -2.6, -0.4), sit(3.6, 2.3, 0.2), sit(6, 2.3, -0.2)],
  washing: [stand(0.6, -2.3, 3), stand(-4.4, -3.6, 3.14), sit(3.6, 2.3, 0.2), stand(5.3, 1.8, 0)],
  breakfast: [sit(-6.15, 1.6, 1.57), stand(-4.4, -3.9, 3.14), sit(-3.65, 1.6, -1.57), sit(-4.9, 2.85, 3.14)],
  away: [away, away, away, away],
  welcome: [stand(1.4, 2.8, 3.14), stand(-4.5, -2.2, 0.4), stand(0.2, 2.2, 2.6), stand(-1, 3, 2.8)],
  relax: [sit(-0.9, 2.55, 3.14), sit(0.1, 2.55, 3.14), sit(1.1, 2.55, 3.14), stand(4.8, 2.4, 0)],
  movie: [sit(-1, 2.55, 3.14), sit(-0.3, 2.55, 3.14), sit(0.4, 2.55, 3.14), sit(1.1, 2.55, 3.14)],
  party: [stand(-1.3, 1.2, 0.6), stand(0.3, 0.9, -0.2), stand(1.2, 1.8, -0.9), stand(-0.5, 2.2, 0.3)],
  study: [sit(-0.4, 2.55, 3.14), sit(0.8, 2.55, 3.14), sit(-6.15, 1.6, 1.57), sit(-3.65, 1.6, -1.57)],
} satisfies Record<string, Family>
export type SceneKey = keyof typeof SCENES

const all = (kind: string, v: number): Values => Object.fromEntries(DEVICES.filter((x) => x.kind === kind).map((x) => [x.id, v]))
const lightsOff = () => all('light', 0)
const acOff = () => all('ac', 0)

/** Everything as it stands overnight; the day replays on top of this. */
export const NIGHT: Values = {
  ...Object.fromEntries(DEVICES.map((x) => [x.id, 0])),
  'kitchen.fridge': 1, 'security.cameras': 1, 'security.armed': 1, 'entrance.lock': 1, 'master.ac': 24, 'kids.ac': 24, 'garden.light': 20, 'entrance.light': 15,
}

export type Routine = { at: number; mode?: string; scene?: SceneKey; text: string; set: Values }
const at = (h: number, m: number) => h * 60 + m
export const SCHEDULE: Routine[] = [
  { at: at(6, 0), mode: 'Wake-up', scene: 'waking', text: 'Wake-up routine activated', set: { 'master.light': 30, 'kids.light': 25, 'security.armed': 0 } },
  { at: at(6, 2), text: 'Bedroom curtains opened', set: { 'master.curtain': 100, 'kids.curtain': 100 } },
  { at: at(6, 3), text: 'Natural light: living room curtains open, garden lights off', set: { 'living.curtain': 100, 'garden.light': 0, 'entrance.light': 0 } },
  { at: at(6, 10), scene: 'washing', text: 'Bathroom water heater activated', set: { 'bath.heater': 1, 'bath.light': 85, 'bath.exhaust': 1 } },
  { at: at(7, 0), mode: 'Breakfast', scene: 'breakfast', text: 'Kitchen morning scene: lights, coffee, oven and exhaust', set: { 'kitchen.light': 90, 'kitchen.coffee': 1, 'kitchen.oven': 1, 'kitchen.exhaust': 1, 'dining.light': 80, 'bath.heater': 0, 'bath.light': 0, 'bath.exhaust': 0, 'master.ac': 0, 'kids.ac': 0, 'master.light': 0, 'kids.light': 0 } },
  { at: at(7, 40), text: 'Cooking finished: oven, coffee and exhaust off', set: { 'kitchen.coffee': 0, 'kitchen.oven': 0, 'kitchen.exhaust': 0 } },
  { at: at(8, 30), mode: 'Away', scene: 'away', text: 'Away mode: lights and appliances off, garage opens', set: { ...lightsOff(), ...acOff(), ...all('fan', 0), 'living.tv': 0, 'living.speaker': 0, 'garage.door': 1, 'garden.gate': 1 } },
  { at: at(8, 31), text: 'Doors locked and security system armed', set: { 'entrance.lock': 1, 'security.armed': 1, 'garage.door': 0, 'garden.gate': 0 } },
  { at: at(12, 0), mode: 'Energy saving', text: 'Energy saving: curtains half closed against the sun', set: { 'living.curtain': 40, 'master.curtain': 30, 'kids.curtain': 30 } },
  { at: at(13, 0), text: 'Garden irrigation started after checking the weather', set: { 'garden.irrigation': 1 } },
  { at: at(13, 25), text: 'Irrigation cycle complete', set: { 'garden.irrigation': 0 } },
  { at: at(17, 30), mode: 'Welcome home', scene: 'welcome', text: 'Family recognised at the gate: door unlocked, welcome scene', set: { 'security.armed': 0, 'entrance.lock': 0, 'garden.gate': 1, 'garage.door': 1, 'garage.light': 80, 'entrance.light': 80, 'living.light': 80, 'living.ac': 23, 'living.speaker': 1, 'living.curtain': 80, 'kitchen.light': 70 } },
  { at: at(17, 36), text: 'Gate and garage closed, car charging, door locked', set: { 'garden.gate': 0, 'garage.door': 0, 'garage.light': 0, 'garage.ev': 1, 'entrance.lock': 1 } },
  { at: at(19, 0), mode: 'Family relaxation', scene: 'relax', text: 'Evening relaxation: soft light, TV and garden lights', set: { 'living.light': 45, 'living.ambient': 70, 'living.tv': 1, 'living.speaker': 0, 'living.curtain': 20, 'garden.light': 80, 'kids.light': 60, 'kids.ac': 23, 'dining.light': 40 } },
  { at: at(22, 0), mode: 'Sleep', scene: 'sleeping', text: 'Sleep mode: lights dim, curtains close, doors lock, security watches', set: { ...lightsOff(), ...all('curtain', 0), 'master.light': 8, 'garden.light': 20, 'entrance.light': 15, 'living.tv': 0, 'living.ac': 0, 'living.fan': 0, 'kitchen.light': 0, 'master.ac': 24, 'kids.ac': 24, 'entrance.lock': 1, 'security.armed': 1 } },
]

export type Mood = { id: string; name: string; scene?: SceneKey; text: string; set: Values }
export const MOODS: Mood[] = [
  { id: 'relax', name: 'Relax', scene: 'relax', text: 'Soft warm light, calm music, comfortable cooling', set: { 'living.light': 35, 'living.ambient': 60, 'living.speaker': 1, 'living.tv': 0, 'living.ac': 23, 'living.curtain': 30 } },
  { id: 'movie', name: 'Movie', scene: 'movie', text: 'Lights to 15%, curtains closed, TV and surround sound on', set: { 'living.light': 15, 'living.ambient': 35, 'living.curtain': 0, 'living.tv': 1, 'living.speaker': 1, 'living.ac': 22, 'kitchen.light': 0, 'dining.light': 0 } },
  { id: 'romantic', name: 'Romantic', text: 'Candle-warm dimming and gentle music', set: { 'living.light': 8, 'living.ambient': 45, 'dining.light': 30, 'living.speaker': 1, 'living.tv': 0, 'living.curtain': 0, 'garden.light': 40, 'living.ac': 23 } },
  { id: 'party', name: 'Party', scene: 'party', text: 'Bright colour, music up, garden lit, extra cooling', set: { 'living.light': 100, 'living.ambient': 100, 'dining.light': 90, 'kitchen.light': 90, 'garden.light': 100, 'living.speaker': 1, 'living.tv': 0, 'living.ac': 21, 'living.fan': 2 } },
  { id: 'focus', name: 'Focus', scene: 'study', text: 'Bright even light, silence, steady cooling', set: { 'living.light': 100, 'dining.light': 100, 'living.ambient': 0, 'living.speaker': 0, 'living.tv': 0, 'living.ac': 23, 'living.curtain': 70 } },
  { id: 'reading', name: 'Reading', scene: 'study', text: 'Comfortable reading light, quiet house', set: { 'living.light': 75, 'dining.light': 70, 'living.ambient': 20, 'living.tv': 0, 'living.speaker': 0, 'living.ac': 24 } },
  { id: 'sleep', name: 'Sleep', scene: 'sleeping', text: 'Everything off, bedrooms cool, home secured', set: { ...SCHEDULE.at(-1)!.set, 'dining.light': 0, 'living.speaker': 0 } },
  { id: 'welcome', name: 'Welcome home', scene: 'welcome', text: 'Door unlocks, lights and cooling greet the family', set: { 'security.armed': 0, 'entrance.lock': 0, 'entrance.light': 80, 'living.light': 85, 'living.ambient': 50, 'kitchen.light': 70, 'living.speaker': 1, 'living.ac': 23, 'living.curtain': 70 } },
]

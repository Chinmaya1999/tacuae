import type { Kind, PlacedDevice } from '../../data/catalog'

const hsl = (h: number) => { const f = (n: number) => { const k = (n + h / 30) % 12, a = 0.5 * Math.min(0.5, 1 - 0.5); return Math.round(255 * (0.5 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, '0') }; return `#${f(0)}${f(8)}${f(4)}` }

export type SceneDef = { id: string; label: string; icon: string; night: boolean; apply: (d: PlacedDevice, kind: Kind, i: number) => Partial<PlacedDevice> }
const light = (level: number, color: string) => ({ on: true, level, color })

/** Lighting / room scenes. They only change the simulated state of devices in the current room. */
export const SCENES: SceneDef[] = [
  { id: 'morning', label: 'Morning', icon: 'Sun', night: false, apply: (_d, k) => (k === 'light' ? light(70, '#fff1d6') : k === 'curtain' ? { on: true, level: 100 } : k === 'ac' ? { on: true, level: 25 } : {}) },
  { id: 'work', label: 'Work', icon: 'Laptop', night: true, apply: (_d, k) => (k === 'light' ? light(100, '#ffffff') : {}) },
  { id: 'reading', label: 'Reading', icon: 'BookOpen', night: true, apply: (_d, k) => (k === 'light' ? light(65, '#ffd9a0') : {}) },
  { id: 'relax', label: 'Relax', icon: 'Sofa', night: true, apply: (_d, k) => (k === 'light' ? light(35, '#ffb86b') : k === 'curtain' ? { on: false } : {}) },
  { id: 'movie', label: 'Movie', icon: 'Clapperboard', night: true, apply: (d, k) => (k === 'light' ? (d.cat === 'rgb-lighting' ? light(15, '#3b4cff') : { on: false }) : k === 'curtain' ? { on: false } : k === 'speaker' || k === 'panel' ? { on: true } : {}) },
  { id: 'dinner', label: 'Dinner', icon: 'Utensils', night: true, apply: (_d, k) => (k === 'light' ? light(45, '#ffcf8a') : {}) },
  { id: 'night', label: 'Night', icon: 'Moon', night: true, apply: (_d, k) => (k === 'light' ? light(12, '#ffb347') : k === 'curtain' ? { on: false } : ['ac', 'lock', 'sensor', 'camera', 'alarm'].includes(k) ? { on: true } : {}) },
  { id: 'party', label: 'Party', icon: 'Music', night: true, apply: (_d, k, i) => (k === 'light' ? light(100, hsl((i * 67) % 360)) : k === 'speaker' ? { on: true } : {}) },
]

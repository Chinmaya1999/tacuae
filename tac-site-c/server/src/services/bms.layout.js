// Typical equipment for a new building, so the digital twin is useful immediately. The builder can move/add/remove anything.
import { LIMITS } from '../constants/bms.js'

export const levelName = (level, floors) => (level < 0 ? `B${-level}` : level === 0 ? 'Ground' : level >= floors ? 'Roof' : `Floor ${level}`)

/** @returns {{towerId:string, level:number, type:string, x:number, y:number}[]} (capped to the project limit) */
export function defaultEquipment(project) {
  const out = [], add = (towerId, level, type, x, y) => out.push({ towerId, level, type, x, y })
  for (const t of project.towers) {
    const F = t.floors, B = t.basements
    // floors
    for (let l = 0; l < F; l++) {
      add(t.id, l, 'ahu', 18, 20); add(t.id, l, 'fcu', 40, 30); add(t.id, l, 'fcu', 62, 30); add(t.id, l, 'temp-sensor', 50, 55)
      add(t.id, l, 'co2-sensor', 78, 55); add(t.id, l, 'energy-meter', 90, 15); add(t.id, l, 'lighting-zone', 30, 60); add(t.id, l, 'lighting-zone', 70, 75)
      add(t.id, l, 'occupancy-sensor', 50, 80); add(t.id, l, 'access-door', 10, 85); add(t.id, l, 'smoke-detector', 35, 45); add(t.id, l, 'smoke-detector', 65, 45)
    }
    // lifts and core
    add(t.id, 0, 'elevator', 46, 8); add(t.id, 0, 'elevator', 54, 8)
    // ground / technical
    add(t.id, 0, 'lt-panel', 90, 40); add(t.id, 0, 'dg', 90, 70); add(t.id, 0, 'ups', 80, 80); add(t.id, 0, 'fire-panel', 12, 20)
    add(t.id, 0, 'cctv', 8, 10); add(t.id, 0, 'cctv', 92, 92); add(t.id, 0, 'rfid-reader', 10, 70); add(t.id, 0, 'biometric', 14, 78); add(t.id, 0, 'intrusion-sensor', 50, 95)
    // basements
    for (let b = 1; b <= B; b++) {
      const l = -b
      add(t.id, l, 'parking-counter', 50, 10); add(t.id, l, 'ev-charger', 20, 60); add(t.id, l, 'ev-charger', 35, 60); add(t.id, l, 'cctv', 8, 8); add(t.id, l, 'smoke-detector', 50, 50); add(t.id, l, 'exhaust-fan', 85, 20)
      if (b === 1) { add(t.id, l, 'tank', 20, 25); add(t.id, l, 'pump', 40, 25); add(t.id, l, 'pump', 55, 25); add(t.id, l, 'flow-meter', 70, 25); add(t.id, l, 'leak-sensor', 30, 40); add(t.id, l, 'stp', 80, 70) }
    }
    if (B === 0) { add(t.id, 0, 'tank', 20, 25); add(t.id, 0, 'pump', 40, 25); add(t.id, 0, 'pump', 55, 25); add(t.id, 0, 'flow-meter', 70, 25); add(t.id, 0, 'leak-sensor', 30, 40) }
    // roof
    add(t.id, F, 'chiller', 25, 30); add(t.id, F, 'chiller', 55, 30); add(t.id, F, 'solar-inverter', 80, 60); add(t.id, F, 'tank', 20, 75); add(t.id, F, 'exhaust-fan', 80, 25)
  }
  return out.slice(0, LIMITS.equipmentPerProject)
}

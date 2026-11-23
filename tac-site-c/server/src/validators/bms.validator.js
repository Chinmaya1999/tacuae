import { BUILDING_TYPES, EQUIPMENT_IDS, LIMITS } from '../constants/bms.js'
import { clean, multiline, num } from '../utils/sanitize.js'
import ApiError from '../utils/ApiError.js'

const int = (v, lo, hi, d) => Math.round(num(v, lo, hi, d))

export function validateProject({ body: b = {} }) {
  const name = clean(b.name, 100)
  if (name.length < 2) throw new ApiError(400, 'Please enter a project name.')
  const raw = Array.isArray(b.towers) ? b.towers.slice(0, LIMITS.towers) : []
  if (!raw.length) throw new ApiError(400, 'Add at least one tower or block.')
  return {
    name, location: clean(b.location, 150), type: BUILDING_TYPES.includes(b.type) ? b.type : 'residential', autoPlace: b.autoPlace !== false,
    towers: raw.map((t, i) => ({ name: clean(t?.name, 40) || `Tower ${i + 1}`, floors: int(t?.floors, 1, LIMITS.floors, 10), unitsPerFloor: int(t?.unitsPerFloor, 0, LIMITS.units, 4), basements: int(t?.basements, 0, LIMITS.basements, 1) })),
  }
}
export function validateEquipment({ body: b = {} }) {
  if (!EQUIPMENT_IDS.includes(b.type)) throw new ApiError(400, 'Unknown equipment type.')
  if (typeof b.towerId !== 'string' || !b.towerId) throw new ApiError(400, 'Choose a tower.')
  return { type: b.type, towerId: b.towerId, level: int(b.level, -LIMITS.basements, LIMITS.floors, 0), x: num(b.x, 0, 100, 50), y: num(b.y, 0, 100, 50), name: clean(b.name, 80) }
}
export function validateEquipmentPatch({ body: b = {} }) {
  const s = {}
  if (b.x !== undefined) s.x = num(b.x, 0, 100, 50)
  if (b.y !== undefined) s.y = num(b.y, 0, 100, 50)
  if (b.level !== undefined) s.level = int(b.level, -LIMITS.basements, LIMITS.floors, 0)
  if (b.name !== undefined) s.name = clean(b.name, 80)
  return s
}
export const validateResolve = ({ body: b = {} }) => ({ note: multiline(b.note, 1000) })
export const validateHours = ({ query: q = {} }) => ({ hours: int(q.hours, 1, 168, 24) })

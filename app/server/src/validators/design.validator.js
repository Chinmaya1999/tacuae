import { FURNITURE_TYPES, PROPERTY_TYPES, ROOM_TYPES } from '../constants/index.js'
import { toObjectId } from '../config/database.js'
import { clean, multiline, num } from '../utils/sanitize.js'
import ApiError from '../utils/ApiError.js'

const hex = (v, d) => (/^#[0-9a-f]{6}$/i.test(String(v)) ? String(v).toLowerCase() : d)

// Never trust the client's JSON shape: rebuild every field.
function cleanRooms(input) {
  return (Array.isArray(input) ? input.slice(0, 20) : []).map((r, i) => ({
    id: clean(r?.id, 40) || `room-${i}`,
    type: ROOM_TYPES.includes(r?.type) ? r.type : 'other',
    name: clean(r?.name, 60) || 'Room',
    w: num(r?.w, 2, 20, 5), l: num(r?.l, 2, 20, 4), h: num(r?.h, 2.2, 4.5, 2.8), // metres
    wall: hex(r?.wall, '#d9dee7'), floor: hex(r?.floor, '#8a6f55'),
    devices: (Array.isArray(r?.devices) ? r.devices.slice(0, 80) : []).map((d, j) => ({
      id: clean(d?.id, 40) || `d-${j}`,
      cat: /^[a-z0-9-]{1,40}$/.test(String(d?.cat)) ? String(d.cat) : 'unknown',
      x: num(d?.x, 0, 100, 50), y: num(d?.y, 0, 100, 50), on: Boolean(d?.on),
      level: num(d?.level, 0, 100, 100), color: hex(d?.color, ''),
    })).filter((d) => d.cat !== 'unknown'),
    furniture: (Array.isArray(r?.furniture) ? r.furniture.slice(0, 60) : []).filter((f) => FURNITURE_TYPES.includes(f?.type)).map((f, j) => ({
      id: clean(f?.id, 40) || `f-${j}`, type: f.type, x: num(f?.x, 0, 100, 50), y: num(f?.y, 0, 100, 50), rot: num(f?.rot, 0, 360, 0),
    })),
  }))
}
export const validateDesign = ({ body: b }) => ({
  name: clean(b?.name, 100) || 'My smart home', clientName: clean(b?.clientName, 120), siteAddress: clean(b?.siteAddress, 200),
  property: PROPERTY_TYPES.includes(b?.property) ? b.property : 'apartment',
  notes: multiline(b?.notes, 3000), rooms: cleanRooms(b?.rooms),
})
export function validateDesignId(req) {
  const id = toObjectId(req.params.id)
  if (!id) throw new ApiError(404, 'Design not found.')
  return id
}
export const validateRespond = ({ body: b }) => ({ accept: Boolean(b?.accept) })
export function validateQuote({ body: b }) {
  const amount = Number(b?.amount)
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1e9) throw new ApiError(400, 'Enter a valid amount.')
  return { amount: Math.round(amount * 100) / 100, note: multiline(b?.note, 2000) }
}
export const validateAdminNote = ({ body: b }) => ({ adminNote: String(b?.adminNote ?? '').slice(0, 2000) })

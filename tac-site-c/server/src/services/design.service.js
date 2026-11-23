import * as Design from '../models/design.model.js'
import { estimateRooms } from './estimate.service.js'
import { DESIGN_STATUS } from '../constants/index.js'
import ApiError from '../utils/ApiError.js'

export const designOut = (d, withOwner = false) => ({
  id: String(d._id), name: d.name, property: d.property || 'apartment', estimate: d.estimate || null, clientName: d.clientName, siteAddress: d.siteAddress, notes: d.notes, rooms: d.rooms, status: d.status,
  quote: d.quote || null, deviceCount: (d.rooms || []).reduce((n, r) => n + r.devices.length, 0), createdAt: d.createdAt, updatedAt: d.updatedAt, submittedAt: d.submittedAt || null,
  ...(withOwner ? { owner: { id: String(d.ownerId), name: d.ownerName, email: d.ownerEmail, role: d.ownerRole, company: d.ownerCompany || '' }, adminNote: d.adminNote || '' } : {}),
})

// ---------- customer / builder ----------
async function owned(user, id) {
  const d = id && (await Design.findOwned(id, user._id))
  if (!d) throw new ApiError(404, 'Design not found.')
  return d
}
export const listMine = async (user) => (await Design.listByOwner(user._id)).map((d) => designOut(d))
export const getMine = async (user, id) => designOut(await owned(user, id))

export async function create(user, data) {
  if ((await Design.countByOwner(user._id)) >= 100) throw new ApiError(400, 'Design limit reached. Delete an old design first.')
  const now = new Date().toISOString()
  const d = await Design.insert({ ...data, ownerId: user._id, ownerName: user.name, ownerEmail: user.email, ownerRole: user.role, ownerCompany: user.company || '', estimate: await estimateRooms(data.rooms), status: 'draft', quote: null, createdAt: now, updatedAt: now })
  return designOut(d)
}
export async function update(user, id, data) {
  const d = await owned(user, id)
  if (d.status !== 'draft') throw new ApiError(409, 'This design was already sent. Withdraw it to edit.')
  const patch = { ...data, estimate: await estimateRooms(data.rooms), updatedAt: new Date().toISOString() }
  await Design.setFields(d._id, patch)
  return designOut({ ...d, ...patch })
}
export async function remove(user, id) {
  const d = await owned(user, id)
  if (d.status === 'submitted' || d.status === 'accepted') throw new ApiError(409, 'Withdraw this design before deleting it.')
  await Design.remove(d._id)
}

const TRANSITIONS = {
  submit: { from: ['draft'], to: () => 'submitted', extra: () => ({ submittedAt: new Date().toISOString(), quote: null }) },
  withdraw: { from: ['submitted', 'quoted', 'rejected'], to: () => 'draft', extra: () => ({ quote: null }) },
  respond: { from: ['quoted'], to: (accept) => (accept ? 'accepted' : 'rejected'), extra: () => ({}) },
}
export async function transition(user, id, action, accept) {
  const t = TRANSITIONS[action], d = await owned(user, id)
  if (!t.from.includes(d.status)) throw new ApiError(409, `Cannot ${action} a design that is ${d.status}.`)
  if (action === 'submit' && !d.rooms.some((r) => r.devices.length)) throw new ApiError(400, 'Add at least one smart device before sending.')
  const patch = { status: t.to(accept), updatedAt: new Date().toISOString(), ...t.extra() }
  if (action === 'submit') patch.estimate = await estimateRooms(d.rooms) // freeze prices as they are at submission
  await Design.setFields(d._id, patch)
  return designOut({ ...d, ...patch })
}

// ---------- admin ----------
export async function listForAdmin(status) {
  // drafts stay private until the owner sends them
  const query = DESIGN_STATUS.includes(status) ? { status } : { status: { $ne: 'draft' } }
  return (await Design.listWhere(query)).map((d) => designOut(d, true))
}
export async function getForAdmin(id) {
  const d = id && (await Design.findById(id))
  if (!d) throw new ApiError(404, 'Design not found.')
  return designOut(d, true)
}
export async function sendQuote(admin, id, { amount, note }) {
  const d = id && (await Design.findById(id))
  if (!d) throw new ApiError(404, 'Design not found.')
  if (!['submitted', 'quoted', 'rejected'].includes(d.status)) throw new ApiError(409, `Cannot quote a design that is ${d.status}.`)
  const quote = { amount, currency: 'AED', note, at: new Date().toISOString(), by: admin.email }
  await Design.setFields(d._id, { quote, status: 'quoted', updatedAt: quote.at })
  return designOut({ ...d, quote, status: 'quoted' }, true)
}
export async function setAdminNote(id, adminNote) {
  const r = id && (await Design.setFields(id, { adminNote, updatedAt: new Date().toISOString() }))
  if (!r?.matchedCount) throw new ApiError(404, 'Design not found.')
}

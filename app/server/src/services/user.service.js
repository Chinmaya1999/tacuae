import * as User from '../models/user.model.js'
import * as Design from '../models/design.model.js'
import * as Audit from '../models/pricing.model.js'
import { mongoEnabled } from '../config/database.js'
import { publicUser } from './auth.service.js'
import ApiError from '../utils/ApiError.js'

export async function listUsers() {
  const [list, counts] = await Promise.all([User.list(), Design.countsByOwner()])
  return list.map((u) => ({ ...publicUser(u), designs: counts[String(u._id)] || 0 }))
}

export async function updateUser(actor, id, patch) {
  if (String(id) === String(actor._id)) throw new ApiError(400, 'You cannot change your own account here.')
  const r = await User.setFields(id, patch)
  if (!r.matchedCount) throw new ApiError(404, 'User not found.')
  await Audit.log(actor, 'user.update', String(id), patch)
}

export async function accountStats() {
  if (!mongoEnabled) return { accounts: false }
  const [u, s] = await Promise.all([User.roleCounts(), Design.statusCounts()])
  return {
    accounts: true, customers: u.customer || 0, builders: u.builder || 0,
    designsSubmitted: s.submitted || 0, designsQuoted: s.quoted || 0, designsAccepted: s.accepted || 0,
    designsTotal: Object.values(s).reduce((n, x) => n + x, 0),
  }
}

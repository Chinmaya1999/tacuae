// Company accounts: a builder (owner) can have members who work on the company's quotations.
//   owner: everything · procurement: edit, share, accept · viewer: read and comment
// Creating members is DEMO MODE ONLY until e-mail invitations exist (an owner must never set the password
// for someone else's address on a live site).
import crypto from 'node:crypto'
import * as User from '../models/user.model.js'
import { hashPassword, publicUser } from './auth.service.js'
import { env } from '../config/env.js'
import { toObjectId } from '../config/database.js'
import ApiError from '../utils/ApiError.js'

export const TEAM_ROLES = ['procurement', 'viewer']
export const companyId = (user) => user.companyOwnerId || user._id

const ALLOW = { procurement: ['read', 'edit', 'approve'], viewer: ['read'] }
export function teamCan(user, need) {
  if (user.companyOwnerId && !ALLOW[user.teamRole]?.includes(need)) throw new ApiError(403, 'Your company role does not allow this.')
}
/** The account whose price list applies: the company owner for team members. */
export async function billingUser(user) {
  if (!user?.companyOwnerId) return user
  const owner = await User.findById(user.companyOwnerId)
  if (!owner || owner.active === false || owner.role !== 'builder') throw new ApiError(403, 'Your company account is not active.')
  return owner
}

function ownerOnly(user) { if (user.role !== 'builder' || user.companyOwnerId) throw new ApiError(403, 'Only the company owner manages the team.') }
export async function list(user) {
  const owner = await billingUser(user)
  return { owner: publicUser(owner), members: (await User.listTeam(owner._id)).map(publicUser), canManage: !user.companyOwnerId && env.demoMode }
}
export async function add(user, { name, email, teamRole }) {
  ownerOnly(user)
  if (!env.demoMode) throw new ApiError(404, 'Team invitations are not available yet.')
  if ((await User.listTeam(user._id)).length >= 20) throw new ApiError(400, 'Team limit reached.')
  const password = crypto.randomBytes(9).toString('base64url'), at = new Date().toISOString()
  try {
    const doc = await User.insert({ name, email, role: 'builder', company: user.company || '', phone: '', companyOwnerId: user._id, teamRole, demo: true, active: true, hash: await hashPassword(password), pwChangedAt: at, createdAt: at })
    return { member: publicUser(doc), password }
  } catch (e) { if (e.code === 11000) throw new ApiError(409, 'An account with this email already exists.'); throw e }
}
export async function update(user, id, set) {
  ownerOnly(user)
  const _id = toObjectId(id), member = _id && (await User.findById(_id))
  if (!member || String(member.companyOwnerId) !== String(user._id)) throw new ApiError(404, 'Team member not found.')
  await User.setFields(_id, set)
}

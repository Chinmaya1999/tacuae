import { ROLES } from '../constants/index.js'
import { toObjectId } from '../config/database.js'
import ApiError from '../utils/ApiError.js'

/** Parses :id into an ObjectId (400 when malformed). */
export function validateIdParam(req) {
  const id = toObjectId(req.params.id)
  if (!id) throw new ApiError(400, 'Invalid id.')
  return id
}
export function validateUserPatch(req) {
  const b = req.body || {}, set = {}
  if (b.active !== undefined) set.active = Boolean(b.active)
  if (b.role !== undefined) { if (!ROLES.includes(b.role)) throw new ApiError(400, 'Invalid role.'); set.role = b.role }
  return { id: validateIdParam(req), set }
}

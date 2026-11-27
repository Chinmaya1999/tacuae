import * as User from '../models/user.model.js'
import { toObjectId } from '../config/database.js'
import { CSRF_HEADER, CSRF_VALUE, SESSION_COOKIE } from '../constants/index.js'
import { parseCookies, verifyToken } from '../utils/generateToken.js'
import ApiError from '../utils/ApiError.js'

const sessionOf = (req) => verifyToken(parseCookies(req.headers.cookie)[SESSION_COOKIE])

/** The signed-in user for this request, or null. Sign-out, a changed password or a disabled account invalidates the cookie. */
export async function loadUser(req) {
  const t = sessionOf(req)
  const id = t && toObjectId(t.uid)
  if (!id) return null
  const u = await User.findById(id)
  if (!u || u.active === false || u.pwChangedAt !== t.v || u.revoked?.includes(t.sid)) return null
  // disabling a company owner also locks out that company's team members
  if (u.companyOwnerId && (await User.findById(u.companyOwnerId))?.active === false) return null
  return u
}

/** Ends this session only, so a copy of the cookie cannot be used after sign-out. */
export async function revokeSession(req) {
  const u = await loadUser(req)
  if (u) await User.revokeSession(u._id, sessionOf(req).sid)
}

/** State-changing requests must carry a custom header, which cross-site forms cannot set (CSRF defence). */
export const csrfGuard = (req, _res, next) =>
  next(req.method !== 'GET' && req.headers[CSRF_HEADER] !== CSRF_VALUE ? new ApiError(403, 'Bad request') : undefined)

export const requireRole = (...roles) => async (req, res, next) => {
  try {
    const u = await loadUser(req)
    if (!u) throw new ApiError(401, 'Not signed in')
    if (!roles.includes(u.role)) throw new ApiError(403, 'Not allowed')
    req.user = u
    res.setHeader('Cache-Control', 'no-store')
    next()
  } catch (e) { next(e) }
}

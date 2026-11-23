import * as User from '../models/user.model.js'
import { toObjectId } from '../config/database.js'
import { CSRF_HEADER, CSRF_VALUE, SESSION_COOKIE } from '../constants/index.js'
import { parseCookies, verifyToken } from '../utils/generateToken.js'
import ApiError from '../utils/ApiError.js'

/** The signed-in user for this request, or null. A disabled account or a changed password invalidates the cookie. */
export async function loadUser(req) {
  const t = verifyToken(parseCookies(req.headers.cookie)[SESSION_COOKIE])
  const id = t && toObjectId(t.uid)
  if (!id) return null
  const u = await User.findById(id)
  return u && u.active !== false && u.pwChangedAt === t.v ? u : null
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

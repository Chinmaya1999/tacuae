// Bookings, notifications, team, analytics and demo-mode endpoints.
import { Router } from 'express'
import * as X from '../services/extra.service.js'
import * as Team from '../services/team.service.js'
import { publicUser } from '../services/auth.service.js'
import { csrfGuard, loadUser, requireRole } from '../middlewares/auth.middleware.js'
import { honeypot, validate } from '../middlewares/validate.middleware.js'
import { rateLimit } from '../middlewares/rateLimit.middleware.js'
import * as V from '../validators/extra.validator.js'
import { env } from '../config/env.js'
import { ROLES } from '../constants/index.js'
import { generateToken, sessionCookie } from '../utils/generateToken.js'
import { isSecure } from '../utils/sanitize.js'
import ApiResponse from '../utils/ApiResponse.js'

const send = (fn) => async (req, res) => ApiResponse.send(res, (await fn(req, res)) || {})
const signIn = (fn) => async (req, res) => {
  const user = await fn(req)
  res.setHeader('Set-Cookie', sessionCookie(generateToken(user), isSecure(req)))
  ApiResponse.send(res, { user: publicUser(user) })
}
const signedIn = requireRole(...ROLES), staff = requireRole('sales', 'admin')
const strict = rateLimit({ max: 200, windowMs: 3600_000 }) // these routes only act in demo mode; presentations repeat them often

const r = Router()
r.get('/demo/config', (_q, res) => ApiResponse.send(res, { demo: env.demoMode }))
r.post('/demo/otp/request', csrfGuard, strict, validate(V.validatePhone), send((q) => X.requestOtp(q.valid.phone)))
r.post('/demo/otp/verify', csrfGuard, strict, validate(V.validateOtp), signIn((q) => X.verifyOtp(q.valid.phone, q.valid.code)))
r.post('/demo/social', csrfGuard, strict, validate(V.validateProvider), signIn((q) => X.socialSignIn(q.valid.provider)))

r.post('/appointments', csrfGuard, honeypot, rateLimit({ max: 8, windowMs: 3600_000, message: 'Too many booking requests. Please call us.' }), validate(V.validateBooking), send(async (q) => { await X.book(await loadUser(q), q.valid) }))
r.get('/appointments', csrfGuard, signedIn, send(async (q) => ({ items: await X.myBookings(q.user) })))
r.get('/sales/appointments', csrfGuard, staff, send(async () => ({ items: await X.allBookings() })))
r.patch('/sales/appointments/:id', csrfGuard, staff, validate(V.validateBookingStatus), send((q) => X.setBooking(q.params.id, q.valid.status)))

r.get('/notifications', csrfGuard, signedIn, send((q) => X.notifications(q.user)))
r.post('/notifications/read', csrfGuard, signedIn, send(async (q) => { await X.readAll(q.user) }))

r.get('/team', csrfGuard, requireRole('builder'), send((q) => Team.list(q.user)))
r.post('/team', csrfGuard, requireRole('builder'), strict, validate(V.validateMember), send((q) => Team.add(q.user, q.valid)))
r.patch('/team/:id', csrfGuard, requireRole('builder'), validate(V.validateMemberPatch), send((q) => Team.update(q.user, q.params.id, q.valid)))

r.get('/admin/analytics', csrfGuard, requireRole('admin'), send(() => X.analytics()))
r.get('/admin/outbox', csrfGuard, requireRole('admin'), send(async () => ({ demo: env.demoMode, items: await X.outbox() })))
export default r

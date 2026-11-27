import { Router } from 'express'
import * as ctrl from '../controllers/auth.controller.js'
import { csrfGuard, requireRole } from '../middlewares/auth.middleware.js'
import { honeypot, validate } from '../middlewares/validate.middleware.js'
import { rateLimit } from '../middlewares/rateLimit.middleware.js'
import { validateGoogle, validateLogin, validatePasswordChange, validatePhoneToken, validateProfile, validateRegister } from '../validators/auth.validator.js'
import { ROLES, SELF_ROLES } from '../constants/index.js'
import { env } from '../config/env.js'

const r = Router()
r.use(csrfGuard)
r.post('/register', rateLimit({ max: 5, windowMs: 3600_000, message: 'Too many sign-ups. Try again later.' }), honeypot, validate(validateRegister), ctrl.register)
// a presentation switches accounts constantly, so demo mode has a much higher ceiling
r.post('/login', rateLimit({ max: env.demoMode ? 300 : 10, windowMs: 15 * 60_000, message: 'Too many attempts. Try again in 15 minutes.' }), validate(validateLogin),
  // also limit guesses against one account, however many addresses they come from
  rateLimit({ max: env.demoMode ? 300 : 20, windowMs: 15 * 60_000, key: (req) => req.valid.email, message: 'Too many attempts. Try again in 15 minutes.' }), ctrl.login)
r.get('/google', ctrl.googleConfig)
r.post('/google', rateLimit({ max: env.demoMode ? 300 : 30, windowMs: 15 * 60_000, message: 'Too many attempts. Try again in 15 minutes.' }), validate(validateGoogle), ctrl.google)
const phoneLimit = rateLimit({ max: env.demoMode ? 300 : 30, windowMs: 15 * 60_000, message: 'Too many attempts. Try again in 15 minutes.' })
r.get('/phone', ctrl.phoneConfig)
r.post('/phone', phoneLimit, validate(validatePhoneToken), ctrl.phone)
r.post('/phone/link', requireRole(...SELF_ROLES), phoneLimit, validate(validatePhoneToken), ctrl.linkPhone)
r.post('/logout', ctrl.logout)
r.get('/me', ctrl.me)
r.patch('/profile', requireRole(...SELF_ROLES), rateLimit({ max: 60, windowMs: 3600_000 }), validate(validateProfile), ctrl.updateProfile)
r.post('/password', requireRole(...ROLES), rateLimit({ max: 10, windowMs: 15 * 60_000, message: 'Too many attempts. Try again in 15 minutes.' }), validate(validatePasswordChange), ctrl.changePassword)
export default r

import { Router } from 'express'
import * as ctrl from '../controllers/auth.controller.js'
import { csrfGuard, requireRole } from '../middlewares/auth.middleware.js'
import { honeypot, validate } from '../middlewares/validate.middleware.js'
import { rateLimit } from '../middlewares/rateLimit.middleware.js'
import { validateLogin, validatePasswordChange, validateRegister } from '../validators/auth.validator.js'
import { ROLES } from '../constants/index.js'

const r = Router()
r.use(csrfGuard)
r.post('/register', rateLimit({ max: 5, windowMs: 3600_000, message: 'Too many sign-ups. Try again later.' }), honeypot, validate(validateRegister), ctrl.register)
r.post('/login', rateLimit({ max: 10, windowMs: 15 * 60_000, message: 'Too many attempts. Try again in 15 minutes.' }), validate(validateLogin), ctrl.login)
r.post('/logout', ctrl.logout)
r.get('/me', ctrl.me)
r.post('/password', requireRole(...ROLES), validate(validatePasswordChange), ctrl.changePassword)
export default r

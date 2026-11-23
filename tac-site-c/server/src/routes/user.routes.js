// Admin: user management (mounted under /api/admin/users).
import { Router } from 'express'
import * as ctrl from '../controllers/user.controller.js'
import { validate } from '../middlewares/validate.middleware.js'
import { validateUserPatch } from '../validators/user.validator.js'

const r = Router()
r.get('/', ctrl.list)
r.patch('/:id', validate(validateUserPatch), ctrl.update)
export default r

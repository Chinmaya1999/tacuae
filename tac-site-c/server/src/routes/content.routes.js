import { Router } from 'express'
import * as ctrl from '../controllers/content.controller.js'
import { validate } from '../middlewares/validate.middleware.js'
import { validateContent } from '../validators/enquiry.validator.js'

// Public read (mounted at /api/content).
const r = Router()
r.get('/', ctrl.get)
export default r

// Admin edit (mounted at /api/admin/content).
export const adminContentRoutes = Router()
adminContentRoutes.put('/:type/:slug', validate(validateContent), ctrl.set)

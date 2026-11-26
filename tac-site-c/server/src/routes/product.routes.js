import { Router } from 'express'
import * as ctrl from '../controllers/product.controller.js'
import { csrfGuard, requireRole } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'
import { validateDesign } from '../validators/design.validator.js'
import { validateProductCreate, validateProductPatch } from '../validators/product.validator.js'

// Signed-in users: catalogue with prices + live estimate (mounted at /api/products).
const r = Router()
r.use(csrfGuard, requireRole('customer', 'builder', 'sales', 'admin'))
r.get('/', ctrl.list)
r.post('/estimate', validate(validateDesign), ctrl.estimate)
export default r

// Admin: manage prices (mounted at /api/admin/products).
export const adminProductRoutes = Router()
adminProductRoutes.get('/', ctrl.adminList)
adminProductRoutes.post('/', validate(validateProductCreate), ctrl.adminCreate)
adminProductRoutes.put('/:id', validate(validateProductPatch), ctrl.adminUpdate)

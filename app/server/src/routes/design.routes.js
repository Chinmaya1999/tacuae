import { Router } from 'express'
import * as ctrl from '../controllers/design.controller.js'
import { csrfGuard, requireRole } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'
import { validateAdminNote, validateDesign, validateQuote, validateRespond } from '../validators/design.validator.js'

// Customers and builders: their own designs (mounted at /api/designs).
const r = Router()
r.use(csrfGuard, requireRole('customer', 'builder'))
r.get('/', ctrl.list)
r.post('/', validate(validateDesign), ctrl.create)
r.get('/:id', ctrl.get)
r.put('/:id', validate(validateDesign), ctrl.update)
r.delete('/:id', ctrl.remove)
r.post('/:id/submit', ctrl.submit)
r.post('/:id/withdraw', ctrl.withdraw)
r.post('/:id/respond', validate(validateRespond), ctrl.respond)
export default r

// Admin: review and quote (mounted at /api/admin/designs).
export const adminDesignRoutes = Router()
adminDesignRoutes.get('/', ctrl.adminList)
adminDesignRoutes.get('/:id', ctrl.adminGet)
adminDesignRoutes.post('/:id/quote', validate(validateQuote), ctrl.adminQuote)
adminDesignRoutes.patch('/:id', validate(validateAdminNote), ctrl.adminNote)

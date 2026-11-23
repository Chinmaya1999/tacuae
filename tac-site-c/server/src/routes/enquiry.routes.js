import { Router } from 'express'
import * as ctrl from '../controllers/enquiry.controller.js'
import { honeypot, validate } from '../middlewares/validate.middleware.js'
import { rateLimit } from '../middlewares/rateLimit.middleware.js'
import { tooFast, validateEnquiry, validateEnquiryPatch } from '../validators/enquiry.validator.js'

// Public contact form (mounted at /api/enquiry).
const r = Router()
r.post('/', honeypot, tooFast, rateLimit({ max: 5, windowMs: 3600_000, message: 'Too many requests' }), validate(validateEnquiry), ctrl.create)
export default r

// Admin: inbox (mounted at /api/admin/enquiries).
export const adminEnquiryRoutes = Router()
adminEnquiryRoutes.get('/', ctrl.list)
adminEnquiryRoutes.patch('/:id', validate(validateEnquiryPatch), ctrl.update)
adminEnquiryRoutes.delete('/:id', ctrl.remove)

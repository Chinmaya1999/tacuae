// Everything under /api/admin requires a signed-in admin.
import { Router } from 'express'
import * as ctrl from '../controllers/admin.controller.js'
import { exportCsv } from '../controllers/enquiry.controller.js'
import { csrfGuard, requireRole } from '../middlewares/auth.middleware.js'
import userRoutes from './user.routes.js'
import { adminDesignRoutes } from './design.routes.js'
import { adminEnquiryRoutes } from './enquiry.routes.js'
import { adminContentRoutes } from './content.routes.js'
import { adminProductRoutes } from './product.routes.js'
import { adminPricingRoutes } from './quote.routes.js'

const r = Router()
r.use(csrfGuard, requireRole('admin'))
r.get('/me', ctrl.me)
r.get('/stats', ctrl.stats)
r.use('/users', userRoutes)
r.use('/designs', adminDesignRoutes)
r.get('/enquiries.csv', exportCsv)
r.use('/enquiries', adminEnquiryRoutes)
r.use('/content', adminContentRoutes)
r.use('/products', adminProductRoutes)
r.use('/pricing', adminPricingRoutes)
export default r

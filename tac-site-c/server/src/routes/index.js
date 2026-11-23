import { Router } from 'express'
import authRoutes from './auth.routes.js'
import designRoutes from './design.routes.js'
import enquiryRoutes from './enquiry.routes.js'
import contentRoutes from './content.routes.js'
import adminRoutes from './admin.routes.js'
import productRoutes from './product.routes.js'
import bmsRoutes from './bms.routes.js'

const api = Router()
api.use('/enquiry', enquiryRoutes)
api.use('/content', contentRoutes)
api.use('/account', authRoutes)
api.use('/designs', designRoutes)
api.use('/products', productRoutes)
api.use('/bms', bmsRoutes)
api.use('/admin', adminRoutes)
export default api

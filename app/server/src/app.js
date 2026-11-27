// Builds the Express app (no side effects: nothing listens or connects here, which keeps it testable).
import express from 'express'
import { env } from './config/env.js'
import { cors } from './config/cors.js'
import { securityHeaders } from './middlewares/security.middleware.js'
import { rateLimit } from './middlewares/rateLimit.middleware.js'
import apiRoutes from './routes/index.js'
import webRoutes from './routes/web.routes.js'
import { errorHandler, notFound } from './middlewares/error.middleware.js'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  if (env.trustProxy) app.set('trust proxy', env.trustProxy)
  app.use(securityHeaders())
  // a ceiling for every API route, on top of the tighter limits on sign-in and public forms
  app.use('/api', rateLimit({ max: 900, windowMs: 60_000 }), (_q, res, next) => { res.setHeader('Cache-Control', 'no-store'); next() })
  app.use(cors())
  // project configurations (many unit templates) are larger than ordinary forms
  app.use(['/api/configurator', '/api/quotations'], express.json({ limit: '250kb' }))
  app.use(express.json({ limit: '30kb' }))

  app.use('/api', apiRoutes)
  app.use('/api', notFound)
  app.use(webRoutes)
  app.use(errorHandler)
  return app
}

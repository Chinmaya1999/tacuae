// Builds the Express app (no side effects: nothing listens or connects here, which keeps it testable).
import express from 'express'
import { env } from './config/env.js'
import { cors } from './config/cors.js'
import apiRoutes from './routes/index.js'
import webRoutes from './routes/web.routes.js'
import { errorHandler, notFound } from './middlewares/error.middleware.js'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  if (env.trustProxy) app.set('trust proxy', env.trustProxy)
  app.use((_q, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.setHeader('X-Frame-Options', 'SAMEORIGIN')
    next()
  })
  app.use(cors())
  app.use(express.json({ limit: '30kb' }))

  app.use('/api', apiRoutes)
  app.use('/api', notFound)
  app.use(webRoutes)
  app.use(errorHandler)
  return app
}

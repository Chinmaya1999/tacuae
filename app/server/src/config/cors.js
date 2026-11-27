// The site and its API are served from one origin, so CORS is off unless CORS_ORIGINS lists allowed origins
// (e.g. CORS_ORIGINS=https://app.example.com when a separate front end calls this API).
import { env } from './env.js'

export function cors() {
  const allowed = new Set(env.corsOrigins)
  return (req, res, next) => {
    const origin = req.headers.origin
    if (!origin || !allowed.has(origin)) return next()
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Vary', 'Origin')
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With')
      return res.sendStatus(204)
    }
    next()
  }
}

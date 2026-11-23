import ApiError from '../utils/ApiError.js'

export const notFound = (_req, res) => res.status(404).json({ ok: false })

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, next) {
  if (res.headersSent) return next(err)
  if (err instanceof ApiError) return res.status(err.status).json({ ok: false, error: err.message })
  if (err.status && err.status < 500) return res.status(err.status).json({ ok: false, error: 'Bad request' }) // e.g. malformed JSON, body too large
  console.error(err)
  res.status(500).json({ ok: false, error: 'Server error' })
}

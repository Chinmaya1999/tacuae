/** Runs a validator `fn(req)`; it returns the cleaned input (stored on req.valid) or throws ApiError(400). */
export const validate = (fn) => (req, _res, next) => { req.valid = fn(req); next() }

/** Bots fill hidden fields: pretend success without doing anything. */
export const honeypot = (req, res, next) => (req.body?.website ? res.json({ ok: true }) : next())

/** Forwards rejected promises to the error middleware (works the same on any Express version). */
export default (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

/** Sliding-window rate limit per client IP (set TRUST_PROXY behind a proxy so req.ip is the real client). */
export function rateLimit({ max, windowMs, message = 'Too many requests. Try again later.' }) {
  const hits = new Map()
  return (req, res, next) => {
    const now = Date.now(), key = req.ip
    const arr = (hits.get(key) || []).filter((t) => now - t < windowMs)
    arr.push(now); hits.set(key, arr)
    if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k)
    if (arr.length > max) return res.status(429).json({ ok: false, error: message })
    next()
  }
}

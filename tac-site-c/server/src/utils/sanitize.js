/** Single-line, trimmed, length-capped string (blocks header/CSV line injection). */
export const clean = (v, max) => String(v ?? '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, max)
export const multiline = (v, max) => String(v ?? '').trim().slice(0, max)
export const num = (v, lo, hi, d = 0) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d }
export const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
export const isSecure = (req) => req.secure || req.headers['x-forwarded-proto'] === 'https'

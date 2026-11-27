// Browser security headers. The policy lists exactly the third parties the site uses: Google sign-in, Firebase SMS
// verification (with reCAPTCHA), Google Fonts and the office map. Add a source here before using a new one.
import { env } from '../config/env.js'
import { isSecure } from '../utils/sanitize.js'

export function securityHeaders() {
  const firebaseFrame = env.firebase ? [`https://${env.firebase.authDomain}`] : []
  const csp = Object.entries({
    'default-src': ["'self'"],
    'script-src': ["'self'", 'https://accounts.google.com/gsi/client', 'https://apis.google.com', 'https://www.google.com/recaptcha/', 'https://www.gstatic.com/recaptcha/', 'https://www.recaptcha.net/recaptcha/'],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://accounts.google.com/gsi/style'],
    'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
    'img-src': ["'self'", 'data:', 'blob:', 'https:'], // admins may link product images on other https sites
    'connect-src': ["'self'", 'data:', 'blob:', 'https://accounts.google.com/gsi/', 'https://identitytoolkit.googleapis.com', 'https://securetoken.googleapis.com', 'https://www.google.com'],
    'frame-src': ['https://accounts.google.com/gsi/', 'https://www.google.com', 'https://recaptcha.google.com', 'https://www.recaptcha.net', ...firebaseFrame],
    'worker-src': ["'self'", 'blob:'],
    'object-src': ["'none'"], 'base-uri': ["'self'"], 'form-action': ["'self'"], 'frame-ancestors': ["'self'"],
  }).map(([k, v]) => `${k} ${v.join(' ')}`).join('; ')

  return (req, res, next) => {
    res.setHeader('Content-Security-Policy', csp)
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.setHeader('X-Frame-Options', 'SAMEORIGIN')
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(self), geolocation=(), usb=()')
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups') // the Google sign-in popup must reply
    if (isSecure(req)) res.setHeader('Strict-Transport-Security', 'max-age=15552000')
    if (env.demoMode) res.setHeader('X-Robots-Tag', 'noindex, nofollow') // sample data must not appear in search
    next()
  }
}

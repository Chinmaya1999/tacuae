// Single place that reads process.env. Everything else imports `env`.
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
export const serverRoot = path.resolve(here, '..', '..') // app/server
export const projectRoot = path.resolve(serverRoot, '..') // app
const e = process.env
const list = (v) => String(v ?? '').split(',').map((s) => s.trim()).filter(Boolean)

export const env = Object.freeze({
  nodeEnv: e.NODE_ENV || 'development',
  // Client demonstrations only: switches on SIMULATED sign-in, payments, messaging and team invites.
  // Safety: it stays OFF unless the database is a demo database (its name contains "demo"), so it can never
  // run against real data.
  demoMode: e.DEMO_MODE === 'true' && (!e.MONGODB_URI || /\/[^/?]*demo[^/?]*(\?|$)/i.test(e.MONGODB_URI)),
  port: Number(e.PORT) || 8787,
  distDir: path.join(projectRoot, 'dist'),
  dataDir: e.DATA_DIR || path.join(serverRoot, 'data'),
  trustProxy: e.TRUST_PROXY ? (e.TRUST_PROXY === 'true' ? 1 : e.TRUST_PROXY) : null,
  corsOrigins: list(e.CORS_ORIGINS), // empty = same-origin only (the site and API share one origin)
  mongoUri: e.MONGODB_URI || '',
  sessionSecret: e.SESSION_SECRET || '',
  adminEmail: String(e.ADMIN_EMAIL || 'admin@tacuae.com').trim().toLowerCase(),
  adminPassword: e.ADMIN_PASSWORD || '',
  googleClientId: String(e.GOOGLE_CLIENT_ID || '').trim(), // empty = Google sign-in is off
  // Firebase phone sign-in: public web-app config. Off unless all four are set.
  firebase: e.FIREBASE_API_KEY && e.FIREBASE_AUTH_DOMAIN && e.FIREBASE_PROJECT_ID && e.FIREBASE_APP_ID
    ? { apiKey: e.FIREBASE_API_KEY.trim(), authDomain: e.FIREBASE_AUTH_DOMAIN.trim(), projectId: e.FIREBASE_PROJECT_ID.trim(), appId: e.FIREBASE_APP_ID.trim() }
    : null,
  enquiryTo: e.ENQUIRY_TO || 'info@tacuae.com',
  smtp: e.SMTP_HOST ? { host: e.SMTP_HOST, port: Number(e.SMTP_PORT) || 587, secure: e.SMTP_SECURE === 'true', user: e.SMTP_USER || '', pass: e.SMTP_PASS || '', from: e.SMTP_FROM || e.SMTP_USER || '' } : null,
})

// TAC UAE server: serves ./dist, public enquiry + content API, and the admin API.
import express from 'express'
import nodemailer from 'nodemailer'
import crypto from 'node:crypto'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { read, write } from './db.mjs'
import { admin, cookieOpts, ensureAdmin, limiter, makeToken, parseCookies, readToken, setPassword, verifyPassword } from './auth.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dist = path.join(__dirname, '..', 'dist')
const PORT = process.env.PORT || 8787
const TO = process.env.ENQUIRY_TO || 'info@tacuae.com'
const STATUSES = ['new', 'contacted', 'closed']

const app = express()
app.disable('x-powered-by')
if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : process.env.TRUST_PROXY)
app.use((_q, res, next) => { res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin'); res.setHeader('X-Frame-Options', 'SAMEORIGIN'); next() })
app.use(express.json({ limit: '30kb' }))

const clean = (v, max) => String(v ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max)
const secure = (req) => req.secure || req.headers['x-forwarded-proto'] === 'https'
const isSecure = (req) => secure(req)

// ---------- mail ----------
const transporter = process.env.SMTP_HOST ? nodemailer.createTransport({
  host: process.env.SMTP_HOST, port: +(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
}) : null

// ---------- public API ----------
const enquiryLimited = limiter(5, 3600_000)
app.post('/api/enquiry', async (req, res) => {
  const b = req.body || {}
  if (b.website) return res.json({ ok: true }) // honeypot
  if (typeof b.elapsed === 'number' && b.elapsed < 2500) return res.status(400).json({ ok: false })
  if (enquiryLimited(req.ip)) return res.status(429).json({ ok: false, error: 'Too many requests' })
  const d = { name: clean(b.name, 120), company: clean(b.company, 120), email: clean(b.email, 160), phone: clean(b.phone, 40),
    service: clean(b.service, 120), projectType: clean(b.projectType, 80), message: String(b.message ?? '').trim().slice(0, 4000) }
  if (d.name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email) || d.message.length < 10) return res.status(400).json({ ok: false, error: 'Invalid input' })
  try {
    const list = read('enquiries.json', [])
    const item = { id: crypto.randomUUID(), at: new Date().toISOString(), ...d, status: 'new', note: '' }
    list.unshift(item); write('enquiries.json', list)
    if (transporter) {
      transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to: TO, replyTo: d.email,
        subject: `Website enquiry — ${d.service || 'General'} — ${d.name}`, text: Object.entries(d).map(([k, v]) => `${k}: ${v}`).join('\n') })
        .catch((e) => console.error('mail failed (enquiry is saved):', e.message))
    }
    res.json({ ok: true })
  } catch (e) { console.error(e); res.status(500).json({ ok: false }) }
})

// admin-editable content (descriptions for products / projects)
app.get('/api/content', (_q, res) => { res.setHeader('Cache-Control', 'no-cache'); res.json(read('content.json', { products: {}, projects: {} })) })

// ---------- admin API ----------
const loginLimited = limiter(5, 15 * 60_000)
app.post('/api/admin/login', (req, res) => {
  if (loginLimited(req.ip)) return res.status(429).json({ ok: false, error: 'Too many attempts. Try again in 15 minutes.' })
  const a = admin()
  if (!a || !verifyPassword(req.body?.password ?? '', a.hash)) return res.status(401).json({ ok: false, error: 'Incorrect password.' })
  res.setHeader('Set-Cookie', `tac_admin=${makeToken(a.changedAt)}; ${cookieOpts(isSecure(req))}`)
  res.json({ ok: true })
})
app.post('/api/admin/logout', (req, res) => { res.setHeader('Set-Cookie', `tac_admin=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${isSecure(req) ? '; Secure' : ''}`); res.json({ ok: true }) })

const guard = (req, res, next) => {
  if (!readToken(parseCookies(req.headers.cookie).tac_admin)) return res.status(401).json({ ok: false, error: 'Not signed in' })
  if (req.method !== 'GET' && req.headers['x-requested-with'] !== 'tac-admin') return res.status(403).json({ ok: false, error: 'Bad request' })
  res.setHeader('Cache-Control', 'no-store'); next()
}
app.use('/api/admin', (req, res, next) => (req.path === '/login' || req.path === '/logout' ? next() : guard(req, res, next)))
app.get('/api/admin/me', (_q, res) => res.json({ ok: true, user: 'admin' }))

const filterList = (q) => {
  let list = read('enquiries.json', [])
  if (STATUSES.includes(q.status)) list = list.filter((e) => e.status === q.status)
  const s = String(q.q ?? '').toLowerCase().trim()
  if (s) list = list.filter((e) => [e.name, e.company, e.email, e.phone, e.service, e.message].join(' ').toLowerCase().includes(s))
  return list
}
app.get('/api/admin/enquiries', (req, res) => res.json({ ok: true, items: filterList(req.query) }))

app.get('/api/admin/stats', (_q, res) => {
  const list = read('enquiries.json', []), day = 86400_000, now = Date.now()
  const daily = Array.from({ length: 14 }, (_, i) => { const d = new Date(now - (13 - i) * day); return { date: d.toISOString().slice(0, 10), count: 0 } })
  list.forEach((e) => { const k = e.at.slice(0, 10), x = daily.find((d) => d.date === k); if (x) x.count++ })
  const by = {}; list.forEach((e) => { const k = e.service || 'General'; by[k] = (by[k] || 0) + 1 })
  res.json({ ok: true, total: list.length, new: list.filter((e) => e.status === 'new').length, contacted: list.filter((e) => e.status === 'contacted').length, closed: list.filter((e) => e.status === 'closed').length,
    last7: list.filter((e) => now - Date.parse(e.at) < 7 * day).length, daily, byService: Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([service, count]) => ({ service, count })),
    mail: Boolean(transporter) })
})

app.patch('/api/admin/enquiries/:id', (req, res) => {
  const list = read('enquiries.json', []), e = list.find((x) => x.id === req.params.id)
  if (!e) return res.status(404).json({ ok: false })
  if (req.body.status !== undefined) { if (!STATUSES.includes(req.body.status)) return res.status(400).json({ ok: false }); e.status = req.body.status }
  if (req.body.note !== undefined) e.note = String(req.body.note).slice(0, 2000)
  write('enquiries.json', list); res.json({ ok: true, item: e })
})
app.delete('/api/admin/enquiries/:id', (req, res) => {
  const list = read('enquiries.json', []), n = list.filter((x) => x.id !== req.params.id)
  if (n.length === list.length) return res.status(404).json({ ok: false })
  write('enquiries.json', n); res.json({ ok: true })
})

const csvCell = (v) => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"` } // blocks spreadsheet formula injection
app.get('/api/admin/enquiries.csv', (req, res) => {
  const cols = ['at', 'status', 'name', 'company', 'email', 'phone', 'service', 'projectType', 'message', 'note']
  const rows = [cols.join(','), ...filterList(req.query).map((e) => cols.map((c) => csvCell(e[c])).join(','))]
  res.setHeader('Content-Type', 'text/csv; charset=utf-8'); res.setHeader('Content-Disposition', `attachment; filename="tac-enquiries-${new Date().toISOString().slice(0, 10)}.csv"`)
  res.send('﻿' + rows.join('\r\n'))
})

app.put('/api/admin/content/:type/:slug', (req, res) => {
  const { type, slug } = req.params
  if (!['products', 'projects'].includes(type) || !/^[a-z0-9-]{1,80}$/.test(slug)) return res.status(400).json({ ok: false })
  const text = String(req.body?.description ?? '').trim().slice(0, 3000)
  const c = read('content.json', { products: {}, projects: {} }); c[type] ||= {}
  if (text) c[type][slug] = text; else delete c[type][slug]
  write('content.json', c); res.json({ ok: true })
})

app.post('/api/admin/password', (req, res) => {
  const { current, next } = req.body || {}
  if (!verifyPassword(current ?? '', admin().hash)) return res.status(400).json({ ok: false, error: 'Current password is incorrect.' })
  if (typeof next !== 'string' || next.length < 10) return res.status(400).json({ ok: false, error: 'New password must be at least 10 characters.' })
  setPassword(next)
  res.setHeader('Set-Cookie', `tac_admin=${makeToken(admin().changedAt)}; ${cookieOpts(isSecure(req))}`) // keep this session alive
  res.json({ ok: true })
})
app.use('/api', (_q, res) => res.status(404).json({ ok: false }))

// ---------- legacy redirects + static site ----------
const slugFix = (s) => s.replace(/%26|&/g, 'and')
app.get('/asin-products-1/:slug', (q, r) => r.redirect(301, `/products/${slugFix(q.params.slug)}`))
app.get('/asin-products/:slug', (q, r) => r.redirect(301, `/products/${slugFix(q.params.slug)}`))
app.get('/about', (_q, r) => r.redirect(301, '/about-us'))

app.use(express.static(dist, { maxAge: '7d', index: false, redirect: false, setHeaders: (r, p) => { if (p.endsWith('.html')) r.setHeader('Cache-Control', 'no-cache') } }))
app.get('/{*splat}', (req, res) => {
  if (req.path === '/admin' || req.path.startsWith('/admin/')) { res.setHeader('X-Robots-Tag', 'noindex, nofollow'); res.setHeader('Cache-Control', 'no-store'); return res.sendFile(path.join(dist, 'index.html')) }
  const clean = req.path.replace(/\/+$/, '')
  const f = path.join(dist, clean, 'index.html')
  if (!f.startsWith(dist)) return res.sendStatus(400)
  if (fs.existsSync(f)) return res.sendFile(f)
  res.status(404).sendFile(path.join(dist, 'index.html'))
})

const initial = ensureAdmin()
app.listen(PORT, () => {
  console.log(`TAC site + admin on http://localhost:${PORT}  (dashboard: /admin)`)
  if (initial) console.log(`\n  ADMIN FIRST-RUN PASSWORD: ${initial}\n  (shown once — sign in at /admin, then change it under Security)\n`)
  if (!transporter) console.log('  SMTP not configured: enquiries are stored and visible in the dashboard, but no email is sent.')
})

// Production server: serves ./dist, handles POST /api/enquiry (validation, spam protection, email).
import express from 'express'
import nodemailer from 'nodemailer'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dist = path.resolve(__dirname, '../dist')
const PORT = process.env.PORT || 8787
const MAIL_TO = process.env.MAIL_TO || 'info@tacuae.com'
const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(express.json({ limit: '20kb' }))

const smtp = process.env.SMTP_HOST
  ? nodemailer.createTransport({ host: process.env.SMTP_HOST, port: +(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true', auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined })
  : null
if (!smtp) console.warn('[enquiry] SMTP_HOST not set – enquiries are saved to server/data/enquiries.jsonl only (no email is sent).')

const hits = new Map() // ip -> timestamps (in-memory rate limit: 5 enquiries / hour)
const limited = (ip) => {
  const now = Date.now(), arr = (hits.get(ip) || []).filter((t) => now - t < 3600e3)
  if (arr.length >= 5) return true
  arr.push(now); hits.set(ip, arr); return false
}
const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max)
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

app.post('/api/enquiry', async (req, res) => {
  const b = req.body || {}
  // honeypot or implausibly fast submit → pretend success, drop silently
  if (clean(b.website, 50) || Number(b.elapsed) < 2500) return res.json({ ok: true })
  if (limited(req.ip)) return res.status(429).json({ error: 'Too many enquiries from this connection. Please try again later or call us.' })
  const d = { name: clean(b.name, 120), company: clean(b.company, 160), email: clean(b.email, 160), phone: clean(b.phone, 30), service: clean(b.service, 120), projectType: clean(b.projectType, 120), message: clean(b.message, 4000) }
  if (d.name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email) || d.message.length < 10 || (d.phone && !/^[+()\d\s-]{6,20}$/.test(d.phone)))
    return res.status(400).json({ error: 'Please check the form fields and try again.' })
  const record = { at: new Date().toISOString(), ip: req.ip, ...d }
  try {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true })
    fs.appendFileSync(path.join(__dirname, 'data/enquiries.jsonl'), JSON.stringify(record) + '\n')
    if (smtp) {
      await smtp.sendMail({
        from: process.env.MAIL_FROM || `TAC UAE Website <${process.env.SMTP_USER || MAIL_TO}>`, to: MAIL_TO, replyTo: `${d.name} <${d.email}>`,
        subject: `Website enquiry – ${d.service || 'General'} – ${d.name}`,
        text: Object.entries(d).map(([k, v]) => `${k}: ${v}`).join('\n'),
        html: `<table>${Object.entries(d).map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v).replace(/\n/g, '<br>')}</td></tr>`).join('')}</table>`,
      })
    }
    res.json({ ok: true })
  } catch (e) {
    console.error('[enquiry] failed', e)
    res.status(500).json({ error: 'We could not send your enquiry right now.' })
  }
})
app.get('/api/health', (_q, r) => r.json({ ok: true, smtp: !!smtp }))

// legacy Wix product URLs → permanent redirects
app.get(['/asin-products/:slug', '/asin-products-1/:slug'], (req, res) => {
  const slug = decodeURIComponent(req.params.slug).replace(/&/g, 'and')
  res.redirect(301, fs.existsSync(path.join(dist, 'products', slug, 'index.html')) ? `/products/${slug}` : '/products')
})
app.use(express.static(dist, { index: false, redirect: false, maxAge: '1h', setHeaders: (r, p) => { if (/\/(assets|img)\//.test(p)) r.setHeader('Cache-Control', 'public, max-age=31536000, immutable') } }))
// per-route prerendered shells (see scripts/postbuild.mjs), else SPA fallback
app.use((req, res) => {
  const p = req.path.replace(/\/+$/, '') || '/'
  const f = path.join(dist, p === '/' ? 'index.html' : `${p}/index.html`)
  res.sendFile(fs.existsSync(f) ? f : path.join(dist, 'index.html'))
})
app.listen(PORT, () => console.log(`TAC site on http://localhost:${PORT}`))

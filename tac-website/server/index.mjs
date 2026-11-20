// Production server: serves ./dist, handles legacy redirects and POST /api/enquiry.
import express from 'express'
import nodemailer from 'nodemailer'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dist = path.join(__dirname, '..', 'dist')
const PORT = process.env.PORT || 8787
const TO = process.env.ENQUIRY_TO || 'info@tacuae.com'
const LOG = path.join(process.env.DATA_DIR || __dirname, 'enquiries.jsonl')

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '20kb' }))

const hits = new Map() // ip -> timestamps (simple in-memory rate limit)
const limited = (ip) => {
  const now = Date.now(), arr = (hits.get(ip) || []).filter((t) => now - t < 3600_000)
  arr.push(now); hits.set(ip, arr)
  return arr.length > 5
}
const clean = (v, max) => String(v ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max)

let transporter = null
if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: +(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  })
}

app.post('/api/enquiry', async (req, res) => {
  const b = req.body || {}
  if (b.website) return res.json({ ok: true }) // honeypot: pretend success
  if (typeof b.elapsed === 'number' && b.elapsed < 2500) return res.status(400).json({ ok: false })
  if (limited(req.ip)) return res.status(429).json({ ok: false, error: 'Too many requests' })

  const d = { name: clean(b.name, 120), company: clean(b.company, 120), email: clean(b.email, 160), phone: clean(b.phone, 40),
    service: clean(b.service, 120), projectType: clean(b.projectType, 80), message: String(b.message ?? '').trim().slice(0, 4000) }
  if (d.name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email) || d.message.length < 10)
    return res.status(400).json({ ok: false, error: 'Invalid input' })

  try {
    fs.appendFileSync(LOG, JSON.stringify({ at: new Date().toISOString(), ...d }) + '\n')
    if (transporter) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER, to: TO, replyTo: d.email,
        subject: `Website enquiry — ${d.service || 'General'} — ${d.name}`,
        text: Object.entries(d).map(([k, v]) => `${k}: ${v}`).join('\n'),
      })
    } else {
      console.warn('SMTP not configured: enquiry saved to enquiries.jsonl only')
    }
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false })
  }
})

// legacy Wix URLs
app.get('/asin-products-1/:slug', (req, res) => res.redirect(301, `/products/${req.params.slug.replace(/%26|&/g, 'and')}`))
app.get('/asin-products/:slug', (req, res) => res.redirect(301, `/products/${req.params.slug.replace(/%26|&/g, 'and')}`))
app.get('/about', (_q, res) => res.redirect(301, '/about-us'))

app.use(express.static(dist, { maxAge: '7d', index: false, redirect: false, setHeaders: (r, p) => { if (p.endsWith('.html')) r.setHeader('Cache-Control', 'no-cache') } }))
app.get('/{*splat}', (req, res) => {
  const clean = req.path.replace(/\/+$/, '')
  const f = path.join(dist, clean, 'index.html')
  if (!f.startsWith(dist)) return res.sendStatus(400)
  if (fs.existsSync(f)) return res.sendFile(f)
  res.status(404).sendFile(path.join(dist, 'index.html'))
})
app.listen(PORT, () => console.log(`TAC site on http://localhost:${PORT}`))

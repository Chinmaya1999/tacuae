// The built React site: legacy redirects, static files, and per-route HTML for crawlers.
import express, { Router } from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { env } from '../config/env.js'

const dist = env.distDir
const r = Router()

const slugFix = (s) => s.replace(/%26|&/g, 'and')
r.get('/asin-products-1/:slug', (q, s) => s.redirect(301, `/products/${slugFix(q.params.slug)}`))
r.get('/asin-products/:slug', (q, s) => s.redirect(301, `/products/${slugFix(q.params.slug)}`))
r.get('/about', (_q, s) => s.redirect(301, '/about-us'))

r.use(express.static(dist, { maxAge: '7d', index: false, redirect: false, setHeaders: (res, p) => { if (p.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache') } }))
r.get('/{*splat}', (req, res) => {
  if (/^\/(admin|dashboard|login|register|q|proposal)(\/|$)/.test(req.path)) { // private app pages: never indexed or cached
    res.setHeader('X-Robots-Tag', 'noindex, nofollow'); res.setHeader('Cache-Control', 'no-store')
    return res.sendFile(path.join(dist, 'index.html'))
  }
  const f = path.join(dist, req.path.replace(/\/+$/, ''), 'index.html')
  if (!f.startsWith(dist)) return res.sendStatus(400)
  if (fs.existsSync(f)) return res.sendFile(f)
  res.status(404).sendFile(path.join(dist, 'index.html'))
})
export default r

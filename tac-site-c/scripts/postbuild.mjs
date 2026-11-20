// Generates sitemap.xml, robots.txt and a per-route index.html with correct <title>/<meta> for crawlers.
import fs from 'node:fs'
import path from 'node:path'
import { routes, company } from '../src/data/content.ts'

const dist = path.resolve('dist')
const base = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

for (const r of routes) {
  let html = base
    .replace(/<title>.*?<\/title>/, `<title>${esc(r.title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(r.desc)}$2`)
    .replace('</head>', `<link rel="canonical" href="${company.site}${r.path}" />\n<meta property="og:title" content="${esc(r.title)}" />\n<meta property="og:description" content="${esc(r.desc)}" />\n<meta property="og:image" content="${company.site}/images/site/hero.jpg" />\n</head>`)
  if (r.path === '/') { fs.writeFileSync(path.join(dist, 'index.html'), html); continue }
  const dir = path.join(dist, r.path)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), html)
}

const today = new Date().toISOString().slice(0, 10)
fs.writeFileSync(path.join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  routes.map((r) => `  <url><loc>${company.site}${r.path}</loc><lastmod>${today}</lastmod></url>`).join('\n') + `\n</urlset>\n`)
fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${company.site}/sitemap.xml\n`)
console.log(`postbuild: ${routes.length} routes, sitemap + robots written`)

// Writes per-route HTML shells (unique <title>, description, canonical, Open Graph), sitemap.xml and robots.txt into dist/.
import fs from 'node:fs'
import path from 'node:path'
const SITE = 'https://www.tacuae.com'
const dist = path.resolve('dist')
const src = JSON.parse(fs.readFileSync('src/data/source.json', 'utf8'))
const services = [
  ['building-management-system', 'Building Management System (BMS)', 'A control system to monitor and manage power, HVAC, access control, pumping stations, elevators and lighting in a facility.'],
  ['smart-home-automation', 'Smart Home Automation', 'Smart wired/wireless control, glass touch switches, unified security, voice control and remote control via cloud.'],
  ['guest-room-management-system', 'Guest Room Management System (GRMS)', 'Hotel room automation: guest control of lighting, temperature, drapes and audio/video.'],
  ['lighting-and-dimming-control', 'Lighting & Dimming Control', 'Movement/timer-based and centrally visualised lighting control, DALI dimming and DMX/RGB systems.'],
  ['knx-automation', 'KNX Automation', 'Licensed KNX distributor and manufacturer – KNX-based building and home automation.'],
  ['knx-training-and-certification', 'KNX Training & Certification', 'Certified KNX Training Center with complete training and certification facilities.'],
]
const pages = [
  ['/', null, null],
  ['/about-us', 'About Us', 'Total Automation Co. LLC – a global specialist in home and building automation. KNX distributor and manufacturer with 600+ projects since 1998.'],
  ['/services', 'Services', 'Building Management Systems, Smart Home Automation, GRMS, Lighting & Dimming Control, KNX Automation and KNX Training from TAC UAE, Dubai.'],
  ['/products', 'Products', 'KNX products from TAC UAE – ThinKnx servers, Audiofy, KNX power supplies, DALI gateway, actuators, interfaces and KNX cable.'],
  ['/projects', 'Projects', 'Major TAC UAE projects: Dubai International Airport, Meydan, Iris Bay, La Verda, American School of Dubai and more.'],
  ['/knx-training', 'KNX Training & Certification', 'Certified KNX Training Center in Dubai. 5-day KNX Basic Course plus KNX Partner and Advanced courses.'],
  ['/contact', 'Contact Us', 'Contact TAC UAE – Suite 506 Le Solarium Business Tower, Dubai Silicon Oasis. +971 4 3926860 · info@tacuae.com.'],
  ['/privacy-policy', 'Privacy Policy', 'How TAC UAE handles information submitted through this website.'],
  ['/terms', 'Terms & Conditions', 'Terms of use for the TAC UAE website.'],
  ...services.map(([s, t, d]) => [`/services/${s}`, t, d]),
  ...src.products.map((p) => [`/products/${p.slug}`, p.title, p.paragraphs[0]]),
  ...src.projects.map((p) => [`/projects/${p.slug}`, p.title, p.paragraphs[0]]),
]
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const base = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
for (const [route, title, desc] of pages) {
  if (route === '/') continue
  const t = esc(`${title} | TAC UAE`), d = esc(desc.slice(0, 300)), url = SITE + route
  let h = base
    .replace(/<title>.*?<\/title>/s, `<title>${t}</title>`)
    .replace(/(<meta name="description" content=")[^"]*/, `$1${d}`)
    .replace(/(<link rel="canonical" href=")[^"]*/, `$1${url}`)
    .replace(/(<meta property="og:title" content=")[^"]*/, `$1${t}`)
    .replace(/(<meta property="og:description" content=")[^"]*/, `$1${d}`)
    .replace('<meta property="og:type" content="website" />', `<meta property="og:type" content="website" />\n    <meta property="og:url" content="${url}" />`)
  fs.mkdirSync(path.join(dist, route), { recursive: true })
  fs.writeFileSync(path.join(dist, route, 'index.html'), h)
}
const today = new Date().toISOString().slice(0, 10)
fs.writeFileSync(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(([r]) => `  <url><loc>${SITE}${r === '/' ? '' : r}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`)
fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE}/sitemap.xml\n`)
// 404 shell
fs.writeFileSync(path.join(dist, '404.html'), base.replace(/<title>.*?<\/title>/s, '<title>Page not found | TAC UAE</title>'))
console.log(`postbuild: ${pages.length} route shells, sitemap.xml, robots.txt`)

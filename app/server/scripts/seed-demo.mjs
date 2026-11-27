// Fills a DEMO database with accounts, prices, quotations and bookings for a client presentation.
// Refuses to run unless DEMO_MODE=true and the database name contains "demo".
const uri = process.env.MONGODB_URI || ''
if (process.env.DEMO_MODE !== 'true' || !/\/[^/?]*demo[^/?]*(\?|$)/i.test(uri)) {
  console.error('Refusing to seed: set DEMO_MODE=true and use a database whose name contains "demo".'); process.exit(1)
}
const { getDb, closeDb } = await import('../src/config/database.js')
const { register, hashPassword } = await import('../src/services/auth.service.js')
const { ensureProducts } = await import('../src/services/product.service.js')
const { ensurePricing } = await import('../src/services/pricing.service.js')
const { cleanHome, cleanProject } = await import('../src/validators/pricing.validator.js')
const Q = await import('../src/services/quote.service.js')
const X = await import('../src/services/extra.service.js')
const User = await import('../src/models/user.model.js')
const Pricing = await import('../src/models/pricing.model.js')
const Product = await import('../src/models/product.model.js')

const db = await getDb()
// already seeded? (the server may have created the first admin on its own, so look for a sample customer)
if (!process.argv.includes('--reset') && (await db.collection('tac_users').findOne({ email: 'customer@demo.tac' }))) { await closeDb(); process.exit(0) }
// empty this app's collections (works with a read/write database user; indexes are kept)
for (const { name } of await db.listCollections().toArray()) if (name.startsWith('tac_')) await db.collection(name).deleteMany({})
await ensureProducts(); await ensurePricing()

const PASSWORD = process.env.DEMO_PASSWORD || 'Demo@12345' // set DEMO_PASSWORD for a demo that is online
const account = async (name, email, role, extra = {}) => {
  const u = await register({ name, email, password: PASSWORD, role: role === 'builder' ? 'builder' : 'customer', company: extra.company || '', phone: extra.phone || '+971500000000', business: extra.business || null })
  const set = { role, demo: true, ...extra.set }
  await User.setFields(u._id, set)
  return { ...u, ...set }
}
const admin = await account('Demo Admin', 'admin@demo.tac', 'admin')
const sales = await account('Sara Sales', 'sales@demo.tac', 'sales')
const customer = await account('Omar Customer', 'customer@demo.tac', 'customer')
const builder = await account('Layla Developer', 'builder@demo.tac', 'builder', { company: 'Demo Developments LLC', business: { tradeLicence: 'DEMO-123', trn: '100000000000003', sector: 'developer' }, set: { verified: true, priceTier: 'trade' } })
const at = new Date().toISOString()
await User.insert({ name: 'Peter Procurement', email: 'procurement@demo.tac', role: 'builder', company: builder.company, phone: '', companyOwnerId: builder._id, teamRole: 'procurement', demo: true, active: true, hash: await hashPassword(PASSWORD), pwChangedAt: at, createdAt: at })

// demo-only products so gate and building systems can be shown (TAC supplies the real ones)
const extra = [
  ['gate-controller', 'Gate & garage controller (demo)', 'Security', 780, 180], ['video-intercom', 'Video intercom (demo)', 'Security', 1100, 160], ['bms-gateway', 'BMS / HVAC gateway (demo)', 'Energy', 4200, 900],
].map(([id, name, group, unitPrice, installPrice]) => ({ id, name, group, unitPrice, installPrice, prices: { trade: Math.round(unitPrice * 0.85) }, connectivity: ['wired', 'wireless'], protocol: 'Demo', specs: 'Placeholder for the demonstration', desc: '', active: true }))
await Product.insertMany(extra)
for (const p of await Product.listAll()) {
  await Product.update(p.id, { sku: `DEMO-${p.id.toUpperCase()}`, 'prices.trade': p.prices?.trade || Math.round(p.unitPrice * 0.85) })
  if (['motion-sensor', 'cloud-control'].includes(p.id)) await Product.update(p.id, { connectivity: ['wired', 'wireless'] })
}
for (const [level, qty] of [['essential', 1], ['comfort', 1], ['luxury', 2]]) {
  await Pricing.upsertRule({ key: `property:gate:${level}`, roomType: 'property', category: 'gate', level, items: [{ productId: 'gate-controller', qty }], starter: true })
}
await Pricing.saveSettings({
  publicEstimates: true, cablingPct: { wired: 6, wireless: 0 }, programmingPerDevice: 45, commissioningPerUnit: 350, amcPct: 8,
  volumeTiers: [{ minUnits: 25, discountPct: 4 }, { minUnits: 100, discountPct: 8 }], salesDiscountLimitPct: 5, maxDiscountPct: 25,
  trn: '100000000000003', terms: 'DEMONSTRATION ONLY — prices and terms are sample values, not a TAC offer.',
  fx: { USD: 0.2723, EUR: 0.25, asOf: 'sample rate' }, popularLevel: 'comfort', bestValueLevel: 'essential',
})

const rooms = (list) => list.map(([type, name], i) => ({ id: `r${i}`, type, name }))
const villa = cleanHome({ homeType: 'villa', areaSqft: 4200, connectivity: 'wired', control: 'all', emirate: 'Dubai', community: 'Arabian Ranches', timeline: '3–6 months', amc: true,
  rooms: rooms([['living', 'Living room'], ['majlis', 'Majlis'], ['master', 'Master bedroom'], ['bedroom', 'Bedroom'], ['kitchen', 'Kitchen']]),
  levels: { lighting: 'luxury', climate: 'comfort', curtains: 'comfort', security: 'comfort', audio: 'comfort', gate: 'essential' } })
const flat = cleanHome({ homeType: 'apartment-2', areaSqft: 1300, connectivity: 'wireless', control: 'app', emirate: 'Dubai', rooms: rooms([['living', 'Living room'], ['master', 'Master bedroom']]), levels: { lighting: 'comfort', climate: 'essential', security: 'essential' } })
const unit = (n) => ({ control: 'app', levels: { lighting: 'comfort', climate: 'essential' }, rooms: rooms(Array.from({ length: n }, (_, i) => (i ? ['bedroom', `Bedroom ${i}`] : ['living', 'Living room']))) })
const tower = cleanProject({ project: { name: 'Marina Heights', type: 'residential-tower', location: 'Dubai Marina', stage: 'Design', handover: '2028-03-31', buildingSystems: 'BMS and HVAC integration for common areas.' }, connectivity: 'wired',
  unitTypes: [{ id: 'a', name: '2BR apartment', quantity: 120, areaSqft: 1200, phase: 'Tower A', config: unit(3) }, { id: 'b', name: '3BR apartment', quantity: 40, areaSqft: 1700, phase: 'Tower B', config: unit(4) }],
  common: [{ productId: 'camera', qty: 48 }, { productId: 'video-intercom', qty: 4 }, { productId: 'bms-gateway', qty: 2 }, { productId: 'energy-meter', qty: 12 }] })

const make = (u, kind, input, name) => Q.create(u, { kind, input, name })
const q1 = await make(customer, 'home', villa, 'Ranches villa')
await Q.requestReview(customer, q1.id, 'Please confirm the majlis lighting.'); await Q.staffMeta(sales, q1.id, { assignedTo: sales.email })
await Q.adjust(sales, q1.id, { discountPct: 5, quantities: {} }); await Q.review(sales, q1.id); await Q.finalize(sales, q1.id)
const q2 = await make(customer, 'home', flat, 'City apartment'); await Q.share(customer, q2.id)
const q3 = await make(builder, 'project', tower, 'Marina Heights — Towers A & B'); await Q.requestReview(builder, q3.id, ''); await Q.adjust(sales, q3.id, { discountPct: 12, quantities: {} })
const q4 = await make(builder, 'home', flat, 'Show apartment'); await Q.requestReview(builder, q4.id, ''); await Q.review(sales, q4.id); await Q.finalize(admin, q4.id); await Q.accept(builder, q4.id); await Q.scheduleSurvey(sales, q4.id, new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10))

const soon = (d) => new Date(Date.now() + d * 86400_000).toISOString().slice(0, 10)
await X.book(customer, { type: 'site survey', date: soon(4), slot: '11:00', name: customer.name, phone: '+971500000000', email: customer.email, notes: 'Villa 12' })
await X.book(null, { type: 'showroom visit', date: soon(6), slot: '15:00', name: 'Walk-in visitor', phone: '+971551234567', email: '', notes: '' })
await (await getDb()).collection('tac_counters').updateOne({ _id: 'configurator_opened' }, { $set: { n: 37 } }, { upsert: true })
await new Promise((r) => setTimeout(r, 800)) // let notifications finish writing
console.log('Demo data ready.')
await closeDb()

// Process entry point: connect, seed the first admin, listen, shut down cleanly.
import { createApp } from './app.js'
import { env } from './config/env.js'
import { closeDb, mongoEnabled } from './config/database.js'
import { ensureAdmin } from './services/auth.service.js'
import { ensureProducts } from './services/product.service.js'
import { mailEnabled } from './integrations/email/mailer.js'
import { startJobs } from './jobs/cron.jobs.js'

// Listen immediately so the site (and the dev proxy / health check) never waits for MongoDB; connect and seed in the background.
const server = createApp().listen(env.port, () => {
  console.log(`TAC site + dashboards on http://localhost:${env.port}  (sign in: /login)`)
  if (!mongoEnabled) console.log('  MONGODB_URI not set: customer/builder accounts and the admin dashboard are disabled.')
  if (!mailEnabled) console.log('  SMTP not configured: enquiries are stored and visible in the dashboard, but no email is sent.')
})
server.on('error', (e) => {
  console.error(e.code === 'EADDRINUSE' ? `Port ${env.port} is already in use. Stop the other server (or set PORT) and try again.` : e)
  process.exit(1)
})

;(async () => {
  try {
    const initial = await ensureAdmin()
    if (initial) console.log(`\n  ADMIN ACCOUNT CREATED: ${initial.email}${initial.password ? `\n  FIRST-RUN PASSWORD: ${initial.password}\n  (shown once — sign in at /login, then change it under Security)` : '  (password = ADMIN_PASSWORD)'}\n`)
    const seeded = await ensureProducts()
    if (seeded) console.log(`  Seeded ${seeded} starter products with PLACEHOLDER prices — set real prices in Admin → Products.`)
    if (mongoEnabled) console.log('  MongoDB connected.')
  } catch (e) { console.error('Could not reach MongoDB (accounts will retry on the next request):', e.message) }
})()
startJobs()

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => { server.close(async () => { await closeDb(); process.exit(0) }); setTimeout(() => process.exit(1), 8000).unref() })
}

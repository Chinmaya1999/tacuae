// Boots the real app on its own disposable MongoDB database. Set TEST_MONGODB_URI (its name must contain "test").
import assert from 'node:assert/strict'
import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'

const raw = process.env.TEST_MONGODB_URI || ''
export const skip = !/\/[^/?]*test[^/?]*(\?|$)/i.test(raw) && 'set TEST_MONGODB_URI to run'

/** `suffix` gives each test file its own database, because files run in parallel. */
export async function startApp(t, suffix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tac-t-'))
  Object.assign(process.env, { DATA_DIR: dir, MONGODB_URI: raw.replace(/\/([^/?]*test[^/?]*)(\?|$)/i, `/$1_${suffix}$2`), ADMIN_EMAIL: 'admin@test.local', ADMIN_PASSWORD: 'admin-password-1' })
  const { createApp } = await import('../../src/app.js')
  const { getDb, closeDb } = await import('../../src/config/database.js')
  const { ensureAdmin } = await import('../../src/services/auth.service.js')
  const { ensureProducts } = await import('../../src/services/product.service.js')
  const { ensurePricing } = await import('../../src/services/pricing.service.js')
  await (await getDb()).dropDatabase()
  await closeDb()
  await ensureAdmin(); await ensureProducts(); await ensurePricing()
  const server = createApp().listen(0)
  await new Promise((r) => server.once('listening', r))
  t.after(async () => { server.close(); await (await getDb()).dropDatabase(); await closeDb(); fs.rmSync(dir, { recursive: true, force: true }) })
  const base = `http://127.0.0.1:${server.address().port}/api`

  /** A browser-like client: keeps its session cookie and asserts the expected status. */
  return () => {
    let cookie = ''
    return async (method, url, body, status = 200) => {
      const r = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'tac-admin', cookie }, body: body === undefined ? undefined : JSON.stringify(body) })
      cookie = r.headers.get('set-cookie')?.split(';')[0] ?? cookie
      const text = await r.text()
      assert.equal(r.status, status, `${method} ${url} → ${r.status} ${text.slice(0, 200)}`)
      return r.headers.get('content-type')?.includes('json') ? JSON.parse(text) : text
    }
  }
}

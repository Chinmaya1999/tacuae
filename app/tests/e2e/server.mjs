// Seeds a disposable demo database, then serves the built site for the browser tests.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const raw = process.env.TEST_MONGODB_URI || ''
if (!/\/[^/?]*test[^/?]*(\?|$)/i.test(raw)) throw new Error('Set TEST_MONGODB_URI to a database whose name contains "test".')
Object.assign(process.env, {
  MONGODB_URI: raw.replace(/\/([^/?]*test[^/?]*)(\?|$)/i, '/$1_e2e_demo$2'), DEMO_MODE: 'true', DATA_DIR: fs.mkdtempSync(path.join(os.tmpdir(), 'tac-e2e-')),
  ADMIN_EMAIL: 'admin@demo.tac', ADMIN_PASSWORD: 'Demo@12345', SMTP_HOST: '', GOOGLE_CLIENT_ID: '', FIREBASE_API_KEY: '',
})
if (spawnSync(process.execPath, ['server/scripts/seed-demo.mjs', '--reset'], { stdio: 'inherit', env: process.env }).status !== 0) process.exit(1)
await import('../../server/src/server.js')

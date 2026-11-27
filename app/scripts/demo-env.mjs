// The ONE local mode, shared by `npm run dev` and `npm run demo`: demo features on, with a local MongoDB and data
// folder in ~/.tac-demo. Apart from public sign-in settings it ignores .env, and it never touches the real database. (Production uses `npm start`.)
import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { parseEnv } from 'node:util'

const home = path.join(os.homedir(), '.tac-demo'), dbDir = path.join(home, 'db'), DB_PORT = 27027

// Only these public sign-in settings are taken from .env, so the real Google and SMS sign-in can be tried locally.
const PUBLIC_KEYS = ['GOOGLE_CLIENT_ID', 'FIREBASE_API_KEY', 'FIREBASE_AUTH_DOMAIN', 'FIREBASE_PROJECT_ID', 'FIREBASE_APP_ID']
const publicSettings = () => {
  let file = {}
  try { file = parseEnv(fs.readFileSync('.env', 'utf8')) } catch { /* no .env */ }
  return Object.fromEntries(PUBLIC_KEYS.map((k) => [k, process.env[k] ?? file[k] ?? '']))
}

export const demoEnv = (port) => ({ ...process.env, ...publicSettings(), DEMO_MODE: 'true', PORT: String(port), MONGODB_URI: `mongodb://127.0.0.1:${DB_PORT}/tac_demo`, DATA_DIR: path.join(home, 'data'), ADMIN_EMAIL: 'admin@demo.tac', ADMIN_PASSWORD: 'Demo@12345', SMTP_HOST: '' })

const listening = () => new Promise((res) => { const s = net.connect(DB_PORT, '127.0.0.1', () => { s.end(); res(true) }); s.on('error', () => res(false)) })

/** Starts the local database if needed (it keeps running so both commands can share it) and adds sample data once. */
export async function prepareDemo(env, { reset = false } = {}) {
  fs.mkdirSync(dbDir, { recursive: true })
  if (!(await listening())) {
    const mongod = spawn('mongod', ['--dbpath', dbDir, '--port', String(DB_PORT), '--bind_ip', '127.0.0.1', '--quiet', '--logpath', path.join(home, 'mongod.log')], { stdio: 'ignore', detached: true })
    mongod.on('error', () => { console.error('MongoDB is not installed. Install it with: brew tap mongodb/brew && brew install mongodb-community'); process.exit(1) })
    mongod.unref()
    for (let i = 0; i < 60 && !(await listening()); i++) await new Promise((r) => setTimeout(r, 500))
    if (!(await listening())) { console.error(`MongoDB did not start. See ${path.join(home, 'mongod.log')}`); process.exit(1) }
  }
  const seed = spawnSync(process.execPath, ['server/scripts/seed-demo.mjs', ...(reset ? ['--reset'] : [])], { stdio: 'inherit', env })
  if (seed.status !== 0) process.exit(seed.status ?? 1)
}

export const banner = (url) => `
  Open ${url}
  Password for every account: Demo@12345
    admin@demo.tac · sales@demo.tac · customer@demo.tac · builder@demo.tac · procurement@demo.tac
`

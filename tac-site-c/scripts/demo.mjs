// One command for a client demonstration:  npm run demo        (npm run demo -- --reset  for fresh data)
// Uses its OWN local MongoDB and data folder in ~/.tac-demo. It never reads .env or touches your real database.
import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'

const home = path.join(os.homedir(), '.tac-demo'), dbDir = path.join(home, 'db'), DB_PORT = 27027
const PORT = process.env.PORT || '8800'
fs.mkdirSync(dbDir, { recursive: true })
const env = { ...process.env, DEMO_MODE: 'true', PORT, MONGODB_URI: `mongodb://127.0.0.1:${DB_PORT}/tac_demo`, DATA_DIR: path.join(home, 'data'), ADMIN_EMAIL: 'admin@demo.tac', ADMIN_PASSWORD: 'Demo@12345', SMTP_HOST: '' }
const run = (args) => { const r = spawnSync(process.execPath, args, { stdio: 'inherit', env }); if (r.status !== 0) process.exit(r.status ?? 1) }
const listening = () => new Promise((res) => { const s = net.connect(DB_PORT, '127.0.0.1', () => { s.end(); res(true) }); s.on('error', () => res(false)) })

let mongod
if (!(await listening())) {
  mongod = spawn('mongod', ['--dbpath', dbDir, '--port', String(DB_PORT), '--bind_ip', '127.0.0.1', '--quiet', '--logpath', path.join(home, 'mongod.log')], { stdio: 'ignore' })
  mongod.on('error', () => { console.error('MongoDB is not installed. Install it with: brew tap mongodb/brew && brew install mongodb-community'); process.exit(1) })
  for (let i = 0; i < 60 && !(await listening()); i++) await new Promise((r) => setTimeout(r, 500))
  if (!(await listening())) { console.error(`MongoDB did not start. See ${path.join(home, 'mongod.log')}`); process.exit(1) }
}
const stop = () => { mongod?.kill(); process.exit(0) }
process.on('SIGINT', stop); process.on('SIGTERM', stop)

for (const a of [['node_modules/typescript/bin/tsc', '-b'], ['node_modules/vite/bin/vite.js', 'build'], ['scripts/postbuild.mjs']]) run(a)
run(['server/scripts/seed-demo.mjs', ...(process.argv.includes('--reset') ? ['--reset'] : [])])
console.log(`
  DEMO is starting → http://localhost:${PORT}
  Password for every account: Demo@12345
    admin@demo.tac · sales@demo.tac · customer@demo.tac · builder@demo.tac · procurement@demo.tac
  Press Ctrl+C to stop.
`)
const server = spawn(process.execPath, ['server/src/server.js'], { stdio: 'inherit', env })
server.on('exit', (c) => { mongod?.kill(); process.exit(c ?? 0) })

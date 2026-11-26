// Starts the API and the Vite dev server together in the same demo mode as `npm run demo`.
// `npm run dev:real` uses the database in .env instead (demo features off). It keeps the API alive:
//  - if the API crashes or is killed, it is started again (so the site never points at a dead server)
//  - when you edit a file under server/src, the API restarts with the new code
import { spawn } from 'node:child_process'
import { watch } from 'node:fs'
import { banner, demoEnv, prepareDemo } from './demo-env.mjs'

const real = process.argv.includes('--real')
const env = real ? process.env : demoEnv(process.env.PORT || 8787)
if (!real) await prepareDemo(env, { reset: process.argv.includes('--reset') })

const svcs = {
  api: [...(real ? ['--env-file-if-exists=.env'] : []), 'server/src/server.js'],
  web: ['node_modules/vite/bin/vite.js', ...(process.env.WEB_PORT ? ['--port', process.env.WEB_PORT] : [])],
}
let stopping = false
const procs = new Map()

function start(name, delay = 0) {
  setTimeout(() => {
    if (stopping) return
    const p = spawn(process.execPath, svcs[name], { stdio: 'inherit', env })
    procs.set(name, p)
    p.on('exit', (code, sig) => {
      if (stopping) return
      if (!p.reloading) console.error(`[dev] ${name} stopped (${sig ?? `code ${code}`}) — restarting in 1s`)
      start(name, p.reloading ? 100 : 1000)
    })
  }, delay)
}

let timer
watch('server/src', { recursive: true }, (_e, file) => {
  if (!file || !/\.(js|mjs|json)$/.test(file)) return
  clearTimeout(timer)
  timer = setTimeout(() => { const p = procs.get('api'); if (p) { console.log(`[dev] ${file} changed — restarting API`); p.reloading = true; p.kill() } }, 150)
})

function shutdown() { stopping = true; procs.forEach((p) => p.kill()); setTimeout(() => process.exit(0), 200) }
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown)
start('api'); start('web')
if (!real) setTimeout(() => console.log(banner('the Vite address shown above (usually http://localhost:5173)')), 1500)

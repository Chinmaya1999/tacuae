// Starts the API and the Vite dev server together, and keeps the API alive:
//  - if the API crashes or is killed, it is started again (so the site never points at a dead server)
//  - when you edit a file under server/src, the API restarts with the new code
import { spawn } from 'node:child_process'
import { watch } from 'node:fs'

const svcs = {
  api: ['--env-file-if-exists=.env', 'server/src/server.js'],
  web: ['node_modules/vite/bin/vite.js', ...(process.env.WEB_PORT ? ['--port', process.env.WEB_PORT] : [])],
}
let stopping = false
const procs = new Map()

function start(name, delay = 0) {
  setTimeout(() => {
    if (stopping) return
    const p = spawn(process.execPath, svcs[name], { stdio: 'inherit' })
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

// Starts the API (port 8787, loads .env, restarts on change) and the Vite dev server together.
import { spawn } from 'node:child_process'

const run = (name, cmd, args) => {
  const p = spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' })
  p.on('exit', (code) => { if (code) { console.error(`[dev] ${name} exited with code ${code}`); shutdown(code) } })
  return p
}
const kids = [
  run('api', process.execPath, ['--env-file-if-exists=.env', '--watch', 'server/src/server.js']),
  run('web', process.execPath, ['node_modules/vite/bin/vite.js']),
]
function shutdown(code = 0) { kids.forEach((k) => k.kill()); process.exit(code) }
process.on('SIGINT', () => shutdown()); process.on('SIGTERM', () => shutdown())

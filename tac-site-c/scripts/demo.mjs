// Client presentation on one port, using the built site:  npm run demo   (npm run demo -- --reset  for fresh data)
import { spawn, spawnSync } from 'node:child_process'
import { banner, demoEnv, prepareDemo } from './demo-env.mjs'

const port = process.env.PORT || '8800', env = demoEnv(port)
for (const a of [['node_modules/typescript/bin/tsc', '-b'], ['node_modules/vite/bin/vite.js', 'build'], ['scripts/postbuild.mjs']]) {
  const r = spawnSync(process.execPath, a, { stdio: 'inherit', env })
  if (r.status !== 0) process.exit(r.status ?? 1)
}
await prepareDemo(env, { reset: process.argv.includes('--reset') })
console.log(banner(`http://localhost:${port}`) + '  Press Ctrl+C to stop.\n')
const server = spawn(process.execPath, ['server/src/server.js'], { stdio: 'inherit', env })
const stop = () => server.kill()
process.on('SIGINT', stop); process.on('SIGTERM', stop)
server.on('exit', (c) => process.exit(c ?? 0))

// Tiny JSON-file store with atomic writes, used for enquiries and editable site content.
import fs from 'node:fs'
import path from 'node:path'
import { env } from '../config/env.js'

const file = (n) => path.join(env.dataDir, n)
export function read(name, fallback) {
  try { return JSON.parse(fs.readFileSync(file(name), 'utf8')) } catch { return fallback }
}
export function write(name, data) {
  fs.mkdirSync(env.dataDir, { recursive: true, mode: 0o700 })
  const tmp = file(name) + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), { mode: 0o600 })
  fs.renameSync(tmp, file(name))
}

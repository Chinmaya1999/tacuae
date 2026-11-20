// Tiny JSON-file store with atomic writes. Fine for a corporate site's enquiry volume;
// swap for MongoDB/Postgres later by re-implementing these few functions.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
export const dataDir = process.env.DATA_DIR || path.join(here, 'data')
fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 })

const file = (n) => path.join(dataDir, n)
export function read(name, fallback) {
  try { return JSON.parse(fs.readFileSync(file(name), 'utf8')) } catch { return fallback }
}
export function write(name, data) {
  const tmp = file(name) + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), { mode: 0o600 })
  fs.renameSync(tmp, file(name))
}
export const exists = (name) => fs.existsSync(file(name))

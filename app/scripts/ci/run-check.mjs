// Runs one pipeline check and records how many errors it found in reports/<id>.json.
//   node scripts/ci/run-check.mjs <id> <junit|tsc|audit|trivy|exit> "<title>" -- <command...>
// The exit code is the command's own; the workflow decides whether that stops anything (it does not).
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import { count } from './parsers.mjs'

const [id, type, title, sep, ...cmd] = process.argv.slice(2)
if (sep !== '--' || !cmd.length) throw new Error('usage: run-check.mjs <id> <type> <title> -- <command...>')
fs.mkdirSync('reports', { recursive: true })
const file = { junit: `reports/${id}.xml`, trivy: `reports/${id}.trivy.json` }[type]
if (file) fs.rmSync(file, { force: true })

const run = spawnSync(cmd[0], cmd.slice(1), { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: { ...process.env, PLAYWRIGHT_JUNIT_OUTPUT_FILE: file ?? '' } })
const output = `${run.stdout ?? ''}${run.stderr ?? ''}${run.error?.message ?? ''}`
process.stdout.write(output)
const report = file && fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null
const result = { id, title, ...count(type, { output, report, status: run.status ?? 1 }) }
fs.writeFileSync(`reports/${id}.json`, JSON.stringify(result, null, 2))
console.log(`\n[${title}] errors: ${result.errors}`)
process.exit(run.status ?? 1)

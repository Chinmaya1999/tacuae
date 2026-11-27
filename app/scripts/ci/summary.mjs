// Combines every reports/*.json into one Markdown report and prints the total error count.
//   node scripts/ci/summary.mjs <reports-dir> <expected-id,expected-id,...>
import fs from 'node:fs'
import path from 'node:path'

export function summarise(results, expected) {
  const rows = expected.map((id) => results.find((r) => r.id === id) ?? { id, title: id, errors: 1, details: ['no result: the job did not finish'] })
  const total = rows.reduce((n, r) => n + r.errors, 0)
  const md = [`## Pipeline checks: ${total ? `${total} error(s)` : 'all passed'}`, '', '| Check | Tests | Errors |', '|---|---|---|',
    ...rows.map((r) => `| ${r.errors ? '❌' : '✅'} ${r.title} | ${r.total ?? '–'} | ${r.errors} |`)]
  for (const r of rows.filter((x) => x.errors)) {
    md.push('', `### ${r.title}`, ...r.details.slice(0, 30).map((d) => `- ${String(d).replace(/[<>@`]/g, ' ').slice(0, 300)}`))
    if (r.details.length > 30) md.push(`- …and ${r.details.length - 30} more`)
  }
  return { total, markdown: md.join('\n') + '\n' }
}

if (process.argv[1]?.endsWith('summary.mjs')) {
  const [dir, ids] = process.argv.slice(2)
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json') && !f.endsWith('.trivy.json')) : []
  const { total, markdown } = summarise(files.map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))), ids.split(','))
  fs.writeFileSync('report.md', markdown)
  console.log(markdown)
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown)
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `errors=${total}\n`)
}

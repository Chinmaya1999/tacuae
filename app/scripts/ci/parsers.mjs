// Turns a tool's output into { errors, total, details }.
const unescape = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&')

function junit(xml) {
  const cases = [...xml.matchAll(/<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g)]
  const failed = cases.filter((c) => /<(failure|error)\b/.test(c[3] ?? ''))
  return {
    total: cases.length, errors: failed.length, skipped: cases.filter((c) => /<skipped\b/.test(c[3] ?? '')).length,
    details: failed.map((c) => unescape(/\bname="([^"]*)"/.exec(c[1])?.[1] ?? 'unnamed test')),
  }
}

export function count(type, { output, report, status }) {
  let r
  try {
    if (type === 'junit' && report) r = junit(report)
    if (type === 'tsc') { const d = output.split('\n').filter((l) => /error TS\d+/.test(l)); r = { errors: d.length, details: d } }
    if (type === 'audit') {
      const bad = Object.values(JSON.parse(output.slice(output.indexOf('{'))).vulnerabilities ?? {}).filter((v) => ['high', 'critical'].includes(v.severity))
      r = { errors: bad.length, details: bad.map((v) => `${v.name} (${v.severity})`) }
    }
    if (type === 'trivy' && report) {
      const v = (JSON.parse(report).Results ?? []).flatMap((x) => x.Vulnerabilities ?? [])
      r = { errors: v.length, details: v.map((x) => `${x.PkgName} ${x.VulnerabilityID} (${x.Severity})`) }
    }
  } catch { r = undefined }
  // a check that failed without a readable result still counts: crashes must never look like success
  if (!r) r = { errors: status === 0 ? 0 : 1, details: status === 0 ? [] : [output.trim().split('\n').slice(-3).join(' | ') || 'failed without output'] }
  else if (status !== 0 && r.errors === 0) r = { ...r, errors: 1, details: ['the check exited with an error (see the job log)'] }
  return r
}

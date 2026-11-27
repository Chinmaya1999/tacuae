// SIMULATED building telemetry. Deterministic: the same equipment at the same time always gives the same reading.
// There is no real hardware behind these numbers; every API response carries `simulated: true`.
import { equipmentDef } from '../constants/bms.js'

export function hash(str) { // FNV-1a
  let h = 2166136261
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
const noise = (seed) => (hash(seed) % 2001) / 1000 - 1 // -1..1
const localHour = (now) => ((now / 3600000) + 4) % 24 // Dubai (UTC+4)
const daily = (now) => Math.max(0, Math.sin((Math.PI * (localHour(now) - 6)) / 14)) // 0 at night, ~1 mid-afternoon
const round = (v, d = 1) => { const m = 10 ** d; return Math.round(v * m) / m }

function readingValue(rd, eq, ctx, now) {
  const seed = hash(eq.id + rd.key), t = now / 1000, phase = (seed % 6283) / 1000
  const n = noise(eq.id + rd.key + Math.floor(t / 5)) * rd.amp * 0.25
  switch (rd.shape) {
    case 'binary': return rd.base
    case 'daily': return rd.base * (0.35 + 0.65 * daily(now)) + n + rd.amp * 0.3 * Math.sin(t / 1800 + phase)
    case 'solar': return Math.max(0, Math.sin((Math.PI * (localHour(now) - 6)) / 12)) * rd.base * (0.94 + 0.06 * Math.sin(t / 300 + phase))
    case 'tank': return rd.base + rd.amp * Math.sin((2 * Math.PI * t) / (3600 * (3 + (seed % 4))) + phase) + n
    case 'floor': return Math.round(((Math.sin((2 * Math.PI * t) / (70 + (seed % 40)) + phase) + 1) / 2) * Math.max(0, (ctx.floors ?? 10) - 1))
    case 'evcharge': return (Math.floor(t / 1800) + seed) % 3 === 0 ? (seed % 2 ? 22 : 7) : 0
    case 'occupancy': return (daily(now) > 0.2 && noise(eq.id + Math.floor(t / 600)) > -0.3) ? 1 : 0
    default: return rd.base + rd.amp * Math.sin((2 * Math.PI * t) / (1800 + (seed % 5400)) + phase) + n
  }
}

/** Current state of one equipment item.
 *  status: online | warning | alarm | fault | offline. alerts: conditions that should raise an alarm. */
export function simulate(eq, ctx = {}, now = Date.now()) {
  const def = equipmentDef[eq.type]
  if (!def) return { status: 'offline', values: {}, alerts: [] }
  const epoch = Math.floor(now / 600000), h = hash(`${eq.id}:${epoch}`) // faults/outages come and go every 10 minutes
  const values = Object.fromEntries(def.readings.map((rd) => [rd.key, round(readingValue(rd, eq, ctx, now), rd.dec ?? 1)]))
  const alerts = []
  let status = 'online'
  if (h % 100 === 7) { status = 'offline'; alerts.push({ code: 'offline', severity: 'medium', message: `${eq.tag} lost communication` }) }
  else if (h % 80 === 3) { status = 'fault'; alerts.push({ code: 'fault', severity: def.safety ? 'critical' : 'high', message: `${eq.tag} reports a fault` }) }
  if (status !== 'offline') for (const rd of def.readings) {
    const v = values[rd.key], crit = (rd.crit !== undefined && v >= rd.crit) || (rd.lowCrit !== undefined && v <= rd.lowCrit)
    const warn = (rd.warn !== undefined && v >= rd.warn) || (rd.lowWarn !== undefined && v <= rd.lowWarn)
    if (crit) { alerts.push({ code: `crit:${rd.key}`, severity: def.module === 'fire' || def.module === 'water' ? 'critical' : 'high', message: `${eq.tag}: ${rd.label} ${v}${rd.unit ? ' ' + rd.unit : ''} is beyond the critical limit` }); if (status === 'online' || status === 'warning') status = 'alarm' }
    else if (warn) { alerts.push({ code: `warn:${rd.key}`, severity: 'medium', message: `${eq.tag}: ${rd.label} ${v}${rd.unit ? ' ' + rd.unit : ''} is outside the normal range` }); if (status === 'online') status = 'warning' }
  }
  if (status === 'offline') for (const k of Object.keys(values)) values[k] = null
  return { status, values, alerts }
}

/** Simulated trend for charts: `points` samples across the last `hours` hours (ignores faults). */
export function history(eq, ctx, hours = 24, points = 48, now = Date.now()) {
  const def = equipmentDef[eq.type]
  if (!def) return {}
  const step = (hours * 3600000) / points
  return Object.fromEntries(def.readings.map((rd) => [rd.key, Array.from({ length: points }, (_, i) => { const t = now - (points - 1 - i) * step; return { t, v: round(readingValue(rd, eq, ctx, t), rd.dec ?? 1) } })]))
}

/** One reading at an arbitrary time (used for energy totals; ignores faults). */
export function valueAt(eq, ctx, key, now) {
  const rd = equipmentDef[eq.type]?.readings.find((x) => x.key === key)
  return rd ? readingValue(rd, eq, ctx, now) : 0
}

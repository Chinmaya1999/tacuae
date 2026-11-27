import crypto from 'node:crypto'
import * as M from '../models/bms.model.js'
import { toObjectId } from '../config/database.js'
import { EQUIPMENT, MODULES, equipmentDef, LIMITS } from '../constants/bms.js'
import { defaultEquipment, levelName } from './bms.layout.js'
import { history as simHistory, simulate, valueAt } from './bms.simulation.js'
import ApiError from '../utils/ApiError.js'

const sid = (x) => String(x)
const projectOut = (p, stats) => ({ id: sid(p._id), name: p.name, location: p.location, type: p.type, towers: p.towers, createdAt: p.createdAt, updatedAt: p.updatedAt, simulated: true, ...(stats ? { stats } : {}) })
const equipmentOut = (e) => ({ id: sid(e._id), towerId: e.towerId, level: e.level, type: e.type, tag: e.tag, name: e.name, x: e.x, y: e.y })
const alarmOut = (a, projectName) => ({ id: sid(a._id), projectId: sid(a.projectId), ...(projectName ? { projectName } : {}), equipmentId: sid(a.equipmentId), tag: a.tag, module: a.module, towerId: a.towerId, level: a.level, severity: a.severity, code: a.code, message: a.message, state: a.state, raisedAt: a.raisedAt, ackBy: a.ackBy || null, ackAt: a.ackAt || null, resolvedAt: a.resolvedAt || null, note: a.note || '' })

export const catalog = () => ({ modules: MODULES, equipment: EQUIPMENT, limits: LIMITS, simulated: true })

/** Loads a project the user may access (owner, or any project for admins). */
export async function loadProject(user, id) {
  const _id = toObjectId(id)
  const p = _id && (await M.findProject(_id))
  if (!p || (user.role !== 'admin' && sid(p.ownerId) !== sid(user._id))) throw new ApiError(404, 'Project not found.')
  return p
}
const towerOf = (p, id) => p.towers.find((t) => t.id === id)

function tagger(project, existing = []) {
  const idx = Object.fromEntries(project.towers.map((t, i) => [t.id, i + 1])), counts = new Map()
  for (const e of existing) { const k = `${e.towerId}:${e.type}`; counts.set(k, (counts.get(k) || 0) + 1) }
  return (towerId, type) => {
    const k = `${towerId}:${type}`, n = (counts.get(k) || 0) + 1
    counts.set(k, n)
    return `${equipmentDef[type].code}-T${idx[towerId]}-${String(n).padStart(2, '0')}`
  }
}

export async function createProject(user, data) {
  if ((await M.countProjects(user._id)) >= 50) throw new ApiError(400, 'Project limit reached.')
  const now = new Date().toISOString()
  const towers = data.towers.map((t) => ({ id: crypto.randomUUID().slice(0, 8), ...t }))
  const p = await M.insertProject({ ownerId: user._id, name: data.name, location: data.location, type: data.type, towers, createdAt: now, updatedAt: now })
  if (data.autoPlace) {
    const tag = tagger(p), docs = defaultEquipment(p).map((e) => ({ ...e, projectId: p._id, ownerId: user._id, tag: tag(e.towerId, e.type), name: equipmentDef[e.type].name, createdAt: now }))
    if (docs.length) await M.insertEquipment(docs)
  }
  return projectOut(p)
}
export async function getProject(user, id) { return projectOut(await loadProject(user, id)) }
export async function deleteProject(user, id) { await M.removeProject((await loadProject(user, id))._id) }

// ---- equipment ----
export async function listEquipment(user, id) { const p = await loadProject(user, id); return (await M.listEquipment(p._id)).map(equipmentOut) }
function checkPlacement(p, d) {
  const t = towerOf(p, d.towerId)
  if (!t) throw new ApiError(400, 'Unknown tower.')
  if (d.level < -t.basements || d.level > t.floors) throw new ApiError(400, `Level must be between B${t.basements} and the roof (${t.floors}).`)
}
export async function addEquipment(user, id, d) {
  const p = await loadProject(user, id)
  checkPlacement(p, d)
  const existing = await M.listEquipment(p._id)
  if (existing.length >= LIMITS.equipmentPerProject) throw new ApiError(400, 'Equipment limit reached for this project.')
  const [doc] = await M.insertEquipment([{ projectId: p._id, ownerId: p.ownerId, towerId: d.towerId, level: d.level, type: d.type, tag: tagger(p, existing)(d.towerId, d.type), name: d.name || equipmentDef[d.type].name, x: d.x, y: d.y, createdAt: new Date().toISOString() }])
  await M.touchProject(p._id)
  return equipmentOut(doc)
}
export async function patchEquipment(user, id, eid, set) {
  const p = await loadProject(user, id), e = await M.findEquipment(p._id, toObjectId(eid))
  if (!e) throw new ApiError(404, 'Equipment not found.')
  if (set.level !== undefined) checkPlacement(p, { towerId: e.towerId, level: set.level })
  await M.updateEquipment(e._id, set)
  return equipmentOut({ ...e, ...set })
}
export async function removeEquipment(user, id, eid) {
  const p = await loadProject(user, id), e = await M.findEquipment(p._id, toObjectId(eid))
  if (!e) throw new ApiError(404, 'Equipment not found.')
  await M.removeEquipment(e._id)
}

// ---- live (simulated) ----
const avg = (a) => (a.length ? Math.round((a.reduce((x, y) => x + y, 0) / a.length) * 10) / 10 : null)
function moduleKpi(mod, rows) {
  const ok = (r) => r.sim.status === 'online' || r.sim.status === 'warning'
  const prim = (r) => r.sim.values[equipmentDef[r.eq.type].readings.find((x) => x.primary)?.key ?? '']
  const of = (...types) => rows.filter((r) => types.includes(r.eq.type))
  const nums = (rs) => rs.map(prim).filter((v) => typeof v === 'number')
  switch (mod) {
    case 'power': return { label: 'Building load', value: Math.round(nums(of('lt-panel')).reduce((a, b) => a + b, 0)), unit: 'kW' }
    case 'hvac': return { label: 'Avg room temp', value: avg(nums(of('fcu', 'vrf', 'temp-sensor'))), unit: '°C' }
    case 'access': return { label: 'Entries / hour', value: Math.round(nums(of('access-door')).reduce((a, b) => a + b, 0)), unit: '' }
    case 'pumping': return { label: 'Pumps available', value: `${of('pump').filter(ok).length}/${of('pump').length}`, unit: '' }
    case 'elevator': return { label: 'Lifts available', value: `${of('elevator').filter(ok).length}/${of('elevator').length}`, unit: '' }
    case 'lighting': return { label: 'Avg dim level', value: avg(nums(of('lighting-zone'))), unit: '%' }
    case 'security': return { label: 'Cameras online', value: `${of('cctv').filter(ok).length}/${of('cctv').length}`, unit: '' }
    case 'fire': return { label: 'Detectors normal', value: `${of('smoke-detector').filter((r) => r.sim.status === 'online').length}/${of('smoke-detector').length}`, unit: '' }
    case 'water': return { label: 'Avg tank level', value: avg(nums(of('tank'))), unit: '%' }
    case 'parking': return { label: 'Occupancy', value: avg(nums(of('parking-counter'))), unit: '%' }
    default: return null
  }
}

/** Simulated state of every equipment item + summary. With persist=true, newly triggered alarms are stored. */
export async function live(user, id, { persist = true, preloaded } = {}) {
  const p = preloaded?.project ?? (await loadProject(user, id)), eqs = preloaded?.equipment ?? (await M.listEquipment(p._id)), now = Date.now()
  const floors = Object.fromEntries(p.towers.map((t) => [t.id, t.floors]))
  const rows = eqs.map((e) => ({ eq: { ...e, id: sid(e._id) }, sim: simulate({ ...e, id: sid(e._id) }, { floors: floors[e.towerId] }, now) }))
  const rawById = new Map(eqs.map((e) => [sid(e._id), e]))

  if (persist) {
    const open = await M.openAlarmKeys(p._id), fresh = []
    for (const { eq, sim } of rows) for (const a of sim.alerts) {
      const key = `${eq.id}:${a.code}`
      if (open.has(key)) continue
      open.add(key)
      fresh.push({ projectId: p._id, ownerId: p.ownerId, equipmentId: rawById.get(eq.id)._id, tag: eq.tag, module: equipmentDef[eq.type].module, towerId: eq.towerId, level: eq.level, severity: a.severity, code: a.code, message: a.message, state: 'active', raisedAt: new Date(now).toISOString() })
    }
    await M.insertAlarms(fresh)
  }

  const totals = { total: rows.length, online: 0, warning: 0, alarm: 0, fault: 0, offline: 0 }
  const items = {}, byModule = Object.fromEntries(MODULES.map((m) => [m.id, { total: 0, online: 0, warning: 0, alarm: 0, fault: 0, offline: 0 }]))
  for (const { eq, sim } of rows) {
    items[eq.id] = { status: sim.status, values: sim.values }
    totals[sim.status]++; const m = byModule[equipmentDef[eq.type].module]; m.total++; m[sim.status]++
  }
  for (const m of MODULES) byModule[m.id].kpi = moduleKpi(m.id, rows.filter((r) => equipmentDef[r.eq.type].module === m.id))

  // energy: load now, solar now, kWh since local midnight (from the simulated LT-panel profile)
  const panels = rows.filter((r) => r.eq.type === 'lt-panel').map((r) => r.eq)
  const midnight = new Date(now); midnight.setUTCHours(-4, 0, 0, 0); if (midnight.getTime() > now) midnight.setUTCDate(midnight.getUTCDate() - 1)
  let todayKwh = 0
  for (let t = midnight.getTime(); t < now; t += 900000) for (const e of panels) todayKwh += valueAt(e, {}, 'kw', t) * 0.25
  const sum = (type) => Math.round(rows.filter((r) => r.eq.type === type).reduce((a, r) => a + (r.sim.values[equipmentDef[type].readings[0].key] ?? 0), 0))
  return { ts: now, simulated: true, items, totals, byModule, energy: { loadKw: sum('lt-panel'), solarKw: sum('solar-inverter'), todayKwh: Math.round(todayKwh) } }
}

export async function history(user, id, eid, hours) {
  const p = await loadProject(user, id), e = await M.findEquipment(p._id, toObjectId(eid))
  if (!e) throw new ApiError(404, 'Equipment not found.')
  const floors = p.towers.find((t) => t.id === e.towerId)?.floors
  return { simulated: true, hours, series: simHistory({ ...e, id: sid(e._id) }, { floors }, hours) }
}

// ---- alarms ----
/** 'open' = not yet resolved (active + acknowledged). */
const stateQuery = (state) => (state === 'open' ? { state: { $in: ['active', 'acknowledged'] } } : ['active', 'acknowledged', 'resolved'].includes(state) ? { state } : {})
export async function listAlarms(user, id, state) {
  const p = await loadProject(user, id)
  return (await M.listAlarms({ projectId: p._id, ...stateQuery(state) })).map((a) => alarmOut(a))
}
export async function globalAlarms(user, state) {
  const projects = await M.listProjects(user.role === 'admin' ? null : user._id), name = Object.fromEntries(projects.map((p) => [sid(p._id), p.name]))
  const q = { projectId: { $in: projects.map((p) => p._id) }, ...(state ? stateQuery(state) : { state: { $in: ['active', 'acknowledged'] } }) }
  return (await M.listAlarms(q)).map((a) => alarmOut(a, name[sid(a.projectId)]))
}
async function ownedAlarm(user, id, aid) {
  const p = await loadProject(user, id), a = await M.findAlarm(p._id, toObjectId(aid))
  if (!a) throw new ApiError(404, 'Alarm not found.')
  return a
}
export async function acknowledge(user, id, aid) {
  const a = await ownedAlarm(user, id, aid)
  if (a.state !== 'active') throw new ApiError(409, `This alarm is already ${a.state}.`)
  const set = { state: 'acknowledged', ackBy: user.email, ackAt: new Date().toISOString() }
  await M.updateAlarm(a._id, set); return alarmOut({ ...a, ...set })
}
export async function resolve(user, id, aid, note) {
  const a = await ownedAlarm(user, id, aid)
  if (a.state === 'resolved') throw new ApiError(409, 'This alarm is already resolved.')
  const set = { state: 'resolved', resolvedAt: new Date().toISOString(), resolvedBy: user.email, note, ...(a.ackAt ? {} : { ackBy: user.email, ackAt: new Date().toISOString() }) }
  await M.updateAlarm(a._id, set); return alarmOut({ ...a, ...set })
}

// ---- overview (all of a builder's projects) ----
export async function overview(user) {
  const projects = await M.listProjects(user.role === 'admin' ? null : user._id)
  const counts = await M.equipmentCounts(projects.map((p) => p._id))
  const out = []
  for (const p of projects) {
    const eqs = counts[sid(p._id)] ? await M.listEquipment(p._id) : []
    const lv = await live(user, null, { persist: false, preloaded: { project: p, equipment: eqs } })
    out.push(projectOut(p, { towers: p.towers.length, floors: p.towers.reduce((n, t) => n + t.floors, 0), units: p.towers.reduce((n, t) => n + t.floors * t.unitsPerFloor, 0), equipment: eqs.length, online: lv.totals.online + lv.totals.warning, issues: lv.totals.alarm + lv.totals.fault, offline: lv.totals.offline, loadKw: lv.energy.loadKw, todayKwh: lv.energy.todayKwh }))
  }
  const alarms = await globalAlarms(user, 'active')
  return { simulated: true, projects: out, alarms: alarms.slice(0, 8), activeAlarms: (await globalAlarms(user)).length }
}
export { levelName }

import { ANY_ROOM, CATEGORY_IDS, CONNECTIVITY, CONTROL_IDS, EMIRATES, HOME_TYPES, LEVEL_IDS, LIMITS, PROJECT_TYPES, PROPERTY_SCOPE } from '../constants/pricing.js'
import { ROOM_TYPES } from '../constants/index.js'
import { clean, multiline, num } from '../utils/sanitize.js'
import ApiError from '../utils/ApiError.js'

const bad = (m) => new ApiError(400, m)
const PID = /^[a-z0-9-]{1,40}$/
const one = (v, list, d) => (list.includes(v) ? v : d)
const arr = (v, max) => (Array.isArray(v) ? v.slice(0, max) : [])

/** Quantities and rates entered by staff or customers are rejected (not silently clamped) when invalid. */
function strict(v, lo, hi, label, { integer = false } = {}) {
  const n = typeof v === 'number' || (typeof v === 'string' && v.trim()) ? Number(v) : NaN
  if (!Number.isFinite(n) || n < lo || n > hi || (integer && !Number.isInteger(n))) throw bad(`${label} must be ${integer ? 'a whole number' : 'a number'} between ${lo} and ${hi}.`)
  return n
}

function cleanLevels(v) {
  const out = {}
  for (const c of CATEGORY_IDS) if (LEVEL_IDS.includes(v?.[c])) out[c] = v[c]
  return out
}
function cleanRooms(v, max) {
  const seen = new Set()
  return arr(v, max).map((r, i) => {
    let id = clean(r?.id, 40) || `room-${i}`
    while (seen.has(id) || id === PROPERTY_SCOPE) id = `${id}-${i}`
    seen.add(id)
    const adjustments = {}
    for (const [k, d] of Object.entries(r?.adjustments || {}).slice(0, 40)) if (PID.test(k)) { const n = strict(d, -50, 50, 'Device change', { integer: true }); if (n) adjustments[k] = n }
    return { id, type: one(r?.type, ROOM_TYPES, 'other'), name: clean(r?.name, 60) || 'Room', adjustments }
  })
}
const unitConfig = (c, maxRooms) => ({ rooms: cleanRooms(c?.rooms, maxRooms), levels: cleanLevels(c?.levels), control: one(c?.control, CONTROL_IDS, '') })

export function cleanHome(b = {}) {
  return {
    ...unitConfig(b, LIMITS.rooms),
    homeType: one(b.homeType, HOME_TYPES, 'apartment-2'),
    areaSqft: num(b.areaSqft, 0, 200000, 0),
    build: one(b.build, ['new', 'retrofit'], 'new'),
    connectivity: one(b.connectivity, CONNECTIVITY, 'wired'),
    emirate: one(b.emirate, EMIRATES, ''), community: clean(b.community, 100), timeline: clean(b.timeline, 60),
    amc: Boolean(b.amc),
  }
}

export function cleanProject(b = {}) {
  const unitTypes = arr(b.unitTypes, LIMITS.unitTypes).map((t, i) => ({
    id: clean(t?.id, 40) || `unit-${i}`, name: clean(t?.name, 60) || `Unit type ${i + 1}`,
    quantity: strict(t?.quantity, 1, LIMITS.unitsPerProject, 'Unit quantity', { integer: true }),
    areaSqft: num(t?.areaSqft, 0, 200000, 0), phase: clean(t?.phase, 40),
    config: unitConfig(t?.config, LIMITS.roomsPerUnit),
  }))
  if (unitTypes.reduce((n, t) => n + t.quantity, 0) > LIMITS.unitsPerProject) throw bad(`A project can have at most ${LIMITS.unitsPerProject} units.`)
  const common = new Map()
  for (const c of arr(b.common, LIMITS.commonItems)) if (PID.test(String(c?.productId))) common.set(c.productId, (common.get(c.productId) || 0) + strict(c.qty, 1, 10000, 'Common-area quantity', { integer: true }))
  const p = b.project || {}
  return {
    project: { name: clean(p.name, 100), type: one(p.type, PROJECT_TYPES, 'residential-tower'), location: clean(p.location, 150), stage: clean(p.stage, 60), handover: /^\d{4}-\d{2}-\d{2}$/.test(p.handover) ? p.handover : '', buildingSystems: multiline(p.buildingSystems, 1500) },
    connectivity: one(b.connectivity, CONNECTIVITY, 'wired'), unitTypes, amc: Boolean(b.amc),
    common: [...common].map(([productId, qty]) => ({ productId, qty })),
  }
}
export const cleanInput = (kind, b) => (kind === 'project' ? cleanProject(b) : cleanHome(b))

export function validateEstimate({ body: b = {} }) {
  const kind = one(b.kind, ['home', 'project'], 'home')
  return { kind, input: cleanInput(kind, b.input) }
}
export function validateCompare({ body: b = {} }) {
  const scenarios = arr(b.scenarios, LIMITS.scenarios).map((s, i) => ({ name: clean(s?.name, 40) || `Scenario ${i + 1}`, level: one(s?.level, LEVEL_IDS, ''), connectivity: one(s?.connectivity, CONNECTIVITY, '') }))
  if (!scenarios.length) throw bad('Add at least one scenario.')
  return { input: cleanProject(b.input), scenarios }
}

export function validateSettings({ body: b = {} }) {
  const s = {}
  const rate = (k, hi, label) => { if (b[k] !== undefined) s[k] = strict(b[k], 0, hi, label) }
  rate('programmingPerDevice', 100000, 'Programming rate'); rate('commissioningPerUnit', 1e6, 'Commissioning rate')
  rate('amcPct', 100, 'AMC %'); rate('salesDiscountLimitPct', 100, 'Sales discount limit'); rate('maxDiscountPct', 100, 'Maximum discount')
  if (b.validityDays !== undefined) s.validityDays = strict(b.validityDays, 1, 365, 'Validity days', { integer: true })
  if (b.cablingPct !== undefined) s.cablingPct = Object.fromEntries(CONNECTIVITY.map((c) => [c, strict(b.cablingPct?.[c] ?? 0, 0, 100, 'Cabling %')]))
  if (b.marginPct !== undefined) s.marginPct = Object.fromEntries(['retail', 'trade', 'partner'].map((c) => [c, strict(b.marginPct?.[c] ?? 0, 0, 500, 'Margin %')]))
  if (b.volumeTiers !== undefined) {
    s.volumeTiers = arr(b.volumeTiers, 12).map((t) => ({ minUnits: strict(t?.minUnits, 1, LIMITS.unitsPerProject, 'Tier units', { integer: true }), discountPct: strict(t?.discountPct, 0, 100, 'Tier discount') })).sort((a, z) => a.minUnits - z.minUnits)
    if (new Set(s.volumeTiers.map((t) => t.minUnits)).size !== s.volumeTiers.length) throw bad('Two volume tiers start at the same unit count.')
  }
  if (b.publicEstimates !== undefined) s.publicEstimates = b.publicEstimates === true
  if (b.trn !== undefined) { s.trn = clean(b.trn, 15); if (s.trn && !/^\d{15}$/.test(s.trn)) throw bad('A UAE TRN has 15 digits.') }
  if (b.terms !== undefined) s.terms = multiline(b.terms, 3000)
  if (b.exclusions !== undefined) s.exclusions = multiline(b.exclusions, 3000)
  if (b.fx !== undefined) {
    const fx = (v, l) => (v === null || v === '' || v === undefined ? null : strict(v, 0.000001, 1000, l))
    s.fx = { USD: fx(b.fx?.USD, 'USD rate'), EUR: fx(b.fx?.EUR, 'EUR rate'), asOf: clean(b.fx?.asOf, 40) }
  }
  rate('depositPct', 100, 'Deposit %')
  if (b.smart !== undefined) s.smart = {
    kwhPerSqft: strict(b.smart?.kwhPerSqft, 0, 20, 'kWh per sq ft'), tariff: strict(b.smart?.tariff, 0, 10, 'Electricity tariff'),
    saving: Object.fromEntries(['lighting', 'climate', 'curtains', 'energy'].map((c) => [c, strict(b.smart?.saving?.[c] ?? 0, 0, 25, 'Saving %')])),
  }
  for (const k of ['popularLevel', 'bestValueLevel']) if (b[k] !== undefined) s[k] = one(b[k], LEVEL_IDS, '')
  return s
}

export function validateRule({ body: b = {} }) {
  const roomType = one(b.roomType, [ANY_ROOM, PROPERTY_SCOPE, ...ROOM_TYPES], null)
  const category = one(b.category, [...CATEGORY_IDS, 'controls'], null)
  if (!roomType || !category) throw bad('Choose a room type and a category.')
  const level = one(b.level, category === 'controls' ? CONTROL_IDS : LEVEL_IDS, null)
  if (!level) throw bad('Choose a package level.')
  if (category === 'controls' && roomType !== PROPERTY_SCOPE) throw bad('Control rules apply to the whole home.')
  const items = new Map()
  for (const i of arr(b.items, 30)) {
    if (!PID.test(String(i?.productId))) throw bad('Choose a product for every row.')
    if (items.has(i.productId)) throw bad('A product is listed twice in this rule.')
    items.set(i.productId, strict(i.qty, 1, 100, 'Quantity', { integer: true }))
  }
  return { roomType, category, level, items: [...items].map(([productId, qty]) => ({ productId, qty })) }
}
export function validateRuleKey({ query: q = {} }) {
  const key = String(q.key ?? '')
  if (!/^[a-z*-]{1,20}:[a-z]{1,20}:[a-z]{1,20}$/.test(key)) throw bad('Invalid rule.')
  return { key }
}

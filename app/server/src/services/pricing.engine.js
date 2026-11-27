// THE pricing engine: pure functions, no database, no clock. Every configurator and quotation prices through here.
// All money is an integer number of fils (1 AED = 100 fils), so totals never drift.
//
//   configuration + rules      → quantities (bill of materials)
//   quantities + price list    → lines
//   lines + charges + discount → totals
//
// Totals are recomputed from the stored lines, so a discount or quantity change on an issued quotation
// never re-reads today's catalogue.
import { ANY_ROOM, PROPERTY_SCOPE } from '../constants/pricing.js'

export const toFils = (aed) => Math.round((Number(aed) || 0) * 100)
const pct = (fils, p) => Math.round((fils * (Number(p) || 0)) / 100)
const add = (map, key, qty) => map.set(key, (map.get(key) || 0) + qty)

/** A specific room rule beats the "any room" rule for the same category and level. */
export function findRule(rules, roomType, category, level) {
  const match = (rt) => rules.find((r) => r.roomType === rt && r.category === category && r.level === level)
  return match(roomType) || (roomType === PROPERTY_SCOPE ? undefined : match(ANY_ROOM))
}

/**
 * Quantities for ONE home / unit.
 * @param config { rooms:[{id,type,name,adjustments:{productId:delta}}], levels:{category:level}, control }
 */
export function resolveUnit(config, rules) {
  const rooms = [], matched = new Set(), selected = Object.entries(config.levels || {}).filter(([, l]) => l)
  const apply = (qty, rule) => { if (rule) for (const i of rule.items) add(qty, i.productId, i.qty) }

  for (const room of config.rooms || []) {
    const qty = new Map()
    for (const [category, level] of selected) {
      const rule = findRule(rules, room.type, category, level)
      if (rule) matched.add(category)
      apply(qty, rule)
    }
    for (const [productId, delta] of Object.entries(room.adjustments || {})) add(qty, productId, delta)
    rooms.push({ id: room.id, name: room.name, type: room.type, items: [...qty].filter(([, q]) => q > 0).map(([productId, q]) => ({ productId, qty: q })) })
  }

  const whole = new Map()
  for (const [category, level] of selected) {
    const rule = findRule(rules, PROPERTY_SCOPE, category, level)
    if (rule) matched.add(category)
    apply(whole, rule)
  }
  if (config.control) apply(whole, findRule(rules, PROPERTY_SCOPE, 'controls', config.control))
  if (whole.size) rooms.push({ id: PROPERTY_SCOPE, name: 'Whole home', type: PROPERTY_SCOPE, items: [...whole].map(([productId, qty]) => ({ productId, qty })) })

  // a chosen category that no rule covers must be reported, never silently priced at zero
  return { rooms, unmapped: selected.map(([c]) => c).filter((c) => !matched.has(c)) }
}

/** Unit prices (fils) of a product for a customer segment, margin included. Missing segment price → retail. */
export function unitPrices(product, segment, settings) {
  const list = segment !== 'retail' && product.prices?.[segment] > 0 ? product.prices[segment] : product.unitPrice
  const margin = settings.marginPct?.[segment] || 0
  const withMargin = (f) => f + pct(f, margin)
  return { unit: withMargin(toFils(list)), accessory: withMargin(toFils(product.accessoryPrice)), install: toFils(product.installPrice) }
}

/** Turns a productId→qty map into priced lines, one per product (no duplicates). */
export function priceLines(quantities, products, segment, settings, connectivity) {
  const byId = new Map(products.map((p) => [p.id, p]))
  const lines = [], unpriced = [], incompatible = []
  for (const [productId, qty] of quantities) {
    if (!(qty > 0)) continue
    const p = byId.get(productId)
    if (!p || p.active === false) { unpriced.push(p?.name || productId); continue }
    const u = unitPrices(p, segment, settings)
    if (!(u.unit > 0)) unpriced.push(p.name)
    if (connectivity && p.connectivity?.length && !p.connectivity.includes(connectivity)) incompatible.push(p.name)
    lines.push({ productId, name: p.name, group: p.group, qty, unit: u.unit, accessory: u.accessory, install: u.install })
  }
  lines.sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name))
  return { lines, unpriced, incompatible }
}

export const tierDiscountPct = (tiers, units) => (tiers || []).filter((t) => units >= t.minUnits).reduce((best, t) => Math.max(best, t.discountPct), 0)

/**
 * @param charges the rate snapshot stored with the quotation:
 *   { vatRate, cablingPct, programmingPerDevice (AED), commissioningPerUnit (AED), amcPct, volumeDiscountPct, units }
 */
export function totals(lines, charges, discountPct = 0, includeAmc = false) {
  const sum = (f) => lines.reduce((n, l) => n + f(l) * l.qty, 0)
  const deviceCount = lines.reduce((n, l) => n + l.qty, 0)
  const devices = sum((l) => l.unit), accessories = sum((l) => l.accessory), installation = sum((l) => l.install)
  const cabling = pct(devices + accessories, charges.cablingPct)
  const programming = toFils(charges.programmingPerDevice) * deviceCount
  const commissioning = toFils(charges.commissioningPerUnit) * (deviceCount ? charges.units || 1 : 0)
  const subtotal = devices + accessories + cabling + installation + programming + commissioning
  const volumeDiscount = pct(subtotal, charges.volumeDiscountPct)
  const discount = pct(subtotal - volumeDiscount, Math.min(100, Math.max(0, discountPct)))
  const amc = includeAmc ? pct(devices, charges.amcPct) : 0
  const taxable = subtotal - volumeDiscount - discount + amc
  const vat = Math.round(taxable * charges.vatRate)
  return { deviceCount, devices, accessories, cabling, installation, programming, commissioning, subtotal, volumeDiscountPct: charges.volumeDiscountPct || 0, volumeDiscount, discountPct, discount, amc, taxable, vat, total: taxable + vat }
}

const chargesFor = (settings, connectivity, units) => ({
  vatRate: settings.vatRate,
  cablingPct: settings.cablingPct?.[connectivity] || 0,
  programmingPerDevice: settings.programmingPerDevice || 0,
  commissioningPerUnit: settings.commissioningPerUnit || 0,
  amcPct: settings.amcPct || 0,
  volumeDiscountPct: tierDiscountPct(settings.volumeTiers, units),
  units,
})
const unique = (a) => [...new Set(a)]

/** Quote for one home (B2C). */
export function priceHome(input, { products, rules, settings, segment = 'retail' }) {
  const { rooms, unmapped } = resolveUnit(input, rules)
  const quantities = new Map()
  for (const r of rooms) for (const i of r.items) add(quantities, i.productId, i.qty)
  const { lines, unpriced, incompatible } = priceLines(quantities, products, segment, settings, input.connectivity)
  const charges = chargesFor(settings, input.connectivity, 1)
  return { segment, charges, lines, rooms, totals: totals(lines, charges, 0, input.amc), includeAmc: !!input.amc, warnings: { unmapped, unpriced: unique(unpriced), incompatible: unique(incompatible) } }
}

/**
 * Quote for a project (B2B): each unit template is resolved once and multiplied by its quantity.
 * @param override optional scenario { level, connectivity } applied to every unit type
 */
export function priceProject(input, { products, rules, settings, segment = 'retail' }, override = {}) {
  const connectivity = override.connectivity || input.connectivity
  const quantities = new Map(), unitTypes = [], unmapped = []
  let units = 0, areaSqft = 0
  for (const t of input.unitTypes) {
    const levels = override.level ? Object.fromEntries(Object.keys(t.config.levels).map((c) => [c, override.level])) : t.config.levels
    const r = resolveUnit({ ...t.config, levels }, rules)
    const perUnit = new Map()
    for (const room of r.rooms) for (const i of room.items) add(perUnit, i.productId, i.qty)
    for (const [id, q] of perUnit) add(quantities, id, q * t.quantity)
    unmapped.push(...r.unmapped)
    units += t.quantity; areaSqft += (t.areaSqft || 0) * t.quantity
    unitTypes.push({ id: t.id, name: t.name, quantity: t.quantity, areaSqft: t.areaSqft || 0, phase: t.phase || '', quantities: [...perUnit] })
  }
  for (const c of input.common || []) add(quantities, c.productId, c.qty)

  const { lines, unpriced, incompatible } = priceLines(quantities, products, segment, settings, connectivity)
  const charges = chargesFor(settings, connectivity, units)
  const total = totals(lines, charges, 0, input.amc)

  // per unit type and per phase figures (before project-level discount and VAT), from the same line prices
  const price = new Map(lines.map((l) => [l.productId, l]))
  const lineSet = (pairs) => pairs.map(([id, qty]) => price.get(id) && { ...price.get(id), qty }).filter(Boolean)
  const types = unitTypes.map(({ quantities: q, ...t }) => {
    const one = totals(lineSet(q), { ...charges, volumeDiscountPct: 0, units: 1 })
    return { ...t, perUnit: one.subtotal, subtotal: one.subtotal * t.quantity }
  })
  const phases = new Map()
  for (const t of types) if (t.phase) add(phases, t.phase, t.subtotal)

  return {
    segment, charges, lines, unitTypes: types, phases: [...phases].map(([name, subtotal]) => ({ name, subtotal })), totals: total, includeAmc: !!input.amc,
    metrics: { units, areaSqft, costPerUnit: units ? Math.round(total.total / units) : 0, costPerSqft: areaSqft ? Math.round(total.total / areaSqft) : null },
    warnings: { unmapped: unique(unmapped), unpriced: unique(unpriced), incompatible: unique(incompatible) },
  }
}

export const compareScenarios = (input, ctx, scenarios) =>
  scenarios.map((s) => ({ name: s.name, level: s.level || '', connectivity: s.connectivity || input.connectivity, pricing: priceProject(input, ctx, s) }))

export const priceInput = (kind, input, ctx) => (kind === 'project' ? priceProject(input, ctx) : priceHome(input, ctx))

/** Sales edits: new quantities on already-snapshotted lines (0 removes). Unit prices never change here. */
export function repriceLines(pricing, quantities = {}, discountPct = 0) {
  const lines = pricing.lines.map((l) => (quantities[l.productId] === undefined ? l : { ...l, qty: quantities[l.productId] })).filter((l) => l.qty > 0)
  // a removed line no longer makes the quotation incomplete
  const removed = new Set(pricing.lines.filter((l) => !lines.some((k) => k.productId === l.productId)).map((l) => l.name))
  const warnings = pricing.warnings && { ...pricing.warnings, unpriced: pricing.warnings.unpriced.filter((n) => !removed.has(n)) }
  return { ...pricing, lines, warnings, totals: totals(lines, pricing.charges, discountPct, pricing.includeAmc) }
}

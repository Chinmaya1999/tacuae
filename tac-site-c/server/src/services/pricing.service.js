// Loads the pricing context for the engine and manages the admin-editable configuration.
import * as Pricing from '../models/pricing.model.js'
import * as Product from '../models/product.model.js'
import { compareScenarios, priceInput, unitPrices } from './pricing.engine.js'
import { mongoEnabled } from '../config/database.js'
import { CATEGORIES, CONTROLS, DEFAULT_SETTINGS, EMIRATES, HOME_TYPES, LEVELS, PROJECT_TYPES, STARTER_RULES } from '../constants/pricing.js'
import { smartScore } from './smart.service.js'
import { billingUser } from './team.service.js'
import ApiError from '../utils/ApiError.js'

export const ruleKey = (r) => `${r.roomType}:${r.category}:${r.level}`

/** First run only: default settings and starter rules. Existing configuration is never overwritten. */
export async function ensurePricing() {
  if (!mongoEnabled) return 0
  await Pricing.insertSettingsIfMissing({ ...DEFAULT_SETTINGS, updatedAt: new Date().toISOString() })
  if ((await Pricing.countRules()) > 0) return 0
  await Pricing.insertRules(STARTER_RULES.map((r) => ({ ...r, key: ruleKey(r), starter: true })))
  return STARTER_RULES.length
}

export async function getSettings() {
  const { _id, ...s } = (await Pricing.getSettings()) || {}
  return { ...DEFAULT_SETTINGS, ...s }
}

export async function context(segment = 'retail') {
  const [products, rules, settings] = await Promise.all([Product.listAll(), Pricing.listRules(), getSettings()])
  return { products, rules, settings, segment }
}

/** Trade and partner price lists unlock only for verified business accounts. */
export const segmentFor = (user) => (user?.role === 'builder' && user.verified && ['trade', 'partner'].includes(user.priceTier) ? user.priceTier : 'retail')
export const canSeePrices = (user, settings) => Boolean(user) || settings.publicEstimates === true

/** Removes every amount from a pricing result, keeping the bill of quantities. */
export function withoutPrices(p) {
  const { totals, charges, metrics, phases, unitTypes, ...rest } = p
  return {
    ...rest, hidden: true,
    lines: p.lines.map(({ productId, name, group, qty }) => ({ productId, name, group, qty })),
    ...(metrics ? { metrics: { units: metrics.units, areaSqft: metrics.areaSqft } } : {}),
    ...(unitTypes ? { unitTypes: unitTypes.map(({ perUnit, subtotal, ...t }) => t) } : {}),
  }
}

export async function estimate(user, kind, input) {
  const ctx = await context(segmentFor(await billingUser(user)))
  const result = priceInput(kind, input, ctx)
  return { pricing: canSeePrices(user, ctx.settings) ? result : withoutPrices(result), smart: kind === 'home' ? smartScore(input, ctx.settings.smart) : null, currency: 'AED', fx: ctx.settings.fx }
}

export async function compare(user, input, scenarios) {
  const ctx = await context(segmentFor(await billingUser(user)))
  const show = canSeePrices(user, ctx.settings)
  return compareScenarios(input, ctx, scenarios).map((s) => (show ? s : { ...s, pricing: withoutPrices(s.pricing) }))
}

/** Everything the configurators need to draw their questions. No cost data. */
export async function options(user) {
  const ctx = await context(segmentFor(await billingUser(user)))
  const show = canSeePrices(user, ctx.settings)
  const name = new Map(ctx.products.map((p) => [p.id, p.name]))
  return {
    categories: CATEGORIES, levels: LEVELS, controls: CONTROLS, homeTypes: HOME_TYPES, projectTypes: PROJECT_TYPES, emirates: EMIRATES,
    tags: { popular: ctx.settings.popularLevel, bestValue: ctx.settings.bestValueLevel },
    pricesVisible: show, amcAvailable: ctx.settings.amcPct > 0,
    // "what changes" per package, generated from the live rules so it is never out of date
    includes: ctx.rules.map((r) => ({ roomType: r.roomType, category: r.category, level: r.level, items: r.items.map((i) => ({ name: name.get(i.productId) || i.productId, qty: i.qty })) })),
    products: ctx.products.filter((p) => p.active !== false).map((p) => ({ id: p.id, name: p.name, group: p.group, ...(show ? { price: unitPrices(p, ctx.segment, ctx.settings).unit } : {}) })),
  }
}

// ---------- admin ----------
export async function adminOverview() {
  const [settings, rules, audit] = await Promise.all([getSettings(), Pricing.listRules(), Pricing.listAudit()])
  return { settings, rules, audit }
}
export async function updateSettings(actor, set) {
  const before = await getSettings()
  await Pricing.saveSettings({ ...set, updatedAt: new Date().toISOString() })
  const changed = Object.fromEntries(Object.keys(set).filter((k) => JSON.stringify(before[k]) !== JSON.stringify(set[k])).map((k) => [k, { from: before[k], to: set[k] }]))
  if (Object.keys(changed).length) await Pricing.log(actor, 'pricing.settings', 'settings', changed)
  return getSettings()
}
export async function saveRule(actor, rule) {
  const known = new Set((await Product.listAll()).map((p) => p.id))
  const missing = rule.items.filter((i) => !known.has(i.productId))
  if (missing.length) throw new ApiError(400, `Unknown product: ${missing.map((m) => m.productId).join(', ')}`)
  const key = ruleKey(rule), before = await Pricing.findRule(key)
  await Pricing.upsertRule({ ...rule, key, starter: false, updatedAt: new Date().toISOString() })
  await Pricing.log(actor, before ? 'pricing.rule.update' : 'pricing.rule.create', key, { from: before?.items ?? null, to: rule.items })
}
export async function deleteRule(actor, key) {
  const before = await Pricing.findRule(key)
  if (!before) throw new ApiError(404, 'Rule not found.')
  await Pricing.removeRule(key)
  await Pricing.log(actor, 'pricing.rule.delete', key, { from: before.items })
}

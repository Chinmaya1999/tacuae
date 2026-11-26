// Smart Score (0–100), savings estimate and badges for a home configuration. Pure and ILLUSTRATIVE:
// the weights and savings percentages are assumptions for TAC to approve, never measured energy use.
const FACTOR = { essential: 0.6, comfort: 0.8, luxury: 1 }
const WEIGHT = { lighting: 22, climate: 20, security: 22, curtains: 12, energy: 12, audio: 6, gate: 6 }
const DEFAULT_AREA = 1200

export function smartScore(input, assumptions) {
  const f = (c) => FACTOR[input.levels?.[c]] || 0
  const rooms = input.rooms?.length || 0
  const coverage = Object.entries(WEIGHT).reduce((n, [c, w]) => n + w * f(c), 0)
  const score = rooms ? Math.min(100, Math.round(coverage + (input.control === 'all' ? 4 : input.control ? 2 : 0))) : 0
  const savingPct = Object.entries(assumptions.saving).reduce((n, [c, p]) => n + p * f(c), 0)
  const area = input.areaSqft || DEFAULT_AREA
  const kwh = Math.round(area * assumptions.kwhPerSqft * (savingPct / 100))
  const badges = [
    ['Secure Home', f('security') >= 0.8], ['Energy Saver', f('energy') > 0 && f('climate') > 0],
    ['Cinema Ready', f('audio') > 0 && f('curtains') > 0 && f('lighting') > 0], ['Fully Smart Home', score >= 85],
  ].map(([name, earned]) => ({ name, earned }))
  return { score, badges, kwh, aed: Math.round(kwh * assumptions.tariff), assumptions: { areaSqft: area, areaAssumed: !input.areaSqft, kwhPerSqft: assumptions.kwhPerSqft, tariff: assumptions.tariff, savingPct: Math.round(savingPct * 10) / 10 } }
}

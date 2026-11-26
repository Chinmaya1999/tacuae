// Pricing and quotation vocabulary, plus the STARTER configuration written to MongoDB on first run.
// !! Starter rules are placeholders for TAC to replace in Admin → Pricing. Rates, margins and discounts start at
// !! zero and public (guest) prices start OFF, so nothing unapproved is shown to website visitors.
export const CATEGORIES = [
  { id: 'lighting', label: 'Lighting' }, { id: 'climate', label: 'AC / climate' }, { id: 'curtains', label: 'Curtains & blinds' },
  { id: 'security', label: 'Security & access' }, { id: 'audio', label: 'Audio' }, { id: 'energy', label: 'Energy' }, { id: 'gate', label: 'Gate / garage' },
]
export const LEVELS = [
  { id: 'essential', label: 'Essential' }, { id: 'comfort', label: 'Comfort' }, { id: 'luxury', label: 'Luxury' },
]
export const CONTROLS = [
  { id: 'app', label: 'Mobile app' }, { id: 'voice', label: 'Voice' }, { id: 'panels', label: 'Wall panels' }, { id: 'all', label: 'All controls' },
]
export const CONNECTIVITY = ['wired', 'wireless']
export const SEGMENTS = ['retail', 'trade', 'partner']
export const HOME_TYPES = ['studio', 'apartment-1', 'apartment-2', 'apartment-3', 'apartment-4', 'apartment-5', 'townhouse', 'villa', 'penthouse']
export const PROJECT_TYPES = ['residential-tower', 'villa-community', 'office', 'hotel', 'retail']
export const EMIRATES = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah']
/** Rule room types that apply once per home/unit rather than per room. */
export const PROPERTY_SCOPE = 'property'
export const ANY_ROOM = '*'

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id)
export const LEVEL_IDS = LEVELS.map((c) => c.id)
export const CONTROL_IDS = CONTROLS.map((c) => c.id)

export const LIMITS = { rooms: 25, unitTypes: 20, roomsPerUnit: 15, unitsPerProject: 2000, commonItems: 60, scenarios: 3, quotesPerUser: 300, versions: 50, comments: 200 }

export const QUOTE_STATUS = ['draft', 'shared', 'revision_requested', 'reviewed', 'final', 'accepted', 'survey']

export const DEFAULT_SETTINGS = {
  vatRate: 0.05,
  publicEstimates: false, // guests see prices only after TAC switches this on
  cablingPct: { wired: 0, wireless: 0 }, // % of devices + accessories
  programmingPerDevice: 0, // AED
  commissioningPerUnit: 0, // AED per home / unit
  marginPct: { retail: 0, trade: 0, partner: 0 }, // added to device and accessory prices
  amcPct: 0, // optional annual maintenance, % of devices
  volumeTiers: [], // [{ minUnits, discountPct }]
  salesDiscountLimitPct: 0, // sales users above this need admin approval
  maxDiscountPct: 40,
  validityDays: 30,
  trn: '',
  terms: '', // TAC's approved wording (the indicative / final label is shown separately on every quotation)
  exclusions: '',
  fx: { USD: null, EUR: null, asOf: '' }, // 1 AED = x. Left empty until TAC approves a rate.
  depositPct: 10, // used by the simulated deposit in demo mode
  // Smart Score and savings are ILLUSTRATIVE assumptions for TAC to approve, never measurements
  smart: { kwhPerSqft: 1.1, tariff: 0.38, saving: { lighting: 8, climate: 12, curtains: 4, energy: 5 } },
  popularLevel: '', // package tagged "Most popular" in the configurator ('' = no tag)
  bestValueLevel: '',
}

const rule = (roomType, category, level, items) => ({ roomType, category, level, items: Object.entries(items).map(([productId, qty]) => ({ productId, qty })) })
const tiers = (roomType, category, essential, comfort, luxury) => [rule(roomType, category, 'essential', essential), rule(roomType, category, 'comfort', comfort), rule(roomType, category, 'luxury', luxury)]

export const STARTER_RULES = [
  ...tiers(ANY_ROOM, 'lighting', { 'ceiling-light': 1, 'glass-switch': 1 }, { 'dali-dimming': 1, 'glass-switch': 1, 'motion-sensor': 1 }, { 'dali-dimming': 2, 'rgb-lighting': 1, 'glass-switch': 1, 'motion-sensor': 1 }),
  // The proposal's example: "bedroom + lighting Comfort" = 2 dimmer channels + 1 keypad + 1 sensor
  rule('bedroom', 'lighting', 'comfort', { 'dali-dimming': 2, 'glass-switch': 1, 'motion-sensor': 1 }),
  ...tiers(ANY_ROOM, 'climate', { 'smart-ac': 1 }, { thermostat: 1 }, { thermostat: 1, 'smart-fan': 1 }),
  ...tiers(ANY_ROOM, 'curtains', { 'motor-curtain': 1 }, { 'motor-curtain': 1 }, { 'motor-curtain': 2 }),
  ...tiers(ANY_ROOM, 'audio', {}, { speaker: 1 }, { speaker: 2 }),
  ...tiers(PROPERTY_SCOPE, 'security', { 'door-lock': 1, camera: 1 }, { 'door-lock': 1, camera: 2, alarm: 1 }, { 'door-lock': 1, camera: 4, alarm: 1, 'motion-sensor': 2 }),
  ...tiers(PROPERTY_SCOPE, 'energy', { 'smart-plug': 2 }, { 'energy-meter': 1, 'smart-plug': 2 }, { 'energy-meter': 1, 'smart-plug': 4 }),
  // control preference is stored as category "controls", level = preference
  rule(PROPERTY_SCOPE, 'controls', 'app', { 'cloud-control': 1 }),
  rule(PROPERTY_SCOPE, 'controls', 'voice', { 'cloud-control': 1, 'voice-control': 1 }),
  rule(PROPERTY_SCOPE, 'controls', 'panels', { 'central-panel': 1 }),
  rule(PROPERTY_SCOPE, 'controls', 'all', { 'cloud-control': 1, 'voice-control': 1, 'central-panel': 1 }),
]

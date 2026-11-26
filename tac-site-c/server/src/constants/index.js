export const ROLES = ['customer', 'builder', 'sales', 'admin']
export const SELF_ROLES = ['customer', 'builder'] // roles anyone may sign up as; sales/admin are assigned by an admin
export const PRICE_TIERS = ['retail', 'trade', 'partner']
export const SECTORS = ['developer', 'contractor', 'fit-out', 'consultant', 'interior-design', 'reseller', 'hospitality', 'office', 'facility-management', 'other']
export const ROOM_TYPES = ['master', 'bedroom', 'kids', 'guest', 'bathroom', 'kitchen', 'living', 'drawing', 'dining', 'hall', 'balcony', 'theatre', 'study', 'office', 'garage', 'majlis', 'lobby', 'exterior', 'other']
export const PROPERTY_TYPES = ['apartment', 'villa', 'house', 'duplex', 'office', 'custom']
export const FURNITURE_TYPES = ['bed', 'sofa', 'coffee-table', 'tv-unit', 'wardrobe', 'desk', 'chair', 'dining-table', 'plant', 'rug']
export const VAT_RATE = 0.05
export const CURRENCY = 'AED'
export const DESIGN_STATUS = ['draft', 'submitted', 'quoted', 'accepted', 'rejected']
export const ENQUIRY_STATUS = ['new', 'contacted', 'closed']
export const CONTENT_TYPES = ['products', 'projects']

export const SESSION_COOKIE = 'tac_session'
export const SESSION_MS = 8 * 3600 * 1000
export const CSRF_HEADER = 'x-requested-with'
export const CSRF_VALUE = 'tac-admin'

// MongoDB collections. Prefixed "tac_" because the database may be shared with other apps.
export const COLLECTIONS = { users: 'tac_users', designs: 'tac_designs', products: 'tac_products', projects: 'tac_projects', equipment: 'tac_equipment', alarms: 'tac_alarms', quotes: 'tac_quotes', pricingSettings: 'tac_pricing_settings', pricingRules: 'tac_pricing_rules', audit: 'tac_audit', notifications: 'tac_notifications', outbox: 'tac_outbox', appointments: 'tac_appointments', counters: 'tac_counters' }

export const ROLES = ['customer', 'builder', 'admin']
export const SELF_ROLES = ['customer', 'builder'] // roles anyone may sign up as; admin is seeded only
export const ROOM_TYPES = ['master', 'bedroom', 'kids', 'guest', 'bathroom', 'kitchen', 'living', 'drawing', 'dining', 'hall', 'balcony', 'theatre', 'study', 'office', 'garage', 'other']
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
export const COLLECTIONS = { users: 'tac_users', designs: 'tac_designs', products: 'tac_products' }

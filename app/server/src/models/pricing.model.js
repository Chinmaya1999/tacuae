// Pricing configuration (tac_pricing_settings: one document, tac_pricing_rules) and the audit log (tac_audit).
import { collection } from '../config/database.js'
import { COLLECTIONS } from '../constants/index.js'

const settings = () => collection(COLLECTIONS.pricingSettings)
const rules = () => collection(COLLECTIONS.pricingRules)
const audit = () => collection(COLLECTIONS.audit)
const strip = { projection: { _id: 0 } }

export const getSettings = async () => (await settings()).findOne({ _id: 'current' })
export const saveSettings = async (set) => (await settings()).updateOne({ _id: 'current' }, { $set: set }, { upsert: true })
export const insertSettingsIfMissing = async (doc) => (await settings()).updateOne({ _id: 'current' }, { $setOnInsert: doc }, { upsert: true })

export const listRules = async () => (await rules()).find({}, strip).sort({ category: 1, roomType: 1, level: 1 }).toArray()
export const countRules = async () => (await rules()).countDocuments()
export const insertRules = async (docs) => (await rules()).insertMany(docs)
/** key = roomType:category:level, so there can never be two rules for the same answer. */
export const upsertRule = async (doc) => (await rules()).updateOne({ key: doc.key }, { $set: doc }, { upsert: true })
export const findRule = async (key) => (await rules()).findOne({ key }, strip)
export const removeRule = async (key) => (await rules()).deleteOne({ key })

export const log = async (actor, action, target, detail = null) => (await audit()).insertOne({ at: new Date().toISOString(), by: actor.email, role: actor.role, action, target, detail })
export const listAudit = async (limit = 100) => (await audit()).find({}, strip).sort({ at: -1 }).limit(limit).toArray()

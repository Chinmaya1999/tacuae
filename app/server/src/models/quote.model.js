// Data access for quotations (collection: tac_quotes). Versions and comments are embedded (both are capped).
// `rev` gives optimistic concurrency: a write based on a stale read matches nothing.
import { collection } from '../config/database.js'
import { COLLECTIONS } from '../constants/index.js'

const quotes = () => collection(COLLECTIONS.quotes)
const summary = { projection: { versions: 0, 'pricing.lines': 0, 'pricing.rooms': 0, input: 0 } }

export const findById = async (_id) => (await quotes()).findOne({ _id })
export const findByShareHash = async (shareHash) => (await quotes()).findOne({ shareHash })
export const list = async (query, limit = 300) => (await quotes()).find(query, summary).sort({ updatedAt: -1 }).limit(limit).toArray()
export const countByOwner = async (ownerId) => (await quotes()).countDocuments({ ownerId })
export const insert = async (doc) => { const r = await (await quotes()).insertOne(doc); return { ...doc, _id: r.insertedId } }
export const remove = async (_id) => (await quotes()).deleteOne({ _id })
export const save = async (q, set, push) => (await quotes()).updateOne({ _id: q._id, rev: q.rev }, { $set: set, $inc: { rev: 1 }, ...(push ? { $push: push } : {}) })
export const statusSummary = async () => (await quotes()).aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$pricing.totals.total' } } }]).toArray()

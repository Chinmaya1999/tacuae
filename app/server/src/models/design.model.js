// Data access for saved room designs (collection: tac_designs).
import { collection } from '../config/database.js'
import { COLLECTIONS } from '../constants/index.js'

const designs = () => collection(COLLECTIONS.designs)

export const findById = async (_id) => (await designs()).findOne({ _id })
export const findOwned = async (_id, ownerId) => (await designs()).findOne({ _id, ownerId })
export const listByOwner = async (ownerId, limit = 200) => (await designs()).find({ ownerId }).sort({ updatedAt: -1 }).limit(limit).toArray()
export const countByOwner = async (ownerId) => (await designs()).countDocuments({ ownerId })
export const insert = async (doc) => { const r = await (await designs()).insertOne(doc); return { ...doc, _id: r.insertedId } }
export const setFields = async (_id, set) => (await designs()).updateOne({ _id }, { $set: set })
export const remove = async (_id) => (await designs()).deleteOne({ _id })
export const listWhere = async (query, limit = 500) => (await designs()).find(query).sort({ updatedAt: -1 }).limit(limit).toArray()
export const countsByOwner = async () => Object.fromEntries((await (await designs()).aggregate([{ $group: { _id: '$ownerId', n: { $sum: 1 } } }]).toArray()).map((x) => [String(x._id), x.n]))
export const statusCounts = async () => Object.fromEntries((await (await designs()).aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]).toArray()).map((x) => [x._id, x.n]))

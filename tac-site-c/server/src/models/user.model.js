// Data access for accounts (collection: tac_users). Document shape:
// { _id, name, email, role, company, phone, active, hash, pwChangedAt, createdAt }
import { collection } from '../config/database.js'
import { COLLECTIONS } from '../constants/index.js'

const users = () => collection(COLLECTIONS.users)

export const findById = async (_id) => (await users()).findOne({ _id })
export const findByEmail = async (email) => (await users()).findOne({ email })
export const findAdmin = async () => (await users()).findOne({ role: 'admin' })
export const insert = async (doc) => { const r = await (await users()).insertOne(doc); return { ...doc, _id: r.insertedId } }
export const list = async (limit = 1000) => (await users()).find({}).sort({ createdAt: -1 }).limit(limit).toArray()
export const setFields = async (_id, set) => (await users()).updateOne({ _id }, { $set: set })
export const listStaff = async () => (await users()).find({ role: { $in: ['sales', 'admin'] }, active: { $ne: false } }, { projection: { name: 1, email: 1, role: 1 } }).toArray()
export const listTeam = async (companyOwnerId) => (await users()).find({ companyOwnerId }).sort({ createdAt: 1 }).toArray()
export const findDemo = async (query) => (await users()).findOne({ ...query, demo: true })
export const upsertAdmin = async (email, set, onInsert) => (await users()).updateOne({ email }, { $set: set, $setOnInsert: onInsert }, { upsert: true })
export const roleCounts = async () => Object.fromEntries((await (await users()).aggregate([{ $group: { _id: '$role', n: { $sum: 1 } } }]).toArray()).map((x) => [x._id, x.n]))

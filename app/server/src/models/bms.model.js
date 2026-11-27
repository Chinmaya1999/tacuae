// Data access for the building-management platform (collections: tac_projects, tac_equipment, tac_alarms).
import { collection } from '../config/database.js'
import { COLLECTIONS } from '../constants/index.js'

const projects = () => collection(COLLECTIONS.projects)
const equipment = () => collection(COLLECTIONS.equipment)
const alarms = () => collection(COLLECTIONS.alarms)

// ---- projects ----
export const listProjects = async (ownerId) => (await projects()).find(ownerId ? { ownerId } : {}).sort({ updatedAt: -1 }).limit(200).toArray()
export const countProjects = async (ownerId) => (await projects()).countDocuments({ ownerId })
export const findProject = async (_id) => (await projects()).findOne({ _id })
export const insertProject = async (doc) => { const r = await (await projects()).insertOne(doc); return { ...doc, _id: r.insertedId } }
export const touchProject = async (_id) => (await projects()).updateOne({ _id }, { $set: { updatedAt: new Date().toISOString() } })
export const removeProject = async (_id) => Promise.all([(await projects()).deleteOne({ _id }), (await equipment()).deleteMany({ projectId: _id }), (await alarms()).deleteMany({ projectId: _id })])

// ---- equipment ----
export const listEquipment = async (projectId) => (await equipment()).find({ projectId }).toArray()
export const findEquipment = async (projectId, _id) => (await equipment()).findOne({ projectId, _id })
export const insertEquipment = async (docs) => { const r = await (await equipment()).insertMany(docs); return docs.map((d, i) => ({ ...d, _id: r.insertedIds[i] })) }
export const updateEquipment = async (_id, set) => (await equipment()).updateOne({ _id }, { $set: set })
export const removeEquipment = async (_id) => Promise.all([(await equipment()).deleteOne({ _id }), (await alarms()).deleteMany({ equipmentId: _id })])
export const equipmentCounts = async (ids) => Object.fromEntries((await (await equipment()).aggregate([{ $match: { projectId: { $in: ids } } }, { $group: { _id: '$projectId', n: { $sum: 1 } } }]).toArray()).map((x) => [String(x._id), x.n]))

// ---- alarms ----
export const openAlarmKeys = async (projectId) => new Set((await (await alarms()).find({ projectId, state: { $in: ['active', 'acknowledged'] } }, { projection: { equipmentId: 1, code: 1 } }).toArray()).map((a) => `${a.equipmentId}:${a.code}`))
export const insertAlarms = async (docs) => (docs.length ? (await alarms()).insertMany(docs) : null)
export const listAlarms = async (query, limit = 300) => (await alarms()).find(query).sort({ raisedAt: -1 }).limit(limit).toArray()
export const findAlarm = async (projectId, _id) => (await alarms()).findOne({ projectId, _id })
export const updateAlarm = async (_id, set) => (await alarms()).updateOne({ _id }, { $set: set })

// MongoDB connection (accounts + saved room designs). The URI comes from MONGODB_URI; it is never hard-coded.
import { MongoClient, ObjectId } from 'mongodb'
import { env } from './env.js'
import { COLLECTIONS } from '../constants/index.js'
import ApiError from '../utils/ApiError.js'

export const mongoEnabled = Boolean(env.mongoUri)
let client = null
let pending = null

/** Lazily connects (and creates indexes) on first use; later calls reuse the same connection. */
export function getDb() {
  if (!mongoEnabled) return Promise.reject(new ApiError(503, 'Accounts are not configured (MONGODB_URI missing).'))
  pending ??= (async () => {
    client = new MongoClient(env.mongoUri, { serverSelectionTimeoutMS: 10000 })
    await client.connect()
    const d = client.db()
    await Promise.all([
      d.collection(COLLECTIONS.users).createIndex({ email: 1 }, { unique: true }),
      d.collection(COLLECTIONS.designs).createIndex({ ownerId: 1, updatedAt: -1 }),
      d.collection(COLLECTIONS.designs).createIndex({ status: 1, updatedAt: -1 }),
      d.collection(COLLECTIONS.products).createIndex({ id: 1 }, { unique: true }),
      d.collection(COLLECTIONS.projects).createIndex({ ownerId: 1, updatedAt: -1 }),
      d.collection(COLLECTIONS.equipment).createIndex({ projectId: 1, towerId: 1, level: 1 }),
      d.collection(COLLECTIONS.alarms).createIndex({ projectId: 1, state: 1, raisedAt: -1 }),
      d.collection(COLLECTIONS.alarms).createIndex({ ownerId: 1, state: 1 }),
      d.collection(COLLECTIONS.quotes).createIndex({ ownerId: 1, updatedAt: -1 }),
      d.collection(COLLECTIONS.quotes).createIndex({ released: 1, status: 1, updatedAt: -1 }),
      d.collection(COLLECTIONS.quotes).createIndex({ shareHash: 1 }, { unique: true, partialFilterExpression: { shareHash: { $type: 'string' } } }),
      d.collection(COLLECTIONS.quotes).createIndex({ ref: 1 }, { unique: true }),
      d.collection(COLLECTIONS.pricingRules).createIndex({ key: 1 }, { unique: true }),
      d.collection(COLLECTIONS.audit).createIndex({ at: -1 }),
      d.collection(COLLECTIONS.notifications).createIndex({ to: 1, at: -1 }),
      d.collection(COLLECTIONS.outbox).createIndex({ at: -1 }),
      d.collection(COLLECTIONS.appointments).createIndex({ userId: 1, date: 1 }),
    ])
    return d
  })().catch((e) => { pending = null; throw e })
  return pending
}
export const collection = async (name) => (await getDb()).collection(name)
export async function closeDb() { if (client) await client.close().catch(() => {}); client = null; pending = null }

/** Parse a string id; returns null instead of throwing. */
export const toObjectId = (s) => (typeof s === 'string' && /^[a-f\d]{24}$/i.test(s) ? new ObjectId(s) : null)

// Data access for the smart-product catalogue (collection: tac_products). Prices are managed by the admin.
import { collection } from '../config/database.js'
import { COLLECTIONS } from '../constants/index.js'

const products = () => collection(COLLECTIONS.products)
const strip = { projection: { _id: 0 } }

export const listAll = async () => (await products()).find({}, strip).sort({ group: 1, name: 1 }).toArray()
export const listActive = async () => (await products()).find({ active: true }, strip).sort({ group: 1, name: 1 }).toArray()
export const count = async () => (await products()).countDocuments()
export const insertMany = async (docs) => (await products()).insertMany(docs)
export const update = async (id, set) => (await products()).findOneAndUpdate({ id }, { $set: set }, { returnDocument: 'after', ...strip })

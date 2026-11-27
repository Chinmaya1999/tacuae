import * as Product from '../models/product.model.js'
import * as Audit from '../models/pricing.model.js'
import { mongoEnabled } from '../config/database.js'
import { PRODUCT_SEED } from '../constants/products.js'
import ApiError from '../utils/ApiError.js'

/** First run only: fill the catalogue with the starter products (placeholder prices). */
export async function ensureProducts() {
  if (!mongoEnabled || (await Product.count()) > 0) return 0
  await Product.insertMany(PRODUCT_SEED.map((p) => ({ ...p, createdAt: new Date().toISOString() })))
  return PRODUCT_SEED.length
}
/** Segment price lists are never sent to the browser of a customer. */
export const listForCustomers = async () => (await Product.listActive()).map(({ prices, ...p }) => p)
export const listForAdmin = () => Product.listAll()
export async function createProduct(actor, doc) {
  try { await Product.insertMany([{ ...doc, createdAt: new Date().toISOString() }]) } catch (e) {
    if (e.code === 11000) throw new ApiError(409, 'A product with this name already exists.')
    throw e
  }
  await Audit.log(actor, 'product.create', doc.id)
  return doc
}
export async function updateProduct(actor, id, set) {
  const r = await Product.update(id, { ...set, updatedAt: new Date().toISOString() })
  const doc = r?.value ?? r // driver versions differ on the return shape
  if (!doc) throw new ApiError(404, 'Product not found.')
  await Audit.log(actor, 'product.update', id, set)
  return doc
}

import * as Product from '../models/product.model.js'
import { mongoEnabled } from '../config/database.js'
import { PRODUCT_SEED } from '../constants/products.js'
import ApiError from '../utils/ApiError.js'

/** First run only: fill the catalogue with the starter products (placeholder prices). */
export async function ensureProducts() {
  if (!mongoEnabled || (await Product.count()) > 0) return 0
  await Product.insertMany(PRODUCT_SEED.map((p) => ({ ...p, createdAt: new Date().toISOString() })))
  return PRODUCT_SEED.length
}
export const listForCustomers = () => Product.listActive()
export const listForAdmin = () => Product.listAll()
export async function updateProduct(id, set) {
  const r = await Product.update(id, { ...set, updatedAt: new Date().toISOString() })
  const doc = r?.value ?? r // driver versions differ on the return shape
  if (!doc) throw new ApiError(404, 'Product not found.')
  return doc
}

import * as Products from '../services/product.service.js'
import { estimateRooms } from '../services/estimate.service.js'
import ApiResponse from '../utils/ApiResponse.js'

export const list = async (_req, res) => ApiResponse.send(res, { items: await Products.listForCustomers() })
export const estimate = async (req, res) => ApiResponse.send(res, { estimate: await estimateRooms(req.valid.rooms) })
export const adminList = async (_req, res) => ApiResponse.send(res, { items: await Products.listForAdmin() })
export const adminCreate = async (req, res) => ApiResponse.send(res, { item: await Products.createProduct(req.user, req.valid) })
export const adminUpdate = async (req, res) => ApiResponse.send(res, { item: await Products.updateProduct(req.user, req.valid.id, req.valid.set) })

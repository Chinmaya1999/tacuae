import * as Designs from '../services/design.service.js'
import { validateDesignId } from '../validators/design.validator.js'
import ApiResponse from '../utils/ApiResponse.js'

// ---- customer / builder ----
export const list = async (req, res) => ApiResponse.send(res, { items: await Designs.listMine(req.user) })
export const create = async (req, res) => ApiResponse.send(res, { item: await Designs.create(req.user, req.valid) })
export const get = async (req, res) => ApiResponse.send(res, { item: await Designs.getMine(req.user, validateDesignId(req)) })
export const update = async (req, res) => ApiResponse.send(res, { item: await Designs.update(req.user, validateDesignId(req), req.valid) })
export async function remove(req, res) { await Designs.remove(req.user, validateDesignId(req)); ApiResponse.send(res) }
export const submit = async (req, res) => ApiResponse.send(res, { item: await Designs.transition(req.user, validateDesignId(req), 'submit') })
export const withdraw = async (req, res) => ApiResponse.send(res, { item: await Designs.transition(req.user, validateDesignId(req), 'withdraw') })
export const respond = async (req, res) => ApiResponse.send(res, { item: await Designs.transition(req.user, validateDesignId(req), 'respond', req.valid.accept) })

// ---- admin ----
export const adminList = async (req, res) => ApiResponse.send(res, { items: await Designs.listForAdmin(req.query.status) })
export const adminGet = async (req, res) => ApiResponse.send(res, { item: await Designs.getForAdmin(validateDesignId(req)) })
export const adminQuote = async (req, res) => ApiResponse.send(res, { item: await Designs.sendQuote(req.user, validateDesignId(req), req.valid) })
export async function adminNote(req, res) { await Designs.setAdminNote(validateDesignId(req), req.valid.adminNote); ApiResponse.send(res) }

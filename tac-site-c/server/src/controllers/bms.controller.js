import * as Bms from '../services/bms.service.js'
import ApiResponse from '../utils/ApiResponse.js'

export const catalog = (_req, res) => ApiResponse.send(res, Bms.catalog())
export const overview = async (req, res) => ApiResponse.send(res, await Bms.overview(req.user))
export const createProject = async (req, res) => ApiResponse.send(res, { project: await Bms.createProject(req.user, req.valid) })
export const getProject = async (req, res) => ApiResponse.send(res, { project: await Bms.getProject(req.user, req.params.id) })
export async function deleteProject(req, res) { await Bms.deleteProject(req.user, req.params.id); ApiResponse.send(res) }
export const listEquipment = async (req, res) => ApiResponse.send(res, { items: await Bms.listEquipment(req.user, req.params.id) })
export const addEquipment = async (req, res) => ApiResponse.send(res, { item: await Bms.addEquipment(req.user, req.params.id, req.valid) })
export const patchEquipment = async (req, res) => ApiResponse.send(res, { item: await Bms.patchEquipment(req.user, req.params.id, req.params.eid, req.valid) })
export async function removeEquipment(req, res) { await Bms.removeEquipment(req.user, req.params.id, req.params.eid); ApiResponse.send(res) }
export const live = async (req, res) => { res.setHeader('Cache-Control', 'no-store'); ApiResponse.send(res, await Bms.live(req.user, req.params.id)) }
export const history = async (req, res) => ApiResponse.send(res, await Bms.history(req.user, req.params.id, req.params.eid, req.valid.hours))
export const listAlarms = async (req, res) => ApiResponse.send(res, { items: await Bms.listAlarms(req.user, req.params.id, req.query.state) })
export const globalAlarms = async (req, res) => ApiResponse.send(res, { items: await Bms.globalAlarms(req.user, req.query.state) })
export const acknowledge = async (req, res) => ApiResponse.send(res, { item: await Bms.acknowledge(req.user, req.params.id, req.params.aid) })
export const resolve = async (req, res) => ApiResponse.send(res, { item: await Bms.resolve(req.user, req.params.id, req.params.aid, req.valid.note) })

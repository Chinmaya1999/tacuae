import * as Enquiries from '../services/enquiry.service.js'
import ApiResponse from '../utils/ApiResponse.js'

export function create(req, res) { Enquiries.create(req.valid); ApiResponse.send(res) }
export const list = (req, res) => ApiResponse.send(res, { items: Enquiries.list(req.query) })
export const update = (req, res) => ApiResponse.send(res, { item: Enquiries.update(req.params.id, req.valid) })
export function remove(req, res) { Enquiries.remove(req.params.id); ApiResponse.send(res) }
export function exportCsv(req, res) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="tac-enquiries-${new Date().toISOString().slice(0, 10)}.csv"`)
  res.send(Enquiries.csv(req.query))
}

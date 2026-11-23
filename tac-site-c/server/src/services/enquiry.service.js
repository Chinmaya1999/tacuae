import crypto from 'node:crypto'
import * as Enquiry from '../models/enquiry.model.js'
import { ENQUIRY_STATUS } from '../constants/index.js'
import { sendEnquiryMail } from '../integrations/email/mailer.js'
import { toCsv } from '../utils/csv.js'
import ApiError from '../utils/ApiError.js'

export function create(data) {
  const list = Enquiry.all()
  list.unshift({ id: crypto.randomUUID(), at: new Date().toISOString(), ...data, status: 'new', note: '' })
  Enquiry.saveAll(list)
  sendEnquiryMail(data)
}

export function list({ status, q } = {}) {
  let items = Enquiry.all()
  if (ENQUIRY_STATUS.includes(status)) items = items.filter((e) => e.status === status)
  const s = String(q ?? '').toLowerCase().trim()
  if (s) items = items.filter((e) => [e.name, e.company, e.email, e.phone, e.service, e.message].join(' ').toLowerCase().includes(s))
  return items
}

export function update(id, patch) {
  const items = Enquiry.all(), e = items.find((x) => x.id === id)
  if (!e) throw new ApiError(404, 'Enquiry not found.')
  Object.assign(e, patch)
  Enquiry.saveAll(items)
  return e
}
export function remove(id) {
  const items = Enquiry.all(), rest = items.filter((x) => x.id !== id)
  if (rest.length === items.length) throw new ApiError(404, 'Enquiry not found.')
  Enquiry.saveAll(rest)
}

const CSV_COLS = ['at', 'status', 'name', 'company', 'email', 'phone', 'service', 'projectType', 'message', 'note']
export const csv = (filter) => toCsv(CSV_COLS, list(filter))

export function stats() {
  const items = Enquiry.all(), day = 86400_000, now = Date.now()
  const daily = Array.from({ length: 14 }, (_, i) => ({ date: new Date(now - (13 - i) * day).toISOString().slice(0, 10), count: 0 }))
  items.forEach((e) => { const x = daily.find((d) => d.date === e.at.slice(0, 10)); if (x) x.count++ })
  const by = {}; items.forEach((e) => { const k = e.service || 'General'; by[k] = (by[k] || 0) + 1 })
  const n = (s) => items.filter((e) => e.status === s).length
  return {
    total: items.length, new: n('new'), contacted: n('contacted'), closed: n('closed'),
    last7: items.filter((e) => now - Date.parse(e.at) < 7 * day).length, daily,
    byService: Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([service, count]) => ({ service, count })),
  }
}

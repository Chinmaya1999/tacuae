import { cleanInput } from './pricing.validator.js'
import { QUOTE_STATUS } from '../constants/pricing.js'
import { clean, multiline } from '../utils/sanitize.js'
import ApiError from '../utils/ApiError.js'

const bad = (m) => new ApiError(400, m)

export function validateCreate({ body: b = {} }) {
  const kind = b.kind === 'project' ? 'project' : 'home'
  const input = cleanInput(kind, b.input)
  if (kind === 'project' && (input.project.name.length < 2 || !input.unitTypes.length)) throw bad('Enter a project name and add at least one unit type.')
  return { kind, input, name: clean(b.name, 100) }
}
// the stored quotation decides the kind, so the input is cleaned against it in the controller
export const validateRevise = ({ body: b = {} }) => ({ rawInput: b.input, name: clean(b.name, 100), note: clean(b.note, 200) })

export function validateText({ body: b = {} }) {
  const text = multiline(b.text, 1500)
  if (!text) throw bad('Write a message first.')
  return { text }
}
export const validateOptionalText = ({ body: b = {} }) => ({ text: multiline(b.text, 1500) })
export function validateSharedComment({ body: b = {} }) {
  const name = clean(b.name, 80), text = multiline(b.text, 1500)
  if (name.length < 2 || !text) throw bad('Enter your name and a message.')
  return { name, text, requestChanges: b.requestChanges === true }
}
export function validateAdjust({ body: b = {} }) {
  let discountPct
  if (b.discountPct !== undefined) {
    discountPct = typeof b.discountPct === 'number' ? b.discountPct : NaN
    if (!Number.isFinite(discountPct) || discountPct < 0 || discountPct > 100) throw bad('Discount must be a number between 0 and 100.')
  }
  const quantities = {}
  for (const [k, v] of Object.entries(b.quantities || {}).slice(0, 200)) {
    if (!/^[a-z0-9-]{1,40}$/.test(k) || !Number.isInteger(v) || v < 0 || v > 100000) throw bad('Quantities must be whole numbers, 0 or more.')
    quantities[k] = v
  }
  return { discountPct, quantities, note: clean(b.note, 200) }
}
export const validateDecision = ({ body: b = {} }) => ({ approve: b.approve === true })
export function validateMeta({ body: b = {} }) {
  const s = {}
  if (b.staffNote !== undefined) s.staffNote = multiline(b.staffNote, 3000)
  if (b.assignedTo !== undefined) s.assignedTo = clean(b.assignedTo, 160).toLowerCase()
  return s
}
export function validateSurvey({ body: b = {} }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date) || Number.isNaN(Date.parse(b.date))) throw bad('Choose a survey date.')
  return { date: b.date }
}
export const validateStaffQuery = ({ query: q = {} }) => ({ status: QUOTE_STATUS.includes(q.status) ? q.status : '', assigned: q.assigned === 'me' ? 'me' : '' })

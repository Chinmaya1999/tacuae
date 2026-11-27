// Quotation lifecycle: Draft → Shared → Revision requested → TAC reviewed → Final → Accepted → Site survey.
// Prices are snapshotted into each version; only an explicit configuration change re-reads the catalogue.
import crypto from 'node:crypto'
import * as Quote from '../models/quote.model.js'
import * as Audit from '../models/pricing.model.js'
import * as User from '../models/user.model.js'
import { toObjectId } from '../config/database.js'
import { context, getSettings, segmentFor } from './pricing.service.js'
import { priceInput, repriceLines } from './pricing.engine.js'
import { LIMITS } from '../constants/pricing.js'
import { smartScore } from './smart.service.js'
import { companyId, teamCan, billingUser } from './team.service.js'
import { emit } from './events.service.js'
import { env } from '../config/env.js'
import ApiError from '../utils/ApiError.js'

const DAY = 86400_000
const now = () => new Date().toISOString()
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex')
export const isExpired = (q, at = Date.now()) => Boolean(q.validUntil) && Date.parse(q.validUntil) < at

/** Which actions a quotation allows from each state. */
export const ALLOWED = {
  edit: ['draft', 'shared', 'revision_requested', 'reviewed', 'final'],
  share: ['draft', 'shared', 'revision_requested', 'reviewed', 'final'],
  requestReview: ['draft', 'shared', 'reviewed', 'final'], // from final: ask TAC to change or reissue it
  requestChanges: ['shared', 'reviewed', 'final'],
  accept: ['final'],
  adjust: ['draft', 'shared', 'revision_requested', 'reviewed'],
  review: ['draft', 'shared', 'revision_requested'],
  finalize: ['reviewed'],
  survey: ['accepted'],
  remove: ['draft'],
}
export function assertAllowed(action, q) {
  if (!ALLOWED[action].includes(q.status)) throw new ApiError(409, `This is not possible while the quotation is ${q.status.replace('_', ' ')}.`)
}

const title = (kind, input) => (kind === 'project' ? input.project.name || 'Project quotation' : 'My smart home')
const snapshot = (q, author, note) => ({ version: q.version, input: q.input, pricing: q.pricing, discountPct: q.pricing.totals.discountPct, status: q.status, author: author.email, note, at: now() })
const noDiscount = () => ({ pct: 0, approval: 'none', requestedBy: '', approvedBy: '' })

/** What leaves the server. `audience`: owner | staff | recipient (secure link). */
export function quoteOut(q, audience) {
  const base = {
    id: String(q._id), ref: q.ref, kind: q.kind, name: q.name, status: q.status, version: q.version, indicative: q.status !== 'final' && q.status !== 'accepted' && q.status !== 'survey',
    expired: isExpired(q), validUntil: q.validUntil, trn: q.trn, terms: q.terms, exclusions: q.exclusions, currency: 'AED', fx: q.fx,
    total: q.pricing?.totals?.total ?? 0, createdAt: q.createdAt, updatedAt: q.updatedAt,
  }
  const detail = q.input ? { input: q.input, pricing: q.pricing, smart: q.smart || null, deposit: q.deposit || null } : {}
  const comments = (q.comments || []).map(({ by, text, at, staff }) => ({ by, text, at, staff }))
  if (audience === 'recipient') return { ...base, id: undefined, preparedFor: q.ownerName, ...detail, comments }
  const versions = q.versions?.map(({ version, at, note, author, status, pricing, discountPct }) => ({ version, at, note, author: audience === 'staff' || author === q.ownerEmail ? author : 'TAC', status, discountPct, total: pricing.totals.total, lines: pricing.lines.map((l) => ({ productId: l.productId, name: l.name, qty: l.qty })) }))
  const own = { ...base, ...detail, comments, versions, discount: { pct: q.pricing?.totals?.discountPct ?? 0 }, shared: Boolean(q.shareHash), shareExpiresAt: q.shareExpiresAt || null }
  if (audience !== 'staff') return own
  return { ...own, discount: q.discount, segment: q.pricing?.segment, staffNote: q.staffNote || '', assignedTo: q.assignedTo || '', owner: { name: q.ownerName, email: q.ownerEmail, phone: q.ownerPhone, company: q.ownerCompany, role: q.ownerRole } }
}

async function commit(q, set, push) {
  const r = await Quote.save(q, { ...set, updatedAt: now() }, push)
  if (!r.matchedCount) throw new ApiError(409, 'This quotation changed while you were working on it. Reload and try again.')
  return Quote.findById(q._id)
}
const withVersion = (q, change, author, note) => {
  if (q.version >= LIMITS.versions) throw new ApiError(400, 'Version limit reached. Duplicate the quotation to continue.')
  const next = { ...q, ...change, version: q.version + 1 }
  return commit(q, { ...change, version: next.version }, { versions: snapshot(next, author, note) })
}

// ---------- owner (customer / builder) ----------
async function owned(user, id, need = 'read') {
  const _id = toObjectId(id), q = _id && (await Quote.findById(_id))
  if (!q || String(q.ownerId) !== String(companyId(user))) throw new ApiError(404, 'Quotation not found.')
  teamCan(user, need)
  return q
}
export const listMine = async (user) => (await Quote.list({ ownerId: companyId(user) })).map((q) => quoteOut(q, 'owner'))
export const getMine = async (user, id) => quoteOut(await owned(user, id), 'owner')

async function priced(owner, kind, input) {
  const ctx = await context(segmentFor(owner))
  const pricing = priceInput(kind, input, ctx)
  if (!pricing.lines.length) throw new ApiError(400, 'Choose at least one automation option so there is something to quote.')
  const s = ctx.settings
  return { pricing, smart: kind === 'home' ? smartScore(input, s.smart) : null, trn: s.trn, terms: s.terms, exclusions: s.exclusions, fx: s.fx, validUntil: new Date(Date.now() + s.validityDays * DAY).toISOString() }
}

export async function create(user, { kind, input, name }) {
  teamCan(user, 'edit')
  const owner = await billingUser(user) // team members quote under the company account and its price list
  if ((await Quote.countByOwner(owner._id)) >= LIMITS.quotesPerUser) throw new ApiError(400, 'Quotation limit reached.')
  const at = now()
  const doc = {
    ref: `TAC-Q-${at.slice(2, 10).replaceAll('-', '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
    kind, name: name || title(kind, input), input, ...(await priced(owner, kind, input)),
    ownerId: owner._id, ownerName: owner.name, ownerEmail: owner.email, ownerPhone: owner.phone || '', ownerCompany: owner.company || '', ownerRole: owner.role,
    status: 'draft', released: false, version: 1, discount: noDiscount(), comments: [], rev: 0, createdAt: at, updatedAt: at,
  }
  doc.versions = [snapshot(doc, user, 'Created')]
  return quoteOut(await Quote.insert(doc), 'owner')
}

/** A new configuration re-prices at today's rates, drops any discount and returns the quotation to draft. */
export async function revise(user, id, { input, name, note }) {
  const q = await owned(user, id, 'edit')
  assertAllowed('edit', q)
  const change = { input, name: name || q.name, ...(await priced(await billingUser(user), q.kind, input)), status: 'draft', discount: noDiscount() }
  return quoteOut(await withVersion(q, change, user, note || 'Configuration updated'), 'owner')
}
export async function duplicate(user, id) {
  const q = await owned(user, id)
  return create(user, { kind: q.kind, input: q.input, name: `${q.name} (copy)`.slice(0, 100) })
}
export async function remove(user, id) {
  const q = await owned(user, id, 'admin')
  assertAllowed('remove', q)
  await Quote.remove(q._id)
}

/** Creates (or replaces) the secret link. Only its hash is stored, so the token is shown once. */
export async function share(user, id) {
  const q = await owned(user, id, 'edit')
  assertAllowed('share', q)
  const token = crypto.randomBytes(24).toString('base64url')
  const shareExpiresAt = new Date(Date.now() + 30 * DAY).toISOString()
  const saved = await commit(q, { shareHash: sha(token), shareExpiresAt, released: true, ...(q.status === 'draft' ? { status: 'shared' } : {}) })
  if (!q.released) emit('quote.released', saved)
  return { token, path: `/q/${token}`, expiresAt: shareExpiresAt, item: quoteOut(saved, 'owner') }
}
export async function unshare(user, id) {
  const q = await owned(user, id, 'edit')
  return quoteOut(await commit(q, { shareHash: null, shareExpiresAt: null }), 'owner')
}

const comment = (q, by, text, staff = false) => {
  if ((q.comments || []).length >= LIMITS.comments) throw new ApiError(400, 'Comment limit reached.')
  return { comments: { by, text, staff, at: now() } }
}
export async function addComment(user, id, text) {
  const q = await owned(user, id)
  return quoteOut(await commit(q, {}, comment(q, user.name, text)), 'owner')
}
export async function requestReview(user, id, text) {
  const q = await owned(user, id, 'edit')
  assertAllowed('requestReview', q)
  const saved = await commit(q, { status: 'revision_requested', released: true }, comment(q, user.name, text || 'Please review and finalise this quotation.'))
  emit(q.released ? 'quote.review-requested' : 'quote.released', saved)
  return quoteOut(saved, 'owner')
}
export async function accept(user, id) {
  const q = await owned(user, id, 'approve')
  assertAllowed('accept', q)
  if (isExpired(q)) throw new ApiError(409, 'This quotation has expired. Ask TAC to reissue it.')
  const saved = await commit(q, { status: 'accepted', acceptedAt: now(), acceptedVersion: q.version })
  emit('quote.accepted', saved)
  return quoteOut(saved, 'owner')
}
/** DEMO MODE ONLY: records a pretend deposit. No payment provider is contacted and no money moves. */
export async function demoDeposit(user, id) {
  if (!env.demoMode) throw new ApiError(404, 'Online payment is not available.')
  const q = await owned(user, id, 'approve')
  if (!['accepted', 'survey'].includes(q.status)) throw new ApiError(409, 'Accept the quotation first.')
  if (q.deposit) throw new ApiError(409, 'A deposit is already recorded.')
  const { depositPct } = await getSettings()
  const saved = await commit(q, { deposit: { amount: Math.round((q.pricing.totals.total * depositPct) / 100), pct: depositPct, status: 'simulated', at: now() } })
  emit('payment.simulated', saved)
  return quoteOut(saved, 'owner')
}

// ---------- secure link recipients (no account) ----------
async function shared(token) {
  const q = /^[\w-]{32}$/.test(token) && (await Quote.findByShareHash(sha(token)))
  if (!q || Date.parse(q.shareExpiresAt) < Date.now()) throw new ApiError(404, 'This link is not valid or has expired.')
  return q
}
export const getShared = async (token) => quoteOut(await shared(token), 'recipient')
export async function commentShared(token, { name, text, requestChanges }) {
  const q = await shared(token)
  const change = requestChanges && ALLOWED.requestChanges.includes(q.status) ? { status: 'revision_requested' } : {}
  const saved = await commit(q, change, comment(q, name, text))
  emit('quote.recipient-comment', saved)
  return quoteOut(saved, 'recipient')
}

// ---------- TAC sales / admin ----------
async function any(id) {
  const _id = toObjectId(id), q = _id && (await Quote.findById(_id))
  if (!q?.released) throw new ApiError(404, 'Quotation not found.')
  return q
}
export async function staffList({ status, assigned }, user) {
  const query = { released: true, ...(status ? { status } : {}), ...(assigned === 'me' ? { assignedTo: user.email } : {}) }
  const [items, summary, team] = await Promise.all([Quote.list(query), Quote.statusSummary(), User.listStaff()])
  return {
    items: items.map((q) => ({ ...quoteOut(q, 'staff'), needsApproval: q.discount.approval === 'pending' })),
    summary: Object.fromEntries(summary.map((s) => [s._id, { count: s.count, value: s.value }])),
    team: team.map((u) => ({ name: u.name, email: u.email, role: u.role })),
  }
}
export const staffGet = async (id) => quoteOut(await any(id), 'staff')

export async function staffMeta(user, id, { staffNote, assignedTo }) {
  const q = await any(id)
  const set = {}
  if (staffNote !== undefined) set.staffNote = staffNote
  if (assignedTo !== undefined) {
    if (assignedTo && !(await User.listStaff()).some((u) => u.email === assignedTo)) throw new ApiError(400, 'Assign to an active sales or admin user.')
    set.assignedTo = assignedTo
  }
  return quoteOut(await commit(q, set), 'staff')
}
export async function staffComment(user, id, text) {
  const q = await any(id), saved = await commit(q, {}, comment(q, user.name, text, true))
  emit('quote.staff-comment', saved)
  return quoteOut(saved, 'staff')
}

/** Discount and/or quantity changes on the snapshot. Above the sales limit, an admin must approve. */
export async function adjust(user, id, { discountPct, quantities, note }) {
  const q = await any(id)
  assertAllowed('adjust', q)
  const settings = await getSettings()
  const pct = discountPct ?? q.discount.pct
  if (pct > settings.maxDiscountPct) throw new ApiError(400, `Discounts above ${settings.maxDiscountPct}% are not allowed.`)
  const unknown = Object.keys(quantities).filter((k) => !q.pricing.lines.some((l) => l.productId === k))
  if (unknown.length) throw new ApiError(400, 'Only existing line items can be changed.')
  const linesChanged = Object.entries(quantities).some(([k, v]) => q.pricing.lines.find((l) => l.productId === k).qty !== v)
  // an approval covers one discount on one set of lines; changing either asks again
  const unchanged = pct === q.discount.pct && !linesChanged
  const needs = pct > settings.salesDiscountLimitPct && user.role !== 'admin'
  if (unchanged) return quoteOut(q, 'staff') // nothing to record, and the review stays valid
  const discount = { pct, approval: pct === 0 ? 'none' : needs ? 'pending' : 'approved', requestedBy: user.email, approvedBy: pct && !needs ? user.email : '' }
  // a discount waiting for approval is recorded but NOT applied to any price the customer can see
  const pricing = repriceLines(q.pricing, quantities, discount.approval === 'pending' ? 0 : pct)
  if (!pricing.lines.length) throw new ApiError(400, 'A quotation needs at least one line item.')
  const saved = await withVersion(q, { pricing, discount, status: q.status === 'reviewed' ? 'revision_requested' : q.status }, user, note || `Adjusted by TAC (discount ${pct}%)`)
  if (discount.approval === 'pending') emit('discount.pending', saved)
  await Audit.log(user, 'quote.adjust', q.ref, { discountPct: pct, quantities, approval: discount.approval })
  return quoteOut(saved, 'staff')
}
export async function decideDiscount(admin, id, approve) {
  const q = await any(id)
  assertAllowed('adjust', q)
  if (q.discount.approval !== 'pending') throw new ApiError(409, 'There is no discount waiting for approval.')
  const discount = approve ? { ...q.discount, approval: 'approved', approvedBy: admin.email } : noDiscount()
  // approval changes the price, so an earlier review no longer covers it
  const change = { discount, pricing: repriceLines(q.pricing, {}, discount.pct), ...(approve && q.status === 'reviewed' ? { status: 'revision_requested' } : {}) }
  const saved = await withVersion(q, change, admin, approve ? `Discount ${q.discount.pct}% approved` : `Discount ${q.discount.pct}% declined`)
  await Audit.log(admin, approve ? 'quote.discount.approve' : 'quote.discount.reject', q.ref, { discountPct: q.discount.pct })
  return quoteOut(saved, 'staff')
}
export async function review(user, id) {
  const q = await any(id)
  assertAllowed('review', q)
  const saved = await commit(q, { status: 'reviewed', reviewedBy: user.email })
  await Audit.log(user, 'quote.review', q.ref)
  return quoteOut(saved, 'staff')
}
export async function finalize(user, id) {
  const q = await any(id)
  assertAllowed('finalize', q)
  if (q.discount.approval === 'pending') throw new ApiError(409, 'The discount is waiting for admin approval.')
  if (q.pricing.warnings.unpriced.length || q.pricing.lines.some((l) => !(l.unit > 0))) throw new ApiError(409, 'Some products have no price. Set prices and ask the customer to update the quotation, or remove those lines.')
  const s = await getSettings()
  const change = { status: 'final', trn: s.trn, validUntil: new Date(Date.now() + s.validityDays * DAY).toISOString(), finalizedBy: user.email, finalizedAt: now() }
  const saved = await withVersion(q, change, user, 'Final quotation issued')
  emit('quote.final', saved)
  await Audit.log(user, 'quote.finalize', q.ref, { total: q.pricing.totals.total })
  return quoteOut(saved, 'staff')
}
export async function scheduleSurvey(user, id, date) {
  const q = await any(id)
  assertAllowed('survey', q)
  const saved = await commit(q, { status: 'survey', surveyDate: date })
  emit('quote.survey', saved)
  await Audit.log(user, 'quote.survey', q.ref, { date })
  return quoteOut(saved, 'staff')
}

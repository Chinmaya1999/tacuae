// Configurator, quotations, secure links, the sales console and pricing admin.
import { Router } from 'express'
import * as Pricing from '../services/pricing.service.js'
import * as Quotes from '../services/quote.service.js'
import { csrfGuard, loadUser, requireRole } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'
import { rateLimit } from '../middlewares/rateLimit.middleware.js'
import * as P from '../validators/pricing.validator.js'
import * as Q from '../validators/quote.validator.js'
import ApiResponse from '../utils/ApiResponse.js'
import { count } from '../services/events.service.js'

const send = (fn) => async (req, res) => ApiResponse.send(res, await fn(req))
const item = (fn) => send(async (req) => ({ item: await fn(req) }))
const optionalUser = async (req, res, next) => { try { req.user = await loadUser(req); res.setHeader('Cache-Control', 'no-store'); next() } catch (e) { next(e) } }

// ---- public configurator (/api/configurator): guests allowed; prices only when TAC enables them ----
export const configuratorRoutes = Router()
configuratorRoutes.use(csrfGuard, rateLimit({ max: 240, windowMs: 60_000 }), optionalUser)
configuratorRoutes.get('/options', send((q) => { count('configurator_opened'); return Pricing.options(q.user) }))
configuratorRoutes.post('/estimate', validate(P.validateEstimate), send((q) => Pricing.estimate(q.user, q.valid.kind, q.valid.input)))
configuratorRoutes.post('/compare', validate(P.validateCompare), send(async (q) => ({ scenarios: await Pricing.compare(q.user, q.valid.input, q.valid.scenarios) })))

// ---- owner (/api/quotations) ----
export const quoteRoutes = Router()
quoteRoutes.use(csrfGuard, requireRole('customer', 'builder'))
quoteRoutes.get('/', send(async (q) => ({ items: await Quotes.listMine(q.user) })))
quoteRoutes.post('/', validate(Q.validateCreate), item((q) => Quotes.create(q.user, q.valid)))
quoteRoutes.get('/:id', item((q) => Quotes.getMine(q.user, q.params.id)))
quoteRoutes.put('/:id', validate(Q.validateRevise), item(async (q) => {
  const { kind } = await Quotes.getMine(q.user, q.params.id)
  return Quotes.revise(q.user, q.params.id, { ...q.valid, input: P.cleanInput(kind, q.valid.rawInput) })
}))
quoteRoutes.delete('/:id', send(async (q) => { await Quotes.remove(q.user, q.params.id) }))
quoteRoutes.post('/:id/duplicate', item((q) => Quotes.duplicate(q.user, q.params.id)))
quoteRoutes.post('/:id/share', send((q) => Quotes.share(q.user, q.params.id)))
quoteRoutes.delete('/:id/share', item((q) => Quotes.unshare(q.user, q.params.id)))
quoteRoutes.post('/:id/comments', validate(Q.validateText), item((q) => Quotes.addComment(q.user, q.params.id, q.valid.text)))
quoteRoutes.post('/:id/request-review', validate(Q.validateOptionalText), item((q) => Quotes.requestReview(q.user, q.params.id, q.valid.text)))
quoteRoutes.post('/:id/accept', item((q) => Quotes.accept(q.user, q.params.id)))
quoteRoutes.post('/:id/demo-deposit', item((q) => Quotes.demoDeposit(q.user, q.params.id)))

// ---- secure link (/api/shared): no account; view and comment only ----
export const sharedRoutes = Router()
sharedRoutes.use(csrfGuard, rateLimit({ max: 60, windowMs: 60_000 }), (_q, res, next) => { res.setHeader('Cache-Control', 'no-store'); next() })
sharedRoutes.get('/:token', item((q) => Quotes.getShared(q.params.token)))
sharedRoutes.post('/:token/comments', rateLimit({ max: 10, windowMs: 3600_000, message: 'Too many messages. Try again later.' }), validate(Q.validateSharedComment), item((q) => Quotes.commentShared(q.params.token, q.valid)))

// ---- sales console (/api/sales) ----
export const salesRoutes = Router()
salesRoutes.use(csrfGuard, requireRole('sales', 'admin'))
salesRoutes.get('/quotations', validate(Q.validateStaffQuery), send((q) => Quotes.staffList(q.valid, q.user)))
salesRoutes.get('/quotations/:id', item((q) => Quotes.staffGet(q.params.id)))
salesRoutes.patch('/quotations/:id', validate(Q.validateMeta), item((q) => Quotes.staffMeta(q.user, q.params.id, q.valid)))
salesRoutes.post('/quotations/:id/comments', validate(Q.validateText), item((q) => Quotes.staffComment(q.user, q.params.id, q.valid.text)))
salesRoutes.post('/quotations/:id/adjust', validate(Q.validateAdjust), item((q) => Quotes.adjust(q.user, q.params.id, q.valid)))
salesRoutes.post('/quotations/:id/discount-decision', requireRole('admin'), validate(Q.validateDecision), item((q) => Quotes.decideDiscount(q.user, q.params.id, q.valid.approve)))
salesRoutes.post('/quotations/:id/review', item((q) => Quotes.review(q.user, q.params.id)))
salesRoutes.post('/quotations/:id/finalize', item((q) => Quotes.finalize(q.user, q.params.id)))
salesRoutes.post('/quotations/:id/survey', validate(Q.validateSurvey), item((q) => Quotes.scheduleSurvey(q.user, q.params.id, q.valid.date)))

// ---- pricing admin (mounted under /api/admin, which already requires an admin) ----
export const adminPricingRoutes = Router()
adminPricingRoutes.get('/', send(() => Pricing.adminOverview()))
adminPricingRoutes.put('/settings', validate(P.validateSettings), send(async (q) => ({ settings: await Pricing.updateSettings(q.user, q.valid) })))
adminPricingRoutes.put('/rules', validate(P.validateRule), send(async (q) => { await Pricing.saveRule(q.user, q.valid) }))
adminPricingRoutes.delete('/rules', validate(P.validateRuleKey), send(async (q) => { await Pricing.deleteRule(q.user, q.valid.key) }))

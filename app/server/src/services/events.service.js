// What happens after a business event: an in-app notification (real) and, in demo mode only, a SIMULATED
// entry showing what would be sent to CRM, WhatsApp, e-mail, SMS, calendar or the payment gateway.
// Fire-and-forget: a notification problem never fails the action that caused it.
import { collection } from '../config/database.js'
import { COLLECTIONS } from '../constants/index.js'
import { env } from '../config/env.js'

export const count = (name, by = 1) => collection(COLLECTIONS.counters).then((c) => c.updateOne({ _id: name }, { $inc: { n: by } }, { upsert: true })).catch(() => {})

const aed = (fils) => `AED ${(fils / 100).toLocaleString('en-AE')}`
const STAFF = 'staff'
/** event → { note: [[recipient, title]], send: [[channel, to, summary]] } */
function plan(event, d) {
  const mine = `/dashboard/quotations/${d._id}`, label = d.ref
  const owner = d.ownerId && String(d.ownerId), phone = d.ownerPhone || 'customer phone', email = d.ownerEmail
  const staff = (t) => [[STAFF, t, '/admin']], me = (t) => (owner ? [[owner, t, mine]] : [])
  switch (event) {
    case 'quote.released': return { note: staff(`New quotation lead ${label} from ${d.ownerName}`), send: [['crm', 'CRM', `Create lead + quotation ${label}, ${aed(d.pricing.totals.total)}, ${d.ownerName}`]] }
    case 'quote.review-requested': return { note: staff(`${d.ownerName} asked for a review of ${label}`) }
    case 'quote.recipient-comment': return { note: [...staff(`New comment on ${label}`), ...me(`New comment on ${label}`)] }
    case 'quote.staff-comment': return { note: me(`TAC replied on ${label}`), send: [['whatsapp', phone, `TAC replied on quotation ${label}`]] }
    case 'discount.pending': return { note: staff(`Discount approval needed on ${label}`) }
    case 'quote.final': return { note: me(`Your final quotation ${label} is ready`), send: [['email', email, `Final quotation ${label}: ${aed(d.pricing.totals.total)}`], ['whatsapp', phone, `Your final quotation ${label} is ready`], ['crm', 'CRM', `${label} → Final`]] }
    case 'quote.accepted': return { note: staff(`${label} accepted by ${d.ownerName}`), send: [['crm', 'CRM', `${label} → Won, ${aed(d.pricing.totals.total)}`]] }
    case 'quote.survey': return { note: me(`Site survey for ${label} on ${d.surveyDate}`), send: [['calendar', 'TAC calendar', `Site survey ${label} on ${d.surveyDate}`], ['sms', phone, `TAC site survey booked for ${d.surveyDate}`]] }
    case 'payment.simulated': return { note: [...staff(`Demo deposit recorded on ${label}`), ...me(`Demo deposit recorded on ${label}`)], send: [['payment', 'Payment gateway', `Deposit ${aed(d.deposit.amount)} for ${label}`]] }
    case 'appointment.new': return { note: staff(`New ${d.type} booking: ${d.name}, ${d.date} ${d.slot}`), send: [['calendar', 'TAC calendar', `${d.type} · ${d.name} · ${d.date} ${d.slot}`], ['sms', d.phone, `TAC received your ${d.type} request for ${d.date} ${d.slot}`], ['crm', 'CRM', `Lead: ${d.name} (${d.type})`]] }
    case 'appointment.confirmed': return { note: d.userId ? [[String(d.userId), `Your ${d.type} on ${d.date} ${d.slot} is confirmed`, '/book']] : [], send: [['whatsapp', d.phone, `Confirmed: ${d.type} on ${d.date} ${d.slot}`]] }
    default: return {}
  }
}

export function emit(event, data) {
  const { note = [], send = [] } = plan(event, data), at = new Date().toISOString()
  const jobs = []
  if (note.length) jobs.push(collection(COLLECTIONS.notifications).then((c) => c.insertMany(note.map(([to, title, link]) => ({ to, title, link, at, readBy: [] })))))
  if (env.demoMode && send.length) jobs.push(collection(COLLECTIONS.outbox).then((c) => c.insertMany(send.map(([channel, to, summary]) => ({ channel, to, summary, event, status: 'simulated', at })))))
  Promise.all(jobs).catch((e) => console.error('event handling failed:', event, e.message))
}

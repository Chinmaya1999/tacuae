import nodemailer from 'nodemailer'
import { env } from '../../config/env.js'

const transporter = env.smtp ? nodemailer.createTransport({
  host: env.smtp.host, port: env.smtp.port, secure: env.smtp.secure,
  auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
}) : null

export const mailEnabled = Boolean(transporter)

/** Fire-and-forget: the enquiry is already saved, so a mail failure is only logged. */
export function sendEnquiryMail(d) {
  if (!transporter) return
  transporter.sendMail({
    from: env.smtp.from, to: env.enquiryTo, replyTo: d.email,
    subject: `Website enquiry — ${d.service || 'General'} — ${d.name}`,
    text: Object.entries(d).map(([k, v]) => `${k}: ${v}`).join('\n'),
  }).catch((e) => console.error('mail failed (enquiry is saved):', e.message))
}

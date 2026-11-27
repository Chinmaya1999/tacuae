import * as Enquiries from '../services/enquiry.service.js'
import { accountStats } from '../services/user.service.js'
import { mailEnabled } from '../integrations/email/mailer.js'
import ApiResponse from '../utils/ApiResponse.js'

export const me = (req, res) => ApiResponse.send(res, { user: req.user.email })
export async function stats(_req, res) {
  ApiResponse.send(res, { ...Enquiries.stats(), mail: mailEnabled, ...(await accountStats().catch(() => ({ accounts: false }))) })
}

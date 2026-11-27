// Verifies the ID token Firebase issues after a successful SMS code. No service account is needed.
import { jwkSource, verifyJwt } from '../google/idToken.js'
import ApiError from '../../utils/ApiError.js'

const firebaseKey = jwkSource('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
const MAX_AGE = 15 * 60 // seconds since the SMS code was entered

/** Returns the verified phone number, or throws 401. */
export async function verifyPhoneToken(token, projectId, getKey = firebaseKey) {
  const bad = new ApiError(401, 'Mobile verification failed or expired. Please request a new code.')
  const c = await verifyJwt(token, getKey)
  if (!c || !projectId || c.aud !== projectId || c.iss !== `https://securetoken.google.com/${projectId}`) throw bad
  if (!c.sub || c.firebase?.sign_in_provider !== 'phone' || !/^\+\d{8,15}$/.test(c.phone_number ?? '')) throw bad
  if (!(c.auth_time > Date.now() / 1000 - MAX_AGE)) throw bad
  return c.phone_number
}

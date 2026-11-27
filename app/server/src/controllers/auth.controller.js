import * as Auth from '../services/auth.service.js'
import { loadUser, revokeSession } from '../middlewares/auth.middleware.js'
import { clearSessionCookie, generateToken, sessionCookie } from '../utils/generateToken.js'
import { isSecure } from '../utils/sanitize.js'
import ApiResponse from '../utils/ApiResponse.js'
import ApiError from '../utils/ApiError.js'
import { REMEMBER_MS } from '../constants/index.js'
import { env } from '../config/env.js'
import { verifyIdToken } from '../integrations/google/idToken.js'
import { verifyPhoneToken } from '../integrations/firebase/idToken.js'

const startSession = (req, res, user) => res.setHeader('Set-Cookie', sessionCookie(generateToken(user), isSecure(req)))

export async function register(req, res) {
  const user = await Auth.register(req.valid)
  startSession(req, res, user)
  ApiResponse.send(res, { user: Auth.publicUser(user) })
}
export async function login(req, res) {
  const user = await Auth.login(req.valid.email, req.valid.password)
  // remembered: kept for 30 days. Otherwise it ends when the browser closes (and after a few hours at most).
  const token = generateToken(user, req.valid.remember ? REMEMBER_MS : undefined)
  res.setHeader('Set-Cookie', sessionCookie(token, isSecure(req), req.valid.remember ? REMEMBER_MS : null))
  ApiResponse.send(res, { user: Auth.publicUser(user) })
}
export const googleConfig = (_req, res) => ApiResponse.send(res, { clientId: env.googleClientId || null })
export async function google(req, res) {
  if (!env.googleClientId) throw new ApiError(404, 'Google sign-in is not enabled.')
  const claims = await verifyIdToken(req.valid.credential, env.googleClientId)
  const user = await Auth.googleSignIn(claims, req.valid.role)
  startSession(req, res, user)
  ApiResponse.send(res, { user: Auth.publicUser(user) })
}
export const phoneConfig = (_req, res) => ApiResponse.send(res, { firebase: env.firebase })
const verifiedPhone = (req) => {
  if (!env.firebase) throw new ApiError(404, 'Mobile sign-in is not enabled.')
  return verifyPhoneToken(req.valid.credential, env.firebase.projectId)
}
export async function phone(req, res) {
  const user = await Auth.phoneSignIn(await verifiedPhone(req), req.valid)
  if (!user) return ApiResponse.send(res, { needsProfile: true })
  startSession(req, res, user)
  ApiResponse.send(res, { user: Auth.publicUser(user) })
}
export async function linkPhone(req, res) {
  const user = await Auth.linkPhone(req.user, await verifiedPhone(req))
  ApiResponse.send(res, { user: Auth.publicUser(user) })
}
export async function logout(req, res) {
  // the cookie is cleared even if the database cannot be reached
  await revokeSession(req).catch((e) => console.error('session revoke failed:', e.message))
  res.setHeader('Set-Cookie', clearSessionCookie(isSecure(req)))
  ApiResponse.send(res)
}
export async function me(req, res) {
  const u = await loadUser(req)
  res.setHeader('Cache-Control', 'no-store')
  ApiResponse.send(res, { user: u ? Auth.publicUser(u) : null }) // signed out is a normal answer, not an error (keeps the browser console clean)
}
export async function updateProfile(req, res) {
  const user = await Auth.updateProfile(req.user, req.valid)
  ApiResponse.send(res, { user: Auth.publicUser(user) })
}
export async function changePassword(req, res) {
  const user = await Auth.changePassword(req.user, req.valid.current, req.valid.next)
  startSession(req, res, user) // keep this session; every other one is now invalid
  ApiResponse.send(res)
}

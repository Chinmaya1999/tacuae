import * as Auth from '../services/auth.service.js'
import { loadUser } from '../middlewares/auth.middleware.js'
import { clearSessionCookie, generateToken, sessionCookie } from '../utils/generateToken.js'
import { isSecure } from '../utils/sanitize.js'
import ApiResponse from '../utils/ApiResponse.js'

const startSession = (req, res, user) => res.setHeader('Set-Cookie', sessionCookie(generateToken(user), isSecure(req)))

export async function register(req, res) {
  const user = await Auth.register(req.valid)
  startSession(req, res, user)
  ApiResponse.send(res, { user: Auth.publicUser(user) })
}
export async function login(req, res) {
  const user = await Auth.login(req.valid.email, req.valid.password)
  startSession(req, res, user)
  ApiResponse.send(res, { user: Auth.publicUser(user) })
}
export function logout(req, res) {
  res.setHeader('Set-Cookie', clearSessionCookie(isSecure(req)))
  ApiResponse.send(res)
}
export async function me(req, res) {
  const u = await loadUser(req)
  res.setHeader('Cache-Control', 'no-store')
  ApiResponse.send(res, { user: u ? Auth.publicUser(u) : null }) // signed out is a normal answer, not an error (keeps the browser console clean)
}
export async function changePassword(req, res) {
  const user = await Auth.changePassword(req.user, req.valid.current, req.valid.next)
  startSession(req, res, user) // keep this session; every other one is now invalid
  ApiResponse.send(res)
}

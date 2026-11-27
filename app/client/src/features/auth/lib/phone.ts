import { useEffect, useState } from 'react'
import type { FirebaseOptions } from 'firebase/app'
import type { ConfirmationResult } from 'firebase/auth'
import { api } from '../../../shared/lib/api'

let cache: Promise<FirebaseOptions | null> | null = null
const fetchConfig = () => (cache ??= api<{ firebase: FirebaseOptions | null }>('/api/account/phone').then((d) => d.firebase).catch(() => { cache = null; return null }))
/** The Firebase web config from the server, or null when mobile sign-in is off. */
export function useFirebaseConfig() {
  const [config, setConfig] = useState<FirebaseOptions | null>(null)
  useEffect(() => { let on = true; fetchConfig().then((v) => on && setConfig(v)); return () => { on = false } }, [])
  return config
}

/** UAE or Indian mobile number in international form, or null. Same rules as the server's demo validator. */
export function toMobile(v: string) {
  const s = v.replace(/[\s()-]/g, '').replace(/^00/, '+').replace(/^0(?=5\d{8}$)/, '+971').replace(/^(?=[6-9]\d{9}$)/, '+91').replace(/^(?=(9715\d{8}|91[6-9]\d{9})$)/, '+')
  return /^\+(9715\d{8}|91[6-9]\d{9})$/.test(s) ? s : null
}

const MESSAGES: Record<string, string> = {
  'auth/invalid-phone-number': 'That mobile number is not valid.',
  'auth/invalid-verification-code': 'That code is not correct.',
  'auth/code-expired': 'That code has expired. Please request a new one.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/quota-exceeded': 'SMS limit reached. Please try again later.',
  'auth/billing-not-enabled': 'SMS sending is not enabled yet (Firebase billing is off).',
  'auth/operation-not-allowed': 'SMS sign-in is not enabled for this country or project.',
  'auth/unauthorized-domain': 'This website address is not authorised for SMS sign-in.',
  'auth/captcha-check-failed': 'The security check failed for this website address.',
  'auth/invalid-app-credential': 'The security check failed. Please try again.',
  'auth/network-request-failed': 'Could not reach the SMS service. Check your connection.',
}
export const phoneError = (e: unknown) => {
  const code = (e as { code?: string }).code
  return code ? (MESSAGES[code] ?? `Mobile verification failed (${code}).`) : (e as Error).message
}

/** Asks Firebase to text a code. The returned object confirms the code and yields an ID token for our server. */
export async function sendCode(config: FirebaseOptions, phone: string, host: HTMLElement) {
  // loaded only when someone actually uses mobile sign-in
  const [{ getApps, initializeApp }, A] = await Promise.all([import('firebase/app'), import('firebase/auth')])
  const app = getApps()[0] ?? initializeApp(config)
  const auth = A.getAuth(app)
  await A.setPersistence(auth, A.inMemoryPersistence) // the site keeps its own session cookie
  const spot = host.appendChild(document.createElement('div'))
  const captcha = new A.RecaptchaVerifier(auth, spot, { size: 'invisible' })
  try {
    const sent: ConfirmationResult = await A.signInWithPhoneNumber(auth, phone, captcha)
    return async (code: string) => (await sent.confirm(code)).user.getIdToken()
  } finally { captcha.clear(); spot.remove() }
}

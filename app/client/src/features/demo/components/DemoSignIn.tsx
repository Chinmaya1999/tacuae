// DEMO MODE ONLY: simulated mobile OTP, Google and Apple sign-in. They open demo accounts, never real ones.
import { useState } from 'react'
import { MessageSquareText } from 'lucide-react'
import { api } from '../../../shared/lib/api'
import { useAuth, type User } from '../../auth/lib/auth'
import { ErrorNote, control } from '../../auth/components/AuthUI'
import PhoneNumberInput, { fullNumber, type Country } from '../../auth/components/PhoneNumberInput'

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden className="shrink-0">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
)
const AppleIcon = () => (
  <svg viewBox="0 0 384 512" width="16" height="18" aria-hidden className="shrink-0" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" /></svg>
)
const social = 'flex w-full items-center justify-center gap-2.5 whitespace-nowrap rounded-xl border border-line bg-white px-3 py-3 text-sm font-semibold text-[#1f1f1f] shadow-sm transition hover:-translate-y-px hover:shadow-md focus-visible:ring-4 focus-visible:ring-brand/20 disabled:opacity-60'
const note = 'text-center text-xs text-amber-700'

function useDemoEntry() {
  const { adopt } = useAuth()
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const run = (fn: () => Promise<void>) => { setErr(''); setBusy(true); fn().catch((e) => setErr(e.message)).finally(() => setBusy(false)) }
  const enter = async (path: string, body: unknown) => adopt((await api<{ user: User }>(path, { method: 'POST', body })).user)
  return { err, busy, run, enter }
}

/** Simulated social buttons. `google` is hidden once the real Google button is configured. */
export function DemoSocial({ google }: { google: boolean }) {
  const { err, busy, run, enter } = useDemoEntry()
  return (
    <div className="space-y-3">
      <div className={`grid gap-3 ${google ? 'sm:grid-cols-2' : ''}`}>
        {google && <button type="button" disabled={busy} className={social} onClick={() => run(() => enter('/api/demo/social', { provider: 'google' }))}><GoogleIcon /><span>Continue with Google</span></button>}
        <button type="button" disabled={busy} className={social} onClick={() => run(() => enter('/api/demo/social', { provider: 'apple' }))}><AppleIcon /><span>Continue with Apple</span></button>
      </div>
      <ErrorNote text={err} />
      <p className={note}>Demo sign-in — simulated, no {google ? 'Google or ' : ''}Apple connection.</p>
    </div>
  )
}

export function DemoPhone() {
  const { err, busy, run, enter } = useDemoEntry()
  const [country, setCountry] = useState<Country>('+971'), [phone, setPhone] = useState(''), [code, setCode] = useState(''), [sent, setSent] = useState('')
  const number = fullNumber(country, phone)
  const send = () => { if (phone.trim() && !busy) run(async () => setSent((await api<{ demoCode: string }>('/api/demo/otp/request', { method: 'POST', body: { phone: number } })).demoCode)) }
  return (
    <div className="space-y-3">
      <PhoneNumberInput country={country} onCountry={(c) => { setCountry(c); setSent('') }} value={phone} onChange={(v) => { setPhone(v); setSent('') }} onEnter={send} />
      <button type="button" disabled={busy || !phone.trim()} className="btn btn-primary w-full justify-center disabled:opacity-60" onClick={send}>Send code</button>
      {sent && <>
        <p role="status" className="flex items-center gap-2 text-sm text-muted"><MessageSquareText size={16} aria-hidden className="text-brand" />Demo code (would arrive by SMS): <b className="tracking-widest text-primary">{sent}</b></p>
        <div className="flex gap-2"><input aria-label="One-time code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••" className={`${control} px-4 text-center tracking-[0.5em]`} value={code} onChange={(e) => setCode(e.target.value)} /><button type="button" disabled={busy || code.length < 6} className="btn btn-dark disabled:opacity-50" onClick={() => run(() => enter('/api/demo/otp/verify', { phone: number, code }))}>Verify</button></div>
      </>}
      <ErrorNote text={err} />
      <p className={note}>Demo sign-in — simulated, no SMS is sent.</p>
    </div>
  )
}

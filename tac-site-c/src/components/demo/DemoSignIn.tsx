// DEMO MODE ONLY: simulated mobile OTP, Google and Apple sign-in. They open demo accounts, never real ones.
import { useState } from 'react'
import { api } from '../../lib/api'
import { useDemo } from '../../lib/demo'
import { useAuth, type User } from '../../lib/auth'
import { field, small } from '../quote/ui'

export default function DemoSignIn() {
  const demo = useDemo(), { adopt } = useAuth()
  const [phone, setPhone] = useState(''), [code, setCode] = useState(''), [sent, setSent] = useState(''), [err, setErr] = useState('')
  if (!demo) return null
  const run = (fn: () => Promise<void>) => { setErr(''); fn().catch((e) => setErr(e.message)) }
  const enter = async (path: string, body: unknown) => adopt((await api<{ user: User }>(path, { method: 'POST', body })).user)
  return (
    <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
      <p className="text-xs text-amber-300">Demo sign-in — simulated, no SMS, Google or Apple connection.</p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className={small} onClick={() => run(() => enter('/api/demo/social', { provider: 'google' }))}>Continue with Google</button>
        <button type="button" className={small} onClick={() => run(() => enter('/api/demo/social', { provider: 'apple' }))}>Continue with Apple</button>
      </div>
      <div className="flex gap-2"><input aria-label="UAE mobile number" type="tel" placeholder="050 123 4567" className={field} value={phone} onChange={(e) => { setPhone(e.target.value); setSent('') }} />
        <button type="button" className={`${small} whitespace-nowrap`} onClick={() => run(async () => setSent((await api<{ demoCode: string }>('/api/demo/otp/request', { method: 'POST', body: { phone } })).demoCode))}>Send code</button></div>
      {sent && <><p role="status" className="text-sm text-silver">Demo code (would arrive by SMS): <b className="text-cyan">{sent}</b></p>
        <div className="flex gap-2"><input aria-label="One-time code" inputMode="numeric" maxLength={6} className={field} value={code} onChange={(e) => setCode(e.target.value)} /><button type="button" className={small} onClick={() => run(() => enter('/api/demo/otp/verify', { phone, code }))}>Verify</button></div></>}
      {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
    </div>
  )
}

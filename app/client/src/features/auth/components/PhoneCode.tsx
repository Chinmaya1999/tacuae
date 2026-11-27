import { useRef, useState } from 'react'
import type { FirebaseOptions } from 'firebase/app'
import { phoneError, sendCode, toMobile } from '../lib/phone'
import { ErrorNote, control } from './AuthUI'
import PhoneNumberInput, { fullNumber, type Country } from './PhoneNumberInput'

const button = 'shrink-0 whitespace-nowrap rounded-xl border border-brand/40 px-4 text-sm font-semibold text-brand transition hover:bg-brand/10 disabled:opacity-45'

/** Mobile number, SMS code, then `onToken` with Firebase's proof of the number. */
export default function PhoneCode({ config, onToken }: { config: FirebaseOptions; onToken: (idToken: string) => Promise<void> }) {
  const [phone, setPhone] = useState(''), [code, setCode] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const [sent, setSent] = useState<{ to: string; confirm: (code: string) => Promise<string> } | null>(null)
  const [country, setCountry] = useState<Country>('+971')
  const host = useRef<HTMLDivElement>(null)
  const run = (fn: () => Promise<void>) => { setErr(''); setBusy(true); fn().catch((e) => setErr(phoneError(e))).finally(() => setBusy(false)) }
  const send = () => run(async () => {
    const to = toMobile(fullNumber(country, phone))
    if (!to) throw new Error('Enter a UAE or Indian mobile number, e.g. 050 123 4567 or +91 98765 43210.')
    setSent(null); setCode('')
    setSent({ to, confirm: await sendCode(config, to, host.current!) })
  })
  const verify = () => run(async () => { await onToken(await sent!.confirm(code.trim())) })
  // not a <form>: this sits inside pages that already have forms
  const onEnter = (fn: () => void, ready: boolean) => (e: { key: string; preventDefault: () => void }) => { if (e.key === 'Enter') { e.preventDefault(); if (ready && !busy) fn() } }
  return (
    <div className="space-y-3">
      <PhoneNumberInput country={country} onCountry={(c) => { setCountry(c); setSent(null) }} value={phone} onChange={(v) => { setPhone(v); setSent(null); setErr('') }} onEnter={() => { if (phone.trim() && !busy) send() }} />
      <button type="button" disabled={busy || !phone.trim()} className={`${button} w-full py-3`} onClick={send}>{busy && !sent ? 'Sending…' : sent ? 'Resend code' : 'Send code'}</button>
      {sent && <>
        <p role="status" className="text-sm text-slate">We sent a code by SMS to <b className="text-brand">{sent.to}</b>.</p>
        <div className="flex gap-2"><input aria-label="One-time code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••" className={`${control} px-4 text-center tracking-[0.5em]`} value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={onEnter(verify, code.length === 6)} /><button type="button" disabled={busy || code.length < 6} className={button} onClick={verify}>Verify</button></div>
      </>}
      <div ref={host} />
      <ErrorNote text={err} />
    </div>
  )
}

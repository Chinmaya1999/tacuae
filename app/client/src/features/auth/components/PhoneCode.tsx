import { useRef, useState } from 'react'
import { Smartphone } from 'lucide-react'
import type { FirebaseOptions } from 'firebase/app'
import { phoneError, sendCode, toMobile } from '../lib/phone'
import { ErrorNote, control } from './AuthUI'

const button = 'shrink-0 whitespace-nowrap rounded-xl border border-white/15 px-4 text-sm text-silver transition hover:border-cyan hover:text-cyan disabled:opacity-40'

/** Mobile number, SMS code, then `onToken` with Firebase's proof of the number. */
export default function PhoneCode({ config, onToken }: { config: FirebaseOptions; onToken: (idToken: string) => Promise<void> }) {
  const [phone, setPhone] = useState(''), [code, setCode] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const [sent, setSent] = useState<{ to: string; confirm: (code: string) => Promise<string> } | null>(null)
  const host = useRef<HTMLDivElement>(null)
  const run = (fn: () => Promise<void>) => { setErr(''); setBusy(true); fn().catch((e) => setErr(phoneError(e))).finally(() => setBusy(false)) }
  const send = () => run(async () => {
    const to = toMobile(phone)
    if (!to) throw new Error('Enter a UAE or Indian mobile number, e.g. 050 123 4567 or +91 98765 43210.')
    setSent(null); setCode('')
    setSent({ to, confirm: await sendCode(config, to, host.current!) })
  })
  const verify = () => run(async () => { await onToken(await sent!.confirm(code.trim())) })
  // not a <form>: this sits inside pages that already have forms
  const onEnter = (fn: () => void, ready: boolean) => (e: { key: string; preventDefault: () => void }) => { if (e.key === 'Enter') { e.preventDefault(); if (ready && !busy) fn() } }
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="group relative min-w-0 flex-1"><Smartphone size={17} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate group-focus-within:text-cyan" />
          <input aria-label="UAE or Indian mobile number" type="tel" autoComplete="tel" placeholder="050 123 4567 or +91…" className={`${control} pl-11 pr-3`} value={phone} onChange={(e) => { setPhone(e.target.value); setSent(null); setErr('') }} onKeyDown={onEnter(send, Boolean(phone.trim()))} /></div>
        <button type="button" disabled={busy || !phone.trim()} className={button} onClick={send}>{busy && !sent ? 'Sending…' : sent ? 'Resend' : 'Send code'}</button>
      </div>
      {sent && <>
        <p role="status" className="text-sm text-silver">We sent a code by SMS to <b className="text-cyan">{sent.to}</b>.</p>
        <div className="flex gap-2"><input aria-label="One-time code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••" className={`${control} px-4 text-center tracking-[0.5em]`} value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={onEnter(verify, code.length === 6)} /><button type="button" disabled={busy || code.length < 6} className={button} onClick={verify}>Verify</button></div>
      </>}
      <div ref={host} />
      <ErrorNote text={err} />
    </div>
  )
}

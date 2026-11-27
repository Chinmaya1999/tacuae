import { useState, type FormEvent } from 'react'
import { BadgeCheck, Briefcase, Building2, CheckCircle2, FileText, Phone, User as UserIcon } from 'lucide-react'
import { api } from '../../../shared/lib/api'
import { useAuth, type User } from '../../auth/lib/auth'
import { ErrorNote, Submit, TextField, control } from '../../auth/components/AuthUI'
import { SECTORS } from '../../auth/lib/sectors'
import { useFirebaseConfig } from '../../auth/lib/phone'
import PhoneCode from '../../auth/components/PhoneCode'

const card = 'rounded-2xl border border-white/10 bg-white/[.03] p-5 sm:p-6'
const formOf = (u: User) => ({ name: u.name, phone: u.phone, company: u.company, tradeLicence: u.business?.tradeLicence ?? '', trn: u.business?.trn ?? '', sector: u.business?.sector ?? 'other' })

/** The signed-in customer's or builder's own details. */
export default function Profile() {
  const { user, adopt } = useAuth(), firebase = useFirebaseConfig()
  const [f, setF] = useState(() => formOf(user!))
  const [err, setErr] = useState(''), [saved, setSaved] = useState(false), [busy, setBusy] = useState(false)
  if (!user) return null
  const builder = user.role === 'builder', member = Boolean(user.teamRole)
  const dirty = JSON.stringify(f) !== JSON.stringify(formOf(user))
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => { setF({ ...f, [k]: e.target.value }); setSaved(false); setErr('') }
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(''); setSaved(false)
    try { const d = await api<{ user: User }>('/api/account/profile', { method: 'PATCH', body: f }); adopt(d.user); setF(formOf(d.user)); setSaved(true) }
    catch (x) { setErr((x as Error).message) } finally { setBusy(false) }
  }
  const facts: [string, string][] = [
    ['Email', user.email],
    ['Account type', user.role === 'builder' ? 'Builder' : 'Home owner'],
    ['Google sign-in', user.google ? 'Connected' : 'Not connected'],
    ['Mobile sign-in', user.verifiedPhone || 'Not set up'],
    ...(user.createdAt ? [['Member since', new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })] as [string, string]] : []),
    ...(builder ? [['Business verification', user.verified ? 'Verified' : 'Not verified'], ['Price list', user.priceTier ?? 'retail']] as [string, string][] : []),
    ...(member ? [['Company role', user.teamRole!] as [string, string]] : []),
  ]
  return (
    <div className="max-w-3xl space-y-6">
      <div><h1 className="font-display text-3xl">My profile</h1><p className="mt-2 text-sm text-silver">View your account and keep your details up to date.</p></div>
      <section aria-label="Account" className={card}>
        <dl className="grid gap-5 sm:grid-cols-2">{facts.map(([k, v]) => <div key={k} className="min-w-0"><dt className="text-xs uppercase tracking-[0.15em] text-slate">{k}</dt><dd className={`mt-1 break-words ${k === 'Email' ? '' : 'first-letter:uppercase'}`}>{v}</dd></div>)}</dl>
        <p className="mt-5 text-xs text-slate">To change your email or account type, contact TAC.</p>
      </section>
      {firebase && <section aria-label="Mobile sign-in" className={`${card} space-y-3`}>
        <h2 className="font-display text-lg">{user.verifiedPhone ? 'Change your sign-in number' : 'Sign in with your mobile'}</h2>
        <p className="text-sm text-silver">Verify a number by SMS to use it for signing in.</p>
        <PhoneCode key={user.verifiedPhone} config={firebase} onToken={async (credential) => {
          const d = await api<{ user: User }>('/api/account/phone/link', { method: 'POST', body: { credential } })
          adopt(d.user); setF((v) => ({ ...v, phone: v.phone || d.user.phone }))
        }} />
      </section>}
      <form onSubmit={submit} className={`${card} space-y-4`}>
        <h2 className="font-display text-lg">Your details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField id="pn" label="Full name" icon={UserIcon} autoComplete="name" required minLength={2} maxLength={120} value={f.name} onChange={set('name')} />
          <TextField id="pp" label="Phone" icon={Phone} type="tel" autoComplete="tel" maxLength={40} placeholder="050 123 4567" value={f.phone} onChange={set('phone')} />
          {!member && <TextField id="pc" label={builder ? 'Company' : 'Company (optional)'} icon={Building2} autoComplete="organization" maxLength={120} value={f.company} onChange={set('company')} />}
        </div>
        {builder && !member && <fieldset className="grid gap-4 rounded-2xl border border-white/10 p-4 sm:grid-cols-2">
          <legend className="px-2 text-xs uppercase tracking-[0.15em] text-accent">Business details</legend>
          <TextField id="pl" label="Trade licence no." icon={FileText} maxLength={60} value={f.tradeLicence} onChange={set('tradeLicence')} />
          <TextField id="pt" label="TRN (15 digits)" icon={BadgeCheck} inputMode="numeric" maxLength={20} value={f.trn} onChange={set('trn')} />
          <div className="sm:col-span-2"><label htmlFor="ps" className="mb-1.5 block text-sm font-medium text-silver">Business sector</label><div className="relative"><Briefcase size={17} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate" /><select id="ps" value={f.sector} onChange={set('sector')} className={`${control} pl-11 pr-4 capitalize [&>option]:bg-deep`}>{SECTORS.map((x) => <option key={x} value={x}>{x.replaceAll('-', ' ')}</option>)}</select></div></div>
          {user.verified && <p className="text-xs text-amber-300/90 sm:col-span-2">Changing your company name, trade licence or TRN removes verification and trade pricing until TAC checks them again.</p>}
        </fieldset>}
        {member && <p className="text-xs text-slate">Company details are managed by your company owner.</p>}
        <ErrorNote text={err} />
        {saved && <p role="status" className="flex items-center gap-2 text-sm text-emerald-300"><CheckCircle2 size={17} />Your profile has been saved.</p>}
        <div className="sm:max-w-xs"><Submit busy={busy} busyText="Saving…" disabled={!dirty || f.name.trim().length < 2}>Save changes</Submit></div>
      </form>
    </div>
  )
}

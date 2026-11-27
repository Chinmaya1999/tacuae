import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, BadgeCheck, Briefcase, Building2, CheckCircle2, ChevronDown, FileText, HardHat, Home, Loader2, Lock, Mail, Phone, Smartphone, User } from 'lucide-react'
import AuthShell, { Divider, ErrorNote, SignedIn, Submit, TextField, control } from '../components/AuthUI'
import { homeFor, useAuth, type Role } from '../lib/auth'
import { DemoPhone, DemoSocial } from '../../demo/components/DemoSignIn'
import GoogleSignIn from '../components/GoogleSignIn'
import PhoneSignIn from '../components/PhoneSignIn'
import { SECTORS } from '../lib/sectors'
import { useGoogleClientId } from '../lib/google'
import { useFirebaseConfig } from '../lib/phone'
import { useDemo } from '../../demo/lib/demo'
import { company } from '../../../shared/data/content'

function useNoIndex(title: string) {
  useEffect(() => {
    document.title = `${title} | TAC UAE`
    const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex, nofollow'; document.head.appendChild(m)
    return () => m.remove()
  }, [title])
}
const safeNext = (n: string | null, fallback: string) => (n && /^\/(?![/\\])/.test(n) ? n : fallback)
const emailError = (v: string) => (!v.trim() ? 'Enter your email address.' : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Enter a valid email, like name@example.com.')
const Loading = () => <div className="theme-light grid min-h-screen place-items-center"><Loader2 className="animate-spin text-primary" aria-label="Loading" /></div>

/** Leaves the sign-in pages once there is a session, after a short confirmation. */
function Leave({ to }: { to: string }) {
  const nav = useNavigate()
  useEffect(() => {
    const quick = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const t = setTimeout(() => nav(to, { replace: true }), quick ? 0 : 650)
    return () => clearTimeout(t)
  }, [nav, to])
  return <SignedIn />
}

type Method = 'email' | 'mobile'
/** Email or mobile, then the other ways in. Only options the server really offers are shown. */
function Methods({ role, children }: { role?: Role; children: ReactNode }) {
  const [method, setMethod] = useState<Method>('email')
  const google = Boolean(useGoogleClientId()), firebase = Boolean(useFirebaseConfig()), demo = useDemo()
  return (
    <div className="mt-7">
      <div role="tablist" aria-label="Sign-in method" className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-[#eef0f5] p-1">
        {([['email', 'Email', Mail], ['mobile', 'Mobile', Smartphone]] as const).map(([id, label, Icon]) => (
          <button key={id} type="button" role="tab" aria-selected={method === id} onClick={() => setMethod(id)} className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${method === id ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}><Icon size={15} aria-hidden />{label}</button>
        ))}
      </div>
      <div role="tabpanel">
        <div hidden={method !== 'email'}>{children}</div>
        {method === 'mobile' && (firebase ? <PhoneSignIn role={role} /> : demo ? <DemoPhone /> : <p className="rounded-xl border border-line bg-white p-4 text-sm text-muted">Mobile sign-in is not available yet. Please use your email{google ? ' or Google' : ''}.</p>)}
      </div>
      {(google || demo) && <>
        <Divider>Or continue with</Divider>
        <div className="space-y-4"><GoogleSignIn role={role} />{demo && <DemoSocial google={!google} />}</div>
      </>}
    </div>
  )
}

const switchLine = 'mt-7 text-center text-sm text-muted'
const switchLink = 'font-semibold text-primary hover:underline'

export function Login() {
  useNoIndex('Sign in')
  const { user, loading, login } = useAuth(), [q] = useSearchParams()
  const [email, setEmail] = useState(''), [pw, setPw] = useState(''), [remember, setRemember] = useState(false), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const [tried, setTried] = useState(false), [touched, setTouched] = useState(false), [help, setHelp] = useState(false)
  if (loading) return <Loading />
  if (user) return <Leave to={safeNext(q.get('next'), homeFor(user.role))} />
  const emailMsg = tried || (touched && email) ? emailError(email) : '', pwMsg = tried && !pw ? 'Enter your password.' : ''
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setTried(true); setErr('')
    if (emailError(email) || !pw) return document.getElementById(emailError(email) ? 'em' : 'pw')?.focus()
    setBusy(true)
    try { await login(email.trim(), pw, remember) } catch (x) { setErr((x as Error).message); setBusy(false) }
  }
  const reset = `mailto:${company.email}?subject=${encodeURIComponent('Password reset request')}&body=${encodeURIComponent(`Please reset the password for my account: ${email}`)}`
  return (
    <AuthShell title="Welcome back" sub="Sign in to continue to your account.">
      <Methods>
        <form onSubmit={submit} noValidate className="space-y-4">
          <TextField id="em" label="Email" icon={Mail} type="email" autoComplete="email" autoFocus required placeholder="you@example.com" value={email} error={emailMsg} onBlur={() => setTouched(true)} onChange={(e) => { setEmail(e.target.value); setErr('') }} />
          <TextField id="pw" label="Password" icon={Lock} type="password" autoComplete="current-password" required placeholder="Enter your password" value={pw} error={pwMsg} onChange={(e) => { setPw(e.target.value); setErr('') }} />
          <div className="flex items-center justify-between gap-3 text-sm">
            <label className="flex cursor-pointer items-center gap-2.5 py-1 text-[#344054]"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-primary" />Remember me</label>
            <button type="button" aria-expanded={help} onClick={() => setHelp(!help)} className="py-1 font-semibold text-primary hover:underline">Forgot password?</button>
          </div>
          {help && <div className="rounded-xl border border-brand/25 bg-brand/[.06] p-4 text-sm text-[#344054]">
            Online password reset is not available yet. TAC will reset it for you:
            <span className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-semibold text-primary"><a href={reset} className="hover:underline">Email {company.email}</a><a href={company.phoneHref} className="hover:underline">Call {company.phone}</a></span>
          </div>}
          <ErrorNote text={err} />
          <Submit busy={busy} busyText="Signing in…">Sign in<ArrowRight size={17} aria-hidden /></Submit>
        </form>
      </Methods>
      <p className={switchLine}>New here? <Link to="/register" className={switchLink}>Create an account</Link></p>
    </AuthShell>
  )
}

export function Register() {
  useNoIndex('Create account')
  const { user, loading, register } = useAuth(), [q] = useSearchParams()
  const [role, setRole] = useState<'customer' | 'builder'>(q.get('type') === 'builder' ? 'builder' : 'customer')
  const [f, setF] = useState({ name: '', email: '', password: '', company: '', phone: '', website: '', tradeLicence: '', trn: '', sector: 'developer' })
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false), [tried, setTried] = useState(false)
  if (loading) return <Loading />
  if (user) return <Leave to={safeNext(q.get('next'), homeFor(user.role))} />
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => { setF({ ...f, [k]: e.target.value }); setErr('') }
  const errors = { n: f.name.trim().length < 2 ? 'Enter your full name.' : '', e: emailError(f.email), pw: f.password.length < 8 ? 'Use at least 8 characters.' : '' }
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setTried(true); setErr('')
    const first = (Object.keys(errors) as (keyof typeof errors)[]).find((k) => errors[k])
    if (first) return document.getElementById(first)?.focus()
    setBusy(true)
    try { await register({ ...f, role }) } catch (x) { setErr((x as Error).message); setBusy(false) }
  }
  const Opt = ({ id, icon: I, t, d }: { id: 'customer' | 'builder'; icon: typeof Home; t: string; d: string }) => (
    <button type="button" onClick={() => setRole(id)} aria-pressed={role === id} className={`relative rounded-2xl border bg-white p-4 text-left shadow-sm transition ${role === id ? 'border-primary ring-4 ring-brand/15' : 'border-line hover:border-[#cbd0da]'}`}>
      {role === id && <CheckCircle2 size={18} aria-hidden className="absolute right-3 top-3 text-primary" />}
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${role === id ? 'bg-gradient-to-b from-brand to-primary text-white' : 'bg-brand/10 text-primary'}`}><I size={20} aria-hidden /></span>
      <span className="mt-3 block font-display text-sm font-bold">{t}</span><span className="block text-xs text-muted">{d}</span></button>
  )
  const strength = [f.password.length >= 8, /[a-z]/.test(f.password) && /[A-Z]/.test(f.password), /\d/.test(f.password), /[^A-Za-z0-9]/.test(f.password)].filter(Boolean).length
  const meter = f.password ? <div className="mt-2 flex items-center gap-3"><div className="flex flex-1 gap-1.5" aria-hidden>{[1, 2, 3, 4].map((n) => <span key={n} className={`h-1.5 flex-1 rounded-full transition ${n <= strength ? ['bg-red-500', 'bg-amber-500', 'bg-brand', 'bg-emerald-500'][strength - 1] : 'bg-line'}`} />)}</div>
    <span role="status" className="w-24 text-right text-xs text-muted">{f.password.length < 8 ? 'Too short' : ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]}</span></div> : null
  return (
    <AuthShell wide title="Create your account" sub="Design your smart home and get a quote from TAC.">
      <div className="mt-7 grid grid-cols-2 gap-3"><Opt id="customer" icon={Home} t="Home owner" d="Design my own home" /><Opt id="builder" icon={HardHat} t="Builder" d="Design for my clients" /></div>
      <Methods role={role}>
        <form onSubmit={submit} noValidate className="space-y-4">
          <TextField id="n" label="Full name" icon={User} autoComplete="name" required value={f.name} error={tried ? errors.n : ''} onChange={set('name')} />
          <TextField id="e" label="Email" icon={Mail} type="email" autoComplete="email" required placeholder="you@example.com" value={f.email} error={tried ? errors.e : ''} onChange={set('email')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField id="c" label={role === 'builder' ? 'Company' : 'Company (optional)'} icon={Building2} autoComplete="organization" value={f.company} onChange={set('company')} />
            <TextField id="p" label="Phone" icon={Phone} type="tel" autoComplete="tel" placeholder="050 123 4567" value={f.phone} onChange={set('phone')} />
          </div>
          <TextField id="pw" label="Password (min 8 characters)" icon={Lock} type="password" autoComplete="new-password" required minLength={8} value={f.password} error={tried ? errors.pw : ''} onChange={set('password')} hint={meter} />
          {role === 'builder' && <fieldset className="grid gap-4 rounded-2xl border border-line bg-white p-4 sm:grid-cols-2">
            <legend className="px-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary">Business details</legend>
            <TextField id="tl" label="Trade licence no." icon={FileText} maxLength={60} value={f.tradeLicence} onChange={set('tradeLicence')} />
            <TextField id="trn" label="TRN (15 digits)" icon={BadgeCheck} inputMode="numeric" maxLength={20} value={f.trn} onChange={set('trn')} />
            <div className="sm:col-span-2"><label htmlFor="sec" className="mb-1.5 block text-sm font-medium text-[#344054]">Business sector</label><div className="relative"><Briefcase size={17} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate" /><ChevronDown size={17} aria-hidden className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate" /><select id="sec" value={f.sector} onChange={set('sector')} className={`${control} appearance-none pl-11 pr-10 capitalize`}>{SECTORS.map((x) => <option key={x} value={x}>{x.replace('-', ' ')}</option>)}</select></div></div>
            <p className="text-xs text-muted sm:col-span-2">TAC verifies business accounts before trade or partner pricing applies.</p>
          </fieldset>}
          <input tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={f.website} onChange={set('website')} name="website" />
          <ErrorNote text={err} />
          <Submit busy={busy} busyText="Creating…">Create account<ArrowRight size={17} aria-hidden /></Submit>
        </form>
      </Methods>
      <p className={switchLine}>Already registered? <Link to={q.get('next') ? `/login?next=${encodeURIComponent(q.get('next')!)}` : '/login'} className={switchLink}>Sign in</Link></p>
    </AuthShell>
  )
}

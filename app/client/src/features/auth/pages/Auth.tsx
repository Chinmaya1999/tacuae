import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, BadgeCheck, Briefcase, Building2, CheckCircle2, ChevronDown, FileText, HardHat, Home, Loader2, Lock, Mail, Phone, User } from 'lucide-react'
import AuthShell, { ErrorNote, Submit, TextField, control } from '../components/AuthUI'
import { homeFor, useAuth } from '../lib/auth'
import DemoSignIn from '../../demo/components/DemoSignIn'
import GoogleSignIn from '../components/GoogleSignIn'
import PhoneSignIn from '../components/PhoneSignIn'
import { SECTORS } from '../lib/sectors'

function useNoIndex(title: string) {
  useEffect(() => {
    document.title = `${title} | TAC UAE`
    const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex, nofollow'; document.head.appendChild(m)
    return () => m.remove()
  }, [title])
}
const safeNext = (n: string | null, fallback: string) => (n && /^\/(?![\/\\])/.test(n) ? n : fallback)

export function Login() {
  useNoIndex('Sign in')
  const { user, loading, login } = useAuth(), nav = useNavigate(), [q] = useSearchParams()
  const [email, setEmail] = useState(''), [pw, setPw] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  if (loading) return <div className="grid min-h-screen place-items-center bg-midnight"><Loader2 className="animate-spin text-cyan" /></div>
  if (user) return <Navigate to={safeNext(q.get('next'), homeFor(user.role))} replace />
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('')
    try { const u = await login(email, pw); nav(safeNext(q.get('next'), homeFor(u.role)), { replace: true }) } catch (x) { setErr((x as Error).message) } finally { setBusy(false) }
  }
  return (
    <AuthShell title="Welcome back" sub="Customers, builders and TAC admins sign in here.">
      <form onSubmit={submit} className="mt-7 space-y-4">
        <TextField id="em" label="Email" icon={Mail} type="email" autoComplete="email" autoFocus required placeholder="you@example.com" value={email} onChange={(e) => { setEmail(e.target.value); setErr('') }} />
        <TextField id="pw" label="Password" icon={Lock} type="password" autoComplete="current-password" required placeholder="Enter your password" value={pw} onChange={(e) => { setPw(e.target.value); setErr('') }} />
        <ErrorNote text={err} />
        <Submit busy={busy} busyText="Signing in…" disabled={!email || !pw}>Sign in<ArrowRight size={17} /></Submit>
      </form>
      <GoogleSignIn />
      <PhoneSignIn />
      <DemoSignIn />
      <p className="mt-7 border-t border-white/10 pt-5 text-center text-sm text-silver">New here? <Link to="/register" className="font-medium text-cyan hover:underline">Create an account</Link></p>
    </AuthShell>
  )
}

export function Register() {
  useNoIndex('Create account')
  const { user, loading, register } = useAuth(), nav = useNavigate(), [q] = useSearchParams()
  const [role, setRole] = useState<'customer' | 'builder'>(q.get('type') === 'builder' ? 'builder' : 'customer')
  const [f, setF] = useState({ name: '', email: '', password: '', company: '', phone: '', website: '', tradeLicence: '', trn: '', sector: 'developer' })
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  if (loading) return <div className="grid min-h-screen place-items-center bg-midnight"><Loader2 className="animate-spin text-cyan" /></div>
  if (user) return <Navigate to={safeNext(q.get('next'), homeFor(user.role))} replace />
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('')
    try { const u = await register({ ...f, role }); nav(safeNext(q.get('next'), homeFor(u.role)), { replace: true }) } catch (x) { setErr((x as Error).message) } finally { setBusy(false) }
  }
  const Opt = ({ id, icon: I, t, d }: { id: 'customer' | 'builder'; icon: typeof Home; t: string; d: string }) => (
    <button type="button" onClick={() => setRole(id)} aria-pressed={role === id} className={`relative rounded-2xl border p-4 text-left transition ${role === id ? 'border-cyan bg-cyan/10 shadow-lg shadow-cyan/10' : 'border-white/12 hover:border-white/35'}`}>
      {role === id && <CheckCircle2 size={18} aria-hidden className="absolute right-3 top-3 text-cyan" />}
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${role === id ? 'bg-cyan text-midnight' : 'bg-white/5 text-cyan'}`}><I size={20} /></span>
      <span className="mt-3 block font-display text-sm">{t}</span><span className="block text-xs text-silver">{d}</span></button>
  )
  const strength = [f.password.length >= 8, /[a-z]/.test(f.password) && /[A-Z]/.test(f.password), /\d/.test(f.password), /[^A-Za-z0-9]/.test(f.password)].filter(Boolean).length
  const meter = f.password ? <div className="mt-2 flex items-center gap-3"><div className="flex flex-1 gap-1.5" aria-hidden>{[1, 2, 3, 4].map((n) => <span key={n} className={`h-1.5 flex-1 rounded-full transition ${n <= strength ? ['bg-red-400', 'bg-amber-300', 'bg-cyan', 'bg-emerald-400'][strength - 1] : 'bg-white/10'}`} />)}</div>
    <span role="status" className="w-24 text-right text-xs text-slate">{f.password.length < 8 ? 'Too short' : ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]}</span></div> : null
  return (
    <AuthShell wide title="Create your account" sub="Design your smart home and get a quote from TAC.">
      <form onSubmit={submit} className="mt-7 space-y-4">
        <div className="grid grid-cols-2 gap-3"><Opt id="customer" icon={Home} t="Home owner" d="Design my own home" /><Opt id="builder" icon={HardHat} t="Builder" d="Design for my clients" /></div>
        <TextField id="n" label="Full name" icon={User} autoComplete="name" required value={f.name} onChange={set('name')} />
        <TextField id="e" label="Email" icon={Mail} type="email" autoComplete="email" required placeholder="you@example.com" value={f.email} onChange={set('email')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField id="c" label={role === 'builder' ? 'Company' : 'Company (optional)'} icon={Building2} autoComplete="organization" value={f.company} onChange={set('company')} />
          <TextField id="p" label="Phone" icon={Phone} type="tel" autoComplete="tel" placeholder="050 123 4567" value={f.phone} onChange={set('phone')} />
        </div>
        <TextField id="pw" label="Password (min 8 characters)" icon={Lock} type="password" autoComplete="new-password" required minLength={8} value={f.password} onChange={set('password')} hint={meter} />
        {role === 'builder' && <fieldset className="grid gap-4 rounded-2xl border border-white/10 bg-white/[.02] p-4 sm:grid-cols-2">
          <legend className="px-2 text-xs uppercase tracking-[0.15em] text-cyan">Business details</legend>
          <TextField id="tl" label="Trade licence no." icon={FileText} maxLength={60} value={f.tradeLicence} onChange={set('tradeLicence')} />
          <TextField id="trn" label="TRN (15 digits)" icon={BadgeCheck} inputMode="numeric" maxLength={20} value={f.trn} onChange={set('trn')} />
          <div className="sm:col-span-2"><label htmlFor="sec" className="mb-1.5 block text-sm font-medium text-silver">Business sector</label><div className="relative"><Briefcase size={17} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate" /><ChevronDown size={17} aria-hidden className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate" /><select id="sec" value={f.sector} onChange={set('sector')} className={`${control} appearance-none pl-11 pr-10 capitalize [&>option]:bg-deep`}>{SECTORS.map((x) => <option key={x} value={x}>{x.replace('-', ' ')}</option>)}</select></div></div>
          <p className="text-xs text-slate sm:col-span-2">TAC verifies business accounts before trade or partner pricing applies.</p>
        </fieldset>}
        <input tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={f.website} onChange={set('website')} name="website" />
        <ErrorNote text={err} />
        <Submit busy={busy} busyText="Creating…" disabled={f.password.length < 8 || f.name.trim().length < 2 || !f.email}>Create account<ArrowRight size={17} /></Submit>
      </form>
      <GoogleSignIn role={role} />
      <PhoneSignIn role={role} />
      <DemoSignIn />
      <p className="mt-7 border-t border-white/10 pt-5 text-center text-sm text-silver">Already registered? <Link to={q.get('next') ? `/login?next=${encodeURIComponent(q.get('next')!)}` : '/login'} className="font-medium text-cyan hover:underline">Sign in</Link></p>
    </AuthShell>
  )
}

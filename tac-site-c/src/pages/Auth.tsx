import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { HardHat, Home, Loader2 } from 'lucide-react'
import { homeFor, useAuth } from '../lib/auth'

const inputCls = 'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate focus:border-cyan'
const label = 'mb-2 block text-xs uppercase tracking-[0.15em] text-silver'

function useNoIndex(title: string) {
  useEffect(() => {
    document.title = `${title} | TAC UAE`
    const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex, nofollow'; document.head.appendChild(m)
    return () => m.remove()
  }, [title])
}
const safeNext = (n: string | null, fallback: string) => (n && /^\/(?!\/)/.test(n) ? n : fallback)

function Shell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-screen place-items-center bg-midnight px-5 py-10 text-white">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="glass relative w-full max-w-md rounded-3xl border border-white/10 p-8">
        <Link to="/"><img src="/images/site/logo-dark.png" alt="TAC — back to website" className="mb-6 h-10 w-auto" /></Link>
        <h1 className="font-display text-2xl">{title}</h1>
        <p className="mt-1 text-sm text-silver">{sub}</p>
        {children}
      </div>
    </div>
  )
}

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
    <Shell title="Sign in" sub="Customers, builders and TAC admins sign in here.">
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div><label htmlFor="em" className={label}>Email</label><input id="em" type="email" autoComplete="email" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} /></div>
        <div><label htmlFor="pw" className={label}>Password</label><input id="pw" type="password" autoComplete="current-password" required value={pw} onChange={(e) => setPw(e.target.value)} className={inputCls} /></div>
        {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
        <button className="btn btn-primary w-full justify-center disabled:opacity-60" disabled={busy || !email || !pw}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-silver">New here? <Link to="/register" className="text-cyan hover:underline">Create an account</Link></p>
    </Shell>
  )
}

export function Register() {
  useNoIndex('Create account')
  const { user, loading, register } = useAuth(), nav = useNavigate()
  const [role, setRole] = useState<'customer' | 'builder'>('customer')
  const [f, setF] = useState({ name: '', email: '', password: '', company: '', phone: '', website: '' })
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  if (loading) return <div className="grid min-h-screen place-items-center bg-midnight"><Loader2 className="animate-spin text-cyan" /></div>
  if (user) return <Navigate to={homeFor(user.role)} replace />
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('')
    try { const u = await register({ ...f, role }); nav(homeFor(u.role), { replace: true }) } catch (x) { setErr((x as Error).message) } finally { setBusy(false) }
  }
  const Opt = ({ id, icon: I, t, d }: { id: 'customer' | 'builder'; icon: typeof Home; t: string; d: string }) => (
    <button type="button" onClick={() => setRole(id)} aria-pressed={role === id} className={`rounded-xl border p-4 text-left transition ${role === id ? 'border-cyan bg-cyan/10' : 'border-white/15 hover:border-white/40'}`}>
      <I size={20} className="text-cyan" /><div className="mt-2 font-display text-sm">{t}</div><div className="text-xs text-silver">{d}</div></button>
  )
  return (
    <Shell title="Create your account" sub="Design your smart home and get a quote from TAC.">
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3"><Opt id="customer" icon={Home} t="Home owner" d="Design my own home" /><Opt id="builder" icon={HardHat} t="Builder" d="Design for my clients" /></div>
        <div><label htmlFor="n" className={label}>Full name</label><input id="n" autoComplete="name" required value={f.name} onChange={set('name')} className={inputCls} /></div>
        <div><label htmlFor="e" className={label}>Email</label><input id="e" type="email" autoComplete="email" required value={f.email} onChange={set('email')} className={inputCls} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="c" className={label}>{role === 'builder' ? 'Company' : 'Company (optional)'}</label><input id="c" autoComplete="organization" value={f.company} onChange={set('company')} className={inputCls} /></div>
          <div><label htmlFor="p" className={label}>Phone</label><input id="p" type="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} className={inputCls} /></div>
        </div>
        <div><label htmlFor="pw" className={label}>Password (min 8 characters)</label><input id="pw" type="password" autoComplete="new-password" required minLength={8} value={f.password} onChange={set('password')} className={inputCls} /></div>
        <input tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={f.website} onChange={set('website')} name="website" />
        {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
        <button className="btn btn-primary w-full justify-center disabled:opacity-60" disabled={busy || f.password.length < 8 || f.name.trim().length < 2 || !f.email}>{busy ? 'Creating…' : 'Create account'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-silver">Already registered? <Link to="/login" className="text-cyan hover:underline">Sign in</Link></p>
    </Shell>
  )
}

// Shared look of the sign-in and register pages.
import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, Check, Eye, EyeOff, Loader2, Lock, ReceiptText, Rotate3d, ShieldCheck, type LucideIcon } from 'lucide-react'
import ClayScene from '../../../shared/components/ClayScene'
import { company } from '../../../shared/data/content'

export const control = 'field-control'
const caption = 'mb-1.5 block text-sm font-medium text-[color:var(--label-ink,var(--color-silver))]'

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; icon: LucideIcon; hint?: ReactNode; error?: string }
export function TextField({ id, label, icon: Icon, hint, error, type = 'text', ...rest }: FieldProps) {
  const [show, setShow] = useState(false), secret = type === 'password'
  return (
    <div>
      <label htmlFor={id} className={caption}>{label}</label>
      <div className="group relative">
        <Icon size={17} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate transition group-focus-within:text-brand" />
        <input id={id} type={secret && show ? 'text' : type} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} className={`${control} pl-11 ${secret ? 'pr-12' : 'pr-4'}`} {...rest} />
        {secret && <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2.5 text-slate transition hover:text-brand">{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>}
      </div>
      {error && <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1.5 text-[0.82rem] text-[color:var(--color-error,#f87171)]"><AlertCircle size={14} aria-hidden />{error}</p>}
      {hint}
    </div>
  )
}

export const ErrorNote = ({ text }: { text: string }) => (text ? <p role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-sm text-[color:var(--color-error,#fca5a5)]"><AlertCircle size={17} aria-hidden className="mt-0.5 shrink-0" />{text}</p> : null)

export const Submit = ({ busy, disabled, children, busyText }: { busy: boolean; disabled?: boolean; children: ReactNode; busyText: string }) => (
  <button className="btn btn-primary w-full justify-center !py-3.5 text-[0.95rem] disabled:cursor-not-allowed disabled:opacity-65" disabled={busy || disabled}>{busy ? <><Loader2 size={17} className="animate-spin" aria-hidden />{busyText}</> : children}</button>
)

export const Divider = ({ children }: { children: ReactNode }) => (
  <div className="my-6 flex items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate"><span className="h-px flex-1 bg-current opacity-20" /><span>{children}</span><span className="h-px flex-1 bg-current opacity-20" /></div>
)

/** Shown for a moment after signing in, before the next page opens. */
export const SignedIn = () => (
  <div className="theme-light grid min-h-screen place-items-center px-6">
    <motion.div role="status" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="text-center">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-b from-brand to-primary text-white shadow-lg shadow-primary/30"><Check size={30} aria-hidden /></span>
      <p className="mt-5 font-display text-xl font-bold">You're signed in</p><p className="mt-1 text-sm text-muted">Opening your workspace…</p>
    </motion.div>
  </div>
)

const POINTS: [LucideIcon, string, string][] = [
  [Rotate3d, 'Design in 3D', 'Plan rooms and smart devices'],
  [ReceiptText, 'Itemised quotes', 'Track every quotation'],
  [ShieldCheck, 'Protected access', 'Your own private workspace'],
]

/** Two columns on large screens: the visual story on the left, the form on the right. */
export default function AuthShell({ title, sub, wide, children }: { title: string; sub: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-midnight lg:grid-cols-[1.08fr_1fr]">
      <aside className="relative hidden overflow-hidden text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-between lg:px-10 lg:py-8 xl:px-14 xl:py-11">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(90%_70%_at_20%_0%,#2a2f7a_0%,transparent_60%),radial-gradient(80%_60%_at_100%_70%,#3b1d72_0%,transparent_65%)]" />
        <div aria-hidden className="absolute inset-0 grid-bg opacity-70" />
        <Link to="/" aria-label="TAC UAE home" className="relative w-fit"><img src={company.logoDark} alt="TAC — Total Automation" className="h-11 w-auto" /></Link>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }} className="relative flex min-h-0 flex-1 items-center justify-center py-4">
          <ClayScene className="!w-[min(100%,560px,62vh)]" />
        </motion.div>
        <div className="relative">
          <h2 className="max-w-lg text-3xl font-bold leading-[1.15] xl:text-[2.5rem]">Your smart building, <span className="bg-gradient-to-r from-ice to-violet bg-clip-text text-transparent">in one secure place.</span></h2>
          <p className="mt-3 max-w-md text-silver">Design, price and follow your automation project with {company.name}.</p>
          <ul className="mt-7 grid grid-cols-3 gap-3">{POINTS.map(([Icon, t, d]) => <li key={t} className="rounded-2xl border border-white/10 bg-white/[.05] p-3.5 backdrop-blur"><Icon size={19} aria-hidden className="text-accent" /><span className="mt-2.5 block text-sm font-semibold">{t}</span><span className="mt-0.5 block text-xs leading-relaxed text-silver">{d}</span></li>)}</ul>
        </div>
      </aside>

      <main className="theme-light relative flex min-w-0 flex-col px-5 py-5 sm:px-10">
        <div className="flex items-center justify-between lg:justify-end">
          <Link to="/" className="lg:hidden"><img src={company.logo} alt="TAC — back to website" className="h-9 w-auto" /></Link>
          <Link to="/" aria-label="Back to website" className="flex items-center gap-1.5 rounded-lg p-2 text-sm font-medium text-muted transition hover:text-primary"><ArrowLeft size={17} aria-hidden /><span className="hidden sm:inline">Back to website</span></Link>
        </div>
        <div className="flex flex-1 items-center justify-center py-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05 }} className={`w-full ${wide ? 'max-w-[520px]' : 'max-w-[410px]'}`}>
            <img src={company.logo} alt="" className="mb-7 hidden h-11 w-auto lg:block" />
            {/* tablets get a smaller version of the illustration; phones get the form alone */}
            <div aria-hidden className="mb-7 hidden justify-center overflow-hidden rounded-3xl bg-[radial-gradient(90%_120%_at_20%_0%,#2a2f7a_0%,#0b1020_60%,#2a1656_100%)] py-3 sm:flex lg:hidden"><ClayScene className="w-[250px]" /></div>
            <h1 className="text-[2rem] font-bold leading-tight">{title}</h1>
            <p className="mt-2 text-muted">{sub}</p>
            {children}
          </motion.div>
        </div>
        <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-xs text-muted"><span className="inline-flex items-center gap-1.5"><Lock size={13} aria-hidden />Passwords are stored encrypted, never as plain text.</span><Link to="/privacy" className="font-medium hover:text-primary">Privacy Policy</Link></p>
      </main>
    </div>
  )
}

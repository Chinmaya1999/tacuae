// Shared look of the sign-in and register pages.
import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, Building2, Check, Eye, EyeOff, Loader2, Lock, type LucideIcon } from 'lucide-react'
import { company } from '../../data/content'

export const control = 'w-full rounded-xl border border-white/12 bg-white/[.04] py-3 text-[0.95rem] text-white outline-none transition placeholder:text-slate hover:border-white/25 focus:border-cyan focus:bg-cyan/[.04] focus:ring-4 focus:ring-cyan/15'
const caption = 'mb-1.5 block text-sm font-medium text-silver'

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; icon: LucideIcon; hint?: ReactNode }
export function TextField({ id, label, icon: Icon, hint, type = 'text', ...rest }: FieldProps) {
  const [show, setShow] = useState(false), secret = type === 'password'
  return (
    <div>
      <label htmlFor={id} className={caption}>{label}</label>
      <div className="group relative">
        <Icon size={17} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate transition group-focus-within:text-cyan" />
        <input id={id} type={secret && show ? 'text' : type} className={`${control} pl-11 ${secret ? 'pr-12' : 'pr-4'}`} {...rest} />
        {secret && <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate hover:text-cyan">{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>}
      </div>
      {hint}
    </div>
  )
}

export const ErrorNote = ({ text }: { text: string }) => (text ? <p role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-400/35 bg-red-500/10 px-3.5 py-3 text-sm text-red-300"><AlertCircle size={17} className="mt-0.5 shrink-0" />{text}</p> : null)

export const Submit = ({ busy, disabled, children, busyText }: { busy: boolean; disabled: boolean; children: ReactNode; busyText: string }) => (
  <button className="btn btn-primary w-full justify-center !py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-75" disabled={busy || disabled}>{busy ? <><Loader2 size={17} className="animate-spin" />{busyText}</> : children}</button>
)

const POINTS = ['Design your smart home in interactive 3D', 'Live, itemised pricing as you choose', 'Save, share and track your quotations']

/** Two columns on large screens: brand story on the left, the form on the right. */
export default function AuthShell({ title, sub, wide, children }: { title: string; sub: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-midnight text-white lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden border-r border-white/10 lg:sticky lg:top-0 lg:block lg:h-screen">
        <img src="/images/site/hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/70 to-midnight/30" />
        <div aria-hidden className="absolute -left-24 bottom-10 h-96 w-96 rounded-full bg-cyan/20 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <Link to="/" aria-label="TAC UAE home" className="w-fit"><img src={company.logoDark} alt="TAC — Total Automation" className="h-12 w-auto" /></Link>
          <div>
            <p className="eyebrow">Total Automation</p>
            <h2 className="mt-4 max-w-md font-display text-4xl leading-tight xl:text-5xl">Intelligence built into <span className="bg-gradient-to-r from-cyan to-azure bg-clip-text text-transparent">every space.</span></h2>
            <ul className="mt-8 space-y-3.5">{POINTS.map((p) => <li key={p} className="flex items-center gap-3 text-silver"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-cyan/15 text-cyan"><Check size={14} /></span><span>{p}</span></li>)}</ul>
            <dl className="mt-10 flex gap-10 border-t border-white/10 pt-6">{[[String(company.established), 'Established'], ['600+', 'Projects'], ['KNX', 'Training center']].map(([v, k]) => <div key={k}><dt className="sr-only">{k}</dt><dd className="font-display text-2xl">{v}</dd><dd className="text-xs text-slate">{k}</dd></div>)}</dl>
          </div>
        </div>
      </aside>

      <main className="relative flex flex-col px-5 py-6 sm:px-10">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
        <div className="relative flex items-center justify-between">
          <Link to="/" className="lg:invisible"><img src={company.logoDark} alt="TAC — back to website" className="h-9 w-auto" /></Link>
          <Link to="/" aria-label="Back to website" className="flex items-center gap-1.5 p-1 text-sm text-silver hover:text-cyan"><ArrowLeft size={18} /><span className="hidden sm:inline">Back to website</span></Link>
        </div>
        <div className="relative flex flex-1 items-center justify-center py-8">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className={`glass w-full rounded-3xl border border-white/10 p-6 shadow-2xl shadow-black/40 sm:p-9 ${wide ? 'max-w-xl' : 'max-w-[460px]'}`}>
            <h1 className="font-display text-3xl">{title}</h1>
            <p className="mt-2 text-sm text-silver">{sub}</p>
            {children}
          </motion.div>
        </div>
        <p className="relative flex items-center justify-center gap-2 text-xs text-slate"><Building2 size={13} />{company.name}<Lock size={13} className="ml-3" /><Link to="/privacy" className="hover:text-cyan">Privacy Policy</Link></p>
      </main>
    </div>
  )
}

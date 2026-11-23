import { Link, NavLink, Outlet } from 'react-router-dom'
import { ExternalLink, LayoutGrid, LogOut, Mail, Phone, Plus, ReceiptText, Home } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { company } from '../../data/content'
import { useDesigns } from '../../pages/dashboard/useDesigns'

const link = ({ isActive }: { isActive: boolean }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${isActive ? 'bg-cyan/15 text-cyan' : 'text-silver hover:bg-white/5 hover:text-white'}`

/** App frame: sidebar on desktop, bottom tab bar on phones. */
export default function Shell({ builder }: { builder: boolean }) {
  const { user, logout } = useAuth(), { items } = useDesigns()
  const waiting = (items ?? []).filter((d) => d.status === 'quoted').length
  const initials = (user?.name ?? '?').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  const Quotes = <>{<ReceiptText size={18} />}Quotes{waiting > 0 && <span className="ml-auto rounded-full bg-cyan px-2 py-0.5 text-[0.7rem] font-medium text-midnight">{waiting}</span>}</>

  return (
    <div className="min-h-screen bg-midnight text-white lg:grid lg:grid-cols-[272px_1fr]">
      <aside className="hidden border-r border-white/10 bg-deep lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="px-6 pb-4 pt-7"><Link to="/dashboard"><img src="/images/site/logo-dark.png" alt="TAC — dashboard home" className="h-9 w-auto" /></Link></div>
        <div className="px-4"><Link to="/dashboard/design/new" className="btn btn-primary w-full justify-center"><Plus size={18} />New design</Link></div>
        <nav aria-label="Dashboard" className="mt-6 space-y-1 px-4">
          <NavLink to="/dashboard" end className={link}><Home size={18} />Home</NavLink>
          <NavLink to="/dashboard/designs" className={link}><LayoutGrid size={18} />{builder ? 'Client projects' : 'My designs'}</NavLink>
          <NavLink to="/dashboard/quotes" className={link}>{Quotes}</NavLink>
        </nav>
        <div className="mt-auto space-y-4 p-4">
          <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4 text-sm">
            <div className="font-display">Need a hand?</div>
            <p className="mt-1 text-xs text-slate">Our engineers can help you plan your smart home.</p>
            <a href={company.phoneHref} className="mt-3 flex items-center gap-2 text-silver hover:text-cyan"><Phone size={14} />{company.phone}</a>
            <a href={`mailto:${company.email}`} className="mt-1.5 flex items-center gap-2 text-silver hover:text-cyan"><Mail size={14} />{company.email}</a>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 p-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan to-azure font-display text-sm text-midnight" aria-hidden>{initials}</span>
            <div className="min-w-0 flex-1"><div className="truncate text-sm">{user?.name}</div><div className="text-xs capitalize text-slate">{user?.role}</div></div>
            <button onClick={() => logout()} aria-label="Sign out" title="Sign out" className="rounded-lg p-2 text-silver hover:bg-white/5 hover:text-cyan"><LogOut size={17} /></button>
          </div>
          <a href="/" className="flex items-center gap-1.5 px-2 text-xs text-slate hover:text-cyan">Back to website <ExternalLink size={12} /></a>
        </div>
      </aside>

      <div className="min-w-0 pb-24 lg:pb-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-deep/90 px-4 py-3 backdrop-blur lg:hidden">
          <Link to="/dashboard"><img src="/images/site/logo-dark.png" alt="TAC" className="h-8 w-auto" /></Link>
          <button onClick={() => logout()} className="flex items-center gap-2 text-sm text-silver"><LogOut size={16} />Sign out</button>
        </header>
        <main id="main" className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10"><Outlet /></main>
      </div>

      <nav aria-label="Dashboard" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-white/10 bg-deep/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {[['/dashboard', 'Home', Home, true], ['/dashboard/designs', builder ? 'Projects' : 'Designs', LayoutGrid, false]].map(([to, label, I, end]) => {
          const Ic = I as typeof Home
          return <NavLink key={to as string} to={to as string} end={end as boolean} className={({ isActive }) => `flex flex-col items-center gap-1 py-2.5 text-[0.7rem] ${isActive ? 'text-cyan' : 'text-silver'}`}><Ic size={20} />{label as string}</NavLink>
        })}
        <NavLink to="/dashboard/design/new" className="flex flex-col items-center gap-1 py-2.5 text-[0.7rem] text-cyan"><span className="-mt-5 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-cyan to-azure text-midnight shadow-lg shadow-cyan/30"><Plus size={22} /></span>New</NavLink>
        <NavLink to="/dashboard/quotes" className={({ isActive }) => `relative flex flex-col items-center gap-1 py-2.5 text-[0.7rem] ${isActive ? 'text-cyan' : 'text-silver'}`}><ReceiptText size={20} />Quotes{waiting > 0 && <span className="absolute right-[28%] top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-cyan px-1 text-[0.6rem] font-medium text-midnight">{waiting}</span>}</NavLink>
      </nav>
    </div>
  )
}

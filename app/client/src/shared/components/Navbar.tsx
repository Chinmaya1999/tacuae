import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Menu, X } from 'lucide-react'
import { useAuth, homeFor } from '../../features/auth/lib/auth'
import { company, nav, products, projects, services, serviceHref } from '../data/content'

const sub: Record<string, { label: string; to: string }[]> = {
  '/services': services.map((s) => ({ label: s.title, to: serviceHref(s) })),
  '/products': [...products.slice(0, 6).map((p) => ({ label: p.name, to: `/products/${p.slug}` })), { label: 'All products →', to: '/products' }],
  '/projects': projects.map((p) => ({ label: p.name, to: `/projects/${p.slug}` })),
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  const { user } = useAuth()
  const acct = user ? { to: homeFor(user.role), label: user.role === 'admin' ? 'Admin' : user.role === 'sales' ? 'Sales console' : 'My dashboard' } : { to: '/login', label: 'Sign in' }
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 40)
    f(); window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])
  useEffect(() => setOpen(false), [loc.pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', k)
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? 'py-3' : 'py-6'}`}>
        <div className={`container-x`}>
          <div className={`flex items-center justify-between rounded-full px-5 md:px-7 py-2.5 transition-all duration-500 ${scrolled ? 'glass border border-white/10 shadow-2xl shadow-black/30' : 'border border-transparent'}`}>
            <Link to="/" aria-label="TAC UAE home" className="flex items-center gap-3">
              <img src={company.logoDark} alt="TAC — Total Automation" className="h-10 md:h-12 w-auto" />
            </Link>

            <nav aria-label="Primary" className="hidden xl:flex items-center gap-6 whitespace-nowrap text-sm">
              {nav.map((n) => (
                <div key={n.to} className="relative group">
                  <NavLink to={n.to} end={n.to === '/'} className="link-u py-2 inline-flex items-center gap-1 text-white/85 hover:text-white aria-[current=page]:text-white">
                    {n.label}{sub[n.to] && <ChevronDown size={13} aria-hidden className="opacity-60 transition group-hover:rotate-180" />}
                  </NavLink>
                  {sub[n.to] && (
                    <div className="invisible opacity-0 translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-300 absolute left-1/2 -translate-x-1/2 top-full pt-4">
                      <ul className="glass border border-white/10 rounded-2xl p-2 min-w-[300px] shadow-2xl">
                        {sub[n.to].map((s) => (
                          <li key={s.to}><Link to={s.to} className="block rounded-xl px-4 py-2.5 text-white/80 hover:bg-white/5 hover:text-cyan transition-colors">{s.label}</Link></li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="flex shrink-0 items-center gap-3 whitespace-nowrap">
              <Link to={acct.to} className="hidden text-sm text-white/85 hover:text-cyan md:inline">{acct.label}</Link>
              <Link to="/design-my-home" className="btn btn-primary hidden md:inline-flex !py-2.5">Design my smart home</Link>
              <button className="xl:hidden p-2 -mr-2" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? 'Close menu' : 'Open menu'}>
                {open ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div id="mobile-menu" className="fixed inset-0 z-40 bg-midnight overflow-y-auto pt-28 pb-10"
            initial={{ clipPath: 'circle(0% at 92% 4%)' }} animate={{ clipPath: 'circle(150% at 92% 4%)' }} exit={{ clipPath: 'circle(0% at 92% 4%)' }}
            transition={{ duration: 0.7, ease: [0.7, 0, 0.2, 1] }}>
            <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
            <nav aria-label="Mobile" className="container-x relative">
              <ul>
                {nav.map((n, i) => (
                  <motion.li key={n.to} initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.05 }}
                    className="border-b border-white/10">
                    <Link to={n.to} className="block py-4 font-display text-3xl font-light">{n.label}</Link>
                  </motion.li>
                ))}
              </ul>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-8 flex flex-col gap-3">
                <Link to={acct.to} className="btn btn-ghost justify-center">{acct.label}</Link>
                <Link to="/design-my-home" className="btn btn-primary justify-center">Design my smart home</Link>
                <Link to="/project-quote" className="btn btn-ghost justify-center">Get a project quote</Link>
                <Link to="/book" className="btn btn-ghost justify-center">Talk to an expert</Link>
                <a href={company.phoneHref} className="btn btn-ghost justify-center">{company.phone}</a>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

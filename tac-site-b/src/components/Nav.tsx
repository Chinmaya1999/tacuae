import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Menu, X, ArrowUpRight, Phone } from 'lucide-react'
import Logo from './Logo'
import { nav, services, products, company } from '../data/content'
import { Magnetic } from './motion'

function Dropdown({ kind, label, to }: { kind: 'services' | 'products'; label: string; to: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const items = kind === 'services'
    ? services.map((s) => ({ to: `/services/${s.slug}`, label: s.title }))
    : products.map((p) => ({ to: `/products/${p.slug}`, label: p.title }))
  const loc = useLocation()
  useEffect(() => setOpen(false), [loc.pathname])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('keydown', onKey); document.addEventListener('mousedown', onDoc)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDoc) }
  }, [])
  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false) }}>
      <div className="flex items-center gap-1">
        <NavLink to={to} className="nav-link" end={false}>{label}</NavLink>
        <button aria-label={`${label} menu`} aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((o) => !o)}
          className="p-1 text-silver hover:text-white">
          <ChevronDown size={14} className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-1/2 top-full z-50 w-max -translate-x-1/2 pt-4"
          >
            <ul className={`rounded-2xl border border-white/10 bg-midnight/95 p-2 shadow-2xl backdrop-blur-xl ${kind === 'products' ? 'grid w-[34rem] grid-cols-2' : 'w-80'}`}>
              {items.map((it) => (
                <li key={it.to}>
                  <Link to={it.to} className="group flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm text-silver transition hover:bg-white/5 hover:text-white">
                    <span>{it.label}</span>
                    <ArrowUpRight size={14} className="shrink-0 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:text-cyan group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
              <li className={kind === 'products' ? 'col-span-2' : ''}>
                <Link to={to} className="mt-1 flex items-center justify-between rounded-xl border-t border-white/10 px-4 py-3 text-xs font-medium uppercase tracking-widest text-cyan">
                  View all {kind} <ArrowUpRight size={14} />
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menu, setMenu] = useState(false)
  const loc = useLocation()

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40)
    on(); window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  useEffect(() => setMenu(false), [loc.pathname])
  useEffect(() => {
    document.documentElement.style.overflow = menu ? 'hidden' : ''
    return () => { document.documentElement.style.overflow = '' }
  }, [menu])

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[60] transition-all duration-500 ${scrolled || menu
          ? 'border-b border-white/10 bg-midnight/70 py-3 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent py-5 md:py-6'}`}
      >
        <div className="wrap flex items-center justify-between gap-6">
          <Link to="/" aria-label="TAC UAE – home" className="relative z-[70] shrink-0">
            <Logo className="h-8 md:h-10" />
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-5 xl:gap-8 lg:flex">
            {nav.map((n) =>
              n.children ? (
                <Dropdown key={n.to} kind={n.children} label={n.label} to={n.to} />
              ) : (
                <NavLink key={n.to} to={n.to} end={n.to === '/'} className="nav-link">{n.label}</NavLink>
              ),
            )}
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            <a href={company.phoneHref} aria-label={`Call ${company.phone}`} className="hidden text-silver transition hover:text-cyan xl:block"><Phone size={16} /></a>
            <Magnetic>
              <Link to="/contact#enquiry" className="btn btn-primary !py-2.5">Get a Consultation</Link>
            </Magnetic>
          </div>

          <button
            className="relative z-[70] grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white lg:hidden"
            aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu} aria-controls="mobile-menu"
            onClick={() => setMenu((m) => !m)}
          >
            {menu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div
            id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu"
            initial={{ clipPath: 'circle(0% at calc(100% - 2.2rem) 2.6rem)' }}
            animate={{ clipPath: 'circle(150% at calc(100% - 2.2rem) 2.6rem)' }}
            exit={{ clipPath: 'circle(0% at calc(100% - 2.2rem) 2.6rem)' }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[55] flex flex-col overflow-y-auto bg-midnight px-6 pb-10 pt-28"
          >
            <div className="bp-grid pointer-events-none absolute inset-0 opacity-60" />
            <nav aria-label="Mobile" className="relative flex flex-1 flex-col justify-center gap-1">
              {nav.map((n, i) => (
                <motion.div key={n.to} initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
                  <NavLink to={n.to} end={n.to === '/'} className={({ isActive }) =>
                    `flex items-baseline gap-4 border-b border-white/10 py-3.5 font-display text-3xl font-medium ${isActive ? 'text-cyan' : 'text-white'}`}>
                    <span className="text-xs tracking-widest text-slate">0{i + 1}</span>{n.label}
                  </NavLink>
                </motion.div>
              ))}
            </nav>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="relative mt-8 space-y-4">
              <Link to="/contact#enquiry" className="btn btn-primary w-full justify-center">Get a Consultation</Link>
              <a href={company.phoneHref} className="block text-center text-sm text-silver">{company.phone} · {company.email}</a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

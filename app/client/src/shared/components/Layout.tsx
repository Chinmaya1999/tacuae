import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion'
import Lenis from 'lenis'
import Navbar from './Navbar'
import Footer from './Footer'
import { company } from '../data/content'

declare global { interface Window { __lenis?: Lenis } }

function Loader() {
  const [show, setShow] = useState(() => { try { return !sessionStorage.getItem('tac-loaded') } catch { return false } })
  useEffect(() => {
    if (!show) return
    const t = setTimeout(() => { setShow(false); try { sessionStorage.setItem('tac-loaded', '1') } catch { /* noop */ } }, 1100)
    return () => clearTimeout(t)
  }, [show])
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="fixed inset-0 z-[100] grid place-items-center bg-midnight" exit={{ y: '-100%' }} transition={{ duration: 0.8, ease: [0.7, 0, 0.2, 1] }}>
          <div className="text-center">
            <motion.img src={company.logoDark} alt="" className="h-14 w-auto mx-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
            <div className="mt-6 h-px w-48 bg-white/10 overflow-hidden"><motion.div className="h-full bg-accent" initial={{ x: '-100%' }} animate={{ x: 0 }} transition={{ duration: 1, ease: 'easeInOut' }} /></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function Layout() {
  const loc = useLocation()
  const { scrollYProgress } = useScroll()
  const prog = useSpring(scrollYProgress, { stiffness: 120, damping: 28 })

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true })
    window.__lenis = lenis
    let raf = 0
    const tick = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); lenis.destroy(); window.__lenis = undefined }
  }, [])

  useEffect(() => {
    if (loc.hash) {
      setTimeout(() => {
        const el = document.querySelector(loc.hash)
        if (el) window.__lenis ? window.__lenis.scrollTo(el as HTMLElement, { offset: -100 }) : el.scrollIntoView()
      }, 350)
    } else {
      window.__lenis ? window.__lenis.scrollTo(0, { immediate: true }) : window.scrollTo(0, 0)
    }
  }, [loc.pathname, loc.hash])

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:bg-accent focus:text-midnight focus:px-4 focus:py-2 focus:rounded">Skip to content</a>
      <Loader />
      <motion.div className="fixed left-0 top-0 z-[60] h-[2px] w-full origin-left bg-gradient-to-r from-accent to-brand" style={{ scaleX: prog }} />
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main id="main" key={loc.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <Footer />
    </>
  )
}

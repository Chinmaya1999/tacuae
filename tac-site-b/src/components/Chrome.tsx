import { useEffect, useState } from 'react'
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion'
import Logo from './Logo'

export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 })
  return <motion.div aria-hidden style={{ scaleX }} className="fixed inset-x-0 top-0 z-[90] h-[2px] origin-left bg-gradient-to-r from-intel to-cyan" />
}

/** Short branded intro, shown once per session. Content renders underneath so it never delays LCP. */
export function Loader() {
  const [show, setShow] = useState(() => {
    try {
      if (sessionStorage.getItem('tac-intro')) return false
      return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch { return false }
  })
  useEffect(() => {
    if (!show) return
    const t = setTimeout(() => { setShow(false); try { sessionStorage.setItem('tac-intro', '1') } catch { /* ignore */ } }, 1500)
    return () => clearTimeout(t)
  }, [show])
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          aria-hidden
          className="fixed inset-0 z-[120] grid place-items-center bg-midnight"
          exit={{ clipPath: 'inset(0 0 100% 0)' }} transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="bp-grid absolute inset-0" />
          <div className="relative flex flex-col items-center gap-8">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
              <Logo className="h-16" />
            </motion.div>
            <div className="h-px w-56 overflow-hidden bg-white/10">
              <motion.div className="h-full bg-cyan" initial={{ x: '-100%' }} animate={{ x: 0 }} transition={{ duration: 1.2, ease: [0.65, 0, 0.35, 1] }} />
            </div>
            <p className="eyebrow !tracking-[0.4em]">Initialising intelligent environment</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

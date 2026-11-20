import { motion, useInView, useReducedMotion, animate } from 'framer-motion'
import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { isFinePointer } from '../lib/smooth'

const EASE = [0.16, 1, 0.3, 1] as const

/** Word-by-word heading reveal. */
export function WordReveal({ text, as: Tag = 'h2', className = '', delay = 0, immediate = false, stagger = 0.07 }: {
  text: string; as?: ElementType; className?: string; delay?: number; immediate?: boolean; stagger?: number
}) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-12% 0px' })
  const reduce = useReducedMotion()
  const show = immediate || inView
  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {text.split(' ').map((w, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden align-bottom pb-[0.12em] -mb-[0.12em]">
          <motion.span
            className="inline-block"
            initial={reduce ? false : { y: '110%' }}
            animate={show ? { y: 0 } : undefined}
            transition={{ duration: 0.9, ease: EASE, delay: delay + i * stagger }}
          >
            {w}&nbsp;
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}

export function Reveal({ children, delay = 0, y = 28, className = '', as = 'div' }: {
  children: ReactNode; delay?: number; y?: number; className?: string; as?: 'div' | 'li' | 'p' | 'span'
}) {
  const reduce = useReducedMotion()
  const M = motion[as] as typeof motion.div
  return (
    <M
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </M>
  )
}

/** Image mask reveal: a clip-path wipe with the image settling from a slight zoom. */
export function MaskReveal({ children, className = '', dir = 'up' }: { children: ReactNode; className?: string; dir?: 'up' | 'left' | 'right' }) {
  const reduce = useReducedMotion()
  const from = dir === 'up' ? 'inset(100% 0 0 0)' : dir === 'left' ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)'
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { clipPath: from }}
      whileInView={{ clipPath: 'inset(0% 0 0 0)' }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 1.3, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

/** Scroll-linked parallax via GSAP ScrollTrigger (transform only). */
export function Parallax({ children, amount = 60, className = '', scale }: { children: ReactNode; amount?: number; className?: string; scale?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = ref.current!
    const amt = window.innerWidth < 768 ? amount * 0.4 : amount
    const tween = gsap.fromTo(el, { yPercent: -amt / 4, scale: scale ?? 1 }, {
      yPercent: amt / 4, scale: scale ? 1 : 1, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
    })
    return () => { tween.scrollTrigger?.kill(); tween.kill() }
  }, [amount, scale])
  return <div ref={ref} className={className} style={{ willChange: 'transform' }}>{children}</div>
}

export function Counter({ to, suffix = '', prefix = '', duration = 2.2, className = '' }: { to: number; suffix?: string; prefix?: string; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const reduce = useReducedMotion()
  const [v, setV] = useState(reduce ? to : 0)
  useEffect(() => {
    if (!inView || reduce) return
    const c = animate(0, to, { duration, ease: EASE, onUpdate: (x) => setV(Math.round(x)) })
    return () => c.stop()
  }, [inView, to, duration, reduce])
  const fmt = to === 1998 ? String(v) : v.toLocaleString('en-US')
  return <span ref={ref} className={className}>{prefix}{fmt}{suffix}</span>
}

/** Magnetic hover for CTAs (desktop pointers only). */
export function Magnetic({ children, strength = 0.28, className = '' }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !isFinePointer() || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' })
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      xTo((e.clientX - (r.left + r.width / 2)) * strength)
      yTo((e.clientY - (r.top + r.height / 2)) * strength)
    }
    const leave = () => { xTo(0); yTo(0) }
    el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave)
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave) }
  }, [strength])
  return <div ref={ref} className={`inline-block ${className}`}>{children}</div>
}

/** Cyan hairline that draws in on scroll. */
export function DrawLine({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current!
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { gsap.set(el, { scaleX: 1 }); return }
    const t = gsap.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } })
    return () => { t.scrollTrigger?.kill(); t.kill() }
  }, [])
  return <div ref={ref} className={`h-px origin-left bg-gradient-to-r from-cyan via-intel/60 to-transparent ${className}`} />
}

export { ScrollTrigger }

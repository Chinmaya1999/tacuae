import { motion, useInView, animate, useMotionValue, useSpring } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { isCoarse } from '../lib/useReducedMotion'

export function Reveal({ children, delay = 0, className = '', y = 28 }: { children: ReactNode; delay?: number; className?: string; y?: number }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.8, delay, ease: [0.2, 0.7, 0.2, 1] }}>
      {children}
    </motion.div>
  )
}

export function Words({ text, className = '', delay = 0, as = 'h2' }: { text: string; className?: string; delay?: number; as?: 'h1' | 'h2' | 'h3' }) {
  const M = motion[as]
  return (
    <M className={className} initial="h" whileInView="v" viewport={{ once: true, margin: '-60px' }} aria-label={text}>
      {text.split(' ').map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.08em] mr-[0.26em]" aria-hidden>
          <motion.span className="inline-block" variants={{ h: { y: '110%' }, v: { y: 0 } }}
            transition={{ duration: 0.8, delay: delay + i * 0.07, ease: [0.2, 0.7, 0.2, 1] }}>{w}</motion.span>
        </span>
      ))}
    </M>
  )
}

export function MaskImage({ src, alt, className = '', imgClass = '', ratio = 'aspect-[4/3]', priority = false }:
  { src: string; alt: string; className?: string; imgClass?: string; ratio?: string; priority?: boolean }) {
  // Reveal with a sliding curtain (transform) instead of an animated clip-path: an element clipped to
  // zero area is treated as off-screen by some mobile browsers, so its reveal would never start.
  return (
    <div className={`relative overflow-hidden ${ratio} ${className}`}>
      <img src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} decoding="async"
        className={`h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-110 ${imgClass}`} />
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 bg-midnight" style={{ transformOrigin: 'top' }}
        initial={{ scaleY: 1 }} whileInView={{ scaleY: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 1.1, ease: [0.7, 0, 0.2, 1] }} />
    </div>
  )
}

export function Counter({ to, suffix = '', label }: { to: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!inView) return
    const c = animate(0, to, { duration: 2, ease: 'easeOut', onUpdate: (x) => setV(Math.round(x)) })
    return () => c.stop()
  }, [inView, to])
  return (
    <div>
      <div className="font-display text-4xl md:text-6xl font-light text-white tabular-nums">
        <span ref={ref}>{v}</span>{suffix}
      </div>
      <div className="mt-2 text-xs uppercase tracking-[0.2em] text-silver">{label}</div>
    </div>
  )
}

/** Magnetic CTA — desktop pointer only */
export function Magnetic({ to, href, children, variant = 'primary', onClick }:
  { to?: string; href?: string; children: ReactNode; variant?: 'primary' | 'ghost' | 'dark'; onClick?: () => void }) {
  const x = useMotionValue(0), y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 18 }), sy = useSpring(y, { stiffness: 220, damping: 18 })
  const move = (e: MouseEvent<HTMLElement>) => {
    if (isCoarse()) return
    const r = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - r.left - r.width / 2) * 0.25); y.set((e.clientY - r.top - r.height / 2) * 0.35)
  }
  const reset = () => { x.set(0); y.set(0) }
  const cls = `btn btn-${variant}`
  const inner = <>{children}<ArrowUpRight size={16} aria-hidden /></>
  return (
    <motion.span style={{ x: sx, y: sy }} onMouseMove={move} onMouseLeave={reset} className="inline-block">
      {to ? <Link to={to} className={cls}>{inner}</Link>
        : href ? <a href={href} className={cls}>{inner}</a>
        : <button type="button" className={cls} onClick={onClick}>{inner}</button>}
    </motion.span>
  )
}

export function PageHero({ eyebrow, title, text, image }: { eyebrow: string; title: string; text?: string; image?: string }) {
  return (
    <section className="relative isolate overflow-hidden pt-40 pb-20 md:pt-52 md:pb-28">
      {image && <img src={image} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-35" />}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-midnight/60 via-midnight/80 to-midnight" />
      <div className="absolute inset-0 -z-10 grid-bg opacity-60" />
      <div className="container-x">
        <span className="eyebrow">{eyebrow}</span>
        <Words as="h1" text={title} className="display mt-6 max-w-5xl" />
        {text && <Reveal delay={0.3}><p className="mt-8 max-w-2xl text-lg text-silver leading-relaxed">{text}</p></Reveal>}
      </div>
    </section>
  )
}

export function Breadcrumb({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs uppercase tracking-[0.18em] text-slate flex gap-2 flex-wrap">
      {items.map((it, i) => (
        <span key={i} className="flex gap-2">
          {it.to ? <Link className="hover:text-cyan" to={it.to}>{it.label}</Link> : <span className="text-silver">{it.label}</span>}
          {i < items.length - 1 && <span aria-hidden>/</span>}
        </span>
      ))}
    </nav>
  )
}

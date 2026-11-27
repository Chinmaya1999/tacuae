// All services in one stage: choose on the left, see it move on the right.
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { services, serviceHref } from '../../../shared/data/content'
import { usePrefersReduced } from '../../../shared/lib/useReducedMotion'
import { MediaLoop } from './ServiceScene'
import SectionHeader from '../../../shared/components/SectionHeader'

const STAY = 7000
export default function SolutionsShowcase() {
  const [index, setIndex] = useState(0), [held, setHeld] = useState(false)
  const ref = useRef<HTMLElement>(null), inView = useInView(ref, { amount: 0.3 }), reduced = usePrefersReduced()
  const running = inView && !held && !reduced
  useEffect(() => { if (!running) return; const t = setTimeout(() => setIndex((i) => (i + 1) % services.length), STAY); return () => clearTimeout(t) }, [index, running])
  const s = services[index]
  return (
    <section ref={ref} aria-labelledby="solutions" className="light-section section">
      <div className="container-x">
        <SectionHeader id="solutions" eyebrow="Our Solutions" title="Intelligent systems for every building." text="What we design, supply and integrate. Choose one to see it." />
        <div className="grid items-start gap-6 lg:grid-cols-12" onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)} onFocus={() => setHeld(true)} onBlur={() => setHeld(false)}>
          <ul className="rail flex gap-2 overflow-x-auto lg:col-span-4 lg:block lg:space-y-2 lg:overflow-visible">
            {services.map((x, i) => (
              <li key={x.slug} className="shrink-0">
                <button type="button" aria-pressed={i === index} onClick={() => setIndex(i)} className={`relative w-full overflow-hidden rounded-2xl border px-4 py-3.5 text-left transition lg:px-5 ${i === index ? 'border-transparent bg-midnight text-white shadow-lift' : 'border-line bg-white text-ink hover:border-[#c7cbe8]'}`}>
                  <span className="flex items-baseline gap-3"><span className={`font-display text-xs font-bold ${i === index ? 'text-accent' : 'text-primary'}`}>0{i + 1}</span><span className="whitespace-nowrap font-display text-sm font-bold lg:whitespace-normal lg:text-base">{x.title}</span></span>
                  {i === index && running && <span key={index} aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-gradient-to-r from-accent to-violet" style={{ animation: `a-fill ${STAY}ms linear forwards` }} />}
                </button>
              </li>
            ))}
          </ul>
          <div className="overflow-hidden rounded-3xl bg-midnight text-white shadow-lift lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div key={s.slug} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
                <div className="group aspect-[16/9]"><MediaLoop image={s.image} alt={s.title} slug={s.slug} /></div>
                <div className="p-6 sm:p-8">
                  <h3 className="text-2xl font-bold">{s.title}</h3>
                  <p className="mt-3 max-w-2xl leading-relaxed text-silver">{s.description}</p>
                  <ul className="mt-5 flex flex-wrap gap-2">{s.capabilities.map((c) => <li key={c} className="rounded-full border border-white/15 px-3 py-1 text-xs text-ice">{c}</li>)}</ul>
                  <Link to={serviceHref(s)} className="btn btn-primary mt-6">Explore solution<ArrowUpRight size={16} aria-hidden /></Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

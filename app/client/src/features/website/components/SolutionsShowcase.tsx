// All services in one stage: choose on the left, see it move on the right.
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { services, serviceHref } from '../../../shared/data/content'
import { usePrefersReduced } from '../../../shared/lib/useReducedMotion'
import { MediaLoop } from './ServiceScene'
import { hasWebGL, isSoftwareGL } from '../../../shared/lib/webgl'
import { isCoarse } from '../../../shared/lib/useReducedMotion'
import { STEPS, STEP_MS } from './service3d/steps'

const ServiceStage = lazy(() => import('./service3d/ServiceStage'))
import SectionHeader from '../../../shared/components/SectionHeader'

const STAY = STEP_MS * 4 // each service stays for its whole four-step story
export default function SolutionsShowcase() {
  const [index, setIndex] = useState(0), [held, setHeld] = useState(false)
  const ref = useRef<HTMLElement>(null), inView = useInView(ref, { amount: 0.3 }), reduced = usePrefersReduced()
  const running = inView && !held && !reduced
  useEffect(() => { if (!running) return; const t = setTimeout(() => setIndex((i) => (i + 1) % services.length), STAY); return () => clearTimeout(t) }, [index, running])
  const s = services[index]
  // the 3D set is loaded when the section is nearly on screen, then paused whenever it is not
  const near = useInView(ref, { margin: '300px', once: true }), visible = useInView(ref, { amount: 0.15 })
  const [webgl, setWebgl] = useState(false), [story, setStory] = useState({ slug: s.slug, step: 0 })
  useEffect(() => { if (near) setWebgl(hasWebGL()) }, [near])
  const step = story.slug === s.slug ? story.step : 0
  useEffect(() => {
    if (!visible || reduced) return
    const t = setTimeout(() => setStory({ slug: s.slug, step: (step + 1) % 4 }), STEP_MS)
    return () => clearTimeout(t)
  }, [s.slug, step, visible, reduced])
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
            <div className="relative aspect-[4/3] sm:aspect-[16/9]" role="group" aria-label={`3D animation: ${s.title}`}>
              {webgl
                ? <Suspense fallback={<span role="status" aria-label="Loading 3D scene" className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-2 border-white/20 border-t-white" />}><div className="absolute inset-0"><ServiceStage slug={s.slug} step={step} running={visible} still={reduced} rich={!isCoarse() && !isSoftwareGL()} slow={isSoftwareGL()} /></div></Suspense>
                : <div className="group absolute inset-0"><MediaLoop image={s.image} alt={s.title} slug={s.slug} /></div>}
              <p className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/20 bg-midnight/75 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-ice backdrop-blur">3D illustration</p>
              <div className="absolute inset-x-3 bottom-3 flex flex-col items-center gap-2">
                <p className="max-w-full rounded-2xl border border-white/15 bg-midnight/85 px-4 py-2 text-center text-sm font-semibold backdrop-blur" data-testid="service-step">{STEPS[s.slug][step]}</p>
                <div role="group" aria-label="Steps" className="flex gap-1.5">{STEPS[s.slug].map((text, i) => <button key={text} type="button" aria-label={`Step ${i + 1}: ${text}`} aria-pressed={i === step} onClick={() => { setStory({ slug: s.slug, step: i }); setHeld(true) }} className={`h-2.5 rounded-full transition-all ${i === step ? 'w-8 bg-accent' : 'w-2.5 bg-white/35 hover:bg-white/70'}`} />)}</div>
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={s.slug} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="p-6 sm:p-8">
                <h3 className="text-2xl font-bold">{s.title}</h3>
                <p className="mt-3 max-w-2xl leading-relaxed text-silver">{s.description}</p>
                <ul className="mt-5 flex flex-wrap gap-2">{s.capabilities.map((c) => <li key={c} className="rounded-full border border-white/15 px-3 py-1 text-xs text-ice">{c}</li>)}</ul>
                <Link to={serviceHref(s)} className="btn btn-primary mt-6">Explore solution<ArrowUpRight size={16} aria-hidden /></Link>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

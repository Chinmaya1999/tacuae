// Landing hero: TAC's own photography, one scene per kind of place, with the systems TAC controls there.
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useInView, useScroll, useTransform } from 'framer-motion'
import { ArrowDown, ArrowUpRight, Building2, Hotel, House, MapPin, Pause, Play, Trophy, Landmark, type LucideIcon } from 'lucide-react'
import { company, services, serviceHref } from '../../../shared/data/content'
import { usePrefersReduced } from '../../../shared/lib/useReducedMotion'

type Slide = { id: string; label: string; icon: LucideIcon; image: string; focus: string; service: string; place?: [string, string] }
const SLIDES: Slide[] = [
  { id: 'dubai', label: 'Buildings', icon: Landmark, image: '/images/site/hero.jpg', focus: 'center 35%', service: 'building-management-system' },
  { id: 'hotels', label: 'Hotels', icon: Hotel, image: '/images/projects/lapita.jpg', focus: 'center 60%', service: 'guest-room-management-system', place: ['Lapita Hotel', '/projects/lapita-hotel'] },
  { id: 'venues', label: 'Venues', icon: Trophy, image: '/images/projects/meydan.jpg', focus: 'center 50%', service: 'lighting-and-dimming-control', place: ['Meydan Grandstand & Racecourse', '/projects/meydan-grandstand-racecourse'] },
  { id: 'homes', label: 'Homes', icon: House, image: '/images/services/smart-home.jpg', focus: 'center 45%', service: 'smart-home-automation' },
  { id: 'offices', label: 'Offices', icon: Building2, image: '/images/services/bms.jpg', focus: 'center 40%', service: 'knx-automation' },
]
const STAY = 7000

export default function ShowcaseHero() {
  const [index, setIndex] = useState(0), [playing, setPlaying] = useState(true)
  const ref = useRef<HTMLElement>(null), inView = useInView(ref, { amount: 0.4 }), reduced = usePrefersReduced()
  const running = playing && inView && !reduced
  useEffect(() => { if (!running) return; const t = setTimeout(() => setIndex((i) => (i + 1) % SLIDES.length), STAY); return () => clearTimeout(t) }, [index, running])
  // the photograph drifts a little slower than the page
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : '16%'])
  const slide = SLIDES[index], service = services.find((s) => s.slug === slide.service)!

  return (
    <section ref={ref} aria-label="Welcome to TAC" className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-midnight">
      <motion.div aria-hidden className="absolute inset-0 -z-20" style={{ y }}>
        <AnimatePresence initial={false}>
          <motion.img key={slide.id} src={slide.image} alt="" fetchPriority={index === 0 ? 'high' : 'auto'} className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: slide.focus }}
            initial={{ opacity: 0, scale: 1.14, clipPath: reduced ? 'inset(0 0 0 0)' : 'inset(0 0 0 100%)' }} animate={{ opacity: 1, scale: 1.02, clipPath: 'inset(0 0 0 0%)' }} exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 0.9 }, clipPath: { duration: 1.1, ease: [0.7, 0, 0.2, 1] }, scale: { duration: STAY / 1000 + 1.5, ease: 'linear' } }} />
        </AnimatePresence>
      </motion.div>
      {/* shading keeps the text readable on any photograph */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(6,10,24,.84)_0%,rgba(6,10,24,.5)_40%,rgba(6,10,24,0)_68%,rgba(6,10,24,.12)_100%)]" />
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-[#060a18]/80 to-transparent" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-2/5 bg-gradient-to-t from-midnight via-midnight/55 to-transparent" />

      <div className="container-x grid flex-1 items-center gap-8 pb-8 pt-32 lg:grid-cols-12 [@media(max-height:780px)]:pb-4 [@media(max-height:780px)]:pt-24">
        <div className="lg:col-span-7">
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-black/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] backdrop-blur"><span className="h-2 w-2 rounded-full bg-[#6fd66f] shadow-[0_0_12px_#6fd66f]" />Customer-centric since {company.established}</motion.p>
          <h1 className="mt-5 font-display text-[2.6rem] font-extrabold leading-[1.02] tracking-[-0.045em] sm:text-6xl xl:text-[clamp(3.4rem,9svh,5.2rem)]">
            {['Competence in', 'technology', '& design.'].map((line, i) => <span key={line} className="-mb-[0.18em] block overflow-hidden"><motion.span initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ delay: 0.3 + i * 0.12, duration: 0.85, ease: [0.2, 0.7, 0.2, 1] }} className={`block pb-[0.18em] ${i === 1 ? 'bg-gradient-to-r from-[#9ff0a0] via-[#c7d2fe] to-accent bg-clip-text text-transparent' : ''}`}>{line}</motion.span></span>)}
          </h1>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">Home and building automation, manufactured, designed and integrated in Dubai: BMS, guest room management, KNX and lighting control.</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to="/projects" className="btn btn-primary !px-6 !py-3.5">View projects<ArrowUpRight size={17} aria-hidden /></Link>
              <Link to="/contact" className="btn btn-ghost !px-6 !py-3.5">Contact us</Link>
              <Link to="/#smart-home" className="group ml-1 inline-flex items-center gap-2.5 py-2 text-sm font-semibold text-white"><span className="grid h-10 w-10 place-items-center rounded-full border border-white/35 transition group-hover:bg-white group-hover:text-midnight"><ArrowDown size={17} aria-hidden /></span>Try our live smart home</Link>
            </div>
          </motion.div>
        </div>

        {/* what TAC controls in the place being shown */}
        <div className="hidden justify-self-end lg:col-span-5 lg:block lg:w-full lg:max-w-[360px]">
          <AnimatePresence mode="wait">
            <motion.div key={slide.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.4 }} className="rounded-3xl border border-white/18 bg-[#0b1020]/62 p-6 shadow-lift backdrop-blur-xl">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9ff0a0]">{slide.label} · what we automate</p>
              <h2 className="mt-2 text-xl font-bold leading-snug">{service.title}</h2>
              <ul className="mt-4 flex flex-wrap gap-2">{service.capabilities.map((c, i) => <motion.li key={c} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 + i * 0.09 }} className="flex items-center gap-2 rounded-full border border-white/18 bg-white/[.07] px-3 py-1.5 text-xs font-semibold"><span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[#6fd66f]" style={{ animationDelay: `${i * 0.35}s` }} />{c}</motion.li>)}</ul>
              <Link to={serviceHref(service)} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ice hover:text-white">Explore this solution<ArrowUpRight size={15} aria-hidden /></Link>
              {slide.place && <Link to={slide.place[1]} className="mt-4 flex items-center gap-2 border-t border-white/12 pt-3 text-xs text-silver hover:text-white"><MapPin size={14} aria-hidden className="text-[#9ff0a0]" />TAC project in the photo: <b>{slide.place[0]}</b></Link>}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* choose a place */}
      <div className="container-x pb-6">
        <div className="mb-5 flex flex-wrap gap-x-10 gap-y-2 text-sm [@media(max-height:780px)]:hidden">
          {[[String(company.established), 'Established'], [`${company.projects}+`, 'Projects completed'], ['KNX', 'Certified training center']].map(([v, k]) => <p key={k} className="flex items-baseline gap-2.5"><b className="font-display text-2xl font-extrabold">{v}</b><span className="text-silver">{k}</span></p>)}
        </div>
        <div className="flex items-stretch gap-2 [@media(max-width:1439px)]:lg:pr-16">
          <div role="group" aria-label="Where we work" className="rail flex flex-1 gap-2 overflow-x-auto">
            {SLIDES.map((s, i) => <button key={s.id} type="button" aria-pressed={i === index} onClick={() => setIndex(i)} className={`group relative flex min-w-[9.5rem] flex-1 items-center gap-3 overflow-hidden rounded-2xl border p-2 pr-3 text-left backdrop-blur-md transition ${i === index ? 'border-white/55 bg-white/16' : 'border-white/14 bg-black/35 hover:border-white/40'}`}>
              <img src={s.image} alt="" loading="lazy" className="h-12 w-14 shrink-0 rounded-xl object-cover transition group-hover:scale-105" />
              <span className="flex items-center gap-2 text-sm font-bold"><s.icon size={15} aria-hidden className="hidden xl:block" />{s.label}</span>
              {i === index && running && <span key={index} aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-gradient-to-r from-[#6fd66f] to-accent" style={{ animation: `a-fill ${STAY}ms linear forwards` }} />}
            </button>)}
          </div>
          {!reduced && <button type="button" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause the slideshow' : 'Play the slideshow'} className="hidden w-14 shrink-0 place-items-center rounded-2xl border border-white/14 bg-black/35 backdrop-blur-md hover:border-white/40 sm:grid">{playing ? <Pause size={18} aria-hidden /> : <Play size={18} aria-hidden />}</button>}
        </div>
      </div>
    </section>
  )
}

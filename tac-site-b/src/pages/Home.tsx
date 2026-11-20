import { lazy, Suspense, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowLeft, ArrowUpRight, Award, Check } from 'lucide-react'
import { useInView } from 'framer-motion'
import HeroBackground from '../components/HeroBackground'
import Img from '../components/Img'
import ContactBlock from '../components/ContactBlock'
import { Counter, DrawLine, Magnetic, MaskReveal, Parallax, Reveal, WordReveal } from '../components/motion'
import { ProductCard, ProjectCard, SectionHead } from '../components/ui'
import { about, company, products, services, training, yearsInIndustry, projectBySlug } from '../data/content'
import { useSeo } from '../lib/seo'

const SmartHome = lazy(() => import('../components/SmartHome'))

/* ------------------------------------------------------------------ HERO */
function Hero() {
  return (
    <section className="relative flex min-h-[100svh] items-end overflow-hidden" aria-label="Introduction">
      <HeroBackground />
      <div className="wrap relative z-10 pb-24 pt-40 md:pb-32">
        <Reveal y={16} className="mb-8">
          <span className="inline-flex items-center gap-3 rounded-full border border-cyan/30 bg-midnight/50 px-4 py-2 backdrop-blur-md">
            <span className="pulse-dot" /><span className="eyebrow !text-[0.7rem] !tracking-[0.3em] text-ice">Engineering Intelligent Environments</span>
          </span>
        </Reveal>
        <WordReveal as="h1" immediate delay={0.5} text="INTELLIGENCE BUILT INTO EVERY SPACE." className="h-display max-w-5xl text-white" />
        <Reveal delay={1.5} className="mt-8 max-w-xl">
          <p className="lead !text-[#c6d3e3]">Transforming the way people live, work and interact with intelligent buildings through advanced automation and integrated technology.</p>
        </Reveal>
        <Reveal delay={1.75} y={36} className="mt-10 flex flex-wrap gap-4">
          <Magnetic><Link to="/services" className="btn btn-primary">Explore Our Solutions <ArrowRight size={16} /></Link></Magnetic>
          <Magnetic><Link to="/about-us" className="btn btn-ghost">Discover TAC</Link></Magnetic>
        </Reveal>
      </div>

      {/* verified fact strip */}
      <div className="absolute inset-x-0 bottom-0 z-10 hidden border-t border-white/10 bg-midnight/40 backdrop-blur-md md:block">
        <div className="wrap flex items-center justify-between py-4 text-[0.7rem] uppercase tracking-[0.22em] text-silver">
          <span>Est. {company.established}</span><span className="h-3 w-px bg-white/20" />
          <span>{company.projectsCompleted}+ projects completed</span><span className="h-3 w-px bg-white/20" />
          <span>Licensed KNX distributor &amp; manufacturer</span><span className="h-3 w-px bg-white/20" />
          <span>Dubai Silicon Oasis, UAE</span>
        </div>
      </div>

      {/* scroll indicator */}
      <div aria-hidden className="absolute bottom-24 right-6 z-10 hidden flex-col items-center gap-3 md:flex lg:right-12">
        <span className="text-[0.7rem] uppercase tracking-[0.35em] text-silver [writing-mode:vertical-rl]">Scroll</span>
        <span className="relative h-16 w-px overflow-hidden bg-white/20"><span className="absolute inset-0 bg-cyan" style={{ animation: 'scrollcue 2.2s cubic-bezier(.65,0,.35,1) infinite' }} /></span>
      </div>
    </section>
  )
}

/* ----------------------------------------------------------------- INTRO */
function Intro() {
  const p = projectBySlug('iris-bay')!
  return (
    <section className="relative overflow-hidden py-28 md:py-40">
      <div className="bp-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="wrap relative grid items-center gap-16 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Reveal><p className="eyebrow mb-5">About TAC</p></Reveal>
          <WordReveal text="WE MAKE BUILDINGS THINK." className="h-display" />
          <Reveal delay={0.2} className="mt-10 max-w-2xl space-y-5">
            <p className="lead">{about.intro[0]}</p>
            <p className="lead">{about.overview}</p>
          </Reveal>
          <div className="mt-14 grid max-w-2xl grid-cols-3 gap-6 border-t border-white/10 pt-10">
            {[
              { n: company.established, s: '', l: 'Year of establishment' },
              { n: company.projectsCompleted, s: '+', l: 'Projects completed' },
              { n: yearsInIndustry(), s: '+', l: 'Years of industry experience' },
            ].map((x) => (
              <div key={x.l}>
                <p className="grad-text font-display text-4xl font-semibold md:text-6xl"><Counter to={x.n} suffix={x.s} /></p>
                <p className="mt-2 text-[0.7rem] uppercase leading-snug tracking-[0.18em] text-slate md:text-xs">{x.l}</p>
              </div>
            ))}
          </div>
          <Reveal delay={0.1} className="mt-10"><Link to="/about-us" className="btn btn-ghost">Our story <ArrowRight size={16} /></Link></Reveal>
        </div>

        <div className="relative lg:col-span-5">
          <MaskReveal className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-white/10">
              <Parallax amount={40} className="absolute -inset-x-0 -inset-y-[6%]"><Img name={p.image} alt={p.alt} sizes="(min-width:1024px) 40vw, 100vw" className="h-full w-full object-cover" /></Parallax>
              <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 via-transparent to-midnight/10" />
              <div className="absolute inset-x-5 bottom-5 flex items-center justify-between rounded-2xl border border-white/15 bg-midnight/60 p-4 backdrop-blur-md">
                <div><p className="text-[0.7rem] uppercase tracking-[0.2em] text-cyan">Featured project</p><p className="mt-1 font-display text-lg text-white">{p.title}</p><p className="text-xs text-silver">{p.location}</p></div>
                <Link to={`/projects/${p.slug}`} aria-label={`View ${p.title}`} className="grid h-11 w-11 place-items-center rounded-full bg-cyan text-midnight transition hover:scale-110"><ArrowUpRight size={18} /></Link>
              </div>
            </div>
          </MaskReveal>
          <div aria-hidden className="absolute -left-6 -top-6 h-24 w-24 border-l border-t border-cyan/60" />
          <div aria-hidden className="absolute -bottom-6 -right-6 h-24 w-24 border-b border-r border-cyan/60" />
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------- SOLUTIONS */
function Solutions() {
  return (
    <section className="sec-tech relative py-24 md:py-36" id="solutions">
      <div className="wrap">
        <div className="mb-16 flex flex-col justify-between gap-8 md:mb-24 md:flex-row md:items-end">
          <SectionHead eyebrow="Our Solutions" title="We offer a range of services to meet your needs." lead="From setting up a lighting control system to installing sensors for energy saving, we’ve got your back." />
          <Reveal><Link to="/services" className="link-arrow">All services <ArrowRight size={14} /></Link></Reveal>
        </div>
        <div className="space-y-24 md:space-y-36">
          {services.map((s, i) => (
            <article key={s.slug} className="group grid items-center gap-8 lg:grid-cols-12 lg:gap-14">
              <MaskReveal dir={i % 2 ? 'right' : 'left'} className={`lg:col-span-7 ${i % 2 ? 'lg:order-2' : ''}`}>
                <Link to={`/services/${s.slug}`} aria-label={s.title} className="card-img relative block aspect-[16/10] overflow-hidden rounded-3xl border border-white/10">
                  <Img name={s.image} alt={s.alt} sizes="(min-width:1024px) 58vw, 100vw" className={`h-full w-full object-cover ${s.slug === 'guest-room-management-system' ? 'object-[30%_50%]' : ''}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-midnight/70 to-transparent opacity-70 transition-opacity duration-700 group-hover:opacity-40" />
                  <span className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-cyan transition-transform duration-700 group-hover:scale-x-100" />
                  <span className="absolute left-6 top-5 font-display text-5xl font-semibold text-white/25 md:text-7xl">0{i + 1}</span>
                </Link>
              </MaskReveal>
              <div className={`lg:col-span-5 ${i % 2 ? 'lg:order-1' : ''}`}>
                <div className="transition-transform duration-700 group-hover:translate-x-1.5">
                  <Reveal><p className="eyebrow mb-4">Solution 0{i + 1}</p></Reveal>
                  <h3 className="font-display text-3xl font-semibold leading-tight text-white md:text-4xl"><Link to={`/services/${s.slug}`}>{s.title}</Link></h3>
                  <Reveal delay={0.1}><p className="lead mt-5">{s.description[0]}</p></Reveal>
                  <Reveal delay={0.15}>
                    <ul className="mt-6 flex flex-wrap gap-2">
                      {s.capabilities.slice(0, 4).map((c) => <li key={c} className="rounded-full border border-white/12 bg-white/[0.03] px-3 py-1.5 text-xs text-ice">{c}</li>)}
                    </ul>
                  </Reveal>
                  <Link to={`/services/${s.slug}`} className="link-arrow mt-8">Explore Solution <ArrowRight size={14} /></Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------- SMART DEMO */
function Experience() {
  const ref = useRef<HTMLDivElement>(null)
  const near = useInView(ref, { once: true, margin: '600px 0px' })
  return (
    <section className="relative overflow-hidden py-24 md:py-36">
      <div className="bp-grid pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[34rem] w-[60rem] -translate-x-1/2 rounded-full bg-intel/15 blur-[160px]" />
      <div className="wrap relative">
        <div className="mb-14 grid gap-8 md:grid-cols-2 md:items-end">
          <SectionHead eyebrow="Smart Automation Experience" title="Control every space. Feel it respond." />
          <Reveal><p className="lead">Dim the lights, draw the curtains, set the climate, arm the building. Explore how integrated control brings comfort, security and energy efficiency into a single, seamless experience.</p></Reveal>
        </div>
        <div ref={ref} className="min-h-[34rem]">
          {near && <Suspense fallback={<div className="grid h-[34rem] place-items-center rounded-3xl border border-white/10 text-sm text-slate">Loading experience…</div>}><SmartHome /></Suspense>}
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------- PRODUCTS */
function Products() {
  const rail = useRef<HTMLDivElement>(null)
  const go = (d: 1 | -1) => rail.current?.scrollBy({ left: d * Math.min(rail.current.clientWidth * 0.8, 760), behavior: 'smooth' })
  return (
    <section className="light relative overflow-hidden py-24 md:py-36" id="products">
      <div className="bp-grid pointer-events-none absolute inset-0 opacity-70" />
      <div className="wrap relative">
        <div className="mb-12 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <SectionHead light eyebrow="Intelligent Products" title="We are a licensed KNX distributor and manufacturer." lead="Our products streamline and simplify all the technology in your home, offering the ultimate lifestyle of comfort and convenience." />
          <div className="flex gap-3">
            <button onClick={() => go(-1)} aria-label="Previous products" className="grid h-12 w-12 place-items-center rounded-full border border-midnight/20 text-midnight transition hover:border-intel hover:bg-intel hover:text-white"><ArrowLeft size={18} /></button>
            <button onClick={() => go(1)} aria-label="Next products" className="grid h-12 w-12 place-items-center rounded-full border border-midnight/20 text-midnight transition hover:border-intel hover:bg-intel hover:text-white"><ArrowRight size={18} /></button>
          </div>
        </div>
      </div>
      <div ref={rail} className="hscroll relative flex gap-5 overflow-x-auto px-4 pb-4 md:px-10 xl:px-16" tabIndex={0} aria-label="Products carousel">
        {products.map((p) => <ProductCard key={p.slug} p={p} className="w-[78vw] shrink-0 sm:w-[22rem]" />)}
      </div>
      <div className="wrap relative mt-12"><Link to="/products" className="btn btn-ghost">Check more products <ArrowRight size={16} /></Link></div>
    </section>
  )
}

/* -------------------------------------------------------------- PROJECTS */
function Projects() {
  const pick = ['dubai-international-airport', 'iris-bay', 'meydan', 'la-verda-suites-and-villas', 'american-school-of-dubai', 'kempinski-hotel-and-suites'].map((s) => projectBySlug(s)!)
  return (
    <section className="sec-dark relative py-24 md:py-36" id="projects">
      <div className="wrap">
        <div className="mb-14 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <SectionHead eyebrow="Featured Projects" title="Where technology meets design excellence." lead="Some of the major projects we have completed across the UAE." />
          <Reveal><Link to="/projects" className="link-arrow">All projects <ArrowRight size={14} /></Link></Reveal>
        </div>
        <div className="grid gap-5 md:grid-cols-12 md:auto-rows-[minmax(0,1fr)]">
          <Reveal className="md:col-span-7 md:row-span-1"><ProjectCard p={pick[0]} sizes="(min-width:768px) 58vw, 100vw" /></Reveal>
          <Reveal delay={0.1} className="md:col-span-5 md:row-span-2"><ProjectCard p={pick[1]} tall sizes="(min-width:768px) 42vw, 100vw" className="h-full" /></Reveal>
          <Reveal delay={0.05} className="md:col-span-7"><ProjectCard p={pick[2]} sizes="(min-width:768px) 58vw, 100vw" /></Reveal>
          <Reveal className="md:col-span-4"><ProjectCard p={pick[3]} sizes="(min-width:768px) 33vw, 100vw" /></Reveal>
          <Reveal delay={0.1} className="md:col-span-4"><ProjectCard p={pick[4]} sizes="(min-width:768px) 33vw, 100vw" /></Reveal>
          <Reveal delay={0.2} className="md:col-span-4"><ProjectCard p={pick[5]} sizes="(min-width:768px) 33vw, 100vw" /></Reveal>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------- WHY */
const why = [
  { t: 'Industry experience', d: `Established in ${company.established}, with more than ${yearsInIndustry()} years of expertise in home and building automation.` },
  { t: 'Automation expertise', d: 'Principally engaged in the manufacturing, design and implementation of home & building automation.' },
  { t: 'Integrated solutions', d: 'Centralized control and monitoring with seamless integration to third-party systems, interfaced with BMS.' },
  { t: 'Project execution', d: `More than ${company.projectsCompleted} projects completed in the Middle East across airports, hotels, residential, commercial buildings and villas.` },
  { t: 'Smart building technologies', d: 'A licensed KNX distributor and manufacturer – KNX, DALI and DMX based control systems.' },
  { t: 'Technical training', d: 'A certified KNX Training Center with complete training and certification facilities.' },
]
function Why() {
  return (
    <section className="sec-tech relative overflow-hidden py-24 md:py-36">
      <div className="wrap relative grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <Reveal><p className="eyebrow mb-4">Why Choose TAC</p></Reveal>
            <WordReveal text="ENGINEERED FOR INTELLIGENT LIVING." className="h-section" />
            <Reveal delay={0.2} className="mt-6"><p className="lead">{about.accountability}</p></Reveal>
            <Reveal delay={0.3} className="mt-10">
              <figure className="overflow-hidden rounded-2xl border border-white/10 bg-midnight/60">
                <Img name="award-2018" alt="Mr. Taj Kollara receiving the Global Award for Best International KNX Project" sizes="361px" className="aspect-[361/208] w-full object-cover" />
                <figcaption className="flex gap-3 p-5 text-sm text-silver"><Award className="mt-0.5 shrink-0 text-cyan" size={18} /><span><strong className="font-medium text-white">{company.award.title}.</strong> {company.award.text}</span></figcaption>
              </figure>
            </Reveal>
          </div>
        </div>
        <ol className="lg:col-span-7">
          {why.map((w, i) => (
            <li key={w.t} className="group relative border-t border-white/10 py-9 first:border-t-0 first:pt-0">
              <DrawLine className="absolute inset-x-0 top-0 hidden" />
              <Reveal className="grid grid-cols-[3.5rem_1fr] gap-4 md:grid-cols-[5rem_1fr] md:gap-8">
                <span className="font-display text-4xl font-semibold text-white/15 transition-colors duration-500 group-hover:text-cyan md:text-6xl">0{i + 1}</span>
                <div>
                  <h3 className="font-display text-2xl font-medium text-white md:text-3xl">{w.t}</h3>
                  <p className="lead mt-3 max-w-xl">{w.d}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------- TRAINING */
function Training() {
  return (
    <section className="light relative overflow-hidden py-24 md:py-36">
      <div className="bp-grid pointer-events-none absolute inset-0" />
      <div className="wrap relative grid items-center gap-14 lg:grid-cols-2">
        <MaskReveal dir="left" className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
            <Parallax amount={30} className="absolute -inset-y-[5%] inset-x-0"><Img name="svc-knx-training" alt="Engineer working at a KNX test bench with a laptop" sizes="(min-width:1024px) 50vw, 100vw" className="h-full w-full object-cover" /></Parallax>
            <div className="absolute left-5 top-5 rounded-full bg-midnight/85 px-4 py-2 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-ice backdrop-blur">Certified KNX Training Center</div>
          </div>
        </MaskReveal>
        <div>
          <Reveal><p className="eyebrow mb-4">KNX Training &amp; Certification</p></Reveal>
          <WordReveal text="LEARN KNX AT A CERTIFIED TRAINING CENTER." className="h-section text-midnight" />
          <Reveal delay={0.2} className="mt-6"><p className="lead">{training.intro} Aside from the 5-day KNX Basic Course, we also provide trainees an exclusive special introduction on topics such as:</p></Reveal>
          <Reveal delay={0.25}>
            <ul className="mt-6 space-y-3">
              {training.specials.map((t) => <li key={t} className="flex items-start gap-3 text-[#26364b]"><Check size={18} className="mt-0.5 shrink-0 text-intel" />{t}</li>)}
            </ul>
          </Reveal>
          <Reveal delay={0.3} className="mt-10 flex flex-wrap gap-4">
            <Magnetic><Link to="/knx-training" className="btn btn-primary">Explore KNX Training <ArrowRight size={16} /></Link></Magnetic>
            <Link to="/contact?service=training#enquiry" className="btn btn-ghost">Training enquiries</Link>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  useSeo(
    'Total Automation Co. LLC (TAC UAE) – Smart Building & Home Automation, Dubai',
    'TAC UAE – licensed KNX distributor and manufacturer. Building Management Systems, Smart Home Automation, Guest Room Management, lighting control and KNX training. 600+ projects since 1998.',
    '/',
  )
  return (
    <>
      <Hero />
      <Intro />
      <Solutions />
      <Experience />
      <Products />
      <Projects />
      <Why />
      <Training />
      <ContactBlock />
    </>
  )
}

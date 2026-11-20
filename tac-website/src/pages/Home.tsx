import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { lazy, Suspense } from 'react'
import Hero from '../components/Hero'
import ContactForm from '../components/ContactForm'
import { Counter, MaskImage, Magnetic, Reveal, Words } from '../components/ui'
import { company, products, projects, services, serviceHref, strengths } from '../data/content'
import { useSeo, orgJsonLd } from '../lib/seo'

const SmartDemo = lazy(() => import('../components/SmartDemo'))

export default function Home() {
  useSeo('Smart Automation | Total Automation Co LLC (TAC) | Dubai', 'Home and building automation, BMS, GRMS, KNX and lighting control since 1998. Total Automation Co. LLC, Dubai, UAE.', '/', orgJsonLd)
  return (
    <>
      <Hero />

      <section className="relative bg-midnight py-24 md:py-40">
        <div className="container-x grid items-center gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <span className="eyebrow">About TAC</span>
            <Words text="WE MAKE BUILDINGS THINK." className="display mt-6" />
            <Reveal delay={0.2}>
              <p className="mt-8 max-w-xl text-lg leading-relaxed text-silver">
                {company.name} is a home and building automation manufacturer, designer and integrator for hotels, airports, malls, high-rise offices, villas and apartments. Customer-centric since {company.established}, TAC delivers smart, energy-efficient solutions that bring comfort, security and cost efficiency to every space.
              </p>
            </Reveal>
            <div className="mt-14 grid grid-cols-3 gap-6 border-t border-white/10 pt-10">
              <Counter to={company.established} label="Established" />
              <Counter to={company.projects} suffix="+" label="Projects completed" />
              <Counter to={company.years} suffix="+" label="Years of experience" />
            </div>
          </div>
          <div className="group relative lg:col-span-5 lg:translate-y-10">
            <MaskImage src="/images/site/security.jpg" alt="Building monitoring control room" ratio="aspect-[4/5]" className="rounded-[2rem]" />
            <div className="absolute -left-4 -bottom-4 hidden h-24 w-24 border-b border-l border-cyan/60 md:block" />
            <div className="absolute -right-4 -top-4 hidden h-24 w-24 border-r border-t border-cyan/60 md:block" />
          </div>
        </div>
      </section>

      <section className="light-section py-24 md:py-36">
        <div className="container-x">
          <span className="eyebrow">Our Solutions</span>
          <Words text="INTELLIGENT SYSTEMS FOR EVERY BUILDING." className="h2 mt-5 max-w-4xl" />
          <div className="mt-16 space-y-6">
            {services.map((s, i) => (
              <Reveal key={s.slug}>
                <Link to={serviceHref(s)} className="group grid overflow-hidden rounded-3xl bg-midnight text-white transition-colors duration-500 hover:bg-deep md:grid-cols-2">
                  <div className={`overflow-hidden ${i % 2 ? 'md:order-2' : ''}`}>
                    <img src={s.image} alt={s.title} loading="lazy" className="h-full min-h-[260px] w-full object-cover transition-transform duration-[1600ms] ease-out group-hover:scale-110" />
                  </div>
                  <div className="relative flex flex-col justify-center p-8 md:p-14">
                    <span className="mb-6 block h-px w-10 bg-cyan transition-all duration-500 group-hover:w-24" />
                    <span className="font-display text-xs tracking-[0.2em] text-slate">0{i + 1}</span>
                    <h3 className="mt-2 font-display text-2xl font-medium transition-transform duration-500 group-hover:translate-x-2 md:text-3xl">{s.title}</h3>
                    <p className="mt-4 text-silver leading-relaxed">{s.description}</p>
                    <ul className="mt-6 flex flex-wrap gap-2">{s.capabilities.map((c) => <li key={c} className="rounded-full border border-white/15 px-3 py-1 text-xs text-ice">{c}</li>)}</ul>
                    <span className="mt-8 inline-flex items-center gap-2 text-sm text-cyan">Explore Solution <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" /></span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Suspense fallback={<div className="h-[600px] bg-deep" />}><SmartDemo /></Suspense>

      <section className="bg-midnight py-24 md:py-36">
        <div className="container-x flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="eyebrow">Intelligent Products</span>
            <Words text="LICENSED KNX DISTRIBUTOR & MANUFACTURER." className="h2 mt-5 max-w-3xl" />
          </div>
          <Magnetic to="/products" variant="ghost">All products</Magnetic>
        </div>
        <div className="rail mt-14 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-6 md:px-10">
          {products.map((p, i) => (
            <Link key={p.slug} to={`/products/${p.slug}`} className="group w-[78vw] max-w-[360px] shrink-0 snap-start overflow-hidden rounded-3xl bg-white text-midnight sm:w-[340px]">
              <div className="relative aspect-[4/3] overflow-hidden bg-[#dbeafb]">
                <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-110" />
                <span className="absolute left-4 top-4 font-display text-xs tracking-[0.2em] text-midnight/60">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <div className="p-6">
                <h3 className="font-display text-lg font-medium leading-snug">{p.name}</h3>
                <span className="mt-4 inline-flex items-center gap-2 text-sm text-azure">View Product <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-deep py-24 md:py-36">
        <div className="container-x">
          <span className="eyebrow">Featured Projects</span>
          <Words text="MAJOR PROJECTS ACROSS DUBAI." className="h2 mt-5 max-w-3xl" />
          <Reveal><p className="mt-5 max-w-xl text-silver">Some of our major projects completed within the past {company.years} years.</p></Reveal>
          <div className="mt-14 grid gap-5 md:grid-cols-6">
            {projects.map((p, i) => (
              <Link key={p.slug} to={`/projects/${p.slug}`} className={`group relative block overflow-hidden rounded-3xl aspect-[16/10] ${i === 0 ? 'md:col-span-4' : i === 1 ? 'md:col-span-2 md:aspect-auto' : i < 4 ? 'md:col-span-3' : 'md:col-span-6 md:aspect-[21/9]'}`}>
                <img src={p.image} alt={p.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1600ms] group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-midnight/90 via-midnight/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                  <div className="mb-1 text-xs uppercase tracking-[0.2em] text-cyan">{p.sector}</div>
                  <h3 className="font-display text-xl font-medium md:text-2xl">{p.name}</h3>
                  <p className="mt-1 text-sm text-silver">{p.location}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm opacity-100 md:opacity-0 transition-opacity duration-500 group-hover:opacity-100">View Project <ArrowUpRight size={15} /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="light-section py-24 md:py-36">
        <div className="container-x">
          <span className="eyebrow">Why Choose TAC</span>
          <Words text="ENGINEERED FOR INTELLIGENT LIVING." className="h2 mt-5 max-w-4xl" />
          <div className="mt-16 grid gap-px overflow-hidden rounded-3xl bg-midnight/10 md:grid-cols-2 lg:grid-cols-3">
            {strengths.map((s, i) => (
              <Reveal key={s.title} delay={(i % 3) * 0.08} className="group bg-paper p-8 transition-colors duration-500 hover:bg-white md:p-10">
                <div className="font-display text-sm text-azure">0{i + 1}</div>
                <div className="my-5 h-px w-8 bg-azure transition-all duration-500 group-hover:w-20" />
                <h3 className="font-display text-xl font-medium">{s.title}</h3>
                <p className="mt-3 text-slate leading-relaxed">{s.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-midnight py-24 md:py-36">
        <img src="/images/services/knx.jpg" alt="" loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-midnight via-midnight/85 to-midnight/50" />
        <div className="container-x">
          <span className="eyebrow">KNX Training & Certification</span>
          <Words text="CERTIFIED KNX TRAINING CENTER." className="h2 mt-5 max-w-3xl" />
          <Reveal><p className="mt-6 max-w-xl text-silver">Our office is a certified KNX Training Center with training and certification facilities. Join the 5-day KNX Basic Course or our Advanced training.</p></Reveal>
          <div className="mt-10"><Magnetic to="/training">Explore KNX Training</Magnetic></div>
        </div>
      </section>

      <section id="enquiry" className="relative overflow-hidden bg-deep py-24 md:py-36">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="container-x relative grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <span className="eyebrow">Contact & Consultation</span>
            <Words text="LET'S BUILD A SMARTER FUTURE." className="h2 mt-5" />
            <Reveal><p className="mt-6 text-silver">Have a project in mind? Let's discuss how intelligent automation can transform your space.</p></Reveal>
            <ul className="mt-8 space-y-2 text-sm text-silver">
              <li><a className="link-u hover:text-cyan" href={company.phoneHref}>{company.phone}</a></li>
              <li><a className="link-u hover:text-cyan" href={`mailto:${company.email}`}>{company.email}</a></li>
              <li>{company.address}</li>
            </ul>
          </div>
          <div className="lg:col-span-7"><ContactForm /></div>
        </div>
      </section>
    </>
  )
}

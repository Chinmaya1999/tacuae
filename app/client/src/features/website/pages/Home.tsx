import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import SmartHomeHero from '../smart-home/SmartHomeHero'
import ContactForm from '../components/ContactForm'
import { Counter, MaskImage, Magnetic, Reveal, Words } from '../../../shared/components/ui'
import { company, products, projects, strengths } from '../../../shared/data/content'
import { useSeo, orgJsonLd } from '../../../shared/lib/seo'
import { MediaLoop } from '../components/ServiceScene'
import CapabilityMarquee from '../components/CapabilityMarquee'
import BuildingExplorer from '../components/BuildingExplorer'
import SolutionsShowcase from '../components/SolutionsShowcase'
import HowItWorks from '../components/HowItWorks'
import Faq from '../components/Faq'
import SectionHeader from '../../../shared/components/SectionHeader'


export default function Home() {
  useSeo('Smart Automation | Total Automation Co LLC (TAC) | Dubai', 'Home and building automation, BMS, GRMS, KNX and lighting control since 1998. Total Automation Co. LLC, Dubai, UAE.', '/', orgJsonLd)
  return (
    <>
      <SmartHomeHero />

      <CapabilityMarquee />

      <SolutionsShowcase />

      <section className="section bg-deep">
        <div className="container-x">
          <SectionHeader eyebrow="Featured Projects" title="Major projects across Dubai." text={`Some of our major projects completed within the past ${company.years} years.`} action={<Magnetic to="/projects" variant="ghost">All projects</Magnetic>} />
          <div className="grid gap-5 md:grid-cols-6">
            {projects.map((p, i) => (
              <Link key={p.slug} to={`/projects/${p.slug}`} className={`group relative block overflow-hidden rounded-3xl aspect-[16/10] ${i === 0 ? 'md:col-span-4' : i === 1 ? 'md:col-span-2 md:aspect-auto' : i < 4 ? 'md:col-span-3' : 'md:col-span-6 md:aspect-[21/9]'}`}>
                <img src={p.image} alt={p.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1600ms] group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-midnight/90 via-midnight/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                  <div className="mb-1 text-xs uppercase tracking-[0.2em] text-accent">{p.sector}</div>
                  <h3 className="font-display text-xl font-medium md:text-2xl">{p.name}</h3>
                  <p className="mt-1 text-sm text-silver">{p.location}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm opacity-100 md:opacity-0 transition-opacity duration-500 group-hover:opacity-100">View Project <ArrowUpRight size={15} /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <BuildingExplorer />

      <HowItWorks />

      <section className="section relative bg-midnight">
        <div className="container-x grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <span className="eyebrow">About TAC</span>
            <Words text="We make buildings think." className="h2 mt-4" />
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
          <div className="group relative lg:col-span-5">
            <MaskImage src="/images/site/security.jpg" alt="Building monitoring control room" ratio="aspect-[4/5]" className="rounded-[2rem]" />
            <div className="absolute -left-4 -bottom-4 hidden h-24 w-24 border-b border-l border-accent/60 md:block" />
            <div className="absolute -right-4 -top-4 hidden h-24 w-24 border-r border-t border-accent/60 md:block" />
          </div>
        </div>
      </section>

      <section className="section bg-midnight">
        <div className="container-x">
          <SectionHeader eyebrow="Intelligent Products" title="Licensed KNX distributor & manufacturer." action={<Magnetic to="/products" variant="ghost">All products</Magnetic>} />
        </div>
        <div className="rail container-x flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4">
          {products.map((p, i) => (
            <Link key={p.slug} to={`/products/${p.slug}`} className="group w-[78vw] max-w-[360px] shrink-0 snap-start overflow-hidden rounded-3xl bg-white text-midnight sm:w-[340px]">
              <div className="relative aspect-[4/3] overflow-hidden bg-[#e6e8fb]">
                <MediaLoop image={p.image} alt={p.name} slug={p.slug} kind="product" interval={3600 + i * 250} />
                <span className="absolute left-4 top-4 font-display text-xs tracking-[0.2em] text-midnight/60">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <div className="p-6">
                <h3 className="font-display text-lg font-medium leading-snug">{p.name}</h3>
                <span className="mt-4 inline-flex items-center gap-2 text-sm text-brand">View Product <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="light-section section">
        <div className="container-x">
          <SectionHeader eyebrow="Why Choose TAC" title="Engineered for intelligent living." />
          <div className="grid gap-px overflow-hidden rounded-3xl bg-midnight/10 md:grid-cols-2 lg:grid-cols-3">
            {strengths.map((s, i) => (
              <Reveal key={s.title} delay={(i % 3) * 0.08} className="group bg-paper p-8 transition-colors duration-500 hover:bg-white md:p-10">
                <div className="font-display text-sm text-brand">0{i + 1}</div>
                <div className="my-5 h-px w-8 bg-brand transition-all duration-500 group-hover:w-20" />
                <h3 className="font-display text-xl font-medium">{s.title}</h3>
                <p className="mt-3 text-slate leading-relaxed">{s.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Faq />

      <section id="enquiry" className="section relative overflow-hidden bg-deep">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="container-x relative grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <span className="eyebrow">Contact & Consultation</span>
            <Words text="Let's build a smarter future." className="h2 mt-5" />
            <Reveal><p className="mt-6 text-silver">Have a project in mind? Let's discuss how intelligent automation can transform your space.</p></Reveal>
            <ul className="mt-8 space-y-2 text-sm text-silver">
              <li><a className="link-u hover:text-accent" href={company.phoneHref}>{company.phone}</a></li>
              <li><a className="link-u hover:text-accent" href={`mailto:${company.email}`}>{company.email}</a></li>
              <li>{company.address}</li>
            </ul>
          </div>
          <div className="lg:col-span-7"><ContactForm /></div>
        </div>
      </section>
    </>
  )
}

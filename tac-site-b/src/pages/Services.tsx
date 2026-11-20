import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { PageHero, CtaBand } from '../components/ui'
import { MaskReveal, Reveal } from '../components/motion'
import Img from '../components/Img'
import { services } from '../data/content'
import { useSeo } from '../lib/seo'

export default function Services() {
  useSeo('Services', 'Building Management Systems, Smart Home Automation, Guest Room Management, Lighting & Dimming Control, KNX Automation and KNX Training from TAC UAE, Dubai.', '/services')
  return (
    <>
      <PageHero eyebrow="Services" title="Globally-renowned building & home automation." lead="Enjoy the power to access and monitor energy anytime and anywhere with low-cost, energy-efficient systems, which we can install for you." crumbs={[{ label: 'Services' }]} />
      <section className="pb-24 md:pb-36">
        <div className="wrap grid gap-6 md:grid-cols-2">
          {services.map((s, i) => (
            <Reveal key={s.slug} delay={(i % 2) * 0.1}>
              <Link to={`/services/${s.slug}`} className="group block h-full overflow-hidden rounded-3xl border border-white/10 bg-tech/70 transition duration-500 hover:border-cyan/40">
                <MaskReveal><div className="card-img relative aspect-[16/10]"><Img name={s.image} alt={s.alt} sizes="(min-width:768px) 50vw, 100vw" className={`h-full w-full object-cover ${s.slug === 'guest-room-management-system' ? 'object-[30%_50%]' : ''}`} /><span className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-cyan transition-transform duration-700 group-hover:scale-x-100" /></div></MaskReveal>
                <div className="p-7 md:p-9">
                  <p className="eyebrow mb-3">0{i + 1}</p>
                  <h2 className="font-display text-2xl font-semibold md:text-3xl">{s.title}</h2>
                  <p className="mt-4 text-silver">{s.short}</p>
                  <ul className="mt-5 flex flex-wrap gap-2">{s.capabilities.slice(0, 3).map((c) => <li key={c} className="rounded-full border border-white/12 px-3 py-1 text-xs text-ice">{c}</li>)}</ul>
                  <span className="link-arrow mt-7">Explore Solution <ArrowRight size={14} /></span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
      <CtaBand />
    </>
  )
}

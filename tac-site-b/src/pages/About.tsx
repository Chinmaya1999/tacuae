import { Award } from 'lucide-react'
import { PageHero, CtaBand, SectionHead } from '../components/ui'
import { Counter, MaskReveal, Parallax, Reveal, WordReveal } from '../components/motion'
import Img from '../components/Img'
import { about, company, yearsInIndustry } from '../data/content'
import { useSeo } from '../lib/seo'

const pillarImg = [
  { n: 'ed-reading', a: 'A person reading comfortably in a softly lit room' },
  { n: 'ed-security', a: 'Operator monitoring security screens' },
  { n: 'ed-laptop', a: 'Person managing a home from a laptop' },
]

export default function About() {
  useSeo('About Us', 'Total Automation Co. LLC – a global specialist in home and building automation. KNX distributor and manufacturer with 600+ projects completed since 1998.', '/about-us')
  return (
    <>
      <PageHero eyebrow="About Us" title="A global specialist in home & building automation." lead="Total Automation Co. LLC – UAE" crumbs={[{ label: 'About Us' }]} />

      <section className="relative pb-24 md:pb-36">
        <div className="wrap grid gap-14 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-6">
            {about.intro.map((t) => <Reveal key={t}><p className="lead">{t}</p></Reveal>)}
            <Reveal><p className="lead">{about.overview}</p></Reveal>
          </div>
          <div className="grid grid-cols-3 gap-6 self-start border-t border-white/10 pt-8 lg:col-span-5 lg:col-start-8">
            {[{ n: company.established, s: '', l: 'Established' }, { n: company.projectsCompleted, s: '+', l: 'Projects' }, { n: yearsInIndustry(), s: '+', l: 'Years' }].map((x) => (
              <div key={x.l}><p className="grad-text font-display text-4xl font-semibold md:text-5xl"><Counter to={x.n} suffix={x.s} /></p><p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate">{x.l}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec-tech py-24 md:py-32">
        <div className="wrap">
          <SectionHead eyebrow="What we deliver" title="Comfort. Security. Cost-efficiency." className="mb-14" />
          <div className="grid gap-6 md:grid-cols-3">
            {about.pillars.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.1}>
                <article className="group h-full overflow-hidden rounded-3xl border border-white/10 bg-midnight/50 transition duration-500 hover:border-cyan/40">
                  <div className="card-img aspect-[4/3]"><Img name={pillarImg[i].n} alt={pillarImg[i].a} sizes="(min-width:768px) 33vw, 100vw" className="h-full w-full object-cover" /></div>
                  <div className="p-7"><h3 className="font-display text-2xl font-medium">{p.title}</h3><p className="mt-3 text-sm leading-relaxed text-silver">{p.text}</p></div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24 md:py-36">
        <div className="wrap grid gap-16 lg:grid-cols-2">
          <div>
            <Reveal><p className="eyebrow mb-4">Accountability</p></Reveal>
            <WordReveal text="KNX DISTRIBUTOR AND MANUFACTURER." className="h-section" />
            <Reveal delay={0.2} className="mt-6 space-y-5"><p className="lead">{about.accountability}</p><p className="lead">We streamline and simplify all the technology in your home, offering the ultimate lifestyle of comfort and convenience.</p></Reveal>
          </div>
          <div>
            <Reveal><p className="eyebrow mb-4">Experience</p></Reveal>
            <Reveal delay={0.1}><p className="font-display text-2xl font-medium leading-snug text-white md:text-3xl">{about.experience}</p></Reveal>
            <Reveal delay={0.2} className="mt-8"><ul className="flex flex-wrap gap-2">{['Airports', 'Hotels', 'Malls', 'High-rise office buildings', 'Commercial buildings', 'Villas', 'Apartment complexes'].map((s) => <li key={s} className="rounded-full border border-white/12 px-4 py-2 text-sm text-ice">{s}</li>)}</ul></Reveal>
          </div>
        </div>
      </section>

      <section className="light relative overflow-hidden py-24 md:py-36">
        <div className="bp-grid pointer-events-none absolute inset-0" />
        <div className="wrap relative grid items-center gap-14 lg:grid-cols-2">
          <div>
            <Reveal><p className="eyebrow mb-4">Our Mission</p></Reveal>
            <WordReveal text={about.mission[0].replace(/\.$/, '').toUpperCase() + '.'} className="h-section text-midnight" />
            <Reveal delay={0.2} className="mt-8 space-y-4">{about.mission.slice(1).map((t) => <p key={t} className="lead">{t}</p>)}</Reveal>
          </div>
          <MaskReveal dir="right"><div className="relative aspect-[4/3] overflow-hidden rounded-3xl"><Parallax amount={30} className="absolute inset-x-0 -inset-y-[5%]"><Img name="ed-team" alt="A team collaborating in a bright office" sizes="(min-width:1024px) 50vw, 100vw" className="h-full w-full object-cover" /></Parallax></div></MaskReveal>
        </div>
      </section>

      <section className="py-24 md:py-32">
        <div className="wrap grid items-center gap-12 lg:grid-cols-[1fr_1.2fr]">
          <Reveal><div className="overflow-hidden rounded-2xl border border-white/10"><Img name="award-2018" alt="Mr. Taj Kollara receiving the Global Award for Best International KNX Project" sizes="361px" className="w-full object-cover" /></div></Reveal>
          <div>
            <Reveal><p className="eyebrow mb-4 flex items-center gap-2"><Award size={14} />Awards</p></Reveal>
            <WordReveal text={company.award.title} className="h-section" />
            <Reveal delay={0.2} className="mt-6"><p className="lead">{company.award.text}</p></Reveal>
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  )
}

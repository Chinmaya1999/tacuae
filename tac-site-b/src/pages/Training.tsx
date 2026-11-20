import { Link } from 'react-router-dom'
import { ArrowRight, Check, MapPin, Phone, GraduationCap } from 'lucide-react'
import { PageHero, SectionHead } from '../components/ui'
import { Magnetic, MaskReveal, Parallax, Reveal } from '../components/motion'
import EnquiryForm from '../components/EnquiryForm'
import Img from '../components/Img'
import { company, training } from '../data/content'
import { useSeo } from '../lib/seo'

export default function Training() {
  useSeo('KNX Training & Certification', 'TAC UAE is a certified KNX Training Center in Dubai with complete training and certification facilities. 5-day KNX Basic Course plus KNX Partner and Advanced courses.', '/knx-training',
    '/img/svc-knx-training-960.webp',
    { '@context': 'https://schema.org', '@type': 'Course', name: 'KNX Basic Course', description: training.courses[0].text, provider: { '@type': 'Organization', name: company.name, url: 'https://www.tacuae.com' }, timeRequired: 'P5D' })
  return (
    <>
      <PageHero eyebrow="KNX Training & Certification" title="A certified KNX Training Center." lead={training.intro} crumbs={[{ label: 'KNX Training' }]}>
        <div className="mt-10 flex flex-wrap gap-4"><Magnetic><a href="#training-enquiry" className="btn btn-primary">Training enquiry <ArrowRight size={16} /></a></Magnetic></div>
      </PageHero>

      <section className="pb-24 md:pb-32">
        <div className="wrap grid items-center gap-12 lg:grid-cols-2">
          <MaskReveal><div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10"><Parallax amount={30} className="absolute inset-x-0 -inset-y-[5%]"><Img name="svc-knx-training" alt="Engineer working at a KNX test bench with a laptop" priority sizes="(min-width:1024px) 50vw, 100vw" className="h-full w-full object-cover" /></Parallax></div></MaskReveal>
          <div>
            <Reveal><p className="eyebrow mb-4">Courses</p></Reveal>
            <div className="space-y-5">
              {training.courses.map((c, i) => (
                <Reveal key={c.title} delay={i * 0.1}>
                  <article className="rounded-2xl border border-white/10 bg-tech/70 p-7">
                    <div className="mb-3 flex items-center justify-between gap-4"><h2 className="flex items-center gap-3 font-display text-xl font-medium"><GraduationCap className="text-cyan" size={20} />{c.title}</h2><span className="rounded-full border border-cyan/40 px-3 py-1 text-[0.7rem] uppercase tracking-widest text-cyan">{c.badge}</span></div>
                    <p className="text-sm leading-relaxed text-silver">{c.text}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="light relative overflow-hidden py-24 md:py-32">
        <div className="bp-grid pointer-events-none absolute inset-0" />
        <div className="wrap relative grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHead light eyebrow="Special introductions" title="Beyond the basics." lead="Aside from the 5-day KNX Basic Course, we also provide our trainees an exclusive special introduction on topics such as:" />
            <ul className="mt-8 space-y-3">{training.specials.map((t) => <Reveal as="li" key={t}><span className="flex items-start gap-3 text-[#26364b]"><Check size={18} className="mt-0.5 shrink-0 text-intel" />{t}</span></Reveal>)}</ul>
          </div>
          <Reveal>
            <div className="rounded-3xl bg-midnight p-8 text-white md:p-10">
              <p className="eyebrow mb-4">Training facilities</p>
              <h2 className="font-display text-2xl font-semibold">Complete training and certification facilities.</h2>
              <ul className="mt-6 space-y-4 text-silver">
                <li className="flex gap-3"><MapPin size={18} className="mt-0.5 shrink-0 text-cyan" />{company.addressLine}</li>
                <li className="flex gap-3"><Phone size={18} className="mt-0.5 shrink-0 text-cyan" /><a href={company.phoneHref} className="hover:text-white">{company.phone}</a></li>
              </ul>
              <p className="mt-6 text-sm text-slate">Course dates, content and certification details are confirmed directly by our team – contact us to enquire.</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="training-enquiry" className="relative py-24 md:py-32">
        <div className="wrap grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4"><SectionHead eyebrow="Training enquiries" title="Book your place." lead="Tell us which course you are interested in and we will respond with details." /><Link to="/services/knx-training-and-certification" className="link-arrow mt-8">About the service <ArrowRight size={14} /></Link></div>
          <div className="rounded-3xl border border-white/10 bg-tech/70 p-6 md:p-10 lg:col-span-8"><EnquiryForm /></div>
        </div>
      </section>
    </>
  )
}

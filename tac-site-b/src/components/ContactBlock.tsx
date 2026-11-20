import { Mail, MapPin, Phone } from 'lucide-react'
import EnquiryForm from './EnquiryForm'
import { Reveal, WordReveal } from './motion'
import { company } from '../data/content'

/* --------------------------------------------------------------- CONTACT */
export default function ContactBlock() {
  return (
    <section id="enquiry" className="relative overflow-hidden py-24 md:py-36">
      <div className="absolute inset-0 bg-gradient-to-br from-midnight via-tech to-[#06223d]" />
      <div className="bp-grid pointer-events-none absolute inset-0" />
      <div className="wrap relative grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Reveal><p className="eyebrow mb-4">Contact &amp; Consultation</p></Reveal>
          <WordReveal text="LET'S BUILD A SMARTER FUTURE." className="h-section" />
          <Reveal delay={0.2} className="mt-6"><p className="lead">Have a project in mind? Let’s discuss how intelligent automation can transform your space.</p></Reveal>
          <Reveal delay={0.3}>
            <ul className="mt-10 space-y-5 text-silver">
              <li className="flex gap-4"><MapPin className="mt-1 shrink-0 text-cyan" size={18} /><span><span className="block text-xs uppercase tracking-widest text-slate">Head office</span>{company.addressLine}</span></li>
              <li className="flex gap-4"><Phone className="mt-1 shrink-0 text-cyan" size={18} /><span><span className="block text-xs uppercase tracking-widest text-slate">Call</span><a href={company.phoneHref} className="hover:text-white">{company.phone}</a></span></li>
              <li className="flex gap-4"><Mail className="mt-1 shrink-0 text-cyan" size={18} /><span><span className="block text-xs uppercase tracking-widest text-slate">Email</span><a href={`mailto:${company.email}`} className="hover:text-white">{company.email}</a></span></li>
            </ul>
          </Reveal>
        </div>
        <Reveal className="lg:col-span-7"><div className="rounded-3xl border border-white/10 bg-midnight/60 p-6 backdrop-blur md:p-10"><EnquiryForm /></div></Reveal>
      </div>
    </section>
  )
}


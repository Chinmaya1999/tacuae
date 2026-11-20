import { Mail, MapPin, Phone, ExternalLink } from 'lucide-react'
import FbIcon from '../components/FbIcon'
import { PageHero } from '../components/ui'
import { Reveal } from '../components/motion'
import EnquiryForm from '../components/EnquiryForm'
import { company } from '../data/content'
import { useSeo } from '../lib/seo'

export default function Contact() {
  useSeo('Contact Us', 'Contact TAC UAE – Suite 506 Le Solarium Business Tower, Dubai Silicon Oasis, Dubai. +971 4 3926860 · info@tacuae.com. Request a consultation.', '/contact')
  const map = `https://www.google.com/maps?q=${encodeURIComponent(company.mapQuery)}&output=embed`
  const link = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.mapQuery)}`
  return (
    <>
      <PageHero eyebrow="Contact Us" title="Let's build a smarter future." lead="For inquiries or questions – fill out the form or call us on +971 4 3926860." crumbs={[{ label: 'Contact' }]} />
      <section id="enquiry" className="pb-20 md:pb-28">
        <div className="wrap grid gap-12 lg:grid-cols-12">
          <Reveal className="space-y-6 lg:col-span-4">
            {[
              { i: MapPin, l: 'Head office', v: company.address.join(', '), h: link },
              { i: Phone, l: 'Call', v: company.phone, h: company.phoneHref },
              { i: Mail, l: 'Email', v: company.email, h: `mailto:${company.email}` },
              { i: FbIcon, l: 'Social', v: 'Facebook', h: company.facebook },
            ].map((x) => (
              <a key={x.l} href={x.h} target={x.h.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="group flex gap-5 rounded-2xl border border-white/10 bg-tech/60 p-6 transition hover:border-cyan/40">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-cyan/10 text-cyan"><x.i size={18} /></span>
                <span><span className="block text-xs uppercase tracking-widest text-slate">{x.l}</span><span className="mt-1 block text-white">{x.v}</span></span>
              </a>
            ))}
          </Reveal>
          <Reveal className="lg:col-span-8"><div className="rounded-3xl border border-white/10 bg-tech/70 p-6 md:p-10"><h2 className="mb-8 font-display text-2xl font-medium">Request a consultation</h2><EnquiryForm /></div></Reveal>
        </div>
      </section>
      <section className="pb-24 md:pb-32">
        <div className="wrap">
          <div className="relative overflow-hidden rounded-3xl border border-white/10">
            <iframe title="Map: TAC UAE head office, Le Solarium Business Tower, Dubai Silicon Oasis" src={map} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-[26rem] w-full border-0 [filter:invert(.92)_hue-rotate(185deg)_saturate(.7)_brightness(.95)]" />
            <a href={link} target="_blank" rel="noopener noreferrer" className="btn btn-primary absolute bottom-5 left-5 !py-2.5">Open in Maps <ExternalLink size={14} /></a>
          </div>
        </div>
      </section>
    </>
  )
}

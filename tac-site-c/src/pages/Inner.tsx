import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react'
import ContactForm from '../components/ContactForm'
import { Breadcrumb, Counter, MaskImage, Magnetic, PageHero, Reveal, Words } from '../components/ui'
import { company, products, projects, routes, services, serviceHref } from '../data/content'
import { useSeo } from '../lib/seo'
import { MediaLoop, ServiceScene } from '../components/ServiceScene'
import ProductAnim from '../components/ProductAnim'
import { useContent } from '../lib/useContent'

const meta = (p: string) => routes.find((r) => r.path === p)!
function usePageSeo(p: string) { const m = meta(p); useSeo(m.title, m.desc, p) }

export function About() {
  usePageSeo('/about-us')
  return (
    <>
      <PageHero eyebrow="About Us" title="A global specialist in home & building automation." image="/images/site/about-2.jpg"
        text="Total Automation CO LLC — UAE has built a reputation for excellence and customer-centric products, delivering state-of-the-art building automation with high customer satisfaction." />
      <section className="bg-midnight py-20 md:py-32">
        <div className="container-x grid gap-14 lg:grid-cols-2">
          <div className="space-y-10">
            {[
              ['Accountability', 'We are committed to energy conservation and green living through customised technology solutions for comfort, safety and security — backed by flawless service.'],
              ['KNX distributor and manufacturer', 'As a KNX distributor and manufacturer, we streamline home technology for comfort and convenience.'],
              ['Experience', `Over ${company.years} years of experience and more than ${company.projects} projects in the Middle East — airports, hotels, residential, commercial buildings and villas.`],
              ['Our Mission', 'To provide smart, energy-efficient solutions through innovation and the best quality, with staff trained in our quality policy and customer-focused, performance-driven products and services.'],
            ].map(([t, d], i) => (
              <Reveal key={t} delay={i * 0.05}>
                <div className="border-l border-cyan/40 pl-6"><h2 className="font-display text-xl">{t}</h2><p className="mt-2 text-silver leading-relaxed">{d}</p></div>
              </Reveal>
            ))}
          </div>
          <div className="group"><MaskImage src="/images/site/about-1.jpg" alt="Comfortable, automated living space" ratio="aspect-[4/5]" className="rounded-[2rem]" /></div>
        </div>
      </section>
      <section className="bg-deep py-20">
        <div className="container-x grid grid-cols-3 gap-6">
          <Counter to={company.established} label="Established" /><Counter to={company.projects} suffix="+" label="Projects completed" /><Counter to={company.years} suffix="+" label="Years of experience" />
        </div>
      </section>
      <section className="light-section py-20 md:py-32">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <div className="group"><MaskImage src="/images/site/award.jpg" alt="Global Awards – Best Project – International – 2018" ratio="aspect-[4/3]" className="rounded-3xl" /></div>
          <div>
            <span className="eyebrow">Awards</span>
            <Words text="GLOBAL AWARDS — BEST PROJECT, INTERNATIONAL, 2018." className="h2 mt-5 !text-3xl md:!text-4xl" />
            <p className="mt-6 text-slate leading-relaxed">Mr. Taj Kollara, Managing Director, ASIN, received the award for Best International KNX Project, for Dubai Parks and Resorts.</p>
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  )
}

export function Services() {
  usePageSeo('/services')
  return (
    <>
      <PageHero eyebrow="Services" title="Building & home automation services." text="Globally renowned building and home automation services — low-cost, energy-efficient systems that can be installed in homes and buildings of every kind." />
      <section className="bg-midnight pb-24">
        <div className="container-x grid gap-6 md:grid-cols-2">
          {services.map((s, i) => (
            <Reveal key={s.slug} delay={(i % 2) * 0.08}>
              <Link to={serviceHref(s)} className="group block overflow-hidden rounded-3xl border border-white/10 bg-deep transition-colors hover:border-cyan/50">
                <div className="aspect-[16/9] overflow-hidden"><MediaLoop image={s.image} alt={s.title} slug={s.slug} /></div>
                <div className="p-8"><h2 className="font-display text-2xl">{s.title}</h2><p className="mt-3 text-silver">{s.short}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm text-cyan">Explore Solution <ArrowUpRight size={16} className="transition group-hover:-translate-y-1 group-hover:translate-x-1" /></span></div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
      <CtaBand />
    </>
  )
}

export function ServiceDetail() {
  const { slug } = useParams()
  const s = services.find((x) => x.slug === slug)
  const m = s && routes.find((r) => r.path === `/services/${s.slug}`)
  useSeo(m?.title ?? 'Service', m?.desc ?? '', `/services/${slug}`)
  if (!s) return <Navigate to="/services" replace />
  if (s.slug === 'knx-training') return <Navigate to="/training" replace />
  const others = services.filter((x) => x.slug !== s.slug && x.slug !== 'knx-training').slice(0, 3)
  return (
    <>
      <PageHero eyebrow="Service" title={s.title} text={s.short} image={s.image} />
      <section className="bg-midnight py-16 md:py-24">
        <div className="container-x grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Breadcrumb items={[{ label: 'Services', to: '/services' }, { label: s.title }]} />
            <p className="mt-8 text-xl leading-relaxed text-silver">{s.description}</p>
            <h2 className="mt-12 font-display text-sm uppercase tracking-[0.2em] text-cyan">Capabilities</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">{s.capabilities.map((c) => <li key={c} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.03] px-4 py-3"><Check size={16} className="text-cyan" />{c}</li>)}</ul>
            <div className="mt-10"><Magnetic to="/contact#enquiry">Enquire about this service</Magnetic></div>
          </div>
          <div className="group space-y-5 lg:col-span-5"><div className="aspect-[16/10] overflow-hidden rounded-3xl border border-white/10"><ServiceScene slug={s.slug} /></div><div className="aspect-[4/3] overflow-hidden rounded-3xl"><img src={s.image} alt={s.title} className="h-full w-full object-cover" /></div><p className="text-xs text-slate">Top: illustrative animation. Bottom: photo.</p></div>
        </div>
      </section>
      <section className="light-section py-16 md:py-24"><div className="container-x">
        <h2 className="font-display text-2xl">More solutions</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">{others.map((o) => (
          <Link key={o.slug} to={serviceHref(o)} className="group overflow-hidden rounded-2xl bg-midnight text-white">
            <div className="aspect-[16/10] overflow-hidden"><img src={o.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" /></div>
            <div className="p-5 font-display">{o.title}</div></Link>))}</div></div></section>
    </>
  )
}

export function Products() {
  usePageSeo('/products')
  return (
    <>
      <PageHero eyebrow="Products" title="KNX products, distributed & manufactured by TAC." text="We are proud to be a distributor and manufacturer of KNX — products that simplify home technology for comfort and convenience." />
      <section className="light-section py-20 md:py-28"><div className="container-x grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((p, i) => (
          <Reveal key={p.slug} delay={(i % 4) * 0.06}>
            <Link to={`/products/${p.slug}`} className="group block overflow-hidden rounded-3xl bg-white shadow-[0_10px_40px_-20px_rgba(7,17,31,.35)] transition-shadow hover:shadow-[0_20px_50px_-15px_rgba(38,139,255,.45)]">
              <div className="aspect-[4/3] overflow-hidden bg-[#dbeafb]"><MediaLoop image={p.image} alt={p.name} slug={p.slug} kind="product" /></div>
              <div className="p-6"><h2 className="font-display text-lg font-medium leading-snug min-h-[3.2rem]">{p.name}</h2>
                <span className="mt-3 inline-flex items-center gap-2 text-sm text-azure">View Product <ArrowRight size={15} className="transition group-hover:translate-x-1" /></span></div>
            </Link></Reveal>))}
      </div></section>
      <section className="bg-midnight py-20"><div className="container-x text-center">
        <h2 className="h2">Interested in our products?</h2><p className="mx-auto mt-4 max-w-lg text-silver">Send us a message for product enquiries, specifications and availability.</p>
        <div className="mt-8"><Magnetic to="/contact#enquiry">Contact us</Magnetic></div></div></section>
    </>
  )
}

export function ProductDetail() {
  const { slug } = useParams()
  const ov = useContent()
  const p = products.find((x) => x.slug === slug || x.legacy === slug)
  useSeo(p ? `${p.name} | Total Automation UAE` : 'Product', p ? `${p.name} — a KNX product from Total Automation Co. LLC, Dubai.` : '', `/products/${slug}`)
  if (!p) return <Navigate to="/products" replace />
  const i = products.indexOf(p), next = products[(i + 1) % products.length]
  return (
    <>
      <section className="bg-midnight pt-36 pb-20 md:pt-44">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-4"><div className="overflow-hidden rounded-3xl bg-[#dbeafb]"><img src={p.image} alt={p.name} className="w-full object-cover" /></div><div className="aspect-[10/7] overflow-hidden rounded-3xl border border-white/10"><ProductAnim slug={p.slug} /></div><p className="text-xs text-slate">Illustrative animation of the product type’s function — not a specification.</p></div>
          <div>
            <Breadcrumb items={[{ label: 'Products', to: '/products' }, { label: p.name }]} />
            <h1 className="display mt-6 !text-4xl md:!text-5xl">{p.name}</h1>
            <p className="mt-6 text-silver leading-relaxed">{p.name} is part of the KNX range distributed and manufactured by {company.name}. For technical specifications, pricing and availability, please contact our team.</p>
            {ov.products?.[p.slug] && <p className="mt-4 whitespace-pre-line leading-relaxed text-silver">{ov.products[p.slug]}</p>}
            <div className="mt-10 flex flex-wrap gap-4"><Magnetic to="/contact#enquiry">Enquire about this product</Magnetic><Magnetic href={company.phoneHref} variant="ghost">{company.phone}</Magnetic></div>
            <Link to={`/products/${next.slug}`} className="mt-12 inline-flex items-center gap-2 text-sm text-cyan link-u">Next: {next.name} <ArrowRight size={15} /></Link>
          </div>
        </div>
      </section>
    </>
  )
}

export function Projects() {
  usePageSeo('/projects')
  return (
    <>
      <PageHero eyebrow="Projects" title="Where technology meets design excellence." text={`Over ${company.years} years of delivering major projects across Dubai.`} />
      <section className="bg-midnight pb-24"><div className="container-x grid gap-6 md:grid-cols-2">
        {projects.map((p, i) => (
          <Reveal key={p.slug} className={i === 0 ? 'md:col-span-2' : ''}>
            <Link to={`/projects/${p.slug}`} className="group relative block overflow-hidden rounded-3xl">
              <div className={i === 0 ? 'aspect-[21/9]' : 'aspect-[4/3]'}><img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1600ms] group-hover:scale-110" /></div>
              <div className="absolute inset-0 bg-gradient-to-t from-midnight/90 to-transparent" />
              <div className="absolute bottom-0 p-7"><div className="text-xs uppercase tracking-[0.2em] text-cyan">{p.sector}</div><h2 className="font-display text-2xl">{p.name}</h2><p className="text-sm text-silver">{p.location}</p></div>
            </Link></Reveal>))}
      </div></section>
      <CtaBand />
    </>
  )
}

export function ProjectDetail() {
  const { slug } = useParams()
  const ov = useContent()
  const p = projects.find((x) => x.slug === slug)
  useSeo(p ? `${p.name} | Total Automation UAE` : 'Project', p ? `${p.name}, ${p.location} — a major project by Total Automation Co. LLC.` : '', `/projects/${slug}`)
  if (!p) return <Navigate to="/projects" replace />
  const i = projects.indexOf(p), next = projects[(i + 1) % projects.length]
  return (
    <>
      <section className="relative isolate flex min-h-[78vh] items-end overflow-hidden pb-16 pt-40">
        <img src={p.image} alt={p.name} className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-midnight via-midnight/50 to-midnight/30" />
        <div className="container-x"><Breadcrumb items={[{ label: 'Projects', to: '/projects' }, { label: p.name }]} />
          <h1 className="display mt-5">{p.name}</h1>
          <p className="mt-4 text-lg text-silver">{p.location} · {p.sector}</p></div>
      </section>
      <section className="bg-midnight py-20"><div className="container-x grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="text-xl leading-relaxed text-silver">{p.name} is one of the major projects completed by {company.name} in the past {company.years} years.
            {p.slug === 'lapita-hotel' && ' TAC received the Global Awards Best International KNX Project award (2018) for Dubai Parks and Resorts.'}</p>
          {ov.projects?.[p.slug] && <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-silver">{ov.projects[p.slug]}</p>}
          <p className="mt-6 text-silver">For more information about this project or similar solutions for your building, please contact our team.</p>
          <div className="mt-10"><Magnetic to="/contact#enquiry">Discuss a similar project</Magnetic></div>
        </div>
        <dl className="grid h-fit grid-cols-2 gap-6 rounded-3xl border border-white/10 p-8 lg:col-span-5">
          <div><dt className="text-xs uppercase tracking-[0.2em] text-slate">Location</dt><dd className="mt-1">{p.location}</dd></div>
          <div><dt className="text-xs uppercase tracking-[0.2em] text-slate">Sector</dt><dd className="mt-1">{p.sector}</dd></div>
        </dl>
      </div></section>
      <Link to={`/projects/${next.slug}`} className="group relative block overflow-hidden py-24 text-center">
        <img src={next.image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30 transition-transform duration-1000 group-hover:scale-105" />
        <div className="text-xs uppercase tracking-[0.2em] text-cyan">Next project</div><div className="mt-3 font-display text-3xl md:text-5xl">{next.name}</div>
      </Link>
    </>
  )
}

export function Training() {
  usePageSeo('/training')
  return (
    <>
      <PageHero eyebrow="KNX Training & Certification" title="Learn KNX at a certified training center." image="/images/services/knx.jpg"
        text="Our office is a certified KNX Training Center with training and certification facilities." />
      <section className="bg-midnight py-20 md:py-28"><div className="container-x grid gap-6 md:grid-cols-2">
        <Reveal><div className="h-full rounded-3xl border border-white/10 bg-deep p-9">
          <div className="font-display text-xs uppercase tracking-[0.2em] text-cyan">Course 01</div><h2 className="mt-3 font-display text-3xl">KNX Basic Course</h2>
          <div className="mt-2 text-silver">Duration: 5 days</div>
          <p className="mt-5 text-silver leading-relaxed">The KNX Partner (Basic) course at our certified KNX Training Center.</p></div></Reveal>
        <Reveal delay={0.08}><div className="h-full rounded-3xl border border-white/10 bg-deep p-9">
          <div className="font-display text-xs uppercase tracking-[0.2em] text-cyan">Course 02</div><h2 className="mt-3 font-display text-3xl">Advanced KNX Training</h2>
          <p className="mt-5 text-silver leading-relaxed">Advanced KNX course for engineers continuing beyond the Basic course. Please contact us for the current schedule and duration.</p></div></Reveal>
      </div>
      <div className="container-x mt-16"><div className="mb-16 aspect-[16/8] overflow-hidden rounded-3xl border border-white/10"><ServiceScene slug="knx-training" /></div>
        <h2 className="font-display text-sm uppercase tracking-[0.2em] text-cyan">Introductions covered</h2>
        <ul className="mt-6 grid gap-3 md:grid-cols-3">
          {['Smart control using touch panels', 'KNX wireless control via mobile apps', 'Central control or visualisation via computer'].map((t) => <li key={t} className="flex items-center gap-3 rounded-xl border border-white/10 px-5 py-4"><Check size={16} className="text-cyan" />{t}</li>)}
        </ul>
        <p className="mt-10 text-silver">Training facilities: {company.address}. For schedules, certification details and fees, call <a className="text-cyan link-u" href={company.phoneHref}>{company.phone}</a> or email <a className="text-cyan link-u" href={`mailto:${company.email}`}>{company.email}</a>.</p>
      </div></section>
      <section className="light-section py-20"><div className="container-x grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5"><span className="eyebrow">Training enquiry</span><Words text="BOOK YOUR PLACE." className="h2 mt-5" /></div>
        <div className="lg:col-span-7"><ContactForm dark={false} /></div></div></section>
    </>
  )
}

export function Contact() {
  usePageSeo('/contact')
  return (
    <>
      <PageHero eyebrow="Contact Us" title="For inquiries or questions." text={`Fill in the form or call ${company.phone}.`} image="/images/site/contact.jpg" />
      <section id="enquiry" className="bg-midnight py-16 md:py-24"><div className="container-x grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-7"><ContactForm /></div>
        <div className="space-y-8 lg:col-span-5">
          <div><h2 className="font-display text-xs uppercase tracking-[0.2em] text-cyan">Head Office</h2><p className="mt-3 text-lg text-silver">{company.address}</p></div>
          <div><h2 className="font-display text-xs uppercase tracking-[0.2em] text-cyan">Phone</h2><a className="mt-3 block text-lg link-u w-fit" href={company.phoneHref}>{company.phone}</a></div>
          <div><h2 className="font-display text-xs uppercase tracking-[0.2em] text-cyan">Email</h2><a className="mt-3 block text-lg link-u w-fit" href={`mailto:${company.email}`}>{company.email}</a></div>
        </div></div>
        <div className="container-x mt-16"><iframe title="TAC UAE office location map" loading="lazy" className="h-[380px] w-full rounded-3xl border border-white/10 grayscale invert-[.9] contrast-[.9]"
          src="https://www.google.com/maps?q=Le+Solarium+Business+Tower+Dubai+Silicon+Oasis&output=embed" referrerPolicy="no-referrer-when-downgrade" /></div>
      </section>
    </>
  )
}

export function Legal({ kind }: { kind: 'privacy' | 'terms' }) {
  usePageSeo(`/${kind}`)
  const priv = kind === 'privacy'
  return (
    <>
      <PageHero eyebrow="Legal" title={priv ? 'Privacy Policy' : 'Terms & Conditions'} />
      <section className="bg-midnight pb-24"><div className="container-x max-w-3xl space-y-5 text-silver leading-relaxed">
        <p className="rounded-xl border border-cyan/30 bg-cyan/5 p-4 text-sm text-ice">Draft text — to be reviewed and approved by {company.legal} before publication.</p>
        {priv ? (<>
          <p>{company.legal} (“TAC”) collects the information you submit through our enquiry form (name, company, email, phone and message) solely to respond to your enquiry.</p>
          <p>We do not sell your information. To request access to or deletion of your data, contact <a className="text-cyan" href={`mailto:${company.email}`}>{company.email}</a>.</p>
        </>) : (<>
          <p>The content of this website is provided for general information about {company.legal}. Product and service details may change; please confirm specifications and availability with our team.</p>
          <p>All trademarks, logos and images remain the property of their respective owners.</p>
        </>)}
      </div></section>
    </>
  )
}

function CtaBand() {
  return (
    <section className="relative overflow-hidden bg-deep py-24 text-center"><div className="absolute inset-0 grid-bg opacity-40" />
      <div className="container-x relative"><Words text="LET'S BUILD A SMARTER FUTURE." className="h2" />
        <p className="mx-auto mt-5 max-w-lg text-silver">Have a project in mind? Let's discuss how intelligent automation can transform your space.</p>
        <div className="mt-8"><Magnetic to="/contact#enquiry">Get a Consultation</Magnetic></div></div></section>
  )
}

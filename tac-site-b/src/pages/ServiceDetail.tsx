import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { PageHero, CtaBand, ProductCard, ProjectCard, SectionHead } from '../components/ui'
import { MaskReveal, Magnetic, Reveal } from '../components/motion'
import Img from '../components/Img'
import { serviceBySlug, projectBySlug, productBySlug, services } from '../data/content'
import { useSeo } from '../lib/seo'

export default function ServiceDetail() {
  const { slug = '' } = useParams()
  const s = serviceBySlug(slug)
  useSeo(s?.title ?? 'Service', s?.short ?? '', `/services/${slug}`, s ? `/img/${s.image}-960.webp` : undefined)
  if (!s) return <Navigate to="/services" replace />
  const prj = s.projects.map((x) => projectBySlug(x)!).filter(Boolean)
  const prd = s.products.map((x) => productBySlug(x)!).filter(Boolean)
  const isTraining = s.slug === 'knx-training-and-certification'
  const others = services.filter((x) => x.slug !== s.slug)
  return (
    <>
      <PageHero eyebrow="Service" title={s.title} lead={s.short} crumbs={[{ label: 'Services', to: '/services' }, { label: s.title }]} />
      <section className="pb-24 md:pb-32">
        <div className="wrap grid gap-12 lg:grid-cols-12">
          <MaskReveal className="lg:col-span-7"><div className="aspect-[16/10] overflow-hidden rounded-3xl border border-white/10"><Img name={s.image} alt={s.alt} priority sizes="(min-width:1024px) 58vw, 100vw" className={`h-full w-full object-cover ${s.slug === 'guest-room-management-system' ? 'object-[30%_50%]' : ''}`} /></div></MaskReveal>
          <div className="lg:col-span-5">
            <div className="space-y-5">{s.description.map((d) => <Reveal key={d}><p className="lead">{d}</p></Reveal>)}</div>
            <Reveal delay={0.2} className="mt-8 flex flex-wrap gap-4">
              <Magnetic><Link to={isTraining ? '/knx-training' : `/contact?service=${encodeURIComponent(s.title.split(' (')[0])}#enquiry`} className="btn btn-primary">{isTraining ? 'Explore KNX Training' : 'Enquire about this service'} <ArrowRight size={16} /></Link></Magnetic>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="sec-tech py-20 md:py-28">
        <div className="wrap">
          <SectionHead eyebrow="Capabilities" title="What this covers." className="mb-12" />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {s.capabilities.map((c, i) => (
              <Reveal as="li" key={c} delay={(i % 3) * 0.08}><div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-midnight/50 p-5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cyan/10 text-cyan"><Check size={16} /></span><span className="text-white">{c}</span></div></Reveal>
            ))}
          </ul>
          {s.note && <p className="mt-8 text-xs text-slate">{s.note}</p>}
        </div>
      </section>

      {prj.length > 0 && (
        <section className="py-24 md:py-32">
          <div className="wrap">
            <SectionHead eyebrow="In practice" title="Delivered on real projects." className="mb-12" />
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{prj.map((p) => <ProjectCard key={p.slug} p={p} sizes="(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw" />)}</div>
          </div>
        </section>
      )}

      {prd.length > 0 && (
        <section className="light py-24 md:py-32">
          <div className="wrap">
            <SectionHead light eyebrow="Related products" title="Built on our KNX range." className="mb-12" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{prd.map((p) => <ProductCard key={p.slug} p={p} />)}</div>
          </div>
        </section>
      )}

      <section className="py-20">
        <div className="wrap">
          <p className="eyebrow mb-6">More solutions</p>
          <ul className="flex flex-wrap gap-3">{others.map((o) => <li key={o.slug}><Link to={`/services/${o.slug}`} className="inline-block rounded-full border border-white/15 px-5 py-2.5 text-sm text-silver transition hover:border-cyan hover:text-white">{o.title}</Link></li>)}</ul>
        </div>
      </section>
      <CtaBand />
    </>
  )
}

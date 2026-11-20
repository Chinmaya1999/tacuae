import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, MapPin } from 'lucide-react'
import type { ReactNode } from 'react'
import Img from './Img'
import { imgMeta } from './Img'
import { Magnetic, Reveal, WordReveal, DrawLine } from './motion'
import type { Product, Project } from '../data/content'

export function PageHero({ eyebrow, title, lead, crumbs, children }: { eyebrow: string; title: string; lead?: string; crumbs?: { label: string; to?: string }[]; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden pt-36 pb-16 md:pt-48 md:pb-24">
      <div className="bp-grid pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -right-40 -top-40 h-[40rem] w-[40rem] rounded-full bg-intel/20 blur-[140px]" />
      <div className="wrap relative">
        {crumbs && (
          <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest text-slate">
            <Link to="/" className="hover:text-cyan">Home</Link>
            {crumbs.map((c) => (<span key={c.label} className="flex items-center gap-2"><span>/</span>{c.to ? <Link to={c.to} className="hover:text-cyan">{c.label}</Link> : <span className="text-silver">{c.label}</span>}</span>))}
          </nav>
        )}
        <p className="eyebrow mb-5 flex items-center gap-3"><span className="pulse-dot" />{eyebrow}</p>
        <WordReveal as="h1" text={title} className="h-display max-w-5xl" immediate />
        {lead && <Reveal delay={0.4} className="mt-8 max-w-2xl"><p className="lead">{lead}</p></Reveal>}
        {children}
      </div>
    </section>
  )
}

export function SectionHead({ eyebrow, title, lead, light, className = '' }: { eyebrow: string; title: string; lead?: string; light?: boolean; className?: string }) {
  return (
    <div className={`max-w-3xl ${className}`}>
      <Reveal><p className="eyebrow mb-4">{eyebrow}</p></Reveal>
      <WordReveal text={title} className={`h-section ${light ? 'text-midnight' : 'text-white'}`} />
      {lead && <Reveal delay={0.25} className="mt-6"><p className="lead">{lead}</p></Reveal>}
    </div>
  )
}

export function CtaBand({ title = "Let's build a smarter future.", text = 'Have a project in mind? Let’s discuss how intelligent automation can transform your space.', to = '/contact#enquiry', cta = 'Get a Consultation' }: { title?: string; text?: string; to?: string; cta?: string }) {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div className="absolute inset-0 bg-gradient-to-br from-tech via-midnight to-[#06223d]" />
      <div className="bp-grid absolute inset-0" />
      <div className="wrap relative flex flex-col items-start justify-between gap-10 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <WordReveal text={title} className="h-section" />
          <Reveal delay={0.2} className="mt-5"><p className="lead">{text}</p></Reveal>
        </div>
        <Magnetic><Link to={to} className="btn btn-primary">{cta}<ArrowRight size={16} /></Link></Magnetic>
      </div>
    </section>
  )
}

/** Project photo that is never stretched: sources narrower than the tile are shown at native size over a blurred ambient copy. */
export function ProjectImage({ p, sizes, className = '' }: { p: Project; sizes: string; className?: string }) {
  if (p.lowRes) {
    const m = imgMeta(p.image)
    return (
      <div className={`relative grid place-items-center overflow-hidden bg-graphite ${className}`}>
        <Img name={p.image} alt="" sizes="480px" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-50 blur-2xl" />
        <Img name={p.image} alt={p.alt} sizes={sizes} className="relative max-h-full w-auto max-w-full object-contain shadow-2xl shadow-black/50 transition-transform duration-[1400ms] group-hover:scale-[1.04]" style={{ maxWidth: `min(100%, ${m.w}px)` }} />
      </div>
    )
  }
  return (
    <div className={`card-img relative overflow-hidden bg-graphite ${className}`}>
      <Img name={p.image} alt={p.alt} sizes={sizes} className="absolute inset-0 h-full w-full object-cover" />
    </div>
  )
}

export function ProjectCard({ p, className = '', sizes = '(min-width:1024px) 40vw, 100vw', tall = false }: { p: Project; className?: string; sizes?: string; tall?: boolean }) {
  return (
    <Link to={`/projects/${p.slug}`} className={`group relative block overflow-hidden rounded-2xl border border-white/10 bg-tech ${className}`}>
      <ProjectImage p={p} sizes={sizes} className={`w-full ${tall ? 'h-full min-h-[26rem]' : 'aspect-[4/3]'}`} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-midnight via-midnight/20 to-transparent" />
      <span className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-cyan transition-transform duration-700 group-hover:scale-x-100" />
      <div className="absolute inset-x-0 bottom-0 p-5 md:p-7">
        <p className="mb-2 flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.2em] text-ice"><MapPin size={12} />{p.location}<span className="text-slate">·</span><span className="text-cyan">{p.category}</span></p>
        <h3 className="font-display text-xl font-medium leading-tight text-white transition-transform duration-500 group-hover:-translate-y-1 md:text-2xl">{p.title}</h3>
        <span className="link-arrow mt-3 opacity-0 transition-all duration-500 group-hover:opacity-100">View Project <ArrowRight size={14} /></span>
      </div>
    </Link>
  )
}

/** Products: shown at native resolution on a light specimen panel. */
export function ProductCard({ p, className = '' }: { p: Product; className?: string }) {
  return (
    <Link to={`/products/${p.slug}`} className={`group flex flex-col overflow-hidden rounded-2xl border border-midnight/10 bg-white shadow-[0_1px_0_rgba(11,23,40,.04)] transition-all duration-500 hover:-translate-y-1.5 hover:border-intel/40 hover:shadow-[0_30px_60px_-30px_rgba(38,139,255,.45)] ${className}`}>
      <div className="relative grid place-items-center overflow-hidden bg-[#eaf4fd] p-0">
        <Img name={p.image} alt={p.title} sizes="361px" className="aspect-[361/278] w-full max-w-[361px] object-cover transition-transform duration-[1200ms] group-hover:scale-[1.05]" />
        <span className="absolute left-3 top-3 rounded-full bg-midnight/80 px-3 py-1 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-ice backdrop-blur">{p.category}</span>
      </div>
      <div className="flex flex-1 flex-col p-6 text-midnight">
        <h3 className="font-display text-lg font-semibold leading-snug">{p.title}</h3>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#4b5b70]">{p.paragraphs[0]}</p>
        <span className="link-arrow mt-auto pt-6">View Product <ArrowUpRight size={14} /></span>
      </div>
    </Link>
  )
}

export { DrawLine }

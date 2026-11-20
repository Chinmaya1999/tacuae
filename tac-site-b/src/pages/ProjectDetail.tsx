import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, MapPin, Check } from 'lucide-react'
import { PageHero, CtaBand, ProjectImage } from '../components/ui'
import { Counter, MaskReveal, Reveal } from '../components/motion'
import { projectBySlug, projects, services } from '../data/content'
import { useSeo } from '../lib/seo'

const num = (v: string) => { const m = v.replace(/,/g, '').match(/^(\d+)(.*)$/); return m ? { n: +m[1], s: m[2] } : null }

export default function ProjectDetail() {
  const { slug = '' } = useParams()
  const p = projectBySlug(slug)
  useSeo(p ? `${p.title}` : 'Project', p?.paragraphs[0]?.slice(0, 155) ?? '', `/projects/${slug}`, p ? `/img/${p.image}-480.webp` : undefined)
  if (!p) return <Navigate to="/projects" replace />
  const i = projects.findIndex((x) => x.slug === p.slug)
  const next = projects[(i + 1) % projects.length], prev = projects[(i - 1 + projects.length) % projects.length]
  const svc = services.filter((s) => s.projects.includes(p.slug))
  return (
    <>
      <PageHero eyebrow={p.category} title={p.title} crumbs={[{ label: 'Projects', to: '/projects' }, { label: p.title }]}>
        <p className="mt-6 flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-ice"><MapPin size={14} className="text-cyan" />{p.location}</p>
      </PageHero>
      <section className="pb-20 md:pb-28">
        <div className="wrap">
          <MaskReveal><div className="overflow-hidden rounded-3xl border border-white/10"><ProjectImage p={p} sizes="(min-width:1280px) 1200px, 100vw" className={p.lowRes ? 'min-h-[22rem] w-full md:min-h-[34rem]' : 'aspect-[16/9] w-full'} /></div></MaskReveal>
        </div>
      </section>
      <section className="pb-24 md:pb-32">
        <div className="wrap grid gap-14 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <Reveal><p className="eyebrow">Project overview</p></Reveal>
            {p.paragraphs.map((t, k) => <Reveal key={k}><p className={k === 0 ? 'font-display text-xl font-medium leading-relaxed text-white md:text-2xl' : 'lead'}>{t}</p></Reveal>)}
          </div>
          <aside className="space-y-8 lg:col-span-4 lg:col-start-9">
            {p.facts.length > 0 && (
              <div className="grid gap-6 rounded-2xl border border-white/10 bg-tech/70 p-7">
                {p.facts.map((f) => { const n = num(f.value); return (
                  <div key={f.label}><p className="grad-text font-display text-4xl font-semibold">{n ? <Counter to={n.n} suffix={n.s} /> : f.value}</p><p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate">{f.label}</p></div>
                ) })}
              </div>
            )}
            <div className="rounded-2xl border border-white/10 p-7">
              <h2 className="eyebrow mb-5">Systems</h2>
              <ul className="space-y-3">{p.systems.map((s) => <li key={s} className="flex items-start gap-3 text-sm text-silver"><Check size={16} className="mt-0.5 shrink-0 text-cyan" />{s}</li>)}</ul>
            </div>
            {svc.length > 0 && <div><h2 className="eyebrow mb-4">Related services</h2><ul className="flex flex-wrap gap-2">{svc.map((s) => <li key={s.slug}><Link to={`/services/${s.slug}`} className="inline-block rounded-full border border-white/15 px-4 py-2 text-xs text-silver transition hover:border-cyan hover:text-white">{s.title}</Link></li>)}</ul></div>}
          </aside>
        </div>
      </section>
      <section className="border-y border-white/10">
        <div className="wrap grid divide-y divide-white/10 md:grid-cols-2 md:divide-x md:divide-y-0">
          <Link to={`/projects/${prev.slug}`} className="group flex items-center gap-5 py-10 md:pr-10"><ArrowLeft className="text-cyan transition group-hover:-translate-x-1" /><span><span className="block text-xs uppercase tracking-widest text-slate">Previous</span><span className="font-display text-xl">{prev.title}</span></span></Link>
          <Link to={`/projects/${next.slug}`} className="group flex items-center justify-end gap-5 py-10 text-right md:pl-10"><span><span className="block text-xs uppercase tracking-widest text-slate">Next</span><span className="font-display text-xl">{next.title}</span></span><ArrowRight className="text-cyan transition group-hover:translate-x-1" /></Link>
        </div>
      </section>
      <CtaBand title="Planning a project like this?" text="Talk to our team about bringing intelligent automation to your building." />
    </>
  )
}

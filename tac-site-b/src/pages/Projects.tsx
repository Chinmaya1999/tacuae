import { useMemo, useState } from 'react'
import { PageHero, CtaBand, ProjectCard } from '../components/ui'
import { Reveal } from '../components/motion'
import { projects, company, yearsInIndustry } from '../data/content'
import { useSeo } from '../lib/seo'

export default function Projects() {
  useSeo('Projects', 'Major TAC UAE projects: Dubai International Airport, Meydan Racecourse, Iris Bay, La Verda Suites and Villas, American School of Dubai and more.', '/projects')
  const cats = useMemo(() => ['All', ...Array.from(new Set(projects.map((p) => p.category)))], [])
  const [cat, setCat] = useState('All')
  const list = projects.filter((p) => cat === 'All' || p.category === cat)
  return (
    <>
      <PageHero eyebrow="Projects" title="Where technology meets design excellence." lead={`With over ${yearsInIndustry()} years in the industry and more than ${company.projectsCompleted} projects completed, here are some of the major projects we have delivered.`} crumbs={[{ label: 'Projects' }]} />
      <section className="pb-24 md:pb-36">
        <div className="wrap">
          <div role="group" aria-label="Filter projects" className="mb-10 flex flex-wrap gap-2">
            {cats.map((c) => <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c} className={`rounded-full border px-5 py-2.5 text-xs font-medium uppercase tracking-wider transition ${cat === c ? 'border-cyan bg-cyan text-midnight' : 'border-white/15 text-silver hover:border-cyan hover:text-white'}`}>{c}</button>)}
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {list.map((p, i) => <Reveal key={p.slug} delay={(i % 3) * 0.08}><ProjectCard p={p} sizes="(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw" /></Reveal>)}
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  )
}

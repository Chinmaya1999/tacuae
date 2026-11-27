import { Link } from 'react-router-dom'
import { ArrowRight, Clock, Loader2, Sparkles } from 'lucide-react'
import { useAuth } from '../../auth/lib/auth'
import { aed, roomTypeById } from '../../../shared/data/catalog'
import { quickRooms, templates } from '../../../shared/data/templates'
import { Icon, PlanThumb, Stat, ago } from '../components/ui'
import DesignCard from '../components/DesignCard'
import { useDesigns } from './useDesigns'

const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening' }

export default function Home({ builder }: { builder: boolean }) {
  const { user } = useAuth(), { items, error } = useDesigns(), first = (user?.name ?? '').split(' ')[0]
  if (error) return <p role="alert" className="text-red-400">{error}</p>
  if (!items) return <Loader2 className="animate-spin text-cyan" />

  const drafts = items.filter((d) => d.status === 'draft'), quoted = items.filter((d) => d.status === 'quoted'), sent = items.filter((d) => d.status === 'submitted')
  const resume = drafts[0] ?? items[0]
  const rooms = items.reduce((n, d) => n + d.rooms.length, 0), devices = items.reduce((n, d) => n + (d.deviceCount ?? 0), 0)
  const latest = items.find((d) => (d.quote?.amount ?? d.estimate?.total ?? 0) > 0)
  const latestValue = latest ? latest.quote?.amount ?? latest.estimate!.total : 0

  return (
    <div className="space-y-10">
      {/* hero */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cyan/15 via-azure/10 to-transparent p-6 sm:p-9">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan/20 blur-3xl" />
        <p className="eyebrow">{builder ? 'Builder dashboard' : 'Smart living'}</p>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl">{greeting()}, {first}</h1>
        <p className="mt-2 max-w-xl text-silver">{builder ? 'Design smart homes for your clients, send them to TAC and receive a quotation for each project.' : 'Design it. Automate it. Experience it. Build your rooms, try your smart devices, then get a quote from TAC.'}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {resume && resume.status === 'draft'
            ? <Link to={`/dashboard/design/${resume.id}`} className="btn btn-primary">Continue “{resume.name.length > 22 ? resume.name.slice(0, 22) + '…' : resume.name}”<ArrowRight size={17} /></Link>
            : <Link to="/dashboard/design/new" className="btn btn-primary">Design my smart home<ArrowRight size={17} /></Link>}
          {resume?.status === 'draft' && <Link to="/dashboard/design/new" className="btn btn-ghost">Start a new design</Link>}
        </div>
      </section>

      {quoted.length > 0 && (
        <Link to="/dashboard/quotes" className="flex items-center gap-4 rounded-2xl border border-cyan/40 bg-cyan/10 p-4 transition hover:bg-cyan/15 sm:p-5" role="status">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan text-midnight"><Sparkles size={20} /></span>
          <span className="min-w-0 flex-1"><span className="block font-display">{quoted.length === 1 ? 'Your quotation is ready' : `${quoted.length} quotations are ready`}</span><span className="block text-sm text-silver">Review the price and accept it or ask for changes.</span></span>
          <ArrowRight className="text-cyan" />
        </Link>)}

      {quoted.length === 0 && sent.length > 0 && (
        <Link to="/dashboard/quotes" className="flex items-center gap-4 rounded-2xl border border-amber-300/30 bg-amber-400/10 p-4 sm:p-5" role="status">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-300/20 text-amber-200"><Clock size={20} /></span>
          <span className="min-w-0 flex-1"><span className="block font-display">{sent.length === 1 ? `“${sent[0].name}” is with TAC` : `${sent.length} designs are with TAC`}</span><span className="block text-sm text-silver">Our engineers are reviewing it. The price will appear here — we will not keep you waiting.</span></span>
          <ArrowRight className="text-amber-200" />
        </Link>)}

      {/* stats */}
      {items.length > 0 && (
        <section aria-label="Overview" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icon="FolderOpen" label={builder ? 'Projects' : 'Designs'} value={items.length} to="/dashboard/designs" hint={`${drafts.length} draft${drafts.length !== 1 ? 's' : ''} · ${sent.length} with TAC`} />
          <Stat icon="Layers" label="Rooms designed" value={rooms} />
          <Stat icon="Lightbulb" label="Smart items" value={devices} />
          <Stat icon="Wallet" label={latest?.quote ? 'Latest quote' : 'Latest estimate'} value={latestValue ? aed(latestValue) : '—'} hint={latest?.name} />
        </section>)}

      {/* continue */}
      {resume && resume.status === 'draft' && (
        <section aria-labelledby="continue">
          <h2 id="continue" className="mb-4 font-display text-xl">Continue where you left off</h2>
          <Link to={`/dashboard/design/${resume.id}`} className="grid gap-5 rounded-2xl border border-white/10 bg-white/[.03] p-4 transition hover:border-cyan/40 sm:grid-cols-[260px_1fr] sm:p-5">
            <PlanThumb design={resume} />
            <div className="flex flex-col justify-center">
              <div className="font-display text-xl">{resume.name}</div>
              <p className="mt-1 text-sm text-silver">{resume.rooms.map((r) => r.name).join(' · ')}</p>
              <p className="mt-1 text-sm text-slate">{resume.deviceCount} smart item{resume.deviceCount !== 1 ? 's' : ''} · edited {ago(resume.updatedAt)}{resume.estimate && resume.estimate.total > 0 ? ` · estimate ${aed(resume.estimate.total)}` : ''}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm text-cyan">Open in studio <ArrowRight size={15} /></span>
            </div>
          </Link>
        </section>)}

      {/* quick start */}
      <section aria-labelledby="quick">
        <div className="mb-4 flex items-end justify-between gap-4"><div><h2 id="quick" className="font-display text-xl">{items.length ? 'Start something new' : 'Pick a starting point'}</h2><p className="mt-1 text-sm text-slate">Templates come pre-loaded with smart devices — change anything you like.</p></div></div>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {templates.map((t) => (
            <li key={t.id}><Link to={`/dashboard/design/new?template=${t.id}`} className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[.03] p-5 transition hover:-translate-y-0.5 hover:border-cyan/50 hover:bg-white/[.06]">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-cyan/10 text-cyan transition group-hover:bg-cyan group-hover:text-midnight"><Icon name={t.icon} size={22} /></span>
              <span className="mt-4 font-display">{t.title}</span><span className="mt-1 flex-1 text-sm text-silver">{t.desc}</span>
              <span className="mt-4 text-xs text-slate">{t.rooms} room{t.rooms > 1 ? 's' : ''} · ready to edit</span></Link></li>))}
        </ul>
        <div className="mt-5"><div className="mb-3 text-xs uppercase tracking-[0.16em] text-slate">Or start with an empty room</div>
          <ul className="flex flex-wrap gap-2">{quickRooms.map((r) => (
            <li key={r}><Link to={`/dashboard/design/new?room=${r}`} className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-silver transition hover:border-cyan hover:text-cyan"><Icon name={roomTypeById[r].icon} size={15} />{roomTypeById[r].label}</Link></li>))}</ul></div>
      </section>

      {/* recent */}
      {items.length > 0 && (
        <section aria-labelledby="recent">
          <div className="mb-4 flex items-end justify-between"><h2 id="recent" className="font-display text-xl">{builder ? 'Recent projects' : 'Recent designs'}</h2><Link to="/dashboard/designs" className="text-sm text-cyan hover:underline">View all</Link></div>
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.slice(0, 3).map((d) => <DesignCard key={d.id} d={d} builder={builder} />)}</ul>
        </section>)}
    </div>
  )
}

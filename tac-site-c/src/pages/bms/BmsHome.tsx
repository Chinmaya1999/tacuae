import { Link } from 'react-router-dom'
import { ArrowRight, Loader2, Plus, Siren } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { buildingTypes } from '../../data/bms'
import { Icon, Stat } from '../../components/dashboard/ui'
import ProjectCard from '../../components/bms/ProjectCard'
import AlarmsList from './AlarmsList'
import { useOverview } from './useOverview'
import { api } from '../../lib/api'

const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening' }

export default function BmsHome() {
  const { user } = useAuth(), { data, error } = useOverview()
  if (error) return <p role="alert" className="text-red-400">{error}</p>
  if (!data) return <Loader2 className="animate-spin text-cyan" />
  const ps = data.projects, sum = (f: (p: (typeof ps)[number]) => number) => ps.reduce((n, p) => n + f(p), 0)
  const equipment = sum((p) => p.stats?.equipment ?? 0), online = sum((p) => p.stats?.online ?? 0)

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cyan/15 via-azure/10 to-transparent p-6 sm:p-9">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan/20 blur-3xl" />
        <p className="eyebrow">Building operations</p>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl">{greeting()}, {(user?.name ?? '').split(' ')[0]}</h1>
        <p className="mt-2 max-w-xl text-silver">Create your buildings, see every floor in 3D, and keep power, HVAC, water, access and safety systems under one roof.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/dashboard/projects/new" className="btn btn-primary"><Plus size={18} />New building project</Link>
          {ps[0] && <Link to={`/dashboard/projects/${ps[0].id}`} className="btn btn-ghost">Open “{ps[0].name.length > 20 ? ps[0].name.slice(0, 20) + '…' : ps[0].name}”<ArrowRight size={16} /></Link>}
        </div>
        <p className="mt-5 text-xs text-amber-200/80">Simulation mode: readings are generated for demonstration and are not coming from real equipment.</p>
      </section>

      {ps.length > 0 && (
        <section aria-label="Overview" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icon="Building2" label="Projects" value={ps.length} hint={`${sum((p) => p.stats?.towers ?? 0)} towers · ${sum((p) => p.stats?.floors ?? 0)} floors`} to="/dashboard/projects" />
          <Stat icon="Cpu" label="Equipment" value={equipment.toLocaleString()} hint={`${equipment ? Math.round((online / equipment) * 100) : 0}% online · simulated`} />
          <Stat icon="Siren" label="Active alarms" value={data.activeAlarms} hint={data.activeAlarms ? 'Needs attention' : 'All clear'} to="/dashboard/alarms" />
          <Stat icon="Zap" label="Energy today" value={`${sum((p) => p.stats?.todayKwh ?? 0).toLocaleString()} kWh`} hint={`${sum((p) => p.stats?.loadKw ?? 0)} kW now`} />
        </section>)}

      {data.alarms.length > 0 && (
        <section aria-labelledby="alarms-h">
          <div className="mb-4 flex items-end justify-between"><h2 id="alarms-h" className="flex items-center gap-2 font-display text-xl"><Siren size={18} className="text-red-300" />Active alarms</h2><Link to="/dashboard/alarms" className="text-sm text-cyan hover:underline">View all</Link></div>
          <AlarmsList items={data.alarms.slice(0, 4)} projects={ps} showProject onAck={async (a) => { await api(`/api/bms/projects/${a.projectId}/alarms/${a.id}/ack`, { method: 'POST' }) }} onResolve={async (a, note) => { await api(`/api/bms/projects/${a.projectId}/alarms/${a.id}/resolve`, { method: 'POST', body: { note } }) }} />
        </section>)}

      <section aria-labelledby="proj-h">
        <div className="mb-4 flex items-end justify-between"><h2 id="proj-h" className="font-display text-xl">{ps.length ? 'Your projects' : 'Start your first project'}</h2>{ps.length > 0 && <Link to="/dashboard/projects" className="text-sm text-cyan hover:underline">View all</Link>}</div>
        {ps.length > 0 ? <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{ps.slice(0, 6).map((p) => <ProjectCard key={p.id} p={p} />)}</ul> : (
          <div><p className="mb-4 max-w-2xl text-silver">Choose a building type to begin. You will set towers and floors, and we will place typical equipment so your digital twin is useful straight away.</p>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">{buildingTypes.map((t) => <li key={t.id}><Link to={`/dashboard/projects/new?type=${t.id}`} className="flex h-full flex-col items-start gap-3 rounded-2xl border border-white/10 bg-white/[.03] p-4 transition hover:border-cyan/50 hover:bg-white/[.06]"><span className="grid h-11 w-11 place-items-center rounded-xl bg-cyan/10 text-cyan"><Icon name={t.icon} size={20} /></span><span className="text-sm">{t.label}</span></Link></li>)}</ul></div>)}
      </section>

      <section aria-labelledby="homes-h" className="rounded-2xl border border-white/10 bg-white/[.03] p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div><h2 id="homes-h" className="font-display text-lg">Smart-home designs for your clients</h2><p className="mt-1 text-sm text-silver">Design apartments in 3D, send them to TAC and receive a quotation per unit.</p></div>
        <Link to="/dashboard/designs" className="btn btn-ghost mt-4 shrink-0 sm:mt-0">Open client designs<ArrowRight size={16} /></Link>
      </section>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { Loader2, Plus } from 'lucide-react'
import ProjectCard from '../components/ProjectCard'
import { useOverview } from './useOverview'

export default function ProjectsList() {
  const { data, error } = useOverview()
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-display text-3xl">Projects</h1><p className="mt-1 text-silver">Every building you manage, with live status.</p></div>
        <Link to="/dashboard/projects/new" className="btn btn-primary"><Plus size={18} />New project</Link></div>
      {error && <p role="alert" className="text-red-400">{error}</p>}
      {!data && !error && <Loader2 className="animate-spin text-accent" />}
      {data && data.projects.length === 0 && <div className="rounded-3xl border border-dashed border-white/20 p-12 text-center"><p className="text-silver">No projects yet.</p><Link to="/dashboard/projects/new" className="btn btn-primary mt-5">Create your first project</Link></div>}
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data?.projects.map((p) => <ProjectCard key={p.id} p={p} />)}</ul>
    </div>
  )
}

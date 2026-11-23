import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { api } from '../../lib/api'
import type { Alarm, Project } from '../../data/bms'
import AlarmsList from './AlarmsList'
import { useOverview } from './useOverview'

/** Alarms across all of the builder's projects. */
export default function BuilderAlarms() {
  const [state, setState] = useState('open'), [items, setItems] = useState<Alarm[] | null>(null), { data } = useOverview()
  const load = useCallback(() => api<{ items: Alarm[] }>(`/api/bms/alarms?state=${state}`).then((d) => setItems(d.items)).catch(() => setItems([])), [state])
  useEffect(() => { setItems(null); load(); const t = setInterval(load, 15000); return () => clearInterval(t) }, [load])
  const projects: Project[] = data?.projects ?? []
  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-3xl">Alarms</h1><p className="mt-1 text-silver">Acknowledge problems, then resolve them with a note. Everything stays in the event history.</p></div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Alarm state">{[['open', 'Open'], ['acknowledged', 'Acknowledged'], ['resolved', 'Resolved']].map(([k, l]) => <button key={k} onClick={() => setState(k)} aria-pressed={state === k} className={`rounded-full border px-4 py-2 text-sm ${state === k ? 'border-cyan bg-cyan/15 text-cyan' : 'border-white/15 text-silver'}`}>{l}</button>)}</div>
      {!items ? <Loader2 className="animate-spin text-cyan" /> : <AlarmsList items={items} projects={projects} showProject onAck={async (a) => { await api(`/api/bms/projects/${a.projectId}/alarms/${a.id}/ack`, { method: 'POST' }); await load() }} onResolve={async (a, note) => { await api(`/api/bms/projects/${a.projectId}/alarms/${a.id}/resolve`, { method: 'POST', body: { note } }); await load() }} empty={state === 'open' ? 'No open alarms. Everything is running normally.' : 'Nothing here.'} />}
    </div>
  )
}

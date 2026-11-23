import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Box, Eye, Loader2, MapPin, Maximize2, Minimize2, Moon, PanelLeft, Pencil, Plus, RotateCcw, Siren, Sun, Table2, ZoomIn, ZoomOut } from 'lucide-react'
import { api } from '../../lib/api'
import { useCatalog, useLive } from '../../lib/bms'
import { isNightNow } from '../../components/bms/facade'
import { levelName, moduleIcon, statusColor, typeLabel, worst, type Alarm, type Equip, type Project, type Status } from '../../data/bms'
import { Icon } from '../../components/dashboard/ui'
import EquipPanel from '../../components/bms/EquipPanel'
import EquipImage from '../../components/bms/EquipImage'
import EquipPicker from '../../components/bms/EquipPicker'
import Systems from './Systems'
import AlarmsList from './AlarmsList'

const Twin3D = lazy(() => import('../../components/bms/Twin3D')) // three.js loads only when a project is opened
const hasWebGL = () => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')) } catch { return false } }
type Tab = 'twin' | 'systems' | 'alarms'
const MODULE_PIC: Record<string, string> = { power: 'lt-panel', hvac: 'ahu', access: 'access-door', pumping: 'pump', elevator: 'elevator', lighting: 'lighting-zone', security: 'cctv', fire: 'fire-panel', water: 'tank', parking: 'ev-charger' }
const Kpi = ({ label, value, tone, slim }: { label: string; value: string | number; tone?: 'bad' | 'good'; slim?: boolean }) => slim ? (
  <div className="flex items-baseline gap-2 rounded-full border border-white/10 bg-white/[.03] px-4 py-1.5 text-sm"><span className="text-[0.66rem] uppercase tracking-[0.14em] text-slate">{label}</span><span className={`font-display tabular-nums ${tone === 'bad' ? 'text-red-300' : tone === 'good' ? 'text-emerald-300' : ''}`}>{value}</span></div>
) : (
  <div className="rounded-xl border border-white/10 bg-white/[.03] px-4 py-3"><div className="text-[0.68rem] uppercase tracking-[0.14em] text-slate">{label}</div><div className={`mt-0.5 font-display text-xl tabular-nums ${tone === 'bad' ? 'text-red-300' : tone === 'good' ? 'text-emerald-300' : ''}`}>{value}</div></div>
)

export default function ProjectPage() {
  const { id } = useParams(), nav = useNavigate(), catalog = useCatalog(), { live } = useLive(id)
  const [project, setProject] = useState<Project | null>(null), [equipment, setEquipment] = useState<Equip[]>([]), [tab, setTab] = useState<Tab>('twin')
  const [sel, setSel] = useState<{ towerId: string; level: number } | null>(null), [browseTower, setBrowseTower] = useState<string | null>(null), [selectedEquip, setSelectedEquip] = useState<string | null>(null), [moduleFilter, setModuleFilter] = useState<string | null>(null)
  const [edit, setEdit] = useState(false), [placing, setPlacing] = useState<string | null>(null), [alarms, setAlarms] = useState<Alarm[]>([]), [alarmState, setAlarmState] = useState('open'), [msg, setMsg] = useState('')
  const [webgl] = useState(hasWebGL), [night, setNight] = useState(isNightNow), [xray, setXray] = useState(false), [full, setFull] = useState(false), [panels, setPanels] = useState(() => typeof window === 'undefined' || window.innerWidth >= 1024), [sysFull, setSysFull] = useState(false), [resetKey, setResetKey] = useState(0), [zoom, setZoom] = useState<{ n: number; dir: 1 | -1 }>({ n: 0, dir: 1 })

  useEffect(() => { document.title = 'Building | TAC UAE' }, [])
  useEffect(() => {
    Promise.all([api<{ project: Project }>(`/api/bms/projects/${id}`), api<{ items: Equip[] }>(`/api/bms/projects/${id}/equipment`)])
      .then(([p, e]) => { setProject(p.project); setEquipment(e.items); setSel({ towerId: p.project.towers[0].id, level: Math.min(1, p.project.towers[0].floors - 1) }); document.title = `${p.project.name} | TAC UAE` })
      .catch(() => nav('/dashboard/projects', { replace: true }))
  }, [id, nav])
  useEffect(() => { if (sel) setBrowseTower(sel.towerId) }, [sel])
  useEffect(() => { // R resets the 3D camera; Esc leaves the full-screen Systems view
    const k = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return
      if (e.key.toLowerCase() === 'r' && tab === 'twin' && !e.ctrlKey && !e.metaKey) setResetKey((n) => n + 1)
      if (e.key === 'Escape') setSysFull(false)
    }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [tab])
  useEffect(() => { // full-screen Systems: lock page scroll
    if (!sysFull || tab !== 'systems') return
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [sysFull, tab])
  useEffect(() => { // full-screen viewer: lock page scroll, Esc leaves it, panels start closed on small screens
    if (!full) return
    setPanels(window.innerWidth >= 1024)
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden'
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setFull(false)
    window.addEventListener('keydown', k)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', k) }
  }, [full])
  const slow = Math.floor((live?.ts ?? 0) / 10000)
  const loadAlarms = useCallback(() => api<{ items: Alarm[] }>(`/api/bms/projects/${id}/alarms${alarmState === 'all' ? '' : `?state=${alarmState}`}`).then((d) => setAlarms(d.items)).catch(() => {}), [id, alarmState])
  useEffect(() => { loadAlarms() }, [loadAlarms, slow])

  const activeTowerId = browseTower ?? sel?.towerId ?? project?.towers[0]?.id
  const levels = useMemo(() => { const t = project?.towers.find((x) => x.id === activeTowerId); return t ? Array.from({ length: t.floors + t.basements + 1 }, (_, i) => t.floors - i) : [] }, [project, activeTowerId])
  const levelInfo = useMemo(() => { const m = new Map<string, { n: number; st?: Status }>(); for (const e of equipment) { const k = `${e.towerId}:${e.level}`, c = m.get(k) ?? { n: 0 }; c.n++; c.st = worst(c.st, live?.items[e.id]?.status ?? 'online'); m.set(k, c) } return m }, [equipment, live])

  if (!project || !catalog) return <div className="grid min-h-screen place-items-center bg-midnight"><Loader2 className="animate-spin text-cyan" /></div>
  const tower = project.towers.find((t) => t.id === activeTowerId), selEquip = equipment.find((e) => e.id === selectedEquip)
  const t = live?.totals, activeIssues = (t?.alarm ?? 0) + (t?.fault ?? 0), onlinePct = t && t.total ? Math.round(((t.online + t.warning) / t.total) * 100) : 0
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 4000) }

  const place = async (towerId: string, level: number, x: number, y: number) => {
    if (!placing) return
    try { const r = await api<{ item: Equip }>(`/api/bms/projects/${id}/equipment`, { method: 'POST', body: { type: placing, towerId, level, x, y } }); setEquipment((q) => [...q, r.item]); setSelectedEquip(r.item.id); flash(`${r.item.tag} added.`) } catch (e) { flash((e as Error).message) }
  }
  const move = async (eid: string, x: number, y: number) => {
    setEquipment((q) => q.map((e) => (e.id === eid ? { ...e, x, y } : e)))
    api(`/api/bms/projects/${id}/equipment/${eid}`, { method: 'PATCH', body: { x, y } }).catch(() => flash('Could not save the new position.'))
  }
  const remove = async () => {
    if (!selEquip || !confirm(`Remove ${selEquip.tag} from this building?`)) return
    try { await api(`/api/bms/projects/${id}/equipment/${selEquip.id}`, { method: 'DELETE' }); setEquipment((q) => q.filter((e) => e.id !== selEquip.id)); setSelectedEquip(null) } catch (e) { flash((e as Error).message) }
  }
  const pickModule = (id: string | null) => {
    const next = moduleFilter === id ? null : id
    setModuleFilter(next)
    if (!next || !activeTowerId || !tower) return
    const label = catalog.modules.find((m) => m.id === next)?.label ?? next
    const levels = [...new Set(equipment.filter((e) => e.towerId === activeTowerId && catalog.equipment.find((d) => d.id === e.type)?.module === next).map((e) => e.level))]
    if (!levels.length) return flash(`No ${label} equipment in ${tower.name}.`)
    if (!sel || sel.towerId !== activeTowerId || !levels.includes(sel.level)) {
      const from = sel?.level ?? 0, lv = [...levels].sort((a, b) => Math.abs(a - from) - Math.abs(b - from))[0]
      setSel({ towerId: activeTowerId, level: lv }); setSelectedEquip(null); flash(`${label} equipment is on ${levelName(lv, tower.floors)} — showing it.`)
    }
  }
  const moduleCount = (id: string) => live?.byModule[id]?.total ?? equipment.filter((e) => catalog.equipment.find((d) => d.id === e.type)?.module === id).length
  const locate = (eid: string) => { const e = equipment.find((x) => x.id === eid); if (!e) return; setSysFull(false); setSel({ towerId: e.towerId, level: e.level }); setSelectedEquip(eid); setModuleFilter(null); setTab('twin') }
  const ack = async (a: Alarm) => { await api(`/api/bms/projects/${id}/alarms/${a.id}/ack`, { method: 'POST' }); await loadAlarms() }
  const resolve = async (a: Alarm, note: string) => { await api(`/api/bms/projects/${id}/alarms/${a.id}/resolve`, { method: 'POST', body: { note } }); await loadAlarms() }
  const openAlarms = alarms.filter((a) => a.state === 'active').length // unacknowledged

  return (
    <div className="min-h-screen bg-midnight text-white">
      <header className="border-b border-white/10 bg-deep/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1700px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 lg:px-6">
          <Link to="/dashboard/projects" aria-label="Back to projects" className="rounded-full p-2 text-silver hover:bg-white/5 hover:text-cyan"><ArrowLeft size={20} /></Link>
          <div className="min-w-0 flex-1"><h1 className="truncate font-display text-lg sm:text-xl">{project.name}</h1><p className="flex items-center gap-2 text-xs text-slate"><MapPin size={12} />{project.location || 'No location'} · {typeLabel(project.type)}</p></div>
          <span className="rounded-full border border-amber-300/40 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-200">Simulation · readings are generated, not from real equipment</span>
        </div>
        <nav aria-label="Project sections" className="mx-auto flex max-w-[1700px] gap-1 overflow-x-auto px-4 lg:px-6">
          {([['twin', 'Digital twin', Box], ['systems', 'Systems', Table2], ['alarms', 'Alarms', Siren]] as const).map(([k, l, I]) => (
            <button key={k} onClick={() => setTab(k)} aria-current={tab === k ? 'page' : undefined} className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm transition ${tab === k ? 'border-cyan text-cyan' : 'border-transparent text-silver hover:text-white'}`}>
              <I size={16} />{l}{k === 'alarms' && activeIssues + openAlarms > 0 && <span className="rounded-full bg-red-500 px-2 py-0.5 text-[0.65rem] text-white">{openAlarms || activeIssues}</span>}</button>))}
        </nav>
      </header>

      <main className="mx-auto max-w-[1700px] space-y-5 px-4 py-5 lg:px-6">
        <section aria-label="Key figures" className={tab === 'twin' ? 'flex flex-wrap gap-2' : 'grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7'}>
          <Kpi slim={tab === 'twin'} label="Equipment" value={t?.total ?? equipment.length} /><Kpi slim={tab === 'twin'} label="Online" value={`${onlinePct}%`} tone={onlinePct >= 95 ? 'good' : undefined} />
          <Kpi slim={tab === 'twin'} label="Active issues" value={activeIssues} tone={activeIssues ? 'bad' : 'good'} /><Kpi slim={tab === 'twin'} label="Offline" value={t?.offline ?? 0} />
          <Kpi slim={tab === 'twin'} label="Building load" value={`${live?.energy.loadKw ?? 0} kW`} /><Kpi slim={tab === 'twin'} label="Solar" value={`${live?.energy.solarKw ?? 0} kW`} /><Kpi slim={tab === 'twin'} label="Energy today" value={`${(live?.energy.todayKwh ?? 0).toLocaleString()} kWh`} />
        </section>

        {tab === 'twin' && (
          <div className={full ? 'fixed inset-0 z-50 bg-midnight' : 'relative h-[calc(100vh-250px)] min-h-[600px] overflow-hidden rounded-3xl border border-white/10 bg-deep'}>
            <aside className={`absolute bottom-3 left-3 top-14 z-10 w-[min(280px,84vw)] space-y-4 overflow-y-auto rounded-2xl border border-white/10 bg-midnight/85 p-3 backdrop-blur ${panels ? '' : 'hidden'}`} aria-label="Floors and filters">
              {project.towers.length > 1 && <div className="flex flex-wrap gap-1.5">{project.towers.map((x) => <button key={x.id} onClick={() => { setSel({ towerId: x.id, level: Math.min(1, x.floors - 1) }); setSelectedEquip(null) }} className={`rounded-full border px-3 py-1 text-xs ${activeTowerId === x.id ? 'border-cyan bg-cyan/15 text-cyan' : 'border-white/15 text-silver'}`}>{x.name}</button>)}</div>}
              <div role="group" aria-label="Show system">
                <div className="mb-2 text-xs uppercase tracking-[0.14em] text-slate">Systems</div>
                <ul className="grid grid-cols-2 gap-1.5">
                  <li><button onClick={() => pickModule(null)} aria-pressed={!moduleFilter} className={`flex h-full w-full items-center gap-2 rounded-xl border p-2 text-left text-xs transition ${!moduleFilter ? 'border-cyan bg-cyan/10 text-cyan' : 'border-white/10 text-silver hover:border-white/30'}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/5"><Icon name="LayoutGrid" size={18} /></span>All systems</button></li>
                  {catalog.modules.map((m) => { const ml = live?.byModule[m.id], issues = (ml?.alarm ?? 0) + (ml?.fault ?? 0), on = moduleFilter === m.id; return (
                    <li key={m.id}><button onClick={() => pickModule(m.id)} aria-pressed={on} title={`${m.label}: ${moduleCount(m.id)} devices`} className={`relative flex h-full w-full items-center gap-2 rounded-xl border p-2 text-left text-xs transition ${on ? 'border-cyan bg-cyan/10 text-cyan' : 'border-white/10 text-silver hover:border-white/30'}`}>
                      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-gradient-to-b from-[#1a2b44] to-[#0e1a2b]"><EquipImage type={MODULE_PIC[m.id]} size={40} fallback={moduleIcon[m.id]} /></span>
                      <span className="min-w-0"><span className="block truncate">{m.label.replace(' control', '').replace('Fire & safety', 'Fire').replace('Parking & EV', 'Parking')}</span><span className="block text-[0.65rem] text-slate">{moduleCount(m.id)} devices</span></span>
                      {issues > 0 && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500" aria-label={`${issues} issues`} />}</button></li>) })}
                </ul>
              </div>
              <div><div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.14em] text-slate"><span>Floors</span><button onClick={() => { setSel(null); setSelectedEquip(null) }} className="normal-case text-cyan hover:underline">Whole building</button></div>
                <ul className="max-h-[34vh] space-y-1 overflow-y-auto pr-1">{levels.map((lv) => { const li = levelInfo.get(`${activeTowerId}:${lv}`), on = sel?.towerId === activeTowerId && sel?.level === lv; return (
                  <li key={lv}><button onClick={() => { setSel({ towerId: activeTowerId!, level: lv }); setSelectedEquip(null) }} aria-pressed={on} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${on ? 'bg-cyan/15 text-cyan' : 'text-silver hover:bg-white/5'}`}>
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: statusColor[li?.st ?? 'online'] }} />{tower ? levelName(lv, tower.floors) : lv}<span className="ml-auto text-xs text-slate">{li?.n ?? 0}</span></button></li>) })}</ul></div>
              <div className="rounded-xl border border-white/10 p-3">
                <button onClick={() => { setEdit(!edit); setPlacing(null) }} aria-pressed={edit} className={`flex w-full items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm ${edit ? 'border-cyan bg-cyan/15 text-cyan' : 'border-white/20 text-silver hover:text-white'}`}><Pencil size={14} />{edit ? 'Editing equipment' : 'Edit equipment'}</button>
                {edit && <div className="mt-3 space-y-2"><div className="text-xs text-silver">Add to this floor</div><EquipPicker catalog={catalog} value={placing} onChange={setPlacing} />
                  <p className="text-xs text-slate">{placing ? <><Plus size={12} className="mr-1 inline" />Click on the floor in the 3D view to place it.</> : 'Pick equipment above, or drag existing equipment to move it.'}</p></div>}
              </div>
            </aside>

            <section className="absolute inset-0" aria-label="3D building">
              <div className="relative h-full w-full overflow-hidden bg-deep" style={{ touchAction: 'none' }} onDoubleClick={(e) => { if (e.target instanceof HTMLCanvasElement) setResetKey((n) => n + 1) }}>
                {webgl ? <Suspense fallback={<div className="grid h-full place-items-center text-silver"><div className="text-center"><Loader2 className="mx-auto mb-3 animate-spin text-cyan" />Building your digital twin…</div></div>}>
                  <Twin3D night={night} xray={xray} resetKey={resetKey} zoom={zoom} project={project} equipment={equipment} live={live} catalog={catalog} sel={sel} selectedEquip={selectedEquip} moduleFilter={moduleFilter} placing={edit ? placing : null} editable={edit}
                    onFloor={(towerId, level) => { setSel({ towerId, level }); setSelectedEquip(null) }} onEquip={setSelectedEquip} onPlace={place} onMove={move} />
                </Suspense> : <div className="grid h-full place-items-center p-8 text-center text-silver">3D is not available on this device. Use the Systems tab to see all equipment and its live status.</div>}
                <div className="absolute right-3 top-3 z-20 flex gap-2">
                  {<button onClick={() => setPanels(!panels)} aria-pressed={panels} aria-label="Panels" title="Show or hide the side panels" className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs backdrop-blur ${panels ? 'border-cyan bg-cyan/20 text-cyan' : 'border-white/15 bg-midnight/80 text-silver hover:text-white'}`}><PanelLeft size={13} /><span className="hidden sm:inline">Panels</span></button>}
                  <button onClick={() => setNight(!night)} aria-pressed={night} aria-label={night ? 'Night' : 'Day'} className="flex items-center gap-1.5 rounded-full border border-white/15 bg-midnight/80 px-3 py-1.5 text-xs text-silver backdrop-blur hover:text-white">{night ? <Moon size={13} /> : <Sun size={13} />}<span className="hidden sm:inline">{night ? 'Night' : 'Day'}</span></button>
                  <button onClick={() => setXray(!xray)} aria-pressed={xray} aria-label="X-ray" title="See through the facade" className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs backdrop-blur ${xray ? 'border-cyan bg-cyan/20 text-cyan' : 'border-white/15 bg-midnight/80 text-silver hover:text-white'}`}><Eye size={13} /><span className="hidden sm:inline">X-ray</span></button>
                  <button onClick={() => setFull(!full)} aria-pressed={full} aria-label={full ? 'Exit full screen' : 'Full screen'} title={full ? 'Exit full screen (Esc)' : 'Full screen'} className="flex items-center gap-1.5 rounded-full border border-white/15 bg-midnight/80 px-3 py-1.5 text-xs text-silver backdrop-blur hover:text-white">{full ? <Minimize2 size={13} /> : <Maximize2 size={13} />}<span className={full ? '' : 'hidden sm:inline'}>{full ? 'Exit' : 'Full screen'}</span></button>
                </div>
                <div className={`absolute bottom-14 z-20 flex flex-col gap-2 ${selEquip ? 'right-[372px]' : 'right-3'}`} role="group" aria-label="Camera">
                  {([['Zoom in', ZoomIn, () => setZoom((z) => ({ n: z.n + 1, dir: 1 }))], ['Zoom out', ZoomOut, () => setZoom((z) => ({ n: z.n + 1, dir: -1 }))], ['Reset view (R)', RotateCcw, () => setResetKey((n) => n + 1)]] as const).map(([label, I, fn]) => (
                    <button key={label} onClick={fn} aria-label={label} title={label} className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-midnight/80 text-silver backdrop-blur transition hover:border-cyan hover:text-cyan"><I size={17} /></button>))}
                </div>
                <div className={`pointer-events-none absolute left-3 z-20 flex flex-wrap items-center gap-2 ${panels ? 'sm:top-3' : 'top-3'} top-3`}>
                  <span className="max-w-[44vw] truncate rounded-full border border-white/25 bg-midnight/90 px-4 py-2 text-sm font-medium text-white backdrop-blur sm:max-w-none">{sel ? (() => { const st = project.towers.find((x) => x.id === sel.towerId); return st ? `${st.name} › ${levelName(sel.level, st.floors)}` : 'Whole building' })() : 'Whole building'}</span>
                  {sel && <button onClick={() => { setSel(null); setSelectedEquip(null) }} className="pointer-events-auto rounded-full border border-cyan/50 bg-midnight/90 px-4 py-2 text-sm font-medium text-cyan backdrop-blur hover:bg-cyan/10"><span className="sm:hidden">Back</span><span className="hidden sm:inline">Back to whole building</span></button>}
                </div>
                <div className={`pointer-events-none absolute bottom-3 flex flex-wrap gap-3 rounded-xl bg-midnight/80 px-3 py-2 text-[0.68rem] text-silver backdrop-blur ${panels ? 'left-[300px]' : 'left-3'}`}>
                  {(['online', 'warning', 'alarm', 'fault', 'offline'] as const).map((s) => <span key={s} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: statusColor[s] }} />{s}</span>)}</div>
                <p className="pointer-events-none absolute bottom-3 right-3 hidden rounded-lg bg-midnight/80 px-3 py-1.5 text-[0.68rem] text-silver backdrop-blur sm:block">Click a floor to open it · click equipment for details · drag to orbit · double-click or R to reset</p>
              </div>
            </section>

            <div className={`absolute bottom-3 right-3 top-14 z-10 w-[min(350px,88vw)] space-y-3 overflow-y-auto ${selEquip ? '' : 'hidden'}`}>
              {selEquip ? <EquipPanel project={project} equip={selEquip} catalog={catalog} live={live} editable={edit} onRemove={remove} onClose={() => setSelectedEquip(null)} />
                : <div className="rounded-2xl border border-dashed border-white/15 p-6 text-sm text-silver"><div className="font-display text-base text-white">Select equipment</div><p className="mt-2">Open a floor, then click any marker to see its live readings, trend and location. Red and orange floors have active problems.</p>
                  {activeIssues > 0 && <button onClick={() => setTab('alarms')} className="mt-4 text-cyan hover:underline">View {activeIssues} active issue{activeIssues > 1 ? 's' : ''} →</button>}</div>}
            </div>
          </div>)}

        {tab === 'systems' && (
          <div className={sysFull ? 'fixed inset-0 z-50 overflow-y-auto bg-midnight px-4 py-5 lg:px-8 lg:py-8' : ''}>
            <div className="mx-auto max-w-[1700px]">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="font-display text-xl">{sysFull ? `${project.name} · Systems` : 'Systems'}</h2><p className="text-xs text-slate">Live status of every system, simulated.</p></div>
                <button onClick={() => setSysFull(!sysFull)} aria-pressed={sysFull} aria-label={sysFull ? 'Exit full screen' : 'Full screen'} title={sysFull ? 'Exit full screen (Esc)' : 'Full screen'} className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-silver hover:border-cyan hover:text-cyan">{sysFull ? <Minimize2 size={15} /> : <Maximize2 size={15} />}{sysFull ? 'Exit full screen' : 'Full screen'}</button>
              </div>
              <Systems project={project} equipment={equipment} live={live} catalog={catalog} onLocate={locate} />
            </div>
          </div>)}
        {tab === 'alarms' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Alarm state">{[['open', 'Open'], ['acknowledged', 'Acknowledged'], ['resolved', 'Resolved'], ['all', 'All']].map(([k, l]) => <button key={k} onClick={() => setAlarmState(k)} aria-pressed={alarmState === k} className={`rounded-full border px-4 py-2 text-sm ${alarmState === k ? 'border-cyan bg-cyan/15 text-cyan' : 'border-white/15 text-silver'}`}>{l}</button>)}</div>
            <AlarmsList items={alarms} projects={[project]} onAck={ack} onResolve={resolve} empty={alarmState === 'open' ? 'No active alarms. Everything is running normally.' : 'Nothing here.'} />
          </div>)}
      </main>
      {msg && <p role="alert" className="fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border border-cyan/40 bg-deep px-4 py-3 text-sm shadow-2xl">{msg}</p>}
    </div>
  )
}

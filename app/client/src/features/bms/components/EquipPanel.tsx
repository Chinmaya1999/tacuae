import { useEffect, useState } from 'react'
import { Trash2, X } from 'lucide-react'
import { api } from '../../../shared/lib/api'
import { fmtVal, levelName, statusColor, statusLabel, type Catalog, type Equip, type Live, type Project } from '../data/bms'
import { Meter, TrendChart } from './charts'
import { Icon } from '../../dashboard/components/ui'
import EquipImage from './EquipImage'
import { moduleIcon } from '../data/bms'

type Pt = { t: number; v: number }
type Props = { project: Project; equip: Equip; catalog: Catalog; live: Live | null; editable: boolean; onRemove: () => void; onClose: () => void }

/** Everything about one piece of equipment: status, live readings, 24 h trend, location. */
export default function EquipPanel({ project, equip, catalog, live, editable, onRemove, onClose }: Props) {
  const def = catalog.equipment.find((d) => d.id === equip.type), mod = catalog.modules.find((m) => m.id === def?.module)
  const lv = live?.items[equip.id], tower = project.towers.find((t) => t.id === equip.towerId)
  const [key, setKey] = useState(def?.readings.find((r) => r.primary)?.key ?? def?.readings[0]?.key ?? ''), [series, setSeries] = useState<Record<string, Pt[]> | null>(null)
  useEffect(() => { setKey(def?.readings.find((r) => r.primary)?.key ?? def?.readings[0]?.key ?? ''); setSeries(null) }, [equip.id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    let alive = true
    api<{ series: Record<string, Pt[]> }>(`/api/bms/projects/${project.id}/equipment/${equip.id}/history?hours=24`).then((d) => alive && setSeries(d.series)).catch(() => {})
    return () => { alive = false }
  }, [project.id, equip.id])
  if (!def) return null
  const st = lv?.status ?? 'online', rd = def.readings.find((r) => r.key === key)

  return (
    <aside aria-label={`${equip.tag} details`} className="space-y-4 rounded-2xl border border-white/10 bg-white/[.03] p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: `${mod?.color}22`, color: mod?.color }}><Icon name={moduleIcon[def.module] ?? 'Gauge'} size={20} /></span>
        <div className="min-w-0 flex-1"><div className="font-display leading-tight">{equip.name}</div><div className="text-sm text-silver">{equip.tag} · {mod?.label}</div></div>
        <button onClick={onClose} aria-label="Close details" className="rounded-full p-1.5 text-slate hover:bg-white/5 hover:text-white"><X size={16} /></button>
      </div>
      <div className="rounded-xl bg-gradient-to-b from-[#1a2b44] to-[#141c30] py-2"><EquipImage type={equip.type} size={170} className="mx-auto" fallback={moduleIcon[def.module]} /></div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs" style={{ borderColor: `${statusColor[st]}88`, color: statusColor[st], background: `${statusColor[st]}18` }}><span className="h-2 w-2 rounded-full" style={{ background: statusColor[st] }} />{statusLabel[st]}</span>
        <span className="rounded-md bg-white/10 px-2.5 py-1 text-sm font-medium text-white">{tower?.name} · {tower ? levelName(equip.level, tower.floors) : ''}</span>
      </div>
      {def.safety && <p className="rounded-lg border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">Status only. This system stays under its certified controller; the platform reads status and alarms but never sends commands.</p>}
      <ul className="space-y-3">{def.readings.map((r) => { const v = lv?.values[r.key] ?? null; return (
        <li key={r.key}><button onClick={() => setKey(r.key)} aria-pressed={key === r.key} className={`block w-full rounded-lg p-2 text-left transition ${key === r.key ? 'bg-white/[.06]' : 'hover:bg-white/[.03]'}`}>
          <div className="flex items-baseline justify-between text-sm"><span className="text-silver">{r.label}</span><span className="font-display tabular-nums">{fmtVal(v, r.unit)}</span></div><div className="mt-1.5"><Meter r={r} v={v} /></div></button></li>) })}</ul>
      {rd && <div><div className="mb-2 text-xs uppercase tracking-[0.14em] text-slate">{rd.label} · last 24 h <span className="normal-case text-amber-300/80">(simulated)</span></div><TrendChart points={series?.[key] ?? []} unit={rd.unit} color={mod?.color} /></div>}
      {editable && <button onClick={onRemove} className="flex items-center gap-2 text-sm text-red-300 hover:underline"><Trash2 size={14} />Remove from building</button>}
    </aside>
  )
}

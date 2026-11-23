import { useMemo, useState } from 'react'
import { Crosshair } from 'lucide-react'
import { fmtVal, levelName, moduleIcon, statusColor, statusLabel, type Catalog, type Equip, type Live, type Project } from '../../data/bms'
import { Icon } from '../../components/dashboard/ui'
import EquipImage from '../../components/bms/EquipImage'

type Props = { project: Project; equipment: Equip[]; live: Live | null; catalog: Catalog; onLocate: (id: string) => void }

/** One card per BMS module, then a live table for the chosen module. */
export default function Systems({ project, equipment, live, catalog, onLocate }: Props) {
  const [mod, setMod] = useState<string>(catalog.modules[0].id), [tower, setTower] = useState(''), [q, setQ] = useState(''), [limit, setLimit] = useState(60)
  const defs = useMemo(() => Object.fromEntries(catalog.equipment.map((d) => [d.id, d])), [catalog])
  const rows = useMemo(() => equipment.filter((e) => defs[e.type]?.module === mod && (!tower || e.towerId === tower) && (!q || `${e.tag} ${e.name}`.toLowerCase().includes(q.toLowerCase()))).sort((a, b) => a.towerId.localeCompare(b.towerId) || b.level - a.level || a.tag.localeCompare(b.tag)), [equipment, defs, mod, tower, q])
  const cur = catalog.modules.find((m) => m.id === mod)!

  return (
    <div className="space-y-6">
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">{catalog.modules.map((m) => {
        const ml = live?.byModule[m.id], issues = (ml?.alarm ?? 0) + (ml?.fault ?? 0), on = m.id === mod
        return (
          <li key={m.id}><button onClick={() => { setMod(m.id); setLimit(60) }} aria-pressed={on} className={`h-full w-full rounded-2xl border p-4 text-left transition ${on ? 'border-cyan bg-cyan/10' : 'border-white/10 bg-white/[.03] hover:border-white/30'}`}>
            <div className="flex items-center justify-between"><span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: `${m.color}22`, color: m.color }}><Icon name={moduleIcon[m.id]} size={18} /></span>
              {issues > 0 ? <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-300">{issues} issue{issues > 1 ? 's' : ''}</span> : (ml?.offline ?? 0) > 0 ? <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-silver">{ml!.offline} offline</span> : ml?.total ? <span className="text-xs text-emerald-300">● OK</span> : null}</div>
            <div className="mt-3 text-sm text-silver">{m.label}</div>
            <div className="mt-0.5 font-display text-xl tabular-nums">{ml?.kpi?.value ?? '—'}<span className="ml-1 text-xs text-slate">{ml?.kpi?.unit}</span></div>
            <div className="text-[0.7rem] text-slate">{ml?.kpi?.label ?? 'No equipment'} · {ml?.total ?? 0} devices</div></button></li>)
      })}</ul>

      <section aria-label={`${cur.label} equipment`} className="rounded-2xl border border-white/10 bg-white/[.03]">
        <div className="flex flex-wrap items-center gap-3 border-b border-white/10 p-4">
          <h2 className="font-display text-lg" style={{ color: cur.color }}>{cur.label}</h2><span className="text-sm text-slate">{rows.length} devices</span>
          <div className="ml-auto flex flex-wrap gap-2">
            {project.towers.length > 1 && <select aria-label="Tower" value={tower} onChange={(e) => setTower(e.target.value)} className="rounded-full border border-white/15 bg-deep px-4 py-2 text-sm"><option value="">All towers</option>{project.towers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>}
            <input aria-label="Search equipment" placeholder="Search tag or name…" value={q} onChange={(e) => setQ(e.target.value)} className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm outline-none focus:border-cyan" />
          </div>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-slate"><tr><th className="p-3 pl-4">Equipment</th><th>Location</th><th>Status</th><th>Reading</th><th /></tr></thead>
          <tbody>{rows.slice(0, limit).map((e) => {
            const d = defs[e.type], lv = live?.items[e.id], t = project.towers.find((x) => x.id === e.towerId), pr = d.readings.find((r) => r.primary) ?? d.readings[0], st = lv?.status ?? 'online'
            return (
              <tr key={e.id} className="border-t border-white/10">
                <td className="p-3 pl-4"><div className="flex items-center gap-3"><span className="shrink-0 overflow-hidden rounded-lg bg-[#13233a]"><EquipImage type={e.type} size={44} /></span><span><span className="block">{e.tag}</span><span className="block text-sm text-silver">{e.name}</span></span></div></td>
                <td><span className="rounded-md bg-white/10 px-2.5 py-1 text-sm font-medium text-white">{t?.name} · {t ? levelName(e.level, t.floors) : ''}</span></td>
                <td><span className="inline-flex items-center gap-2" style={{ color: statusColor[st] }}><span className="h-2 w-2 rounded-full" style={{ background: statusColor[st] }} />{statusLabel[st]}</span></td>
                <td className="tabular-nums">{pr.label}: <b className="font-display font-normal">{fmtVal(lv?.values[pr.key], pr.unit)}</b></td>
                <td className="pr-4 text-right"><button onClick={() => onLocate(e.id)} className="inline-flex items-center gap-1.5 text-cyan hover:underline"><Crosshair size={14} />Locate in 3D</button></td>
              </tr>)
          })}</tbody></table></div>
        {rows.length === 0 && <p className="p-8 text-center text-slate">No equipment of this kind{q || tower ? ' matches the filter' : ' in this project'}.</p>}
        {rows.length > limit && <div className="border-t border-white/10 p-3 text-center"><button onClick={() => setLimit(limit + 100)} className="text-sm text-cyan hover:underline">Show more ({rows.length - limit} more)</button></div>}
      </section>
    </div>
  )
}

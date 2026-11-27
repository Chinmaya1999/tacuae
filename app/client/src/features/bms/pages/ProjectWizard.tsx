import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Loader2, Minus, Plus } from 'lucide-react'
import { api } from '../../../shared/lib/api'
import { buildingTypes, type Project } from '../data/bms'
import { Icon } from '../../dashboard/components/ui'

type T = { name: string; floors: number; unitsPerFloor: number; basements: number }
const field = 'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate focus:border-cyan'
const presets: { label: string; towers: T[] }[] = [
  { label: 'Single tower · 20 floors', towers: [{ name: 'Tower A', floors: 20, unitsPerFloor: 6, basements: 2 }] },
  { label: 'Twin towers · 15 floors', towers: [{ name: 'Tower A', floors: 15, unitsPerFloor: 4, basements: 2 }, { name: 'Tower B', floors: 15, unitsPerFloor: 4, basements: 2 }] },
  { label: 'Mid-rise block · 8 floors', towers: [{ name: 'Block 1', floors: 8, unitsPerFloor: 4, basements: 1 }] },
]
const Num = ({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) => (
  <label className="block text-xs uppercase tracking-[0.12em] text-silver">{label}
    <div className="mt-2 flex items-center rounded-xl border border-white/15 bg-white/5">
      <button type="button" aria-label={`Fewer ${label}`} onClick={() => onChange(Math.max(min, value - 1))} className="p-3 text-silver hover:text-cyan"><Minus size={15} /></button>
      <input type="number" min={min} max={max} value={value} onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || min)))} className="w-full bg-transparent py-2 text-center text-base normal-case tabular-nums text-white outline-none" />
      <button type="button" aria-label={`More ${label}`} onClick={() => onChange(Math.min(max, value + 1))} className="p-3 text-silver hover:text-cyan"><Plus size={15} /></button></div></label>
)

export default function ProjectWizard() {
  const nav = useNavigate(), [q] = useSearchParams(), [step, setStep] = useState(0)
  const [type, setType] = useState(buildingTypes.some((t) => t.id === q.get('type')) ? q.get('type')! : 'residential'), [name, setName] = useState(''), [location, setLocation] = useState('')
  const [towers, setTowers] = useState<T[]>(presets[0].towers), [autoPlace, setAutoPlace] = useState(true), [busy, setBusy] = useState(false), [err, setErr] = useState('')
  const set = (i: number, p: Partial<T>) => setTowers(towers.map((t, k) => (k === i ? { ...t, ...p } : t)))
  const floors = towers.reduce((n, t) => n + t.floors, 0), units = towers.reduce((n, t) => n + t.floors * t.unitsPerFloor, 0)
  const create = async () => {
    setBusy(true); setErr('')
    try { const r = await api<{ project: Project }>('/api/bms/projects', { method: 'POST', body: { name, location, type, towers, autoPlace } }); nav(`/dashboard/projects/${r.project.id}`) } catch (e) { setErr((e as Error).message); setBusy(false) }
  }
  const steps = ['Building', 'Towers & floors', 'Review']
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div><Link to="/dashboard/projects" className="text-sm text-silver hover:text-cyan">← Projects</Link><h1 className="mt-2 font-display text-3xl">New building project</h1></div>
      <ol className="flex items-center gap-2" aria-label="Steps">{steps.map((s, i) => (
        <li key={s} className="flex flex-1 items-center gap-2 last:flex-none"><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs ${i < step ? 'bg-cyan text-midnight' : i === step ? 'border border-cyan text-cyan' : 'border border-white/20 text-slate'}`}>{i < step ? <Check size={14} /> : i + 1}</span>
          <span className={`hidden text-sm sm:inline ${i === step ? 'text-white' : 'text-slate'}`}>{s}</span>{i < steps.length - 1 && <span className={`h-px flex-1 ${i < step ? 'bg-cyan/60' : 'bg-white/15'}`} />}</li>))}</ol>

      {step === 0 && (
        <section className="space-y-6">
          <div><h2 className="mb-3 font-display text-lg">What are you building?</h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">{buildingTypes.map((t) => <li key={t.id}><button onClick={() => setType(t.id)} aria-pressed={type === t.id} className={`flex h-full w-full flex-col items-start gap-2 rounded-2xl border p-3 text-left text-sm transition ${type === t.id ? 'border-cyan bg-cyan/10' : 'border-white/10 hover:border-white/30'}`}><Icon name={t.icon} size={20} className="text-cyan" />{t.label}</button></li>)}</ul></div>
          <label className="block text-xs uppercase tracking-[0.15em] text-silver">Project name<input autoFocus maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Marina Heights" className={`${field} mt-2`} /></label>
          <label className="block text-xs uppercase tracking-[0.15em] text-silver">Location (optional)<input maxLength={150} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Dubai Marina, UAE" className={`${field} mt-2`} /></label>
        </section>)}

      {step === 1 && (
        <section className="space-y-5">
          <div className="flex flex-wrap gap-2"><span className="mr-1 self-center text-xs uppercase tracking-[0.14em] text-slate">Quick start</span>{presets.map((p) => <button key={p.label} onClick={() => setTowers(p.towers)} className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-silver hover:border-cyan hover:text-cyan">{p.label}</button>)}</div>
          <ul className="space-y-4">{towers.map((t, i) => (
            <li key={i} className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
              <div className="flex items-center gap-3"><input aria-label={`Name of tower ${i + 1}`} maxLength={40} value={t.name} onChange={(e) => set(i, { name: e.target.value })} className="min-w-0 flex-1 rounded-lg bg-transparent px-1 font-display text-lg outline-none ring-cyan/60 focus:ring-1" />
                {towers.length > 1 && <button onClick={() => setTowers(towers.filter((_, k) => k !== i))} className="text-sm text-slate hover:text-red-300">Remove</button>}</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3"><Num label="Floors" value={t.floors} min={1} max={80} onChange={(n) => set(i, { floors: n })} /><Num label="Units per floor" value={t.unitsPerFloor} min={0} max={60} onChange={(n) => set(i, { unitsPerFloor: n })} /><Num label="Parking levels" value={t.basements} min={0} max={6} onChange={(n) => set(i, { basements: n })} /></div>
            </li>))}</ul>
          {towers.length < 10 && <button onClick={() => setTowers([...towers, { name: `Tower ${String.fromCharCode(65 + towers.length)}`, floors: 10, unitsPerFloor: 4, basements: 1 }])} className="flex items-center gap-2 rounded-full border border-dashed border-white/25 px-5 py-2.5 text-sm text-silver hover:border-cyan hover:text-cyan"><Plus size={15} />Add tower or block</button>}
          <p className="text-sm text-slate">{towers.length} tower{towers.length > 1 ? 's' : ''} · {floors} floors{units ? ` · ${units} units` : ''}</p>
        </section>)}

      {step === 2 && (
        <section className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
            <div className="font-display text-xl">{name || 'Untitled project'}</div><p className="text-sm text-silver">{buildingTypes.find((t) => t.id === type)?.label}{location ? ` · ${location}` : ''}</p>
            <ul className="mt-4 space-y-1.5 text-sm text-silver">{towers.map((t, i) => <li key={i} className="flex justify-between"><span>{t.name}</span><span className="tabular-nums text-slate">{t.floors} floors · {t.unitsPerFloor} units/floor · {t.basements} parking</span></li>)}</ul></div>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-cyan/30 bg-cyan/[.06] p-4"><input type="checkbox" checked={autoPlace} onChange={(e) => setAutoPlace(e.target.checked)} className="mt-1 h-4 w-4 accent-cyan" />
            <span><span className="block font-display">Place typical equipment automatically <span className="text-xs text-cyan">(recommended)</span></span><span className="mt-1 block text-sm text-silver">Adds HVAC, power meters, lighting, access, fire detectors, lifts, pumps, tanks and parking equipment to each floor. You can move, add or remove anything afterwards.</span></span></label>
          <p className="rounded-xl border border-amber-300/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">Readings in this portal are <b>simulated</b>. Real controllers and sensors are connected later through gateways; nothing here controls real equipment.</p>
          {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
        </section>)}

      <div className="flex justify-between gap-3">
        <button onClick={() => setStep(step - 1)} disabled={step === 0 || busy} className="btn btn-ghost disabled:opacity-0"><ArrowLeft size={16} />Back</button>
        {step < 2 ? <button onClick={() => setStep(step + 1)} disabled={step === 0 && name.trim().length < 2} className="btn btn-primary disabled:opacity-50">Next<ArrowRight size={16} /></button>
          : <button onClick={create} disabled={busy} className="btn btn-primary disabled:opacity-60">{busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}Create project</button>}
      </div>
    </div>
  )
}

// B2B project configurator: unit templates × quantities, common areas, and up to three scenarios side by side.
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Copy, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { api } from '../../../shared/lib/api'
import { useAuth } from '../../auth/lib/auth'
import { useSeo } from '../../../shared/lib/seo'
import { clearDraft, money, pretty, rid, useDraft, useOptions, useQuoteEstimate, type Pricing, type ProjectInput, type Quote, type UnitType } from '../lib/quote'
import { Field, PriceSummary, Stepper, card, field, small } from '../components/ui'
import { CategoryPicker, ControlPicker, LevelPicker, RoomPicker } from '../components/ConfigFields'

const DRAFT = 'tac-project-draft'
const unit = (name: string, quantity: number): UnitType => ({ id: rid(), name, quantity, areaSqft: 0, phase: '', config: { rooms: [{ id: rid(), type: 'living', name: 'Living room', adjustments: {} }, { id: rid(), type: 'bedroom', name: 'Bedroom', adjustments: {} }], levels: { lighting: 'essential' }, control: '' } })
const blank = (): ProjectInput => ({ project: { name: '', type: 'residential-tower', location: '', stage: '', handover: '', buildingSystems: '' }, connectivity: 'wired', unitTypes: [unit('2BR apartment', 1)], common: [], amc: false })
type Scenario = { name: string; level: string; connectivity: string }
type Result = Scenario & { pricing: Pricing }

export default function ProjectQuote() {
  useSeo('Get a project quote | TAC UAE', 'Configure automation for towers, villa communities, offices, hotels and retail: unit mixes, common areas and side-by-side scenarios.', '/project-quote')
  const [params] = useSearchParams()
  const quoteId = params.get('quote')
  return <Builder key={quoteId ?? 'new'} quoteId={quoteId} />
}

function Builder({ quoteId }: { quoteId: string | null }) {
  const nav = useNavigate(), { user, loading } = useAuth(), who = user?.id ?? ''
  const [input, setInput] = useDraft(quoteId ? null : DRAFT, blank)
  const [ready, setReady] = useState(!quoteId), [open, setOpen] = useState<string | null>(input.unitTypes[0]?.id ?? null)
  const [busy, setBusy] = useState(false), [err, setErr] = useState('')
  const [scenarios, setScenarios] = useState<Scenario[]>([{ name: 'Essential', level: 'essential', connectivity: '' }, { name: 'Comfort', level: 'comfort', connectivity: '' }, { name: 'Luxury', level: 'luxury', connectivity: '' }])
  const [results, setResults] = useState<Result[] | null>(null)
  const { options, error: optErr } = useOptions(who)
  const valid = input.unitTypes.length > 0 && input.unitTypes.every((u) => u.quantity >= 1)
  const { pricing, fx, error } = useQuoteEstimate('project', input, who, ready && valid)
  const set = (patch: Partial<ProjectInput>) => setInput((s) => ({ ...s, ...patch }))
  const setP = (patch: Partial<ProjectInput['project']>) => setInput((s) => ({ ...s, project: { ...s.project, ...patch } }))
  const setUnit = (id: string, patch: Partial<UnitType>) => setInput((s) => ({ ...s, unitTypes: s.unitTypes.map((u) => (u.id === id ? { ...u, ...patch } : u)) }))
  useEffect(() => { setResults(null) }, [input, who]) // a comparison is only valid for the inputs it was run on

  useEffect(() => {
    if (!quoteId || loading) return
    api<{ item: Quote }>(`/api/quotations/${quoteId}`).then((d) => { setInput(d.item.input); setOpen(d.item.input.unitTypes[0]?.id); setReady(true) }).catch((e) => setErr(e.message))
  }, [quoteId, loading]) // eslint-disable-line react-hooks/exhaustive-deps

  const compare = async () => {
    setBusy(true); setErr('')
    try { setResults((await api<{ scenarios: Result[] }>('/api/configurator/compare', { method: 'POST', body: { input, scenarios } })).scenarios) } catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }
  const save = async () => {
    if (!user) return nav(`/register?next=${encodeURIComponent('/project-quote')}&type=builder`)
    setBusy(true); setErr('')
    try {
      const d = await api<{ item: Quote }>(quoteId ? `/api/quotations/${quoteId}` : '/api/quotations', { method: quoteId ? 'PUT' : 'POST', body: { kind: 'project', input } })
      if (!quoteId) clearDraft(DRAFT)
      nav(`/dashboard/quotations/${d.item.id}`)
    } catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }

  if (!options || !ready) return <div className="grid min-h-[70vh] place-items-center pt-32">{optErr || err ? <p role="alert" className="text-red-400">{optErr || err}</p> : <Loader2 className="animate-spin text-cyan" />}</div>
  const p = input.project
  const canSave = !user || user.role === 'customer' || user.role === 'builder'
  const bomIds = [...new Map((results ?? []).flatMap((r) => r.pricing.lines.map((l) => [l.productId, l.name] as const)))]

  return (
    <div className="container-x pb-24 pt-32">
      <h1 className="font-display text-3xl md:text-4xl">Get a project quote</h1>
      <p className="mt-2 max-w-2xl text-sm text-silver">Configure each unit type once. It is applied to every unit of that type.</p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-8">
          <section className={card} aria-label="Project">
            <h2 className="mb-4 font-display text-xl">1. Project</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="Project name"><input className={field} maxLength={100} value={p.name} onChange={(e) => setP({ name: e.target.value })} /></Field>
              <Field name="Project type"><select className={field} value={p.type} onChange={(e) => setP({ type: e.target.value })}>{options.projectTypes.map((t) => <option key={t} value={t}>{pretty(t)}</option>)}</select></Field>
              <Field name="Location"><input className={field} maxLength={150} value={p.location} onChange={(e) => setP({ location: e.target.value })} /></Field>
              <Field name="Stage"><select className={field} value={p.stage} onChange={(e) => setP({ stage: e.target.value })}><option value="">Choose…</option>{['Concept', 'Design', 'Tender', 'Under construction', 'Fit-out', 'Existing building'].map((t) => <option key={t}>{t}</option>)}</select></Field>
              <Field name="Handover date"><input type="date" className={field} value={p.handover} onChange={(e) => setP({ handover: e.target.value })} /></Field>
              <Field name="Wiring"><select className={field} value={input.connectivity} onChange={(e) => set({ connectivity: e.target.value })}><option value="wired">Wired</option><option value="wireless">Wireless</option></select></Field>
            </div>
          </section>

          <section aria-label="Unit mix" className="space-y-3">
            <h2 className="font-display text-xl">2. Unit mix</h2>
            {input.unitTypes.map((u) => (
              <div key={u.id} className={card}>
                <div className="grid items-end gap-3 sm:grid-cols-[1fr_100px_120px_130px_auto]">
                  <Field name="Unit type"><input className={field} maxLength={60} value={u.name} onChange={(e) => setUnit(u.id, { name: e.target.value })} /></Field>
                  <Field name="Quantity"><input type="number" min={1} max={2000} step={1} className={field} value={u.quantity || ''} onChange={(e) => setUnit(u.id, { quantity: Math.max(0, Math.round(Number(e.target.value))) })} /></Field>
                  <Field name="Sq ft each"><input type="number" min={0} className={field} value={u.areaSqft || ''} onChange={(e) => setUnit(u.id, { areaSqft: Math.max(0, Number(e.target.value)) })} /></Field>
                  <Field name="Phase (optional)"><input className={field} maxLength={40} value={u.phase} onChange={(e) => setUnit(u.id, { phase: e.target.value })} placeholder="Tower A" /></Field>
                  <div className="flex gap-1">
                    <button className={small} title="Duplicate this template" aria-label={`Duplicate ${u.name}`} disabled={input.unitTypes.length >= 20} onClick={() => { const c = { ...structuredClone(u), id: rid(), name: `${u.name} copy` }; set({ unitTypes: [...input.unitTypes, c] }); setOpen(c.id) }}><Copy size={15} /></button>
                    <button className={small} aria-label={`Remove ${u.name}`} disabled={input.unitTypes.length === 1} onClick={() => confirm(`Remove ${u.name}?`) && set({ unitTypes: input.unitTypes.filter((x) => x.id !== u.id) })}><Trash2 size={15} /></button>
                  </div>
                </div>
                <button className="mt-3 text-sm text-cyan hover:underline" aria-expanded={open === u.id} onClick={() => setOpen(open === u.id ? null : u.id)}>{open === u.id ? 'Close template' : `Configure template (${u.config.rooms.length} rooms, ${Object.keys(u.config.levels).length} categories)`}</button>
                {open === u.id && <div className="mt-4 space-y-5 border-t border-white/10 pt-4">
                  <RoomPicker rooms={u.config.rooms} max={15} onChange={(rooms) => setUnit(u.id, { config: { ...u.config, rooms } })} />
                  <CategoryPicker options={options} levels={u.config.levels} onChange={(levels) => setUnit(u.id, { config: { ...u.config, levels } })} />
                  <LevelPicker options={options} levels={u.config.levels} onChange={(levels) => setUnit(u.id, { config: { ...u.config, levels } })} />
                  <ControlPicker options={options} value={u.config.control} onChange={(control) => setUnit(u.id, { config: { ...u.config, control } })} />
                </div>}
              </div>))}
            <button className={small} disabled={input.unitTypes.length >= 20} onClick={() => { const n = unit('New unit type', 1); set({ unitTypes: [...input.unitTypes, n] }); setOpen(n.id) }}><Plus size={15} className="mr-1 inline" />Add unit type</button>
          </section>

          <section className={card} aria-label="Common areas">
            <h2 className="mb-1 font-display text-xl">3. Common areas and building systems</h2>
            <p className="mb-4 text-sm text-silver">Devices for lobbies, car parks and access points, as totals for the whole project.</p>
            <ul className="space-y-2 text-sm">{input.common.map((c) => <li key={c.productId} className="flex items-center justify-between gap-3"><span>{options.products.find((x) => x.id === c.productId)?.name ?? c.productId}</span><span className="flex items-center gap-3"><input aria-label="Quantity" type="number" min={1} max={10000} className={`${field} !w-24`} value={c.qty} onChange={(e) => set({ common: input.common.map((x) => (x.productId === c.productId ? { ...x, qty: Math.max(1, Math.round(Number(e.target.value))) } : x)) })} /><button className="text-slate hover:text-red-300" aria-label="Remove" onClick={() => set({ common: input.common.filter((x) => x.productId !== c.productId) })}><Trash2 size={15} /></button></span></li>)}</ul>
            <select aria-label="Add common-area device" className={`${field} mt-3 max-w-xs`} value="" onChange={(e) => e.target.value && set({ common: [...input.common, { productId: e.target.value, qty: 1 }] })}><option value="">+ Add a device…</option>{options.products.filter((x) => !input.common.some((c) => c.productId === x.id)).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
            <div className="mt-4"><Field name="Building systems TAC should quote (BMS / HVAC integration, access control, metering…)"><textarea rows={3} maxLength={1500} className={field} value={p.buildingSystems} onChange={(e) => setP({ buildingSystems: e.target.value })} /></Field></div>
            {options.amcAvailable && <label className="mt-4 flex items-center gap-3 text-sm"><input type="checkbox" checked={input.amc} onChange={(e) => set({ amc: e.target.checked })} className="h-4 w-4 accent-cyan" />Include annual maintenance (AMC)</label>}
          </section>

          <section className={card} aria-label="Scenario comparison">
            <h2 className="mb-1 font-display text-xl">4. Compare scenarios</h2>
            <p className="mb-4 text-sm text-silver">Each scenario applies one package level and/or wiring type to every unit template.</p>
            <div className="space-y-2">{scenarios.map((s, i) => { const upd = (patch: Partial<Scenario>) => { setScenarios(scenarios.map((x, j) => (j === i ? { ...x, ...patch } : x))); setResults(null) }; return (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_180px_180px_auto]">
                <input aria-label="Scenario name" className={field} maxLength={40} value={s.name} onChange={(e) => upd({ name: e.target.value })} />
                <select aria-label="Package level" className={field} value={s.level} onChange={(e) => upd({ level: e.target.value })}><option value="">As configured</option>{options.levels.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}</select>
                <select aria-label="Wiring" className={field} value={s.connectivity} onChange={(e) => upd({ connectivity: e.target.value })}><option value="">Project wiring</option><option value="wired">Wired</option><option value="wireless">Wireless</option></select>
                <button className={small} aria-label="Remove scenario" disabled={scenarios.length === 1} onClick={() => { setScenarios(scenarios.filter((_, j) => j !== i)); setResults(null) }}><Trash2 size={15} /></button>
              </div>) })}</div>
            <div className="mt-3 flex items-center gap-3">
              <Stepper label="scenarios" value={scenarios.length} min={1} max={3} onChange={(n) => { setScenarios(n < scenarios.length ? scenarios.slice(0, n) : [...scenarios, { name: `Scenario ${n}`, level: '', connectivity: '' }]); setResults(null) }} />
              <button className="btn btn-primary !py-2 disabled:opacity-60" disabled={busy || !valid} onClick={compare}>Compare</button>
            </div>
            {results && <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[480px] text-left text-sm">
              <thead><tr className="text-xs uppercase tracking-wider text-slate"><th className="py-2">Measure</th>{results.map((r, i) => <th key={i} className="py-2 text-right text-white">{r.name}</th>)}</tr></thead>
              <tbody>
                {([['Total incl. VAT', (r: Result) => (r.pricing.totals ? money(r.pricing.totals.total) : 'Sign in')], ['Cost per unit', (r: Result) => (r.pricing.metrics?.costPerUnit !== undefined ? money(r.pricing.metrics.costPerUnit) : 'Sign in')], ['Cost per sq ft', (r: Result) => (r.pricing.metrics?.costPerSqft ? money(r.pricing.metrics.costPerSqft) : '—')], ['Wiring', (r: Result) => pretty(r.connectivity)], ['Devices', (r: Result) => r.pricing.lines.reduce((n, l) => n + l.qty, 0)]] as const).map(([k, f]) => <tr key={k} className="border-t border-white/10"><td className="py-2 text-silver">{k}</td>{results.map((r, i) => <td key={i} className="py-2 text-right tabular-nums">{f(r)}</td>)}</tr>)}
                <tr><td colSpan={results.length + 1} className="pt-4 text-xs uppercase tracking-wider text-slate">Bill of materials (quantities)</td></tr>
                {bomIds.map(([id, name]) => <tr key={id} className="border-t border-white/10"><td className="py-1.5 text-silver">{name}</td>{results.map((r, i) => <td key={i} className="py-1.5 text-right tabular-nums">{r.pricing.lines.find((l) => l.productId === id)?.qty ?? 0}</td>)}</tr>)}
                {results.some((r) => r.pricing.warnings.incompatible.length) && <tr className="border-t border-white/10 text-xs text-amber-200"><td className="py-2">Not available in this wiring</td>{results.map((r, i) => <td key={i} className="py-2 text-right">{r.pricing.warnings.incompatible.join(', ') || '—'}</td>)}</tr>}
              </tbody></table></div>}
          </section>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-28 lg:self-start">
          <div className={card}>{!valid ? <p className="text-sm text-amber-300">Every unit type needs a quantity of at least 1.</p> : error ? <p role="alert" className="text-sm text-red-400">{error}</p> : <PriceSummary pricing={pricing} fx={fx} />}
            <p className="mt-4 border-t border-white/10 pt-3 text-xs text-slate">Indicative quotation — subject to site survey.</p></div>
          {canSave && <button className="btn btn-primary w-full justify-center disabled:opacity-60" disabled={busy || !valid || (!!user && (p.name.trim().length < 2 || !pricing?.lines.length))} onClick={save}><Save size={16} />{!user ? 'Create account to save' : quoteId ? 'Save new version' : 'Save project quotation'}</button>}
          {!!user && p.name.trim().length < 2 && <p className="text-xs text-slate">Enter a project name to save.</p>}
          {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
        </aside>
      </div>
    </div>
  )
}

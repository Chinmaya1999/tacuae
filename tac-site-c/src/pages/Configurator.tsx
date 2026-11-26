// B2C guided configurator: one question per step, live price beside it. Guests may use it; saving needs an account.
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Box, Loader2, Save } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useSeo } from '../lib/seo'
import { clearDraft, pretty, useDraft, useOptions, useQuoteEstimate, type HomeInput, type Quote } from '../lib/quote'
import { DRAFT_EVENT, HOME_DRAFT, blankHome, readHomeDraft } from '../lib/homeDraft'
import SmartScore from '../components/demo/SmartScore'
import { Choice, Field, PriceSummary, Stepper, card, field, small } from '../components/quote/ui'
import { CategoryPicker, ControlPicker, LevelPicker, RoomPicker } from '../components/quote/ConfigFields'
import Preview3D from '../components/quote/Preview3D'

const STEPS = ['Property type', 'Size and wiring', 'Rooms', 'Automation', 'Package level', 'Control', 'Location and timeline', 'Your design']

export default function Configurator() {
  useSeo('Design my smart home | TAC UAE', 'Choose your rooms and automation level and see an indicative smart-home design and price from Total Automation.', '/design-my-home')
  const [params] = useSearchParams()
  const quoteId = params.get('quote')
  return <Wizard key={quoteId ?? 'new'} quoteId={quoteId} />
}

function Wizard({ quoteId }: { quoteId: string | null }) {
  const nav = useNavigate(), { user, loading } = useAuth(), who = user?.id ?? ''
  const [state, setState] = useDraft(quoteId ? null : HOME_DRAFT, blankHome)
  const [ready, setReady] = useState(!quoteId), [busy, setBusy] = useState(false), [err, setErr] = useState(''), [preview, setPreview] = useState(false)
  const { options, error: optErr } = useOptions(who)
  const { step, input } = state
  const { pricing, smart, fx, error } = useQuoteEstimate('home', input, who, ready)
  const set = (patch: Partial<HomeInput>) => setState((s) => ({ ...s, input: { ...s.input, ...patch } }))
  const go = (n: number) => { setState((s) => ({ ...s, step: n })); setErr('') }

  useEffect(() => { // the assistant changed the draft
    if (quoteId) return
    const f = () => setState(readHomeDraft())
    window.addEventListener(DRAFT_EVENT, f); return () => window.removeEventListener(DRAFT_EVENT, f)
  }, [quoteId, setState])

  useEffect(() => { // editing a saved quotation
    if (!quoteId || loading) return
    api<{ item: Quote }>(`/api/quotations/${quoteId}`).then((d) => { setState({ step: STEPS.length - 1, input: d.item.input }); setReady(true) }).catch((e) => setErr(e.message))
  }, [quoteId, loading]) // eslint-disable-line react-hooks/exhaustive-deps

  const canSave = !user || user.role === 'customer' || user.role === 'builder'
  const save = async () => {
    if (!user) return nav(`/register?next=${encodeURIComponent('/design-my-home')}`) // the draft stays in this browser
    setBusy(true); setErr('')
    try {
      const d = await api<{ item: Quote }>(quoteId ? `/api/quotations/${quoteId}` : '/api/quotations', { method: quoteId ? 'PUT' : 'POST', body: { kind: 'home', input } })
      if (!quoteId) clearDraft(HOME_DRAFT)
      nav(`/dashboard/quotations/${d.item.id}`)
    } catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }

  if (!options || !ready) return <div className="grid min-h-[70vh] place-items-center pt-32">{optErr || err ? <p role="alert" className="text-red-400">{optErr || err}</p> : <Loader2 className="animate-spin text-cyan" />}</div>
  const name = (id: string) => options.products.find((p) => p.id === id)?.name ?? id
  const adjust = (roomId: string, productId: string, by: number) => set({ rooms: input.rooms.map((r) => (r.id === roomId ? { ...r, adjustments: { ...r.adjustments, [productId]: (r.adjustments[productId] ?? 0) + by } } : r)) })

  return (
    <div className="container-x pb-24 pt-32">
      <h1 className="font-display text-3xl md:text-4xl">Design my smart home</h1>
      <div className="mt-5" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} aria-label="Progress"><div className="h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan to-azure transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div></div>
      <nav aria-label="Steps" className="mt-3 flex flex-wrap gap-1.5">{STEPS.map((s, i) => <button key={s} onClick={() => go(i)} aria-current={i === step ? 'step' : undefined} className={`rounded-full border px-3 py-1 text-xs ${i === step ? 'border-cyan bg-cyan/15 text-cyan' : 'border-white/15 text-silver hover:text-white'}`}>{i + 1}. {s}</button>)}</nav>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="min-w-0 space-y-5" aria-label={STEPS[step]}>
          <h2 className="font-display text-xl">{STEPS[step]}</h2>
          {step === 0 && <div className="grid gap-2 sm:grid-cols-3">{options.homeTypes.map((t) => <Choice key={t} on={input.homeType === t} onClick={() => set({ homeType: t })}>{pretty(t)}</Choice>)}</div>}
          {step === 1 && <div className="space-y-5">
            <Field name="Size in square feet"><input type="number" min={0} inputMode="numeric" className={`${field} max-w-xs`} value={input.areaSqft || ''} onChange={(e) => set({ areaSqft: Math.max(0, Number(e.target.value)) })} placeholder="e.g. 1400" /></Field>
            <div className="grid gap-2 sm:grid-cols-2"><Choice on={input.build === 'new'} onClick={() => set({ build: 'new' })}>New build</Choice><Choice on={input.build === 'retrofit'} onClick={() => set({ build: 'retrofit' })}>Retrofit an existing home</Choice></div>
            <div className="grid gap-2 sm:grid-cols-2"><Choice on={input.connectivity === 'wired'} onClick={() => set({ connectivity: 'wired' })}>Wired<span className="block text-xs text-slate">Cabled system, usually planned during construction</span></Choice><Choice on={input.connectivity === 'wireless'} onClick={() => set({ connectivity: 'wireless' })}>Wireless<span className="block text-xs text-slate">Less cabling, suits finished homes</span></Choice></div>
          </div>}
          {step === 2 && <RoomPicker rooms={input.rooms} max={25} onChange={(rooms) => set({ rooms })} />}
          {step === 3 && <CategoryPicker options={options} levels={input.levels} onChange={(levels) => set({ levels })} />}
          {step === 4 && <LevelPicker options={options} levels={input.levels} onChange={(levels) => set({ levels })} />}
          {step === 5 && <ControlPicker options={options} value={input.control} onChange={(control) => set({ control })} />}
          {step === 6 && <div className="grid max-w-xl gap-4 sm:grid-cols-2">
            <Field name="Emirate"><select className={field} value={input.emirate} onChange={(e) => set({ emirate: e.target.value })}><option value="">Choose…</option>{options.emirates.map((e) => <option key={e}>{e}</option>)}</select></Field>
            <Field name="Community"><input className={field} maxLength={100} value={input.community} onChange={(e) => set({ community: e.target.value })} /></Field>
            <Field name="When do you want it installed?"><select className={field} value={input.timeline} onChange={(e) => set({ timeline: e.target.value })}><option value="">Choose…</option>{['As soon as possible', 'Within 3 months', '3–6 months', '6 months or later', 'Just exploring'].map((t) => <option key={t}>{t}</option>)}</select></Field>
          </div>}
          {step === 7 && <div className="space-y-5">
            <p className="text-sm text-silver">Fine-tune each room. The price updates as you go.</p>
            {pricing?.rooms?.map((r) => (
              <div key={r.id} className={card}>
                <h3 className="font-display">{r.name}</h3>
                <ul className="mt-3 space-y-2 text-sm">{r.items.map((i) => <li key={i.productId} className="flex items-center justify-between gap-3"><span>{name(i.productId)}</span>{r.id === 'property' ? <span className="tabular-nums text-silver">× {i.qty}</span> : <Stepper label={`${name(i.productId)} in ${r.name}`} value={i.qty} onChange={(v) => adjust(r.id, i.productId, v - i.qty)} />}</li>)}{!r.items.length && <li className="text-slate">No devices yet.</li>}</ul>
                {r.id !== 'property' && <select aria-label={`Add a device to ${r.name}`} className={`${field} mt-3 max-w-xs`} value="" onChange={(e) => e.target.value && adjust(r.id, e.target.value, 1)}><option value="">+ Add a device…</option>{options.products.filter((p) => !r.items.some((i) => i.productId === p.id)).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>}
              </div>))}
            {options.amcAvailable && <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={input.amc} onChange={(e) => set({ amc: e.target.checked })} className="h-4 w-4 accent-cyan" />Add an annual maintenance contract (AMC)</label>}
            <button type="button" className={small} onClick={() => setPreview(!preview)} aria-pressed={preview}><Box size={15} className="mr-2 inline" />{preview ? 'Hide 3D preview' : 'Preview in 3D'}</button>
            {preview && pricing?.rooms && <><Preview3D rooms={pricing.rooms} /><p className="text-xs text-slate">Simulated preview — illustrative device placement, not a site layout.</p></>}
          </div>}

          <div className="flex flex-wrap items-center gap-3 pt-3">
            {step > 0 && <button className="btn btn-ghost" onClick={() => go(step - 1)}><ArrowLeft size={16} />Back</button>}
            {step < STEPS.length - 1 ? <button className="btn btn-primary" onClick={() => go(step + 1)}>Next<ArrowRight size={16} /></button>
              : canSave && <button className="btn btn-primary disabled:opacity-60" disabled={busy || !pricing?.lines.length} onClick={save}><Save size={16} />{!user ? 'Create account to save and share' : quoteId ? 'Save new version' : 'Save quotation'}</button>}
            {!quoteId && <button className="text-sm text-slate hover:text-cyan" onClick={() => confirm('Start over? Your current answers will be cleared.') && setState(blankHome())}>Start over</button>}
            {step === STEPS.length - 1 && !user && <Link to="/login?next=/design-my-home" className="text-sm text-cyan hover:underline">Sign in</Link>}
          </div>
          {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
        </section>
        <aside className="space-y-3 lg:sticky lg:top-28 lg:self-start">
          <div className={card}>{error ? <p role="alert" className="text-sm text-red-400">{error}</p> : <PriceSummary pricing={pricing} fx={fx} />}
            <p className="mt-4 border-t border-white/10 pt-3 text-xs text-slate">Indicative quotation — subject to site survey.</p></div>
          <SmartScore smart={smart} />
        </aside>
      </div>
    </div>
  )
}

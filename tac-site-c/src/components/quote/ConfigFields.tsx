// Questions shared by the home and project configurators.
import { Choice, Stepper } from './ui'
import { roomTypes } from '../../data/catalog'
import { rid, type Options, type RoomInput, type UnitConfig } from '../../lib/quote'

export function RoomPicker({ rooms, max, onChange }: { rooms: RoomInput[]; max: number; onChange: (r: RoomInput[]) => void }) {
  const setCount = (type: string, label: string, n: number) => {
    const mine = rooms.filter((r) => r.type === type)
    if (n < mine.length) { const drop = new Set(mine.slice(n).map((r) => r.id)); return onChange(rooms.filter((r) => !drop.has(r.id))) }
    onChange([...rooms, { id: rid(), type, name: mine.length ? `${label} ${mine.length + 1}` : label, adjustments: {} }])
  }
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {roomTypes.map((t) => { const n = rooms.filter((r) => r.type === t.id).length; return (
        <li key={t.id} className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-sm ${n ? 'border-cyan/50 bg-cyan/5' : 'border-white/10'}`}><span>{t.label}</span><Stepper label={t.label} value={n} max={rooms.length >= max ? n : 10} onChange={(v) => setCount(t.id, t.label, v)} /></li>) })}
    </ul>
  )
}

export function CategoryPicker({ options, levels, onChange }: { options: Options; levels: UnitConfig['levels']; onChange: (l: UnitConfig['levels']) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">{options.categories.map((c) => (
      <Choice key={c.id} on={!!levels[c.id]} onClick={() => { const next = { ...levels }; if (next[c.id]) delete next[c.id]; else next[c.id] = 'comfort'; onChange(next) }}>{c.label}</Choice>))}</div>
  )
}

/** Essential / Comfort / Luxury per category, with what each one adds (read from the live rules). */
export function LevelPicker({ options, levels, onChange }: { options: Options; levels: UnitConfig['levels']; onChange: (l: UnitConfig['levels']) => void }) {
  const chosen = options.categories.filter((c) => levels[c.id])
  if (!chosen.length) return <p className="text-sm text-slate">Choose at least one automation category first.</p>
  const describe = (category: string, level: string) => {
    const find = (rt: string) => options.includes.find((r) => r.category === category && r.level === level && r.roomType === rt)
    const text = (r: ReturnType<typeof find>) => r?.items.map((i) => `${i.qty} × ${i.name}`).join(', ')
    const perRoom = text(find('*')), whole = text(find('property'))
    if (perRoom) return `Per room: ${perRoom}`
    if (whole) return `For the home: ${whole}`
    return find('*') ? 'No devices at this level' : 'TAC will advise'
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-sm text-silver">Set all to {options.levels.map((l) => <button type="button" key={l.id} onClick={() => onChange(Object.fromEntries(chosen.map((c) => [c.id, l.id])))} className="rounded-full border border-white/20 px-3 py-1 hover:border-cyan hover:text-cyan">{l.label}</button>)}</div>
      {chosen.map((c) => (
        <fieldset key={c.id}><legend className="mb-2 font-display text-sm">{c.label}</legend>
          <div className="grid gap-2 sm:grid-cols-3">{options.levels.map((l) => (
            <Choice key={l.id} on={levels[c.id] === l.id} onClick={() => onChange({ ...levels, [c.id]: l.id })}>
              <span className="flex flex-wrap items-center gap-2 text-white">{l.label}
                {options.tags.popular === l.id && <span className="rounded-full bg-cyan/20 px-2 text-[0.65rem] text-cyan">Most popular</span>}
                {options.tags.bestValue === l.id && <span className="rounded-full bg-emerald-400/15 px-2 text-[0.65rem] text-emerald-300">Best value</span>}</span>
              <span className="mt-1 block text-xs text-slate">{describe(c.id, l.id)}</span>
            </Choice>))}</div>
        </fieldset>))}
    </div>
  )
}

export function ControlPicker({ options, value, onChange }: { options: Options; value: string; onChange: (v: string) => void }) {
  return <div className="grid gap-2 sm:grid-cols-2">{options.controls.map((c) => <Choice key={c.id} on={value === c.id} onClick={() => onChange(value === c.id ? '' : c.id)}>{c.label}</Choice>)}</div>
}

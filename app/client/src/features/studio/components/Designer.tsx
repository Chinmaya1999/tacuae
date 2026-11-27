import { useMemo, useRef, useState, type PointerEvent as RPE } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import * as L from 'lucide-react'
import { bill, deviceById, devices, groupColor, groups, newRoom, roomTypeById, roomTypes, uid, type Design, type Device, type Group, type Room, type RoomType } from '../../../shared/data/catalog'
import { Effect, Furniture, Glow, Window } from './Scene'

const Icon = ({ name, size = 20, className = '' }: { name: string; size?: number; className?: string }) => {
  const C = (L as unknown as Record<string, L.LucideIcon>)[name] ?? L.Home
  return <C size={size} className={className} aria-hidden />
}
const clamp = (n: number, lo = 3, hi = 97) => Math.min(hi, Math.max(lo, n))

// Scenes: decide each device's state by its kind.
const SCENES: { id: string; label: string; icon: string; rule: (k: Device['kind']) => boolean }[] = [
  { id: 'welcome', label: 'Welcome home', icon: 'DoorOpen', rule: (k) => ['light', 'ac', 'fan', 'curtain', 'speaker', 'panel', 'switch', 'cloud', 'voice', 'meter', 'plug'].includes(k) },
  { id: 'movie', label: 'Movie night', icon: 'Tv', rule: (k) => ['ac', 'speaker', 'voice', 'switch', 'panel', 'meter'].includes(k) },
  { id: 'night', label: 'Good night', icon: 'Moon', rule: (k) => ['lock', 'camera', 'sensor', 'alarm', 'ac', 'cloud', 'meter'].includes(k) },
  { id: 'away', label: 'Away', icon: 'ShieldCheck', rule: (k) => ['lock', 'camera', 'sensor', 'alarm', 'cloud', 'meter'].includes(k) },
]
const LEVELS = [{ at: 0, n: 'Starter' }, { at: 100, n: 'Smart Home' }, { at: 250, n: 'Home Genius' }, { at: 450, n: 'Master Architect' }]

type Props = { design: Design; onChange?: (d: Design) => void; readOnly?: boolean }

export default function Designer({ design, onChange, readOnly }: Props) {
  const [ri, setRi] = useState(0)
  const [sel, setSel] = useState<string | null>(null)
  const [night, setNight] = useState(true)
  const [group, setGroup] = useState<Group | 'all'>('all')
  const [adding, setAdding] = useState(false)
  const canvas = useRef<HTMLDivElement>(null)
  const drag = useRef<{ id: string; sx: number; sy: number; moved: boolean } | null>(null)

  const rooms = design.rooms
  const room: Room = rooms[Math.min(ri, rooms.length - 1)] ?? newRoom('other')
  const edit = (fn: (r: Room) => Room) => onChange?.({ ...design, rooms: rooms.map((r) => (r.id === room.id ? fn(r) : r)) })
  const setDevices = (fn: (d: Room['devices']) => Room['devices']) => edit((r) => ({ ...r, devices: fn(r.devices) }))

  const add = (d: Device) => {
    if (readOnly) return
    const n = room.devices.length
    const id = uid()
    setDevices((ds) => [...ds, { id, cat: d.id, x: clamp(30 + ((n * 17) % 44) + (n % 3) * 4), y: clamp(25 + ((n * 23) % 40)), on: true }])
    setSel(id)
  }
  const toggle = (id: string) => setDevices((ds) => ds.map((p) => (p.id === id ? { ...p, on: !p.on } : p)))
  const remove = (id: string) => { setDevices((ds) => ds.filter((p) => p.id !== id)); setSel(null) }
  const scene = (rule: (k: Device['kind']) => boolean) => setDevices((ds) => ds.map((p) => ({ ...p, on: rule(deviceById[p.cat]?.kind) })))

  const down = (e: RPE, id: string) => { setSel(id); if (readOnly) return; e.currentTarget.setPointerCapture(e.pointerId); drag.current = { id, sx: e.clientX, sy: e.clientY, moved: false } }
  const move = (e: RPE) => {
    const d = drag.current, box = canvas.current?.getBoundingClientRect()
    if (!d || !box) return
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 5) return
    d.moved = true
    const x = clamp(((e.clientX - box.left) / box.width) * 100), y = clamp(((e.clientY - box.top) / box.height) * 100)
    setDevices((ds) => ds.map((p) => (p.id === d.id ? { ...p, x, y } : p)))
  }
  const up = (id: string) => { const d = drag.current; drag.current = null; if (!d || !d.moved) toggle(id) }
  const tap = (id: string) => { if (readOnly) toggle(id) }

  // ---- game: score, level, badges ----
  const all = useMemo(() => rooms.flatMap((r) => r.devices), [rooms])
  const usedGroups = new Set(all.map((p) => deviceById[p.cat]?.group).filter(Boolean))
  const points = all.length * 10 + usedGroups.size * 50 + (rooms.length > 1 && rooms.every((r) => r.devices.length) ? 100 : 0)
  const li = LEVELS.reduce((a, l, i) => (points >= l.at ? i : a), 0), next = LEVELS[li + 1]
  const pct = next ? ((points - LEVELS[li].at) / (next.at - LEVELS[li].at)) * 100 : 100
  const items = useMemo(() => bill(rooms), [rooms])

  const curtains = room.devices.filter((p) => deviceById[p.cat]?.kind === 'curtain')
  const curtainOpen = curtains.length ? curtains.some((p) => p.on) : null
  const selected = room.devices.find((p) => p.id === sel)
  const shown = devices.filter((d) => group === 'all' || d.group === group)
  const suggested = roomTypeById[room.type].suggest

  return (
    <div className={`grid gap-5 ${readOnly ? '' : 'xl:grid-cols-[250px_minmax(0,1fr)_280px]'}`}>
      {/* ---- palette ---- */}
      {!readOnly && (
        <aside className="order-2 space-y-3 xl:order-1" aria-label="Smart devices">
          <h3 className="font-display text-sm uppercase tracking-[0.16em] text-silver">Add features</h3>
          <div className="flex flex-wrap gap-1.5">
            {(['all', ...groups.map((g) => g.id)] as const).map((g) => (
              <button key={g} onClick={() => setGroup(g)} className={`rounded-full border px-3 py-1 text-xs transition ${group === g ? 'border-cyan bg-cyan/15 text-cyan' : 'border-white/15 text-silver hover:text-white'}`}>{g === 'all' ? 'All' : g}</button>
            ))}
          </div>
          <ul className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
            {shown.map((d) => (
              <li key={d.id}>
                <button onClick={() => add(d)} className="group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[.03] p-3 text-left transition hover:border-cyan/50 hover:bg-white/[.07]">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg" style={{ background: `${groupColor[d.group]}22`, color: groupColor[d.group] }}><Icon name={d.icon} /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm leading-tight">{d.name}</span>
                    <span className="block truncate text-[0.7rem] text-slate">{suggested.includes(d.id) ? '★ Suggested for this room' : d.group}</span></span>
                  <L.Plus size={16} className="text-slate transition group-hover:text-cyan" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </aside>
      )}

      {/* ---- playground ---- */}
      <section className={`order-1 min-w-0 space-y-4 xl:order-2 `}>
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Rooms">
          {rooms.map((r, i) => (
            <button key={r.id} role="tab" aria-selected={i === ri} onClick={() => { setRi(i); setSel(null) }}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${i === ri ? 'border-cyan bg-cyan/15 text-cyan' : 'border-white/15 text-silver hover:text-white'}`}>
              <Icon name={roomTypeById[r.type].icon} size={15} />{r.name}
              {r.devices.length > 0 && <span className="rounded-full bg-white/10 px-1.5 text-[0.65rem]">{r.devices.length}</span>}
            </button>
          ))}
          {!readOnly && <button onClick={() => setAdding(!adding)} className="flex items-center gap-1.5 rounded-full border border-dashed border-white/25 px-4 py-2 text-sm text-silver hover:border-cyan hover:text-cyan"><L.Plus size={15} />Add room</button>}
        </div>

        <AnimatePresence>
          {adding && !readOnly && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[.03] p-3 sm:grid-cols-5">
                {roomTypes.map((t) => (
                  <button key={t.id} onClick={() => {
                    const n = rooms.filter((r) => r.type === (t.id as RoomType)).length + 1
                    onChange?.({ ...design, rooms: [...rooms, newRoom(t.id, n)] }); setRi(rooms.length); setAdding(false); setSel(null)
                  }} className="flex flex-col items-center gap-2 rounded-xl border border-white/10 p-3 text-xs text-silver transition hover:border-cyan hover:text-cyan"><Icon name={t.icon} size={22} />{t.label}</button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* the room */}
        <div className="rounded-3xl border border-white/10 bg-deep p-3 shadow-2xl shadow-black/40 sm:p-4">
          <div ref={canvas} className="relative aspect-[100/62] w-full select-none overflow-hidden rounded-2xl border border-white/15 bg-[#10223a]" onClick={(e) => e.target === e.currentTarget && setSel(null)}>
            <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px)', backgroundSize: '5% 8.06%' }} />
            <svg viewBox="0 0 100 62" className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none"><Furniture type={room.type} />
              <path d="M2 62 V54 A8 8 0 0 1 10 62" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth=".35" /></svg>
            <Window open={curtainOpen} night={night} />
            {/* night shade; lights glow above it */}
            <div className={`pointer-events-none absolute inset-0 bg-[#020611] transition-opacity duration-700 ${night ? 'opacity-70' : 'opacity-0'}`} />
            <AnimatePresence>
              {room.devices.map((p) => { const d = deviceById[p.cat]; return d?.kind === 'light' && p.on ? <Glow key={p.id} x={p.x} y={p.y} color={d.tint ?? '#ffe9a8'} night={night} /> : null })}
              {room.devices.some((p) => p.on && deviceById[p.cat]?.kind === 'ac') && <motion.div key="cool" className="pointer-events-none absolute inset-0 bg-cyan-300/[.07]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}
            </AnimatePresence>

            <AnimatePresence>
              {room.devices.map((p) => {
                const d = deviceById[p.cat]; if (!d) return null
                const c = groupColor[d.group], active = p.id === sel
                return (
                  <motion.button key={p.id} type="button" aria-label={`${d.name}: ${p.on ? d.on : d.off}${readOnly ? '' : '. Tap to toggle, drag to move'}`} aria-pressed={p.on}
                    className={`absolute grid h-12 w-12 place-items-center ${readOnly ? 'cursor-pointer' : 'cursor-grab touch-none active:cursor-grabbing'}`} style={{ left: `${p.x}%`, top: `${p.y}%`, translate: '-50% -50%' }}
                    initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }} whileHover={{ scale: 1.12 }}
                    onPointerDown={(e) => down(e, p.id)} onPointerMove={move} onPointerUp={() => (readOnly ? tap(p.id) : up(p.id))} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(p.id) } if (e.key === 'Delete' && !readOnly) remove(p.id) }}>
                    {p.on && <Effect kind={d.kind} />}
                    <span className={`relative grid h-11 w-11 place-items-center rounded-full border-2 backdrop-blur transition ${active ? 'ring-2 ring-white/70' : ''}`}
                      style={{ borderColor: p.on ? c : 'rgba(255,255,255,.25)', background: p.on ? `${c}33` : 'rgba(7,17,31,.75)', color: p.on ? c : '#8a98ad', boxShadow: p.on ? `0 0 22px ${c}77` : 'none' }}>
                      {d.kind === 'fan' && p.on ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}><Icon name={d.icon} /></motion.span>
                        : <Icon name={d.kind === 'lock' && !p.on ? 'LockOpen' : d.icon} />}
                    </span>
                  </motion.button>)
              })}
            </AnimatePresence>
            {!room.devices.length && <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-silver"><p className="max-w-xs rounded-xl bg-black/40 p-4 backdrop-blur">{readOnly ? 'No devices in this room.' : <>Pick a feature on the left to place it in your <b>{room.name.toLowerCase()}</b>. Drag to move, tap to switch on.</>}</p></div>}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button onClick={() => setNight(!night)} className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs text-silver hover:text-white" aria-pressed={night}>{night ? <L.Moon size={14} /> : <L.Sun size={14} />}{night ? 'Night' : 'Day'}</button>
            {SCENES.map((s) => (
              <button key={s.id} disabled={!room.devices.length || readOnly} onClick={() => scene(s.rule)} className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs text-silver transition enabled:hover:border-cyan enabled:hover:text-cyan disabled:opacity-40"><Icon name={s.icon} size={14} />{s.label}</button>
            ))}
            {!readOnly && room.devices.length > 0 && <span className="ml-auto hidden text-xs text-slate sm:inline">Tap = on/off · Drag = move</span>}
          </div>
        </div>

        {/* inspector */}
        <AnimatePresence mode="wait">
          {selected && deviceById[selected.cat] && (
            <motion.div key={selected.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/[.04] p-4">
              <span className="grid h-12 w-12 place-items-center rounded-xl" style={{ background: `${groupColor[deviceById[selected.cat].group]}22`, color: groupColor[deviceById[selected.cat].group] }}><Icon name={deviceById[selected.cat].icon} size={24} /></span>
              <div className="min-w-0 flex-1"><div className="font-display">{deviceById[selected.cat].name}</div><p className="text-sm text-silver">{deviceById[selected.cat].desc}</p></div>
              <button onClick={() => toggle(selected.id)} className="rounded-full border border-cyan/50 px-4 py-2 text-sm text-cyan hover:bg-cyan/10">{selected.on ? deviceById[selected.cat].on : deviceById[selected.cat].off}</button>
              {!readOnly && <button onClick={() => remove(selected.id)} className="flex items-center gap-1.5 rounded-full border border-red-400/40 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10"><L.Trash2 size={14} />Remove</button>}
            </motion.div>
          )}
        </AnimatePresence>
        {!readOnly && rooms.length > 1 && <button onClick={() => { onChange?.({ ...design, rooms: rooms.filter((r) => r.id !== room.id) }); setRi(0); setSel(null) }} className="text-xs text-slate hover:text-red-300">Remove “{room.name}” from this design</button>}
      </section>

      {/* ---- score + selection ---- */}
      {!readOnly && (
        <aside className="order-3 space-y-5" aria-label="Your selection">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan/10 to-transparent p-4">
            <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-silver"><L.Trophy size={15} className="text-amber-300" />Smart score</span><motion.span key={points} initial={{ scale: 1.5 }} animate={{ scale: 1 }} className="font-display text-2xl tabular-nums">{points}</motion.span></div>
            <div className="mt-1 font-display text-cyan">{LEVELS[li].n}</div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full rounded-full bg-gradient-to-r from-cyan to-azure" animate={{ width: `${pct}%` }} /></div>
            <p className="mt-2 text-xs text-slate">{next ? `${next.at - points} points to ${next.n}` : 'Top level reached!'}</p>
            <ul className="mt-4 grid grid-cols-3 gap-2">
              {groups.map((g) => { const got = usedGroups.has(g.id); return (
                <li key={g.id} title={g.blurb} className={`rounded-lg border px-1 py-2 text-center text-[0.62rem] leading-tight transition ${got ? 'border-white/30 text-white' : 'border-white/10 text-slate opacity-60'}`} style={got ? { background: `${g.color}22`, color: g.color } : undefined}>{got ? '✓ ' : ''}{g.id}</li>) })}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-display text-sm uppercase tracking-[0.16em] text-silver">Your selection · {all.length}</h3>
            {items.length === 0 ? <p className="text-sm text-slate">Nothing added yet.</p> : (
              <ul className="space-y-2">{items.map((it) => (
                <li key={it.device.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.03] p-2.5 text-sm">
                  <span style={{ color: groupColor[it.device.group] }}><Icon name={it.device.icon} size={17} /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate">{it.device.name}</span><span className="block truncate text-[0.7rem] text-slate">{[...it.rooms].join(', ')}</span></span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs tabular-nums">×{it.qty}</span></li>))}</ul>)}
          </div>
        </aside>
      )}
    </div>
  )
}

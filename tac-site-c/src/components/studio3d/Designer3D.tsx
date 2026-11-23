import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as L from 'lucide-react'
import { deviceById, devices, furnitureTypes, floorColors, groupColor, groups, mountOf, newRoom, roomTypeById, roomTypes, uid, wallColors, aed, type Design, type Device, type FurnitureType, type Group, type PlacedDevice, type Room } from '../../data/catalog'
import { useEstimate, useProducts } from '../../lib/products'
import CostPanel from '../studio/CostPanel'
import RoomScene from './RoomScene'
import { SCENES } from './scenes'
import { defaultLevel, dims, levelOf } from './geometry'
import { useStudioUI, type CamMode } from './store'

const Icon = ({ name, size = 18, className = '' }: { name: string; size?: number; className?: string }) => {
  const C = (L as unknown as Record<string, L.LucideIcon>)[name] ?? L.Home
  return <C size={size} className={className} aria-hidden />
}
const CAMS: { id: CamMode; label: string; icon: string }[] = [
  { id: 'orbit', label: 'Orbit', icon: 'Orbit' }, { id: 'top', label: 'Top', icon: 'LayoutDashboard' }, { id: 'front', label: 'Front', icon: 'PanelTop' },
  { id: 'walk', label: 'Walk', icon: 'Footprints' }, { id: 'free', label: 'Free', icon: 'Move3d' },
]
const chip = (on: boolean) => `rounded-full border px-3 py-1 text-xs transition ${on ? 'border-cyan bg-cyan/15 text-cyan' : 'border-white/15 text-silver hover:text-white'}`
const Slider = ({ label, value, min, max, step = 1, unit = '', onStart, onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onStart: () => void; onChange: (v: number) => void }) => (
  <label className="block text-xs text-silver"><span className="flex justify-between"><span>{label}</span><span className="tabular-nums text-white">{value}{unit}</span></span>
    <input type="range" min={min} max={max} step={step} value={value} onPointerDown={onStart} onKeyDown={onStart} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full accent-cyan" /></label>
)

type Props = { design: Design; onChange?: (d: Design) => void; readOnly?: boolean }

export default function Designer3D({ design, onChange, readOnly }: Props) {
  const { sel, select, night, setNight, cam, setCam } = useStudioUI()
  const [ri, setRi] = useState(0), [tab, setTab] = useState<'devices' | 'furniture' | 'room'>('devices'), [group, setGroup] = useState<Group | 'all'>('all'), [adding, setAdding] = useState(false)
  const past = useRef<Design[]>([]), future = useRef<Design[]>([]), capture = useRef<(() => string) | null>(null)
  const products = useProducts(), estimate = useEstimate(design.rooms, design.estimate)

  const rooms = design.rooms
  const room: Room = rooms[Math.min(ri, rooms.length - 1)] ?? newRoom('other')
  const selDevice = sel?.kind === 'device' ? room.devices.find((d) => d.id === sel.id) : undefined
  const selFurn = sel?.kind === 'furniture' ? (room.furniture ?? []).find((f) => f.id === sel.id) : undefined

  // ---- history (undo / redo) ----
  const begin = useCallback(() => { past.current = [...past.current.slice(-49), design]; future.current = [] }, [design])
  const apply = (next: Design) => onChange?.(next)
  const patchRoom = (fn: (r: Room) => Room) => apply({ ...design, rooms: rooms.map((r) => (r.id === room.id ? fn(r) : r)) })
  const commit = (fn: (r: Room) => Room) => { begin(); patchRoom(fn) }
  const undo = () => { const p = past.current.pop(); if (p) { future.current.push(design); select(null); apply(p) } }
  const redo = () => { const n = future.current.pop(); if (n) { past.current.push(design); select(null); apply(n) } }

  // ---- edits ----
  const setDev = (id: string, patch: Partial<PlacedDevice>) => patchRoom((r) => ({ ...r, devices: r.devices.map((d) => (d.id === id ? { ...d, ...patch } : d)) }))
  const toggle = useCallback((id: string) => { const cur = room.devices.find((d) => d.id === id); if (cur) apply({ ...design, rooms: rooms.map((r) => (r.id === room.id ? { ...r, devices: r.devices.map((d) => (d.id === id ? { ...d, on: !d.on } : d)) } : r)) }) }, [design, room, rooms]) // eslint-disable-line react-hooks/exhaustive-deps
  const move = useCallback((kind: 'device' | 'furniture', id: string, x: number, y: number) => {
    if (readOnly) return
    onChange?.({ ...design, rooms: rooms.map((r) => (r.id !== room.id ? r : kind === 'device' ? { ...r, devices: r.devices.map((d) => (d.id === id ? { ...d, x, y } : d)) } : { ...r, furniture: (r.furniture ?? []).map((f) => (f.id === id ? { ...f, x, y } : f)) })) })
  }, [design, room, rooms, onChange, readOnly])

  const addDevice = (def: Device) => {
    if (readOnly) return
    const n = room.devices.filter((d) => mountOf[deviceById[d.cat]?.kind] === mountOf[def.kind]).length, m = mountOf[def.kind], id = uid()
    const wall = m.startsWith('wall'), spots: [number, number][] = [[50, 0], [100, 50], [0, 50], [50, 100]]
    const [x, y] = wall ? [spots[n % 4][0] + (spots[n % 4][0] === 50 ? (n % 3 - 1) * 12 : 0), spots[n % 4][1] + (spots[n % 4][1] === 50 ? (n % 3 - 1) * 12 : 0)] : [25 + (n % 3) * 25, 30 + (Math.floor(n / 3) % 3) * 22]
    commit((r) => ({ ...r, devices: [...r.devices, { id, cat: def.id, x, y, on: true, level: defaultLevel(def.id) }] })); select({ id, kind: 'device' })
  }
  const addFurniture = (type: FurnitureType) => { if (readOnly) return; const id = uid(), n = (room.furniture ?? []).length; commit((r) => ({ ...r, furniture: [...(r.furniture ?? []), { id, type, x: 50 + ((n % 3) - 1) * 14, y: 55 + (Math.floor(n / 3) % 3) * 12 - 10, rot: 0 }] })); select({ id, kind: 'furniture' }) }
  const removeSel = () => { if (!sel || readOnly) return; commit((r) => (sel.kind === 'device' ? { ...r, devices: r.devices.filter((d) => d.id !== sel.id) } : { ...r, furniture: (r.furniture ?? []).filter((f) => f.id !== sel.id) })); select(null) }
  const duplicate = () => {
    if (!sel || readOnly) return; const id = uid()
    commit((r) => sel.kind === 'device'
      ? { ...r, devices: [...r.devices, ...r.devices.filter((d) => d.id === sel.id).map((d) => ({ ...d, id, x: Math.min(95, d.x + 6), y: Math.min(95, d.y + 6) }))] }
      : { ...r, furniture: [...(r.furniture ?? []), ...(r.furniture ?? []).filter((f) => f.id === sel.id).map((f) => ({ ...f, id, x: Math.min(95, f.x + 6), y: Math.min(95, f.y + 6) }))] })
    select({ id, kind: sel.kind })
  }
  const rotate = () => { if (selFurn && !readOnly) commit((r) => ({ ...r, furniture: (r.furniture ?? []).map((f) => (f.id === selFurn.id ? { ...f, rot: (f.rot + 90) % 360 } : f)) })) }
  const runScene = (id: string) => {
    const s = SCENES.find((x) => x.id === id); if (!s) return
    setNight(s.night)
    if (!readOnly) commit((r) => ({ ...r, devices: r.devices.map((d, i) => ({ ...d, ...s.apply(d, deviceById[d.cat]?.kind, i) })) }))
  }
  const shot = () => { const url = capture.current?.(); if (!url) return; const a = document.createElement('a'); a.href = url; a.download = `${room.name.replace(/\W+/g, '-').toLowerCase()}.png`; a.click() }

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName) || readOnly) return
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo() }
      else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo() }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && sel) { e.preventDefault(); removeSel() }
      else if (e.key.toLowerCase() === 'r' && selFurn && cam !== 'walk') rotate()
    }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  })

  const shown = useMemo(() => devices.filter((d) => group === 'all' || d.group === group), [group])
  const { w, l, h } = dims(room), suggested = roomTypeById[room.type].suggest
  const selDef = selDevice ? deviceById[selDevice.cat] : undefined, kind = selDef?.kind
  const dimmable = kind === 'light' || kind === 'fan'

  const [full, setFull] = useState(false), [panels, setPanels] = useState(() => typeof window === 'undefined' || window.innerWidth >= 1024), [resetKey, setResetKey] = useState(0), [zoom, setZoom] = useState<{ n: number; dir: 1 | -1 }>({ n: 0, dir: 1 })
  useEffect(() => { // full-screen designer: lock page scroll, Esc leaves it
    if (!full) return
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden'
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setFull(false)
    window.addEventListener('keydown', k)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', k) }
  }, [full])
  const side = panels && !readOnly
  return (
    <div className={full ? 'fixed inset-0 z-50 bg-midnight' : `relative overflow-hidden rounded-3xl border border-white/10 bg-deep ${readOnly ? 'h-[580px]' : 'h-[calc(100vh-170px)] min-h-[640px]'}`}>
      <div className="absolute inset-0 bg-deep" style={{ touchAction: 'none' }} onDoubleClick={(e) => { if (e.target instanceof HTMLCanvasElement) setResetKey((n) => n + 1) }}>
        <RoomScene resetKey={resetKey} zoom={zoom} room={room} readOnly={readOnly} onBegin={begin} onMove={move} onToggle={toggle} onCapture={(fn) => { capture.current = fn }} />
      </div>

      <div className="pointer-events-none absolute left-3 top-3 z-20 flex max-w-[calc(100%-250px)] flex-col gap-2">
        <div className="pointer-events-auto flex flex-nowrap items-center gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Rooms">
          {rooms.map((r, i) => (
            <button key={r.id} role="tab" aria-selected={i === ri} onClick={() => { setRi(i); select(null) }} className={`flex shrink-0 items-center gap-2 rounded-full border bg-midnight/80 px-4 py-2 text-sm backdrop-blur transition ${i === ri ? 'border-cyan bg-cyan/15 text-cyan' : 'border-white/15 text-silver hover:text-white'}`}>
              <Icon name={roomTypeById[r.type]?.icon ?? 'Home'} size={15} />{r.name}{r.devices.length > 0 && <span className="rounded-full bg-white/10 px-1.5 text-[0.65rem]">{r.devices.length}</span>}</button>))}
          {!readOnly && <button onClick={() => setAdding(!adding)} className="flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-white/25 bg-midnight/80 px-4 py-2 text-sm backdrop-blur text-silver hover:border-cyan hover:text-cyan"><L.Plus size={15} />Add room</button>}
          <span className="pointer-events-none hidden self-start rounded-full border border-amber-300/40 bg-midnight/80 px-3 py-1 text-[0.7rem] text-amber-300 backdrop-blur sm:block">Simulation · not connected to real devices</span>
      </div>

        <div className="pointer-events-auto flex flex-wrap gap-1 rounded-2xl border border-white/10 bg-midnight/70 p-1 backdrop-blur" role="group" aria-label="Camera">{CAMS.map((c) => (
              <button key={c.id} onClick={() => setCam(c.id)} aria-pressed={cam === c.id} title={c.label} className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs transition ${cam === c.id ? 'bg-cyan/20 text-cyan' : 'text-silver hover:text-white'}`}><Icon name={c.icon} size={14} /><span className="hidden sm:inline">{c.label}</span></button>))}</div>
      </div>
        {adding && !readOnly && (
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[.03] p-3 sm:grid-cols-4">{roomTypes.map((t) => (
            <button key={t.id} onClick={() => { const n = rooms.filter((r) => r.type === t.id).length + 1; begin(); apply({ ...design, rooms: [...rooms, newRoom(t.id, n)] }); setRi(rooms.length); setAdding(false); select(null) }} className="flex flex-col items-center gap-2 rounded-xl border border-white/10 p-3 text-xs text-silver transition hover:border-cyan hover:text-cyan"><Icon name={t.icon} size={20} />{t.label}</button>))}</div>)}


      <div className="absolute right-3 top-3 z-20 flex gap-1 rounded-2xl border border-white/10 bg-midnight/80 p-1 backdrop-blur" role="group" aria-label="Designer tools">
        {!readOnly && <><button onClick={undo} aria-label="Undo" title="Undo (Ctrl+Z)" className="rounded-xl p-2 text-silver hover:text-white"><L.Undo2 size={16} /></button><button onClick={redo} aria-label="Redo" title="Redo (Ctrl+Shift+Z)" className="rounded-xl p-2 text-silver hover:text-white"><L.Redo2 size={16} /></button></>}
        <button onClick={() => setNight(!night)} aria-label={night ? 'Switch to day' : 'Switch to night'} aria-pressed={night} className="rounded-xl p-2 text-silver hover:text-white">{night ? <L.Moon size={16} /> : <L.Sun size={16} />}</button>
        <button onClick={shot} aria-label="Save screenshot" title="Save screenshot" className="rounded-xl p-2 text-silver hover:text-white"><L.Camera size={16} /></button>
        {!readOnly && <button onClick={() => setPanels(!panels)} aria-label="Panels" aria-pressed={panels} title="Show or hide the side panels" className={`rounded-xl p-2 ${panels ? 'bg-cyan/20 text-cyan' : 'text-silver hover:text-white'}`}><L.PanelLeft size={16} /></button>}
        <button onClick={() => setFull(!full)} aria-label={full ? 'Exit full screen' : 'Full screen'} aria-pressed={full} title={full ? 'Exit full screen (Esc)' : 'Full screen'} className="rounded-xl p-2 text-silver hover:text-white">{full ? <L.Minimize2 size={16} /> : <L.Maximize2 size={16} />}</button>
      </div>

      {!readOnly && (
        <aside className={`absolute bottom-3 left-3 z-20 w-[min(300px,86vw)] space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-midnight/85 p-3 backdrop-blur ${panels ? '' : 'hidden'}`} style={{ top: 150 }} aria-label="Build tools">
          <div className="flex gap-1.5">{(['devices', 'furniture', 'room'] as const).map((t) => <button key={t} onClick={() => setTab(t)} className={`flex-1 ${chip(tab === t)} capitalize`}>{t === 'room' ? 'Room style' : t === 'devices' ? 'Smart devices' : 'Furniture'}</button>)}</div>
          {tab === 'devices' && <>
            <div className="flex flex-wrap gap-1.5">{(['all', ...groups.map((g) => g.id)] as const).map((g) => <button key={g} onClick={() => setGroup(g)} className={chip(group === g)}>{g === 'all' ? 'All' : g}</button>)}</div>
            <ul className="max-h-[520px] space-y-2 overflow-y-auto pr-1">{shown.map((d) => { const p = products[d.id]; return (
              <li key={d.id}><button onClick={() => addDevice(d)} className="group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[.03] p-3 text-left transition hover:border-cyan/50 hover:bg-white/[.07]">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg" style={{ background: `${groupColor[d.group]}22`, color: groupColor[d.group] }}><Icon name={d.icon} size={20} /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm leading-tight">{d.name}</span><span className="block truncate text-[0.7rem] text-slate">{suggested.includes(d.id) ? '★ Suggested · ' : ''}{p ? (p.unitPrice > 0 ? `from ${aed(p.unitPrice)}` : 'Price on request') : d.group}</span></span>
                <L.Plus size={16} className="text-slate group-hover:text-cyan" aria-hidden /></button></li>) })}</ul></>}
          {tab === 'furniture' && <ul className="grid grid-cols-2 gap-2">{furnitureTypes.map((f) => (
            <li key={f.id}><button onClick={() => addFurniture(f.id)} className="flex w-full flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[.03] p-3 text-xs text-silver transition hover:border-cyan/50 hover:text-white"><span className="h-8 w-8 rounded-md" style={{ background: f.color }} />{f.label}</button></li>))}</ul>}
          {tab === 'room' && (
            <div className="space-y-4 rounded-xl border border-white/10 bg-white/[.03] p-4">
              <label className="block text-xs text-silver">Room name<input maxLength={60} value={room.name} onFocus={begin} onChange={(e) => patchRoom((r) => ({ ...r, name: e.target.value }))} className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan" /></label>
              <Slider label="Width" value={w} min={2} max={14} step={0.1} unit=" m" onStart={begin} onChange={(v) => patchRoom((r) => ({ ...r, w: v }))} />
              <Slider label="Length" value={l} min={2} max={14} step={0.1} unit=" m" onStart={begin} onChange={(v) => patchRoom((r) => ({ ...r, l: v }))} />
              <Slider label="Ceiling height" value={h} min={2.2} max={4.5} step={0.1} unit=" m" onStart={begin} onChange={(v) => patchRoom((r) => ({ ...r, h: v }))} />
              <div><div className="mb-2 text-xs text-silver">Wall colour</div><div className="flex flex-wrap gap-2">{wallColors.map((c) => <button key={c} aria-label={`Wall ${c}`} onClick={() => commit((r) => ({ ...r, wall: c }))} className={`h-7 w-7 rounded-full border-2 ${room.wall === c ? 'border-cyan' : 'border-white/20'}`} style={{ background: c }} />)}</div></div>
              <div><div className="mb-2 text-xs text-silver">Flooring</div><div className="flex flex-wrap gap-2">{floorColors.map((c) => <button key={c} aria-label={`Floor ${c}`} onClick={() => commit((r) => ({ ...r, floor: c }))} className={`h-7 w-7 rounded-md border-2 ${room.floor === c ? 'border-cyan' : 'border-white/20'}`} style={{ background: c }} />)}</div></div>
            </div>)}
        </aside>
      )}
      {!readOnly && <aside className={`absolute bottom-3 right-3 z-20 w-[min(310px,86vw)] overflow-y-auto ${panels ? '' : 'hidden'}`} style={{ top: 64 }} aria-label="Estimate"><CostPanel e={estimate} /></aside>}

      <div className={`absolute bottom-16 z-20 flex flex-col gap-2 ${side ? 'right-[336px]' : 'right-3'}`} role="group" aria-label="Camera zoom">
        {([['Zoom in', L.ZoomIn, () => setZoom((z) => ({ n: z.n + 1, dir: 1 }))], ['Zoom out', L.ZoomOut, () => setZoom((z) => ({ n: z.n + 1, dir: -1 }))], ['Reset view', L.RotateCcw, () => setResetKey((n) => n + 1)]] as const).map(([label, I, fn]) => (
          <button key={label} onClick={fn} aria-label={label} title={label} className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-midnight/80 text-silver backdrop-blur transition hover:border-cyan hover:text-cyan"><I size={17} /></button>))}
      </div>

      <div className={`pointer-events-none absolute bottom-3 z-20 flex flex-col gap-2 ${side ? 'left-[324px] right-[392px]' : 'left-3 right-16'}`}>
        <p className="pointer-events-none hidden self-start rounded-lg bg-midnight/80 px-3 py-1.5 text-[0.7rem] text-silver backdrop-blur sm:block">{cam === 'walk' ? 'W A S D / arrows to walk · drag to look around' : readOnly ? 'Drag to orbit · click a device to try it · double-click to reset' : 'Click a device to switch it · drag to move · drag the background to orbit · double-click to reset'}</p>
        {/* inspector */}
        {(selDevice || selFurn) && (
          <div className="pointer-events-auto max-h-[42vh] overflow-y-auto rounded-2xl border border-white/15 bg-midnight/92 p-4 backdrop-blur">
            {selDevice && selDef && <div className="grid gap-4 md:grid-cols-[1fr_minmax(0,1.3fr)]">
              <div className="flex items-start gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl" style={{ background: `${groupColor[selDef.group]}22`, color: groupColor[selDef.group] }}><Icon name={selDef.icon} size={24} /></span>
                <div><div className="font-display">{selDef.name}</div><p className="text-sm text-silver">{selDef.desc}</p>
                  {products[selDef.id] && <p className="mt-1 text-xs text-slate">{products[selDef.id].protocol} · {products[selDef.id].specs}{products[selDef.id].connectivity?.length ? ` · ${products[selDef.id].connectivity.join(' / ')}` : ''}</p>}</div></div>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setDev(selDevice.id, { on: !selDevice.on })} onPointerDown={begin} className="rounded-full border border-cyan/50 px-4 py-1.5 text-sm text-cyan hover:bg-cyan/10">{selDevice.on ? selDef.on : selDef.off}</button>
                  {!readOnly && <><button onClick={duplicate} className="flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-1.5 text-sm text-silver hover:text-white"><L.Copy size={14} />Duplicate</button><button onClick={removeSel} className="flex items-center gap-1.5 rounded-full border border-red-400/40 px-4 py-1.5 text-sm text-red-300 hover:bg-red-500/10"><L.Trash2 size={14} />Remove</button></>}</div>
                {dimmable && <Slider label={kind === 'fan' ? 'Speed' : 'Brightness'} value={levelOf(selDevice)} min={5} max={100} unit="%" onStart={begin} onChange={(v) => setDev(selDevice.id, { level: v, on: true })} />}
                {kind === 'light' && <div className="flex flex-wrap items-center gap-2 text-xs text-silver">Colour
                  {[['Warm', '#ffb86b'], ['Soft', '#ffe9a8'], ['White', '#ffffff'], ['Cool', '#cfe3ff'], ['Blue', '#3b82ff'], ['Magenta', '#ff3df0'], ['Green', '#35e07c']].map(([n, c]) => <button key={c} aria-label={n} title={n} onClick={() => { begin(); setDev(selDevice.id, { color: c, on: true }) }} className={`h-6 w-6 rounded-full border-2 ${selDevice.color === c ? 'border-white' : 'border-white/20'}`} style={{ background: c }} />)}
                  <input type="color" aria-label="Custom colour" value={selDevice.color || selDef.tint || '#ffe9a8'} onPointerDown={begin} onChange={(e) => setDev(selDevice.id, { color: e.target.value, on: true })} className="h-7 w-9 cursor-pointer rounded border border-white/20 bg-transparent" /></div>}
                {kind === 'ac' && <Slider label="Temperature" value={levelOf(selDevice)} min={16} max={30} unit="°C" onStart={begin} onChange={(v) => setDev(selDevice.id, { level: v, on: true })} />}
                {kind === 'curtain' && <Slider label="Open" value={levelOf(selDevice)} min={0} max={100} unit="%" onStart={begin} onChange={(v) => setDev(selDevice.id, { level: v, on: v > 0 })} />}
              </div></div>}
            {selFurn && <div className="flex flex-wrap items-center gap-3"><span className="font-display">{furnitureTypes.find((f) => f.id === selFurn.type)?.label}</span><span className="text-sm text-slate">Design item · not priced</span>
              {!readOnly && <div className="ml-auto flex gap-2"><button onClick={rotate} className="flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-1.5 text-sm text-silver hover:text-white"><L.RotateCw size={14} />Rotate (R)</button><button onClick={duplicate} className="flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-1.5 text-sm text-silver hover:text-white"><L.Copy size={14} />Duplicate</button><button onClick={removeSel} className="flex items-center gap-1.5 rounded-full border border-red-400/40 px-4 py-1.5 text-sm text-red-300 hover:bg-red-500/10"><L.Trash2 size={14} />Remove</button></div>}</div>}
          </div>)}

        <div className="pointer-events-auto flex flex-wrap gap-2" role="group" aria-label="Lighting scenes">{SCENES.map((s) => (
          <button key={s.id} onClick={() => runScene(s.id)} disabled={!room.devices.length} className="flex items-center gap-2 rounded-full border border-white/20 bg-midnight/80 px-4 py-2 text-xs text-silver backdrop-blur transition enabled:hover:border-cyan enabled:hover:text-cyan disabled:opacity-40"><Icon name={s.icon} size={14} />{s.label}</button>))}</div>


        {!readOnly && rooms.length > 1 && <button onClick={() => { begin(); apply({ ...design, rooms: rooms.filter((r) => r.id !== room.id) }); setRi(0); select(null) }} className="pointer-events-auto self-start rounded-full bg-midnight/80 px-3 py-1.5 text-xs text-silver backdrop-blur hover:text-red-300">Remove “{room.name}” from this design</button>}
      </div>
    </div>
  )
}

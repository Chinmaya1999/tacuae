// On-screen game controls for the walk-through: prompt, action button and a touch joystick.
import { useRef, useState, type PointerEvent } from 'react'
import { Power } from 'lucide-react'
import { usePlay } from './play'

export default function PlayHud() {
  const near = usePlay((s) => s.near), press = usePlay((s) => s.press), setStick = usePlay((s) => s.setStick)
  const pad = useRef<HTMLDivElement>(null), [knob, setKnob] = useState({ x: 0, y: 0 })
  const drag = (e: PointerEvent) => {
    if (e.type !== 'pointerdown' && !e.buttons) return
    const r = pad.current!.getBoundingClientRect()
    let x = (e.clientX - r.left - r.width / 2) / (r.width / 2), y = (e.clientY - r.top - r.height / 2) / (r.height / 2)
    const len = Math.max(1, Math.hypot(x, y)); x /= len; y /= len
    setKnob({ x, y }); setStick(x, y)
  }
  const stop = () => { setKnob({ x: 0, y: 0 }); setStick(0, 0) }
  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none">
      <p className="absolute left-1/2 top-16 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-black/55 px-4 py-1.5 text-xs text-white backdrop-blur sm:block"><b>W A S D</b> move · <b>drag</b> look · <b>Q</b> turn · <b>E</b> switch</p>
      <div className="absolute inset-x-0 bottom-5 flex justify-center">
        <button type="button" onClick={press} disabled={!near} className="pointer-events-auto flex items-center gap-2.5 rounded-2xl border border-white/20 bg-black/65 px-4 py-2.5 text-sm font-semibold text-white shadow-2xl backdrop-blur transition disabled:opacity-60">
          {near ? <><span className="grid h-7 w-7 place-items-center rounded-lg bg-white text-xs font-bold text-black">E</span><Power size={15} aria-hidden className={near.on ? 'text-emerald-300' : 'text-silver'} />{near.on ? 'Switch off' : 'Switch on'} {near.name}</> : 'Walk up to a device'}
        </button>
      </div>
      <div ref={pad} role="application" aria-label="Movement joystick" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); drag(e) }} onPointerMove={drag} onPointerUp={stop} onPointerCancel={stop}
        className="pointer-events-auto absolute bottom-20 left-4 h-28 w-28 touch-none rounded-full border border-white/25 bg-black/35 backdrop-blur [@media(pointer:fine)]:hidden">
        <span className="absolute left-1/2 top-1/2 h-12 w-12 rounded-full bg-white/80 shadow-lg" style={{ transform: `translate(calc(-50% + ${knob.x * 32}px), calc(-50% + ${knob.y * 32}px))` }} />
      </div>
    </div>
  )
}

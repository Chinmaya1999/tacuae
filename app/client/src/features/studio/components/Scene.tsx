import { motion } from 'framer-motion'
import type { RoomType } from '../../../shared/data/catalog'

/** Top-down furniture for each room type (viewBox 100 x 62). Purely decorative. */
export function Furniture({ type }: { type: RoomType }) {
  const f = 'rgba(255,255,255,.07)', s = 'rgba(255,255,255,.22)'
  const R = (x: number, y: number, w: number, h: number, r = 1.2, extra = {}) => <rect x={x} y={y} width={w} height={h} rx={r} fill={f} stroke={s} strokeWidth=".35" {...extra} />
  const C = (cx: number, cy: number, r: number) => <circle cx={cx} cy={cy} r={r} fill={f} stroke={s} strokeWidth=".35" />
  switch (type) {
    case 'master': case 'bedroom': case 'kids': case 'guest': return <>{R(34, 12, 32, 34, 2)}{R(37, 14, 11, 7, 2)}{R(52, 14, 11, 7, 2)}{R(34, 28, 32, 18, 1.5, { opacity: 0.6 })}{R(24, 14, 6, 6)}{R(70, 14, 6, 6)}{R(88, 10, 8, 30)}</>
    case 'bathroom': return <>{R(6, 8, 40, 16, 4)}{R(9, 11, 34, 10, 4)}{C(78, 14, 4)}{R(70, 6, 16, 5)}{R(62, 34, 28, 22, 1, { strokeDasharray: '1.5 1.5' })}{R(8, 40, 14, 10)}</>
    case 'kitchen': return <>{R(4, 4, 92, 9)}{R(4, 13, 9, 40)}{R(34, 28, 36, 14, 1.5)}{R(84, 30, 12, 22)}{C(20, 8.5, 2.2)}{C(28, 8.5, 2.2)}{C(36, 8.5, 2.2)}</>
    case 'living': case 'hall': case 'theatre': return <>{R(20, 6, 60, 6)}{R(20, 36, 60, 14, 3)}{R(20, 36, 10, 14, 3)}{R(34, 22, 32, 10, 1.5)}{R(14, 18, 72, 28, 3, { strokeDasharray: '2 2', fill: 'none' })}</>
    case 'dining': return <>{R(30, 20, 40, 22, 3)}{[34, 46, 58].map((x) => <g key={x}>{R(x, 14, 8, 4, 1.5)}{R(x, 44, 8, 4, 1.5)}</g>)}{R(22, 26, 4, 10, 1.5)}{R(74, 26, 4, 10, 1.5)}</>
    case 'drawing': return <>{R(8, 8, 26, 12, 3)}{R(66, 8, 26, 12, 3)}{R(8, 40, 26, 12, 3)}{R(40, 24, 20, 14, 2)}{C(50, 31, 6)}{R(38, 54, 24, 4)}</>
    case 'office': case 'study': return <>{R(24, 6, 52, 12)}{C(50, 26, 5)}{R(4, 10, 8, 40)}{R(88, 10, 8, 40)}{R(40, 40, 20, 10, 1.5, { opacity: 0.6 })}</>
    case 'balcony': return <>{R(2, 54, 96, 3, 1)}{C(10, 46, 5)}{C(90, 46, 5)}{R(36, 24, 28, 18, 2)}{R(30, 28, 5, 10, 1.5)}{R(65, 28, 5, 10, 1.5)}</>
    case 'garage': return <>{R(22, 10, 56, 38, 8)}{R(30, 16, 40, 12, 4, { opacity: 0.6 })}{C(30, 14, 3)}{C(70, 14, 3)}{C(30, 44, 3)}{C(70, 44, 3)}</>
    default: return <>{R(30, 20, 40, 22, 3, { strokeDasharray: '2 2', fill: 'none' })}</>
  }
}

/** Window on the top wall with curtains that slide open/closed. open=null means "no curtain device in this room". */
export function Window({ open, night }: { open: boolean | null; night: boolean }) {
  return (
    <div className="pointer-events-none absolute left-[28%] top-0 h-[5%] w-[44%] overflow-hidden rounded-b-md border-x border-b border-white/30 bg-sky-200/20">
      <div className={`absolute inset-0 transition-opacity duration-700 ${night ? 'bg-indigo-950/70' : 'bg-gradient-to-b from-sky-200/70 to-sky-100/20'}`} />
      {open !== null && <>
        <motion.div className="absolute inset-y-0 left-0 bg-violet-400/70" initial={false} animate={{ width: open ? '10%' : '52%' }} transition={{ type: 'spring', stiffness: 70, damping: 16 }} />
        <motion.div className="absolute inset-y-0 right-0 bg-violet-400/70" initial={false} animate={{ width: open ? '10%' : '52%' }} transition={{ type: 'spring', stiffness: 70, damping: 16 }} />
      </>}
    </div>
  )
}

/** Live animation drawn under the device icon while it is on. */
export function Effect({ kind }: { kind: string }) {
  const ring = (c: string, d = 0) => <motion.span className="absolute rounded-full border" style={{ borderColor: c, inset: 0 }} initial={{ scale: 0.6, opacity: 0.9 }} animate={{ scale: 3, opacity: 0 }} transition={{ duration: 2.2, repeat: Infinity, delay: d, ease: 'easeOut' }} />
  switch (kind) {
    case 'ac': return <>{ring('#5ee1ff')}{ring('#5ee1ff', 0.7)}{ring('#5ee1ff', 1.4)}</>
    case 'sensor': return <>{ring('#ffb35e')}{ring('#ffb35e', 1)}</>
    case 'alarm': return <>{ring('#ff5d5d')}{ring('#ff5d5d', 0.4)}</>
    case 'voice': case 'speaker': return <>{ring('#6aa9ff')}{ring('#6aa9ff', 0.6)}</>
    case 'cloud': case 'panel': case 'meter': case 'switch': case 'plug': return ring('#6aa9ff')
    case 'lock': return ring('#7dff9f')
    case 'camera': return (
      <motion.svg className="absolute left-1/2 top-1/2 -translate-y-1/2 overflow-visible" width="150" height="110" viewBox="0 0 150 110" style={{ transformOrigin: '0 50%' }}
        animate={{ rotate: [-28, 28, -28] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
        <path d="M0 55 L150 5 L150 105 Z" fill="rgba(255,80,80,.18)" stroke="rgba(255,120,120,.5)" strokeWidth=".6" />
      </motion.svg>)
    default: return null
  }
}

/** Soft pool of light on the floor. Rendered above the night shade so it truly "lights up" the room. */
export function Glow({ x, y, color, night }: { x: number; y: number; color: string; night: boolean }) {
  return (
    <motion.div aria-hidden className="pointer-events-none absolute rounded-full mix-blend-screen" style={{ left: `${x}%`, top: `${y}%`, width: '46%', aspectRatio: '1', translate: '-50% -50%', background: `radial-gradient(circle, ${color} 0%, ${color}00 68%)` }}
      initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: night ? 0.95 : 0.4, scale: 1 }} exit={{ opacity: 0, scale: 0.4 }} transition={{ duration: 0.5 }} />
  )
}

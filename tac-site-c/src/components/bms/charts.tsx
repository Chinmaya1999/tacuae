import { limitState, type Reading } from '../../data/bms'

type Pt = { t: number; v: number }

/** Small trend line with min/max labels. Data is simulated for now; the parent labels it. */
export function TrendChart({ points, unit = '', color = '#00d5ff', height = 120 }: { points: Pt[]; unit?: string; color?: string; height?: number }) {
  if (points.length < 2) return <div className="grid place-items-center text-xs text-slate" style={{ height }}>No data</div>
  const w = 400, pad = 4, vs = points.map((p) => p.v), lo = Math.min(...vs), hi = Math.max(...vs), span = hi - lo || 1
  const x = (i: number) => pad + (i / (points.length - 1)) * (w - pad * 2), y = (v: number) => height - pad - ((v - lo) / span) * (height - pad * 2 - 12) - 6
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ')
  const t0 = new Date(points[0].t), t1 = new Date(points[points.length - 1].t), hm = (d: Date) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return (
    <figure>
      <svg viewBox={`0 0 ${w} ${height}`} className="w-full" role="img" aria-label={`Trend from ${hm(t0)} to ${hm(t1)}, minimum ${lo} ${unit}, maximum ${hi} ${unit}`}>
        <defs><linearGradient id="tg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".35" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
        <path d={`${d} L${x(points.length - 1)} ${height} L${x(0)} ${height} Z`} fill="url(#tg)" /><path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <figcaption className="mt-1 flex justify-between text-[0.68rem] text-slate"><span>{hm(t0)}</span><span>min {lo} · max {hi} {unit}</span><span>{hm(t1)}</span></figcaption>
    </figure>
  )
}

/** Tiny inline sparkline. */
export function Spark({ points, color = '#00d5ff' }: { points: number[]; color?: string }) {
  if (points.length < 2) return null
  const lo = Math.min(...points), hi = Math.max(...points), span = hi - lo || 1
  return <svg viewBox="0 0 100 24" className="h-6 w-24" aria-hidden><path d={points.map((v, i) => `${i ? 'L' : 'M'}${(i / (points.length - 1)) * 100} ${22 - ((v - lo) / span) * 20}`).join(' ')} fill="none" stroke={color} strokeWidth="1.5" /></svg>
}

/** Horizontal meter for one reading, coloured by its limits. */
export function Meter({ r, v }: { r: Reading; v: number | null }) {
  const st = limitState(r, v), color = st === 2 ? '#ff4d4d' : st === 1 ? '#ffd166' : '#35e07c'
  const lo = Math.min(r.lowCrit ?? Infinity, r.base - r.amp * 2, 0 > r.base - r.amp * 3 ? r.base - r.amp * 3 : 0), hi = Math.max(r.crit ?? -Infinity, r.base + r.amp * 2.5, r.base * 1.2, 1)
  const pct = v === null ? 0 : Math.max(2, Math.min(100, ((v - (isFinite(lo) ? lo : 0)) / (hi - (isFinite(lo) ? lo : 0) || 1)) * 100))
  return <div className="h-1.5 overflow-hidden rounded-full bg-white/10" role="presentation"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} /></div>
}

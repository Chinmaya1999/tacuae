import { useEffect, useRef } from 'react'

/** Light-weight connected-nodes canvas: a building-automation network feeling. */
export default function NetworkCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current!, ctx = cv.getContext('2d')!
    let w = 0, h = 0, raf = 0, mx = 0.5, my = 0.5
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const N = coarse ? 28 : 56
    const nodes = Array.from({ length: N }, () => ({ x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 0.00018, vy: (Math.random() - 0.5) * 0.00018, p: Math.random() * 6 }))
    const pulses: { a: number; b: number; t: number }[] = []
    const resize = () => { w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0) }
    resize(); window.addEventListener('resize', resize)
    const move = (e: PointerEvent) => { mx = e.clientX / innerWidth; my = e.clientY / innerHeight }
    window.addEventListener('pointermove', move, { passive: true })
    let tick = 0
    const draw = () => {
      tick++; ctx.clearRect(0, 0, w, h)
      const pos = nodes.map((n) => { n.x = (n.x + n.vx * 16 + 1) % 1; n.y = (n.y + n.vy * 16 + 1) % 1; return [n.x * w + (mx - 0.5) * 26 * (n.p % 1.5), n.y * h + (my - 0.5) * 18 * (n.p % 1.5)] })
      const maxD = Math.min(190, w / 5)
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
        const dx = pos[i][0] - pos[j][0], dy = pos[i][1] - pos[j][1], dd = Math.hypot(dx, dy)
        if (dd < maxD) { ctx.strokeStyle = `rgba(0,213,255,${0.16 * (1 - dd / maxD)})`; ctx.beginPath(); ctx.moveTo(pos[i][0], pos[i][1]); ctx.lineTo(pos[j][0], pos[j][1]); ctx.stroke()
          if (tick % 45 === 0 && Math.random() < 0.04 && pulses.length < 14) pulses.push({ a: i, b: j, t: 0 }) }
      }
      nodes.forEach((n, i) => { const g = 0.5 + 0.5 * Math.sin(tick / 40 + n.p); ctx.fillStyle = `rgba(165,232,255,${0.35 + g * 0.5})`; ctx.beginPath(); ctx.arc(pos[i][0], pos[i][1], 1.6 + g, 0, 7); ctx.fill() })
      for (let k = pulses.length - 1; k >= 0; k--) { const p = pulses[k]; p.t += 0.02; if (p.t >= 1) { pulses.splice(k, 1); continue }
        const x = pos[p.a][0] + (pos[p.b][0] - pos[p.a][0]) * p.t, y = pos[p.a][1] + (pos[p.b][1] - pos[p.a][1]) * p.t
        ctx.fillStyle = '#00D5FF'; ctx.shadowColor = '#00D5FF'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(x, y, 2.4, 0, 7); ctx.fill(); ctx.shadowBlur = 0 }
      raf = requestAnimationFrame(draw)
    }
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); window.removeEventListener('pointermove', move) }
  }, [])
  return <canvas ref={ref} className="absolute inset-0 -z-10 h-full w-full" aria-hidden />
}

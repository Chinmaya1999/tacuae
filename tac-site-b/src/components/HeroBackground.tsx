import { useEffect, useRef, useState } from 'react'
import Img from './Img'
import { gsap } from '../lib/gsap'

const VIDEO = '/media/hero.mp4' // drop a compressed MP4 (≤ 8 MB, 1080p, muted loop) here and it is used automatically
const POSTER_VIDEO = '/media/hero-poster.jpg'

function GridCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current!
    const ctx = c.getContext('2d')!
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const mobile = window.innerWidth < 768
    let w = 0, h = 0, raf = 0, visible = true, last = 0
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.5)
      w = c.clientWidth; h = c.clientHeight
      c.width = w * dpr; c.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h)
      const hy = h * 0.66, vx = w * 0.62
      // receding floor lines
      const g = ctx.createLinearGradient(0, hy, 0, h)
      g.addColorStop(0, 'rgba(0,213,255,0)'); g.addColorStop(1, 'rgba(0,213,255,.34)')
      ctx.strokeStyle = g; ctx.lineWidth = 1
      const cols = mobile ? 14 : 26
      for (let i = -cols; i <= cols; i++) {
        ctx.beginPath(); ctx.moveTo(vx, hy); ctx.lineTo(vx + i * (w / cols) * 1.35, h); ctx.stroke()
      }
      const speed = reduce ? 0 : (t / 1000) * 0.12
      for (let i = 0; i < 14; i++) {
        const p = ((i / 14 + speed) % 1)
        const y = hy + Math.pow(p, 2.2) * (h - hy)
        ctx.globalAlpha = Math.min(1, p * 1.6) * 0.9
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
      }
      ctx.globalAlpha = 1
      // horizon glow
      const hg = ctx.createLinearGradient(0, hy - 40, 0, hy + 30)
      hg.addColorStop(0, 'rgba(38,139,255,0)'); hg.addColorStop(.5, 'rgba(0,213,255,.22)'); hg.addColorStop(1, 'rgba(38,139,255,0)')
      ctx.fillStyle = hg; ctx.fillRect(0, hy - 40, w, 70)
      // slow scan sweep
      if (!reduce) {
        const sx = ((t / 9000) % 1) * (w * 1.4) - w * 0.2
        const sg = ctx.createLinearGradient(sx - 120, 0, sx + 120, 0)
        sg.addColorStop(0, 'rgba(165,232,255,0)'); sg.addColorStop(.5, 'rgba(165,232,255,.06)'); sg.addColorStop(1, 'rgba(165,232,255,0)')
        ctx.fillStyle = sg; ctx.fillRect(sx - 120, 0, 240, h)
      }
    }
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop)
      if (!visible || t - last < 33) return // ~30fps
      last = t; draw(t)
    }
    resize(); draw(0)
    const ro = new ResizeObserver(() => { resize(); draw(last) }); ro.observe(c)
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }); io.observe(c)
    if (!reduce) raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect() }
  }, [])
  return <canvas ref={ref} aria-hidden className="absolute inset-0 h-full w-full" />
}

function Blueprint() {
  const s = { fill: 'none', stroke: '#a5e8ff', strokeWidth: 1, strokeOpacity: 0.5 } as const
  const d = (delay: number, len = 600) => ({ strokeDasharray: len, strokeDashoffset: len, animation: `drawline 2.6s ${delay}s forwards cubic-bezier(.16,1,.3,1)` })
  return (
    <svg aria-hidden viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 h-full w-full">
      {/* corner brackets */}
      <path {...s} d="M48 120 V76 H92" style={d(1.2, 120)} />
      <path {...s} d="M1392 120 V76 H1348" style={d(1.3, 120)} />
      <path {...s} d="M48 700 V744 H92" style={d(1.4, 120)} className="hidden md:block" />
      <path {...s} d="M1392 700 V744 H1348" style={d(1.5, 120)} className="hidden md:block" />
      {/* dimension line + isometric outline on the right */}
      <g className="hidden lg:block">
        <path {...s} d="M1180 180 L1300 120 L1300 520 L1180 580 Z" style={d(1.6, 1200)} strokeOpacity=".28" />
        <path {...s} d="M1180 180 L1060 120 L1060 520 L1180 580" style={d(1.8, 1200)} strokeOpacity=".28" />
        <path {...s} d="M1060 120 L1180 60 L1300 120" style={d(2.0, 600)} strokeOpacity=".28" />
        {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} {...s} d={`M1180 ${240 + i * 56} L1300 ${180 + i * 56}`} style={d(2.1 + i * 0.1, 160)} strokeOpacity=".16" />)}
        <path {...s} d="M1340 120 V520 M1332 120 H1348 M1332 520 H1348" style={d(2.4, 500)} />
      </g>
      <circle cx="1180" cy="380" r="4" fill="#00d5ff" className="hidden lg:block"><animate attributeName="opacity" values="1;.2;1" dur="2.8s" repeatCount="indefinite" /></circle>
    </svg>
  )
}

export default function HeroBackground() {
  const wrap = useRef<HTMLDivElement>(null)
  const [video, setVideo] = useState(false)

  useEffect(() => {
    // optional real video: only on desktop/tablet, no reduced-motion, no data-saver, and only if the file exists
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } }
    if (window.innerWidth < 768 || nav.connection?.saveData || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let off = false
    fetch(VIDEO, { method: 'HEAD' }).then((r) => {
      const ok = r.ok && (r.headers.get('content-type') || '').startsWith('video')
      if (!off && ok) setVideo(true)
    }).catch(() => {})
    return () => { off = true }
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = wrap.current!
    const t = gsap.to(el, { yPercent: 14, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top top', end: 'bottom top', scrub: true } })
    return () => { t.scrollTrigger?.kill(); t.kill() }
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden bg-midnight">
      <div ref={wrap} className="absolute -inset-x-0 -top-[8%] h-[116%]" style={{ willChange: 'transform' }}>
        <Img name="svc-bms" alt="" priority sizes="100vw" className="h-full w-full object-cover object-[50%_30%]" style={{ animation: 'kenburns 28s ease-out infinite alternate' }} />
        {video && (
          <video className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline preload="metadata" poster={POSTER_VIDEO} aria-hidden>
            <source src={VIDEO} type="video/mp4" />
          </video>
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-midnight via-midnight/75 to-midnight/25" />
      <div className="absolute inset-0 bg-gradient-to-b from-midnight/70 via-transparent to-midnight" />
      <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_80%_30%,rgba(38,139,255,.22),transparent)] mix-blend-screen" />
      <GridCanvas />
      <Blueprint />
    </div>
  )
}

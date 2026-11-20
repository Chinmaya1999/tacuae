import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion'
import { Magnetic } from './ui'
import { isCoarse, usePrefersReduced } from '../lib/useReducedMotion'
import { company } from '../data/content'

const title = 'INTELLIGENCE BUILT INTO EVERY SPACE.'
const W = 520, H = 700
const ICE = '#A5E8FF', CYAN = '#00D5FF', WARM = '#ffe6a8'

// Tower cluster (blueprint elevation)
const towers = [
  { id: 'a', x: 170, y: 90, w: 180, h: 510, cols: 6, rows: 15 },
  { id: 'b', x: 52, y: 270, w: 100, h: 330, cols: 3, rows: 9 },
  { id: 'c', x: 372, y: 340, w: 98, h: 260, cols: 3, rows: 7 },
]
const hash = (a: number, b: number, c: number) => ((a * 73856093) ^ (b * 19349663) ^ (c * 83492791)) >>> 0

// System chips: anchor point on the building -> chip position (all in viewBox units)
const chips = [
  { k: 'LIGHTING', v: 'Evening scene', ax: 290, ay: 180, cx: 440, cy: 112, mobile: true },
  { k: 'CLIMATE', v: '22°C · Auto', ax: 100, ay: 330, cx: 78, cy: 232, mobile: true },
  { k: 'SECURITY', v: 'Armed', ax: 420, ay: 390, cx: 440, cy: 290, mobile: true },
  { k: 'ENERGY', v: 'Monitored', ax: 200, ay: 130, cx: 78, cy: 96, mobile: false },
  { k: 'KNX BUS', v: 'Online', ax: 330, ay: 636, cx: 420, cy: 676, mobile: false },
]

const ticker = ['Building Management Systems', 'Smart Home Automation', 'Guest Room Management', 'KNX Automation', 'Lighting & Dimming Control', 'DALI · DMX · RGB', 'KNX Training & Certification']

function Building({ reduced }: { reduced: boolean }) {
  const d = reduced ? 0 : 1
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full overflow-visible" role="img" aria-label="Animated blueprint of an intelligent building network">
      <defs>
        <linearGradient id="scan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={CYAN} stopOpacity="0" /><stop offset=".5" stopColor={CYAN} stopOpacity=".55" /><stop offset="1" stopColor={CYAN} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#13304f" stopOpacity=".55" /><stop offset="1" stopColor="#0b1728" stopOpacity=".75" /></linearGradient>
        <clipPath id="clipAll">{towers.map((t) => <rect key={t.id} x={t.x} y={t.y} width={t.w} height={t.h} />)}</clipPath>
      </defs>

      {/* ground + bus */}
      <motion.path d={`M10 600 H${W - 10}`} stroke={ICE} strokeOpacity=".5" strokeWidth="1.2" fill="none" initial={{ pathLength: d ? 0 : 1 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2 }} />
      <path id="bus" d="M70 636 H460" stroke={CYAN} strokeOpacity=".35" strokeWidth="2" fill="none" strokeDasharray="2 6" />
      {[260 + 0, 100, 420].map((x, i) => <path key={i} d={`M${x} 600 V636`} stroke={CYAN} strokeOpacity=".5" strokeWidth="1.2" />)}
      {[100, 260, 420].map((x) => <circle key={x} cx={x} cy="636" r="4" fill="#07111f" stroke={CYAN} strokeWidth="1.5" />)}
      {!reduced && [0, 1, 2].map((i) => (
        <circle key={i} r="3.2" fill={CYAN}><animateMotion dur="4.2s" begin={`${2.4 + i * 1.4}s`} repeatCount="indefinite" path="M70 636 H460" /></circle>
      ))}

      {/* tower glass + outlines (drawn) */}
      {towers.map((t, i) => (
        <g key={t.id}>
          <motion.rect x={t.x} y={t.y} width={t.w} height={t.h} fill="url(#glass)" initial={{ opacity: d ? 0 : 1 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 + i * 0.25, duration: 1 }} />
          <motion.path d={`M${t.x} 600 V${t.y} H${t.x + t.w} V600`} fill="none" stroke={ICE} strokeWidth="1.4" strokeLinejoin="round"
            initial={{ pathLength: d ? 0 : 1 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3 + i * 0.35, duration: 1.8, ease: 'easeInOut' }} />
          {/* floor lines */}
          {Array.from({ length: t.rows }).map((_, r) => (
            <motion.path key={r} d={`M${t.x} ${t.y + (t.h / t.rows) * r} H${t.x + t.w}`} stroke={ICE} strokeOpacity=".16" strokeWidth=".8" fill="none"
              initial={{ pathLength: d ? 0 : 1 }} animate={{ pathLength: 1 }} transition={{ delay: 1 + r * 0.05, duration: 0.9 }} />
          ))}
          {/* windows */}
          {Array.from({ length: t.rows }).map((_, r) => Array.from({ length: t.cols }).map((__, c) => {
            const cw = t.w / t.cols, rh = t.h / t.rows, hs = hash(i, r, c)
            const warm = hs % 4 === 0
            return (
              <rect key={`${r}-${c}`} className={reduced ? '' : 'win'} x={t.x + c * cw + cw * 0.18} y={t.y + r * rh + rh * 0.22} width={cw * 0.64} height={rh * 0.5} rx="1.5"
                fill={warm ? WARM : ICE} opacity={reduced ? (hs % 3 ? 0.18 : 0.8) : undefined}
                style={reduced ? undefined : { animationDelay: `${2 + (r * 0.16 + c * 0.14 + (i * 0.4)) % 5.5}s`, animationDuration: `${4.8 + (hs % 5) * 0.4}s`, opacity: 0.12 }} />
            )
          }))}
        </g>
      ))}

      {/* crown + antenna of main tower */}
      <motion.path d="M215 90 V54 H305 V90 M260 54 V14" stroke={ICE} strokeWidth="1.4" fill="none" initial={{ pathLength: d ? 0 : 1 }} animate={{ pathLength: 1 }} transition={{ delay: 1.6, duration: 1.2 }} />
      <circle cx="260" cy="12" r="3.5" fill={CYAN} className="hud-dot" />
      {!reduced && <circle cx="260" cy="12" r="3.5" fill="none" stroke={CYAN}><animate attributeName="r" values="3;22" dur="2.4s" repeatCount="indefinite" /><animate attributeName="opacity" values=".8;0" dur="2.4s" repeatCount="indefinite" /></circle>}

      {/* scan beam */}
      {!reduced && (
        <g clipPath="url(#clipAll)">
          <motion.rect x="0" width={W} height="90" fill="url(#scan)" initial={{ y: 600 }} animate={{ y: [600, 0, 600] }} transition={{ duration: 7, ease: 'easeInOut', repeat: Infinity, delay: 2.4 }} />
        </g>
      )}

      {/* leader lines */}
      {chips.map((c, i) => (
        <motion.path key={c.k} d={`M${c.ax} ${c.ay} L${c.cx} ${c.cy}`} stroke={CYAN} strokeOpacity=".6" strokeWidth="1" strokeDasharray="3 4" fill="none"
          initial={{ pathLength: d ? 0 : 1 }} animate={{ pathLength: 1 }} transition={{ delay: 2.6 + i * 0.25, duration: 0.8 }} />
      ))}
      {chips.map((c) => <circle key={c.k} cx={c.ax} cy={c.ay} r="3.5" fill="#07111f" stroke={CYAN} strokeWidth="1.5" />)}
    </svg>
  )
}

export default function Hero() {
  const ref = useRef<HTMLElement>(null)
  const reduced = usePrefersReduced()
  const [videoFailed, setVideoFailed] = useState(false)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : '16%'])
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  const useVideo = !reduced && !isCoarse() && !conn?.saveData && !videoFailed

  // pointer tilt
  const mx = useMotionValue(0), my = useMotionValue(0)
  const rx = useSpring(useTransform(my, [-1, 1], [5, -5]), { stiffness: 80, damping: 18 })
  const ry = useSpring(useTransform(mx, [-1, 1], [-8, 8]), { stiffness: 80, damping: 18 })
  useEffect(() => {
    if (reduced || isCoarse()) return
    const f = (e: PointerEvent) => { mx.set((e.clientX / innerWidth) * 2 - 1); my.set((e.clientY / innerHeight) * 2 - 1) }
    window.addEventListener('pointermove', f, { passive: true })
    return () => window.removeEventListener('pointermove', f)
  }, [reduced, mx, my])

  return (
    <section ref={ref} className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-midnight" aria-label="Introduction">
      {/* backdrop */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 -z-30 scale-110">
        <img src="/images/site/hero.jpg" alt="" fetchPriority="high" className="h-full w-full object-cover opacity-25" />
        {useVideo && (
          <video className="absolute inset-0 h-full w-full object-cover opacity-30" autoPlay muted loop playsInline preload="metadata" poster="/images/site/hero.jpg" onError={() => setVideoFailed(true)}>
            <source src="/videos/hero.mp4" type="video/mp4" onError={() => setVideoFailed(true)} />
          </video>
        )}
      </motion.div>
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_60%_70%_at_75%_45%,rgba(38,139,255,.28),transparent_70%),linear-gradient(to_right,#07111f_20%,rgba(7,17,31,.7)_60%,rgba(7,17,31,.85))]" />
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-midnight/70 via-transparent to-midnight" />
      <div className="absolute inset-0 -z-10 grid-bg opacity-60" />
      {/* blueprint rulers */}
      <div className="pointer-events-none absolute inset-y-24 right-3 hidden w-px bg-gradient-to-b from-transparent via-cyan/40 to-transparent lg:block" />
      <div className="pointer-events-none absolute bottom-40 left-0 right-0 hidden h-px bg-gradient-to-r from-transparent via-cyan/25 to-transparent lg:block" />

      <motion.div style={{ opacity: fade }} className="container-x relative grid flex-1 items-center gap-6 pb-10 pt-32 lg:grid-cols-12 lg:pt-28">
        {/* copy */}
        <div className="lg:col-span-6 xl:col-span-6">
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.8 }}
            className="mb-7 inline-flex w-fit items-center gap-3 rounded-full border border-cyan/30 bg-midnight/50 px-4 py-2 backdrop-blur">
            <span className="hud-dot h-1.5 w-1.5 rounded-full bg-cyan" />
            <span className="font-display text-[0.72rem] tracking-[0.24em] text-ice">ENGINEERING INTELLIGENT ENVIRONMENTS</span>
          </motion.div>

          <h1 className="display max-w-3xl !text-[clamp(2.3rem,5.2vw,4.6rem)]" aria-label={title}>
            {title.split(' ').map((w, i) => (
              <span key={i} className="mr-[0.25em] inline-block overflow-hidden align-bottom pb-[0.08em]" aria-hidden>
                <motion.span className={`inline-block ${w.startsWith('INTELLIGENCE') ? 'bg-gradient-to-r from-ice to-cyan bg-clip-text text-transparent' : ''}`} initial={{ y: '110%' }} animate={{ y: 0 }}
                  transition={{ duration: 0.9, delay: 0.5 + i * 0.1, ease: [0.2, 0.7, 0.2, 1] }}>{w}</motion.span>
              </span>
            ))}
          </h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 1 }} className="mt-7 max-w-lg text-base leading-relaxed text-silver md:text-lg">
            Transforming the way people live, work and interact with intelligent buildings through advanced automation and integrated technology.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.7, duration: 0.8 }} className="mt-9 flex flex-wrap gap-4">
            <Magnetic to="/services">Explore Our Solutions</Magnetic>
            <Magnetic to="/about-us" variant="ghost">Discover TAC</Magnetic>
          </motion.div>

          <motion.dl initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.1, duration: 1 }} className="mt-10 flex gap-8 border-t border-white/10 pt-6 sm:gap-12">
            {[[String(company.established), 'Established'], [`${company.projects}+`, 'Projects completed'], [`${company.years}+`, 'Years of experience']].map(([v, l]) => (
              <div key={l}><dt className="sr-only">{l}</dt><dd className="font-display text-2xl font-light text-white sm:text-3xl">{v}</dd><dd className="mt-1 text-[0.7rem] uppercase tracking-[0.16em] text-silver">{l}</dd></div>
            ))}
          </motion.dl>
        </div>

        {/* living blueprint */}
        <div className="relative mx-auto w-full max-w-[420px] sm:max-w-[470px] lg:col-span-6 lg:w-[min(100%,calc((100svh-290px)*0.743))] lg:max-w-none lg:justify-self-end" style={{ perspective: 1200 }}>
          <motion.div style={{ rotateX: rx, rotateY: ry, aspectRatio: `${W} / ${H}` }} className="relative w-full">
            <Building reduced={reduced} />
            {chips.map((c, i) => (
              <motion.div key={c.k} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 3 + i * 0.25, duration: 0.6 }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 ${c.mobile ? '' : 'hidden sm:block'}`} style={{ left: `${(c.cx / W) * 100}%`, top: `${(c.cy / H) * 100}%` }}>
                <div className="glass whitespace-nowrap rounded-xl border border-cyan/30 px-3 py-2 shadow-lg shadow-black/30">
                  <div className="flex items-center gap-2 font-display text-[0.7rem] tracking-[0.18em] text-cyan"><span className="hud-dot h-1.5 w-1.5 rounded-full bg-cyan" />{c.k}</div>
                  <div className="mt-0.5 text-xs text-white">{c.v}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
          <p className="mt-2 text-center text-[0.7rem] uppercase tracking-[0.2em] text-slate lg:text-right">Illustrative system view</p>
        </div>
      </motion.div>

      {/* service ticker */}
      <div className="relative border-y border-white/10 bg-midnight/60 py-3.5 backdrop-blur" aria-hidden>
        <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
          <div className={`marquee-track flex shrink-0 gap-10 pr-10 ${reduced ? '!animate-none' : ''}`}>
            {[...ticker, ...ticker].map((t, i) => (
              <span key={i} className="flex items-center gap-10 whitespace-nowrap font-display text-xs uppercase tracking-[0.22em] text-silver">{t}<span className="h-1 w-1 rounded-full bg-cyan" /></span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

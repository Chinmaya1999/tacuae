// Homepage hero: a full-screen smart-home simulation. One control panel shows at a time.
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import { Clock, CloudSun, LayoutGrid, Mic, Minus, Plus, RotateCcw, Sparkles, Video, type LucideIcon } from 'lucide-react'
import { hasWebGL, isSoftwareGL } from '../../../shared/lib/webgl'
import { isCoarse, usePrefersReduced } from '../../../shared/lib/useReducedMotion'
import { useHome } from './store'
import { VIEWS, type View } from './data/home'
import { isDark, type Weather } from './engine/automation'
import type { CameraApi, Insets } from './scene/HomeCanvas'
import { Activity, Glance, HomeDetails, Notices } from './ui/Status'
import Rooms from './ui/Rooms'
import Voice from './ui/Voice'
import { DayAndWeather, Moods, Timeline } from './ui/Controls'
import { chip, panel } from './ui/shared'

const HomeCanvas = lazy(() => import('./scene/HomeCanvas'))
const NONE: Insets = { left: 0, top: 0, bottom: 0 }
const skyFor = (min: number, weather: Weather) => isDark(min) ? 'linear-gradient(#050818,#141b45 55%,#2a2260)'
  : weather === 'rainy' ? 'linear-gradient(#39455c,#66748f 55%,#8d9ab0)' : weather === 'cold' ? 'linear-gradient(#46607f,#8ea6c2 55%,#d5dfea)'
    : min < 450 || min > 1020 ? 'linear-gradient(#1e2a5e,#8a5a8a 50%,#f0a06c)' : weather === 'hot' ? 'linear-gradient(#3f7fc4,#a9c8da 50%,#f6d79c)' : 'linear-gradient(#1d56a8,#5ca2e4 55%,#bfe0ff)'

const TABS: { id: Tab; name: string; hint: string; icon: LucideIcon }[] = [
  { id: 'day', name: 'Daily routine', hint: 'Watch it run itself', icon: Clock },
  { id: 'voice', name: 'Voice', hint: 'Just ask', icon: Mic },
  { id: 'moods', name: 'Moods', hint: 'One touch scenes', icon: Sparkles },
  { id: 'rooms', name: 'Rooms', hint: 'Control by hand', icon: LayoutGrid },
  { id: 'weather', name: 'Weather & more', hint: 'Climate and energy', icon: CloudSun },
]
type Tab = 'day' | 'voice' | 'moods' | 'rooms' | 'weather'

export default function SmartHomeHero() {
  const reduced = usePrefersReduced()
  const ref = useRef<HTMLElement>(null), inView = useInView(ref, { margin: '100px' })
  const min = useHome((s) => s.min), weather = useHome((s) => s.weather), view = useHome((s) => s.view), playing = useHome((s) => s.playing), speed = useHome((s) => s.speed), mode = useHome((s) => s.mode)
  const step = useHome((s) => s.step), look = useHome((s) => s.look)
  const [tab, setTab] = useState<Tab>('day')
  const [ready, setReady] = useState(false), webgl = useRef(true), camera = useRef<CameraApi | null>(null)
  // how much of the screen the text and controls cover, so the camera frames the house in the free space
  const intro = useRef<HTMLElement>(null), dock = useRef<HTMLDivElement>(null), [insets, setInsets] = useState<Insets>(NONE)
  useEffect(() => {
    const text = intro.current!, controls = dock.current!
    // a resize can still arrive while the page is being left, so work from the elements held here
    const measure = () => { if (text.isConnected) setInsets(window.innerWidth < 1024 ? NONE : { left: text.offsetWidth - 20, top: 135, bottom: controls.offsetHeight + 16 }) }
    const watch = new ResizeObserver(measure)
    watch.observe(text); watch.observe(controls); window.addEventListener('resize', measure)
    return () => { watch.disconnect(); window.removeEventListener('resize', measure) }
  }, [])

  // the page text appears first, then the 3D house loads
  useEffect(() => { webgl.current = hasWebGL(); const t = setTimeout(() => setReady(true), 200); return () => clearTimeout(t) }, [])
  useEffect(() => {
    if (!playing || reduced || !inView) return
    const t = setInterval(step, speed === 'story' ? 5500 : 1000)
    return () => clearInterval(t)
  }, [playing, speed, reduced, inView, step])

  const open = (id: Tab) => {
    setTab(id)
    document.getElementById('home-controls')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' })
    if (id === 'voice') setTimeout(() => document.querySelector<HTMLInputElement>('#home-controls input[aria-label="Command for the home"]')?.focus(), 120)
  }

  return (
    <section ref={ref} aria-label="Interactive smart home" data-mode={mode} data-view={view} className="relative isolate flex flex-col bg-midnight lg:block lg:h-[100svh] lg:min-h-[720px] lg:overflow-hidden">
      {/* the house fills the whole screen behind everything on large screens; on phones it sits under the headline */}
      <div className="relative order-2 h-[56svh] min-h-[360px] overflow-hidden lg:absolute lg:inset-0 lg:-z-10 lg:h-auto">
        <div aria-hidden className="absolute inset-0 -z-10 transition-[background] duration-[1800ms]" style={{ background: skyFor(min, weather) }} />
        {webgl.current && ready
          ? <Suspense fallback={<Poster />}><div className="absolute inset-0"><HomeCanvas api={camera} insets={insets} running={inView} still={reduced} rich={!isCoarse() && !isSoftwareGL()} slow={isSoftwareGL()} /></div></Suspense>
          : <Poster note={ready ? 'Your browser cannot show the 3D home. The controls still run the simulation.' : undefined} />}
        {/* keeps the text readable over a bright sky */}
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(11,16,32,.92)_0%,rgba(11,16,32,.65)_22%,rgba(11,16,32,0)_44%)] lg:block" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-midnight/85 to-transparent" />
      </div>

      {/* camera */}
      <div className="relative z-10 order-3 mx-3 mt-3 flex justify-end gap-2 lg:absolute lg:right-5 lg:top-28 lg:m-0">
        <label className={`${panel} flex items-center gap-2 px-3 py-1.5 text-xs`}><Video size={14} aria-hidden className="text-accent" />
          <select aria-label="Camera view" value={view} onChange={(e) => look(e.target.value as View)} className="bg-transparent font-semibold outline-none [&>option]:text-black">{VIEWS.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></label>
        <div className={`${panel} flex gap-1 p-1`}><button type="button" aria-label="Zoom in" className={chip(false)} onClick={() => camera.current?.zoom(0.82)}><Plus size={14} aria-hidden /></button><button type="button" aria-label="Zoom out" className={chip(false)} onClick={() => camera.current?.zoom(1.22)}><Minus size={14} aria-hidden /></button><button type="button" aria-label="Reset view" className={chip(false)} onClick={() => camera.current?.reset()}><RotateCcw size={14} aria-hidden /></button></div>
      </div>

      {/* headline, status and what just happened */}
      <header ref={intro} className="relative z-10 order-1 flex flex-col items-start gap-3 px-5 pb-4 pt-24 md:px-10 lg:absolute lg:left-0 lg:top-24 lg:w-[400px] lg:p-0 lg:pl-8 xl:w-[460px] xl:pl-12">
        <p className="eyebrow">Intelligent living · Live simulation</p>
        <h1 className="font-display text-[2.1rem] font-bold leading-[1.08] tracking-tight [text-shadow:0_2px_24px_rgba(0,0,0,.5)] sm:text-4xl lg:text-[2.6rem] xl:text-5xl">Your Home. Your Intelligence.</h1>
        <p className="max-w-md text-sm text-white/85 sm:text-base">A home that adapts to your day, your weather and your voice. Try it below.</p>
        <div className="flex flex-wrap gap-2.5">
          <button type="button" onClick={() => { look('cutaway'); open('rooms') }} className="btn btn-primary">Explore smart home</button>
          <button type="button" onClick={() => open('voice')} className="btn btn-ghost">Try voice control</button>
        </div>
        <div className="mt-1 flex w-full max-w-md flex-col items-start gap-2"><Glance /><Notices /><Activity /></div>
      </header>

      {/* choose how to control it */}
      <div ref={dock} id="home-controls" className={`${panel} relative z-10 order-4 m-3 scroll-mt-24 lg:absolute lg:inset-x-5 lg:bottom-4 lg:m-0 lg:mr-[72px]`}>
        <div role="tablist" aria-label="Ways to control the home" className="rail flex overflow-x-auto border-b border-white/10 p-1.5">
          {TABS.map((t) => <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} aria-label={t.name} onClick={() => setTab(t.id)} className={`flex min-w-max flex-1 items-center justify-center gap-2.5 rounded-xl px-3 py-2 text-left transition ${tab === t.id ? 'bg-primary text-white shadow-md shadow-primary/30' : 'text-silver hover:bg-white/5 hover:text-white'}`}><t.icon size={17} aria-hidden /><span><span className="block text-sm font-semibold leading-tight">{t.name}</span><span className="hidden text-[0.68rem] opacity-70 2xl:block">{t.hint}</span></span></button>)}
        </div>
        <div role="tabpanel" aria-label={TABS.find((t) => t.id === tab)!.name} className="p-3 lg:max-h-[11rem] lg:overflow-y-auto" data-lenis-prevent>
          {tab === 'day' && <Timeline />}{tab === 'voice' && <Voice />}{tab === 'moods' && <Moods />}{tab === 'rooms' && <Rooms />}
          {tab === 'weather' && <div className="space-y-3"><DayAndWeather /><HomeDetails /></div>}
        </div>
      </div>
    </section>
  )
}

const Poster = ({ note }: { note?: string }) => (
  <div className="absolute inset-0 grid place-items-center">
    {note ? <p className="max-w-sm rounded-xl bg-midnight/80 p-4 text-center text-sm text-silver">{note}</p> : <span role="status" className="flex flex-col items-center gap-3 text-sm text-white/80"><span aria-hidden className="h-9 w-9 animate-spin rounded-full border-2 border-white/25 border-t-white" />Building your smart home…</span>}
  </div>
)

// Automation timeline, mood presets, day/night and weather controls.
import { BookOpen, Film, Focus, Heart, Home, Moon, PartyPopper, Pause, Play, Sofa, Sun, Sunrise, Sunset, CloudSun, type LucideIcon } from 'lucide-react'
import { useHome } from '../store'
import { MOODS, SCHEDULE } from '../data/schedule'
import { clock } from '../engine/automation'
import { WEATHER } from './Status'
import { chip } from './shared'

const ICONS: Record<string, LucideIcon> = { relax: Sofa, movie: Film, romantic: Heart, party: PartyPopper, focus: Focus, reading: BookOpen, sleep: Moon, welcome: Home }
const TIMES: [string, number, LucideIcon][] = [['Sunrise', 6 * 60 + 3, Sunrise], ['Morning', 7 * 60, CloudSun], ['Afternoon', 13 * 60, Sun], ['Sunset', 18 * 60 + 40, Sunset], ['Night', 22 * 60, Moon]]

export function Timeline() {
  const min = useHome((s) => s.min), playing = useHome((s) => s.playing), setTime = useHome((s) => s.setTime), options = useHome((s) => s.options)
  const current = [...SCHEDULE].reverse().find((r) => r.at <= min)
  return (
    <div className="space-y-3">
    <p className="text-sm text-silver">{current?.text ?? 'Press play to watch a full day, or jump to a moment.'}</p>
    <div className="rail flex gap-1.5 overflow-x-auto">
      <button type="button" aria-label={playing ? 'Pause the day' : 'Play the day'} onClick={() => options({ playing: !playing })} className={chip(playing)}>{playing ? <Pause size={14} aria-hidden /> : <Play size={14} aria-hidden />}</button>
      {SCHEDULE.filter((r) => r.mode).map((r) => <button key={r.at} type="button" aria-pressed={current?.mode === r.mode} onClick={() => setTime(r.at)} className={chip(r.at <= min && SCHEDULE.filter((x) => x.mode && x.at <= min).at(-1) === r)}><span className="tabular-nums opacity-70">{clock(r.at)}</span>{r.mode}</button>)}
    </div>
    </div>
  )
}

export function Moods() {
  const mode = useHome((s) => s.mode), mood = useHome((s) => s.mood)
  return <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{MOODS.map((m) => { const I = ICONS[m.id]; return <button key={m.id} type="button" title={m.text} aria-pressed={mode === `${m.name} mode`} onClick={() => mood(m.id)} className={`${chip(mode === `${m.name} mode`)} !py-3.5 !text-sm`}><I size={17} aria-hidden />{m.name}</button> })}</div>
}

export function DayAndWeather() {
  const min = useHome((s) => s.min), weather = useHome((s) => s.weather), speed = useHome((s) => s.speed), setTime = useHome((s) => s.setTime), weatherTo = useHome((s) => s.weatherTo), options = useHome((s) => s.options)
  return (
    <div className="space-y-2">
      <div className="rail flex items-center gap-1.5 overflow-x-auto">
        {TIMES.map(([name, at, I]) => <button key={name} type="button" aria-pressed={min === at} onClick={() => setTime(at)} className={chip(min === at)}><I size={14} aria-hidden />{name}</button>)}
        <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-white/20" />
        {WEATHER.map(([id, name, I]) => <button key={id} type="button" aria-pressed={weather === id} onClick={() => weatherTo(id)} className={chip(weather === id)}><I size={14} aria-hidden />{name}</button>)}
      </div>
      <div className="flex items-center gap-2 text-xs">
        <input type="range" min={0} max={1435} step={5} value={min} aria-label="Time of day" onChange={(e) => setTime(Number(e.target.value))} className="min-w-0 flex-1 accent-[#8b93ff]" />
        <div role="group" aria-label="Clock speed" className="flex gap-1">{([['story', 'Story'], ['live', 'Live clock']] as const).map(([id, name]) => <button key={id} type="button" aria-pressed={speed === id} onClick={() => options({ speed: id, playing: true })} className={chip(speed === id)}>{name}</button>)}</div>
      </div>
    </div>
  )
}

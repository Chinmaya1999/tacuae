// Voice assistant: microphone where the browser supports it, typed commands everywhere.
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { CheckCircle2, HelpCircle, Mic, Send, Volume2, VolumeX } from 'lucide-react'
import { useHome } from '../store'
import { chip } from './shared'

const EXAMPLES = ['Hey Home, turn on the living room lights', 'Set bedroom temperature to 23 degrees', 'Close all curtains', 'Activate movie mode', 'Switch off all lights', 'Open the garage', 'Turn on garden lights', 'Activate sleep mode', 'Good morning']
type Recognition = { lang: string; interimResults: boolean; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void; onend: () => void; onerror: (e: { error: string }) => void; start: () => void; abort: () => void }
const speechApi = () => (window.isSecureContext ? ((window as unknown as Record<string, unknown>).SpeechRecognition ?? (window as unknown as Record<string, unknown>).webkitSpeechRecognition) as (new () => Recognition) | undefined : undefined)

export default function Voice() {
  const command = useHome((s) => s.command), heard = useHome((s) => s.heard)
  const [text, setText] = useState(''), [listening, setListening] = useState(false), [partial, setPartial] = useState(''), [speak, setSpeak] = useState(false), [note, setNote] = useState('')
  const mic = useRef<Recognition | null>(null), Api = speechApi()
  useEffect(() => () => { mic.current?.abort(); window.speechSynthesis?.cancel() }, [])
  const run = (said: string) => {
    if (!said.trim()) return
    const reply = command(said.trim()); setText('')
    if (speak && window.speechSynthesis) { window.speechSynthesis.cancel(); window.speechSynthesis.speak(new SpeechSynthesisUtterance(reply)) }
  }
  const listen = () => {
    if (!Api) return
    const r = (mic.current = new Api())
    r.lang = 'en-US'; r.interimResults = true
    r.onresult = (e) => { const last = e.results[e.results.length - 1]; if (last.isFinal) run(last[0].transcript); else setPartial(last[0].transcript) }
    r.onend = () => { setListening(false); setPartial('') }
    r.onerror = (e) => { if (e.error !== 'aborted') setNote('The microphone was not available. Type a command instead.') }
    setNote(''); setListening(true); r.start()
  }
  return (
    <div className="space-y-2">
      <form onSubmit={(e: FormEvent) => { e.preventDefault(); run(text) }} className="flex items-center gap-2">
        <button type="button" disabled={!Api} onClick={listening ? () => mic.current?.abort() : listen} aria-pressed={listening} aria-label={listening ? 'Stop listening' : 'Speak a command'} title={Api ? 'Your browser’s speech service processes the audio' : 'Microphone needs a supported browser on a secure (https) address'}
          className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-b from-brand to-primary text-white shadow-lg shadow-primary/40 disabled:from-white/15 disabled:to-white/10 disabled:shadow-none`}>{listening && <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-accent/60" />}<Mic size={18} aria-hidden className="relative" /></button>
        <input aria-label="Command for the home" value={listening ? partial : text} readOnly={listening} onChange={(e) => setText(e.target.value)} maxLength={90} placeholder={listening ? 'Listening…' : Api ? 'Speak, or type “activate movie mode”' : 'Type “activate movie mode”'} className="field-control !py-2 px-3.5 text-sm" />
        <button type="submit" aria-label="Send command" className={`${chip(true)} h-10 w-10`}><Send size={15} aria-hidden /></button>
        <button type="button" onClick={() => { setSpeak(!speak); window.speechSynthesis?.cancel() }} aria-pressed={speak} aria-label="Spoken replies" title="Spoken replies" className={`${chip(speak)} h-10 w-10`}>{speak ? <Volume2 size={15} aria-hidden /> : <VolumeX size={15} aria-hidden />}</button>
      </form>
      <div role="status" aria-label="Voice result" className="min-h-[1.3rem] text-xs">
        {note ? <span className="text-amber-200">{note}</span> : heard ? <span className="flex flex-wrap items-center gap-x-2">{heard.intent === 'Not recognised' || heard.intent === 'Security' ? <HelpCircle size={14} aria-hidden className="text-amber-300" /> : <CheckCircle2 size={14} aria-hidden className="text-emerald-300" />}<span className="text-slate">Heard “{heard.said}”</span><span className="rounded bg-white/10 px-1.5 font-semibold">{heard.intent}</span><span>{heard.reply}</span></span> : <span className="text-slate">Simulation only: no real device is operated.</span>}
      </div>
      <div className="rail flex gap-1.5 overflow-x-auto pb-1">{EXAMPLES.map((c) => <button key={c} type="button" onClick={() => run(c)} className={chip(false)}>“{c}”</button>)}</div>
    </div>
  )
}

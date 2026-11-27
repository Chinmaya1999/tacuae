// DEMO assistant: a scripted helper (keyword matching, English + Arabic), NOT an AI model. It edits the home
// configurator draft only after the user confirms, and every price comes from the pricing engine.
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MessageCircle, Send, X } from 'lucide-react'
import { api } from '../../../shared/lib/api'
import { useDemo } from '../lib/demo'
import { money, type HomeInput, type Pricing } from '../../quotations/lib/quote'
import { readHomeDraft, writeHomeDraft } from '../../quotations/lib/homeDraft'
import { company } from '../../../shared/data/content'

type Change = { input: HomeInput; text: string }
type Msg = { me?: boolean; text: string; change?: Change; book?: boolean }
const CATS: [string, string, RegExp, string | null][] = [
  ['curtains', 'curtains & blinds', /curtain|blind|ستائر|ستارة/i, 'motor-curtain'], ['lighting', 'lighting', /light|lamp|dimm|إضاءة|انارة|إنارة/i, 'dali-dimming'],
  ['climate', 'AC / climate', /\bac\b|air ?con|climate|thermostat|مكيف|تكييف/i, 'thermostat'], ['security', 'security', /secur|camera|lock|alarm|أمن|كاميرا|قفل/i, null],
  ['audio', 'audio', /audio|speaker|music|صوت|سماعة|موسيقى/i, 'speaker'], ['energy', 'energy monitoring', /energy|power|طاقة/i, null], ['gate', 'gate / garage', /gate|garage|بوابة|كراج/i, null],
]
const ROOMS: [RegExp, string[], string][] = [
  [/bed ?room|غرف النوم|غرفة النوم/i, ['master', 'bedroom', 'kids', 'guest'], 'all bedrooms'], [/living|المعيشة|الصالة/i, ['living'], 'the living room'],
  [/kitchen|المطبخ/i, ['kitchen'], 'the kitchen'], [/majlis|المجلس/i, ['majlis'], 'the majlis'], [/office|المكتب/i, ['office', 'study'], 'the office'],
]
const estimate = (input: HomeInput) => api<{ pricing: Pricing }>('/api/configurator/estimate', { method: 'POST', body: { kind: 'home', input } }).then((d) => d.pricing)

async function answer(text: string): Promise<Msg> {
  const draft = readHomeDraft(), input = draft.input, ar = /[؀-ۿ]/.test(text)
  const say = (en: string, a: string) => (ar ? a : en)
  const cat = CATS.find((c) => c[2].test(text)), add = /\badd\b|install|include|أضف|اضف|ركب/i.test(text), remove = /remove|delete|without|احذف|أزل|بدون/i.test(text)
  if (cat && (add || remove)) {
    const [id, label, , product] = cat, target = ROOMS.find((r) => r[0].test(text))
    const next: HomeInput = structuredClone(input)
    let what: string
    if (target && product) {
      const mine = next.rooms.filter((r) => target[1].includes(r.type))
      if (!mine.length) return { text: say(`Your design has no ${target[2].replace('all ', '')} yet. Add rooms in the configurator first.`, 'لا توجد هذه الغرفة في تصميمك بعد.') }
      const has = (await estimate(input)).rooms ?? []
      const changed = mine.filter((r) => { const q = has.find((x) => x.id === r.id)?.items.find((i) => i.productId === product)?.qty ?? 0; if (add ? q > 0 : q === 0) return false; r.adjustments[product] = (r.adjustments[product] ?? 0) + (add ? 1 : -q); return true })
      if (!changed.length) return { text: say(add ? `Those rooms already have ${label}.` : `Those rooms have no ${label}.`, 'لا يوجد تغيير مطلوب.') }
      what = `${add ? 'Add' : 'Remove'} ${label}: ${changed.map((r) => r.name).join(', ')}`
    } else {
      if (add === !!next.levels[id]) return { text: say(add ? `${label} is already in your design.` : `${label} is not in your design.`, 'لا يوجد تغيير مطلوب.') }
      if (add) next.levels[id] = 'comfort'; else delete next.levels[id]
      what = `${add ? 'Add' : 'Remove'} ${label} (whole home)`
    }
    const [before, after] = await Promise.all([estimate(input), estimate(next)])
    const diff = before.totals && after.totals ? ` Price change: ${after.totals.total >= before.totals.total ? '+' : '−'}${money(Math.abs(after.totals.total - before.totals.total))}, new total ${money(after.totals.total)}.` : ' Sign in to see prices.'
    return { text: say(`Proposed change — ${what}.${diff} Apply it?`, `التغيير المقترح: ${what}. ${after.totals ? `الإجمالي الجديد ${money(after.totals.total)}.` : ''} هل أطبقه؟`), change: { input: next, text: what } }
  }
  if (/price|cost|total|how much|كم|السعر|التكلفة/i.test(text)) {
    const p = await estimate(input)
    return { text: p.totals ? say(`Your current design: ${p.totals.deviceCount} devices, ${money(p.totals.total)} including VAT (indicative, subject to site survey).`, `تصميمك الحالي: ${p.totals.deviceCount} جهاز، ${money(p.totals.total)} شامل الضريبة (سعر تقديري).`) : say('Sign in to see prices.', 'سجّل الدخول لعرض الأسعار.') }
  }
  if (/human|expert|call|book|visit|survey|whatsapp|agent|موعد|اتصال|خبير|زيارة/i.test(text)) return { text: say(`You can book a callback, showroom visit or site survey, or call ${company.phone}.`, `يمكنك حجز موعد أو الاتصال على ${company.phone}.`), book: true }
  if (/package|essential|comfort|luxury|differen|باقة|الباقات/i.test(text)) return { text: say('Essential covers the basics, Comfort adds dimming, sensors and more control, Luxury adds the most devices per room. Step 5 of the configurator lists exactly what each one includes.', 'الأساسية تغطي الاحتياجات الأولية، والمريحة تضيف التعتيم والحساسات، والفاخرة تضيف أكبر عدد من الأجهزة.') }
  return { text: say('I can add or remove options (“add blinds to all bedrooms”), tell you the price, explain packages or help you book a visit.', 'يمكنني إضافة أو حذف خيارات (مثلاً: أضف ستائر إلى غرف النوم)، أو عرض السعر، أو حجز موعد.') }
}

export default function Assistant() {
  const demo = useDemo(), { pathname } = useLocation()
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [text, setText] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>([{ text: 'Hello! Ask me about your smart-home design. مرحباً!' }])
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }) }, [msgs, open])
  if (!demo || /^\/(admin|q|proposal|login|register)(\/|$)/.test(pathname)) return null
  const ask = async (q: string) => {
    if (!q.trim() || busy) return
    setMsgs((m) => [...m, { me: true, text: q }]); setText(''); setBusy(true)
    try { const a = await answer(q); setMsgs((m) => [...m, a]) } catch (e) { setMsgs((m) => [...m, { text: (e as Error).message }]) } finally { setBusy(false) }
  }
  const apply = (i: number, c: Change) => {
    const d = readHomeDraft(); writeHomeDraft({ step: Math.max(d.step, 7), input: c.input })
    setMsgs((m) => [...m.map((x, j) => (j === i ? { ...x, change: undefined } : x)), { text: `Done: ${c.text}. Open “Design my smart home” to see it.` }])
  }
  return (
    <div className="no-print fixed bottom-24 right-4 z-[80] text-white lg:bottom-4" data-lenis-prevent>
      {open && <section aria-label="Assistant" className="mb-3 flex h-[460px] max-h-[70vh] w-[min(370px,92vw)] flex-col rounded-2xl border border-white/15 bg-deep shadow-2xl">
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-3"><div><div className="font-display text-sm">TAC assistant</div><div className="text-xs text-amber-300">Demo — scripted, not AI</div></div><button onClick={() => setOpen(false)} aria-label="Close"><X size={18} /></button></header>
        <div className="flex-1 space-y-3 overflow-y-auto p-3 text-sm" aria-live="polite">
          {msgs.map((m, i) => <div key={i} dir="auto" className={`max-w-[88%] rounded-2xl px-3 py-2 ${m.me ? 'ml-auto bg-accent/20' : 'bg-white/5'}`}>{m.text}
            {m.change && i === msgs.length - 1 && <div className="mt-2 flex gap-2"><button className="rounded-full bg-accent px-3 py-1 text-xs text-midnight" onClick={() => apply(i, m.change!)}>Apply</button><button className="rounded-full border border-white/20 px-3 py-1 text-xs" onClick={() => setMsgs((x) => x.map((y, j) => (j === i ? { ...y, change: undefined } : y)))}>No thanks</button></div>}
            {m.book && <Link to="/book" onClick={() => setOpen(false)} className="mt-2 block text-accent underline">Book now</Link>}</div>)}
          <div ref={end} />
        </div>
        <div className="flex flex-wrap gap-1.5 px-3 pb-2">{['Add blinds to all bedrooms', 'How much is my design?', 'أضف ستائر إلى غرف النوم'].map((s) => <button key={s} dir="auto" onClick={() => ask(s)} className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-silver hover:text-accent">{s}</button>)}</div>
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); ask(text) }} className="flex gap-2 border-t border-white/10 p-3"><input aria-label="Message" dir="auto" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-accent" /><button aria-label="Send" disabled={busy} className="rounded-xl bg-accent px-3 text-midnight disabled:opacity-50"><Send size={16} /></button></form>
      </section>}
      <button onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Open the assistant" className="ml-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-brand to-primary text-white shadow-lg shadow-accent/30"><MessageCircle size={24} /></button>
    </div>
  )
}

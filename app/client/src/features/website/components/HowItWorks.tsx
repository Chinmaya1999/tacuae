import { ClipboardCheck, Cuboid, ReceiptText, Ruler } from 'lucide-react'
import { Magnetic, Reveal } from '../../../shared/components/ui'

// Mirrors the real quotation journey: configure → indicative price → TAC review and final quote → site survey.
const STEPS = [
  { icon: Cuboid, title: 'Design your space', text: 'Choose your property, rooms and the systems you want in the guided configurator.' },
  { icon: ReceiptText, title: 'See your quotation', text: 'Save an itemised, indicative quotation and share it with a secure link.' },
  { icon: ClipboardCheck, title: 'TAC reviews it', text: 'Our team reviews your request and issues the final quotation.' },
  { icon: Ruler, title: 'Site survey', text: 'Accept the quotation and TAC schedules a visit to your site.' },
]

export default function HowItWorks() {
  return (
    <section aria-labelledby="how" className="relative overflow-hidden bg-midnight py-24 md:py-32">
      <div aria-hidden className="aurora absolute inset-0" />
      <div className="container-x relative">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div><span className="eyebrow">How it works</span><h2 id="how" className="h2 mt-5 max-w-2xl">From first idea to site survey.</h2></div>
          <Magnetic to="/design-my-home">Start your design</Magnetic>
        </div>
        <ol className="mt-14 grid gap-x-6 gap-y-10 md:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="relative">
              <Reveal delay={i * 0.08}>
                {i < STEPS.length - 1 && <span aria-hidden className="absolute left-[4.5rem] right-0 top-7 hidden h-px bg-gradient-to-r from-accent/50 to-transparent md:block" />}
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand to-primary text-white shadow-[inset_-5px_-6px_12px_rgba(30,20,110,.55),inset_5px_6px_10px_rgba(255,255,255,.28),0_16px_28px_-12px_rgba(79,70,229,.9)]"><Icon size={24} aria-hidden /></span>
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-accent">Step {i + 1}</p>
                <h3 className="mt-2 text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-silver">{text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

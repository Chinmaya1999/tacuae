import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { company } from '../../../shared/data/content'

// Answers only restate what the website and its tools already say.
const ITEMS: [string, string][] = [
  ['What does TAC do?', `${company.name} is a home and building automation manufacturer, designer and integrator for hotels, airports, malls, high-rise offices, villas and apartments, since ${company.established}.`],
  ['Is the price in the configurator final?', 'No. It is an indicative quotation, subject to TAC review and a site survey. Prices appear once you sign in, or when TAC has enabled them for visitors.'],
  ['Can I share a quotation with someone else?', 'Yes. You can create a secure link so another person can view the quotation and comment, without an account.'],
  ['Who can create an account?', 'Home owners and builders can register. TAC verifies business accounts before trade or partner pricing applies.'],
  ['Do you offer KNX training?', 'Yes. Our office is a certified KNX Training Center, with the 5-day KNX Basic Course and Advanced training.'],
]

export default function Faq() {
  return (
    <section aria-labelledby="faq" className="light-section section">
      <div className="container-x grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <span className="eyebrow">FAQs</span>
          <h2 id="faq" className="h2 mt-5">Good to know.</h2>
          <p className="mt-5 text-muted">Something else? <Link to="/contact" className="font-semibold text-primary hover:underline">Ask our team</Link>.</p>
        </div>
        <div className="divide-y divide-line border-y border-line lg:col-span-8">
          {ITEMS.map(([q, a]) => (
            <details key={q} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-display text-lg font-bold [&::-webkit-details-marker]:hidden">{q}<span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-white text-primary transition group-open:rotate-45"><Plus size={16} /></span></summary>
              <p className="max-w-2xl pb-6 leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

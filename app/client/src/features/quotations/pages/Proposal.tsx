// Branded proposal, printed or saved as PDF from the browser. Opened by the owner, sales, or a secure link.
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Loader2, Printer } from 'lucide-react'
import { api } from '../../../shared/lib/api'
import { day, money, pretty, type Quote } from '../lib/quote'
import { company, projects } from '../../../shared/data/content'

export default function Proposal() {
  const { id, token } = useParams(), [q] = useSearchParams()
  const [quote, setQuote] = useState<Quote | null>(null), [err, setErr] = useState('')
  useEffect(() => {
    document.title = 'Proposal | TAC UAE'
    const url = token ? `/api/shared/${token}` : q.get('staff') ? `/api/sales/quotations/${id}` : `/api/quotations/${id}`
    api<{ item: Quote }>(url).then((d) => setQuote(d.item)).catch((e) => setErr(e.message))
  }, [id, token]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!quote) return <div className="grid min-h-screen place-items-center bg-midnight text-white">{err ? <p role="alert">{err}</p> : <Loader2 className="animate-spin text-accent" />}</div>
  const p = quote.pricing, t = p.totals, meta = quote.input?.project
  const H = ({ children }: { children: React.ReactNode }) => <h2 className="mb-3 border-b-2 border-[#6366f1] pb-1 font-display text-xl">{children}</h2>
  return (
    <div className="min-h-screen bg-[#e9edf3] py-6 text-[#101828] print:bg-white print:py-0">
      <button onClick={() => window.print()} className="no-print mx-auto mb-4 flex items-center gap-2 rounded-full bg-[#0b1020] px-5 py-2.5 text-sm text-white"><Printer size={15} />Print / save as PDF</button>
      <article className="proposal mx-auto max-w-[820px] space-y-9 bg-white p-10 shadow-xl print:max-w-none print:p-0 print:shadow-none">
        <header>
          <img src="/images/site/logo-color.png" alt={company.brand} className="h-14 w-auto" />
          <img src="/images/site/hero.jpg" alt="" className="mt-6 h-56 w-full rounded-xl object-cover" />
          <p className="mt-6 text-xs uppercase tracking-[0.2em] text-[#6366f1]">{quote.indicative ? 'Indicative proposal — subject to site survey' : 'Final proposal'}</p>
          <h1 className="mt-2 font-display text-4xl">{quote.name}</h1>
          <p className="mt-2 text-sm">{quote.ref} · version {quote.version} · {day(quote.updatedAt)}{quote.validUntil && ` · valid until ${day(quote.validUntil)}`}{quote.trn && ` · TRN ${quote.trn}`}</p>
          {(quote.owner?.name || quote.preparedFor) && <p className="text-sm">Prepared for {quote.owner?.name || quote.preparedFor}</p>}
        </header>
        <section><H>About Total Automation</H><p className="text-sm leading-relaxed">{company.name} has delivered home and building automation since {company.established}, with more than 600 projects across the Middle East. TAC is a KNX distributor, manufacturer and certified training center.</p></section>
        <section><H>Scope</H>
          <p className="text-sm">{quote.kind === 'project' ? [meta?.name, pretty(meta?.type ?? ''), meta?.location, meta?.stage].filter(Boolean).join(' · ') : [pretty(quote.input.homeType), quote.input.areaSqft && `${quote.input.areaSqft} sq ft`, pretty(quote.input.connectivity), quote.input.community, quote.input.emirate].filter(Boolean).join(' · ')}</p>
          <ul className="mt-2 list-disc pl-5 text-sm">{quote.kind === 'project' ? p.unitTypes?.map((u) => <li key={u.id}>{u.quantity} × {u.name}{u.phase && ` (${u.phase})`}</li>) : p.rooms?.map((r) => <li key={r.id}>{r.name}: {r.items.reduce((n, i) => n + i.qty, 0)} devices</li>)}</ul>
          {meta?.buildingSystems && <p className="mt-2 text-sm">Building systems: {meta.buildingSystems}</p>}
        </section>
        <section><H>Bill of quantities</H><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="py-1">Item</th><th>Category</th><th className="text-right">Qty</th><th className="text-right">Amount (ex VAT)</th></tr></thead>
          <tbody>{p.lines.map((l) => <tr key={l.productId} className="border-b border-[#e3e8ef]"><td className="py-1">{l.name}</td><td>{l.group}</td><td className="text-right">{l.qty}</td><td className="text-right">{l.unit !== undefined && money((l.unit + (l.accessory ?? 0) + (l.install ?? 0)) * l.qty)}</td></tr>)}</tbody></table></section>
        {t && <section className="break-inside-avoid"><H>Price summary</H><dl className="ml-auto max-w-sm space-y-1 text-sm">
          {([['Equipment and installation', t.devices + t.accessories + t.installation], ['Cabling, programming and commissioning', t.cabling + t.programming + t.commissioning], ['Discounts', -(t.volumeDiscount + t.discount)], ['Annual maintenance', t.amc], ['VAT', t.vat]] as const).filter(([, v]) => v !== 0).map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt>{k}</dt><dd>{v < 0 ? '−' : ''}{money(Math.abs(v))}</dd></div>)}
          <div className="flex justify-between border-t-2 border-[#101828] pt-2 font-display text-lg"><dt>Total</dt><dd>{money(t.total)}</dd></div></dl></section>}
        <section className="break-inside-avoid"><H>Selected TAC projects</H><div className="grid grid-cols-3 gap-3">{projects.slice(0, 3).map((x) => <figure key={x.slug}><img src={x.image} alt="" className="h-28 w-full rounded-lg object-cover" /><figcaption className="mt-1 text-xs"><b>{x.name}</b><br />{x.location}</figcaption></figure>)}</div></section>
        <footer className="border-t pt-4 text-xs leading-relaxed">{quote.terms && <p className="whitespace-pre-wrap">{quote.terms}</p>}{quote.exclusions && <p>Exclusions: {quote.exclusions}</p>}<p className="mt-2">{company.name} · {company.address} · {company.phone} · {company.email}</p></footer>
      </article>
    </div>
  )
}

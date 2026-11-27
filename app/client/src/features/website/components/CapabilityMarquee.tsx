import { services } from '../../../shared/data/content'

const items = [...new Set(services.filter((s) => s.slug !== 'knx-training').flatMap((s) => s.capabilities))]
const Row = ({ list, reverse }: { list: string[]; reverse?: boolean }) => (
  <div className="flex w-max gap-3 marquee" style={reverse ? { animationDirection: 'reverse' } : undefined}>
    {[0, 1].map((copy) => <ul key={copy} aria-hidden={copy === 1 || reverse} className="flex gap-3">{list.map((c) => <li key={c} className="flex items-center gap-2.5 whitespace-nowrap rounded-full border border-white/12 bg-white/[.04] px-5 py-2.5 font-display text-sm font-semibold text-silver"><span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-accent to-violet" />{c}</li>)}</ul>)}
  </div>
)

/** Everything TAC automates, drifting past in two directions. */
export default function CapabilityMarquee() {
  const half = Math.ceil(items.length / 2)
  return (
    <section aria-label="What we automate" className="overflow-hidden border-y border-white/10 bg-deep py-6 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
      <div className="space-y-3"><Row list={items.slice(0, half)} /><Row list={items.slice(half)} reverse /></div>
    </section>
  )
}

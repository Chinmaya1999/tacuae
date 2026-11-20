import { useMemo, useState } from 'react'
import { PageHero, CtaBand, ProductCard } from '../components/ui'
import { Reveal } from '../components/motion'
import { products } from '../data/content'
import { useSeo } from '../lib/seo'

export default function Products() {
  useSeo('Products', 'KNX products from TAC UAE – ThinKnx servers, Audiofy multiroom audio, KNX power supplies, DALI gateway, actuators, interfaces and KNX cable.', '/products')
  const cats = useMemo(() => ['All', ...Array.from(new Set(products.map((p) => p.category)))], [])
  const [cat, setCat] = useState('All')
  const list = products.filter((p) => cat === 'All' || p.category === cat)
  return (
    <>
      <PageHero eyebrow="Products" title="A proud distributor and manufacturer of KNX." lead="Our products streamline and simplify all the technology in your home, offering the ultimate lifestyle of comfort and convenience." crumbs={[{ label: 'Products' }]} />
      <section className="light relative py-20 md:py-28">
        <div className="bp-grid pointer-events-none absolute inset-0 opacity-70" />
        <div className="wrap relative">
          <div role="group" aria-label="Filter products" className="mb-10 flex flex-wrap gap-2">
            {cats.map((c) => (
              <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c} className={`rounded-full border px-5 py-2.5 text-xs font-medium uppercase tracking-wider transition ${cat === c ? 'border-midnight bg-midnight text-white' : 'border-midnight/20 text-midnight hover:border-intel hover:text-intel'}`}>{c}</button>
            ))}
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((p, i) => <Reveal key={p.slug} delay={(i % 4) * 0.06}><ProductCard p={p} className="h-full" /></Reveal>)}
          </div>
        </div>
      </section>
      <CtaBand title="Need help choosing?" text="Talk to our team about the right KNX products for your project." cta="Contact Us" />
    </>
  )
}

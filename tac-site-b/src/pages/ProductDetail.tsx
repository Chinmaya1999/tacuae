import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { PageHero, ProductCard, CtaBand } from '../components/ui'
import { Magnetic, Reveal } from '../components/motion'
import Img from '../components/Img'
import { productBySlug, products } from '../data/content'
import { useSeo } from '../lib/seo'

export default function ProductDetail() {
  const { slug = '' } = useParams()
  const p = productBySlug(slug)
  useSeo(p?.title ?? 'Product', p?.paragraphs[0] ?? '', `/products/${slug}`, p ? `/img/${p.image}-361.webp` : undefined,
    p && { '@context': 'https://schema.org', '@type': 'Product', name: p.title, description: p.paragraphs.join(' '), image: `https://www.tacuae.com/img/${p.image}-361.webp`, category: p.category })
  if (!p) return <Navigate to="/products" replace />
  const i = products.findIndex((x) => x.slug === p.slug)
  const next = products[(i + 1) % products.length]
  const more = products.filter((x) => x.slug !== p.slug && x.category === p.category).concat(products.filter((x) => x.slug !== p.slug && x.category !== p.category)).slice(0, 4)
  return (
    <>
      <PageHero eyebrow={p.category} title={p.title} crumbs={[{ label: 'Products', to: '/products' }, { label: p.title }]} />
      <section className="pb-24 md:pb-32">
        <div className="wrap grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <div className="grid place-items-center rounded-3xl border border-white/10 bg-[#eaf4fd] p-6 md:p-10">
              <Img name={p.image} alt={p.title} priority sizes="361px" className="aspect-[361/278] w-full max-w-[361px] rounded-xl object-cover shadow-xl shadow-midnight/20" />
            </div>
          </Reveal>
          <div className="lg:col-span-7">
            <div className="space-y-5">{p.paragraphs.map((t) => <Reveal key={t}><p className="lead">{t}</p></Reveal>)}</div>
            <Reveal delay={0.1} className="mt-10 rounded-2xl border border-white/10 bg-tech/70 p-7">
              <h2 className="eyebrow mb-5">Key information</h2>
              <ul className="grid gap-3 sm:grid-cols-2">{p.facts.map((f) => <li key={f} className="flex items-start gap-3 text-sm text-silver"><Check size={16} className="mt-0.5 shrink-0 text-cyan" />{f}</li>)}</ul>
            </Reveal>
            <Reveal delay={0.15} className="mt-10 flex flex-wrap gap-4">
              <Magnetic><Link to={`/contact?service=products#enquiry`} className="btn btn-primary">Enquire about this product <ArrowRight size={16} /></Link></Magnetic>
              <Link to="/products" className="btn btn-ghost"><ArrowLeft size={16} />All products</Link>
            </Reveal>
          </div>
        </div>
      </section>
      <section className="light py-20 md:py-28">
        <div className="wrap">
          <div className="mb-10 flex items-end justify-between"><h2 className="font-display text-2xl font-semibold text-midnight md:text-3xl">More products</h2><Link to={`/products/${next.slug}`} className="link-arrow">Next: {next.title} <ArrowRight size={14} /></Link></div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{more.map((x) => <ProductCard key={x.slug} p={x} />)}</div>
        </div>
      </section>
      <CtaBand />
    </>
  )
}

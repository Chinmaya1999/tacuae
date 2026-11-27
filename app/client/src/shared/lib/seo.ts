import { useEffect } from 'react'
import { company } from '../data/content'

function setMeta(key: 'name' | 'property', name: string, val: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${key}="${name}"]`)
  if (!el) { el = document.createElement('meta'); el.setAttribute(key, name); document.head.appendChild(el) }
  el.setAttribute('content', val)
}

export function useSeo(title: string, description: string, path: string, jsonLd?: object) {
  useEffect(() => {
    document.title = title
    setMeta('name', 'description', description)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:url', company.site + path)
    setMeta('property', 'og:image', company.site + '/images/site/hero.jpg')
    setMeta('name', 'twitter:card', 'summary_large_image')
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link) }
    link.href = company.site + path
    document.getElementById('ld-json')?.remove()
    if (jsonLd) {
      const s = document.createElement('script')
      s.type = 'application/ld+json'; s.id = 'ld-json'; s.text = JSON.stringify(jsonLd)
      document.head.appendChild(s)
    }
  }, [title, description, path, jsonLd])
}

export const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: company.name,
  alternateName: company.brand,
  url: company.site,
  logo: company.site + company.logo,
  email: company.email,
  telephone: company.phone,
  foundingDate: String(company.established),
  address: { '@type': 'PostalAddress', streetAddress: 'Suite 506, Le Solarium Business Tower, Dubai Silicon Oasis', addressLocality: 'Dubai', addressCountry: 'AE' },
  sameAs: [company.facebook],
}

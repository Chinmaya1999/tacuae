import { useEffect } from 'react'

const SITE = 'https://www.tacuae.com'
function setMeta(sel: string, attr: string, key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(sel)
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el) }
  el.content = content
}
export function useSeo(title: string, description: string, path: string, image = '/og.jpg', jsonLd?: object) {
  useEffect(() => {
    const full = title.includes('TAC') ? title : `${title} | TAC UAE`
    document.title = full
    setMeta('meta[name="description"]', 'name', 'description', description)
    setMeta('meta[property="og:title"]', 'property', 'og:title', full)
    setMeta('meta[property="og:description"]', 'property', 'og:description', description)
    setMeta('meta[property="og:url"]', 'property', 'og:url', SITE + path)
    setMeta('meta[property="og:image"]', 'property', 'og:image', image.startsWith('http') ? image : SITE + image)
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link) }
    link.href = SITE + path
    let ld = document.getElementById('page-jsonld')
    if (jsonLd) {
      if (!ld) { ld = document.createElement('script'); ld.id = 'page-jsonld'; ld.setAttribute('type', 'application/ld+json'); document.head.appendChild(ld) }
      ld.textContent = JSON.stringify(jsonLd)
    } else ld?.remove()
  }, [title, description, path, image, jsonLd])
}

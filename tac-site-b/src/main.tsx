import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'

// Analytics only loads when a GA4 measurement ID is configured at build time (VITE_GA_ID).
const ga = import.meta.env.VITE_GA_ID as string | undefined
if (ga) {
  const w = window as unknown as { dataLayer: unknown[]; gtag: (...a: unknown[]) => void }
  const s = document.createElement('script'); s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${ga}`
  document.head.appendChild(s)
  w.dataLayer = w.dataLayer || []
  w.gtag = function (...a: unknown[]) { w.dataLayer.push(a) }
  w.gtag('js', new Date()); w.gtag('config', ga)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><BrowserRouter><App /></BrowserRouter></StrictMode>,
)

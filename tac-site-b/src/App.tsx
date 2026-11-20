import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Nav from './components/Nav'
import Footer from './components/Footer'
import { Loader, ScrollProgress } from './components/Chrome'
import Home from './pages/Home'
import { startSmooth, scrollToTop, scrollToId } from './lib/smooth'
import { ScrollTrigger } from './lib/gsap'
import { productLegacy } from './data/content'

const About = lazy(() => import('./pages/About'))
const Services = lazy(() => import('./pages/Services'))
const ServiceDetail = lazy(() => import('./pages/ServiceDetail'))
const Products = lazy(() => import('./pages/Products'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Projects = lazy(() => import('./pages/Projects'))
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'))
const Training = lazy(() => import('./pages/Training'))
const Contact = lazy(() => import('./pages/Contact'))
const Legal = lazy(() => import('./pages/Legal'))
const NotFound = lazy(() => import('./pages/NotFound'))

/** Old Wix product URLs (/asin-products/<slug>, /asin-products-1/<slug>) → new product pages. */
function LegacyProduct() {
  const { slug = '' } = useParams()
  const p = productLegacy(slug)
  return <Navigate to={p ? `/products/${p.slug}` : '/products'} replace />
}

function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) { const t = setTimeout(() => scrollToId(hash.slice(1)), 450); return () => clearTimeout(t) }
    scrollToTop()
    const t = setTimeout(() => ScrollTrigger.refresh(), 600)
    return () => clearTimeout(t)
  }, [pathname, hash])
  return null
}

export default function App() {
  const location = useLocation()
  useEffect(() => { startSmooth() }, [])
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <Loader />
      <ScrollProgress />
      <Nav />
      <ScrollManager />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          id="main" key={location.pathname}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          <Suspense fallback={<div className="min-h-screen" />}>
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/about-us" element={<About />} />
              <Route path="/services" element={<Services />} />
              <Route path="/services/:slug" element={<ServiceDetail />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:slug" element={<ProjectDetail />} />
              <Route path="/knx-training" element={<Training />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy-policy" element={<Legal kind="privacy" />} />
              <Route path="/terms" element={<Legal kind="terms" />} />
              <Route path="/asin-products/:slug" element={<LegacyProduct />} />
              <Route path="/asin-products-1/:slug" element={<LegacyProduct />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </motion.main>
      </AnimatePresence>
      <Footer />
    </>
  )
}

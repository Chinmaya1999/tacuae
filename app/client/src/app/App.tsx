import { Link, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import ClayScene from '../shared/components/ClayScene'
import Layout from '../shared/components/Layout'
import Home from '../features/website/pages/Home'
import { lazy, Suspense, type ComponentType } from 'react'
import { AuthProvider } from '../features/auth/lib/auth'
import DemoBar from '../features/demo/components/DemoBar'

const Configurator = lazy(() => import('../features/quotations/pages/Configurator'))
const ProjectQuote = lazy(() => import('../features/quotations/pages/ProjectQuote'))
const SharedQuote = lazy(() => import('../features/quotations/pages/SharedQuote'))
const Simulation = lazy(() => import('../features/website/pages/Simulation'))
const Booking = lazy(() => import('../features/website/pages/Booking'))
const Proposal = lazy(() => import('../features/quotations/pages/Proposal'))
const Assistant = lazy(() => import('../features/demo/components/Assistant'))
const L = (k: string) => lazy(() => import('../features/website/pages/Inner').then((m) => ({ default: (m as unknown as Record<string, ComponentType<any>>)[k] })))
const Admin = lazy(() => import('../features/admin/pages/Admin'))
const Dashboard = lazy(() => import('../features/dashboard/pages/Dashboard'))
const Login = lazy(() => import('../features/auth/pages/Auth').then((m) => ({ default: m.Login })))
const Register = lazy(() => import('../features/auth/pages/Auth').then((m) => ({ default: m.Register })))
const P = { About: L('About'), Services: L('Services'), ServiceDetail: L('ServiceDetail'), Products: L('Products'), ProductDetail: L('ProductDetail'), Projects: L('Projects'), ProjectDetail: L('ProjectDetail'), Training: L('Training'), Contact: L('Contact'), Legal: L('Legal') }

const NotFound = () => (
  <div className="aurora container-x grid min-h-[80vh] place-items-center pb-20 pt-32 text-center">
    <div className="grid justify-items-center">
      <ClayScene className="w-[min(100%,360px)]" />
      <h1 className="h2 mt-6">Page not found</h1>
      <p className="mt-3 max-w-md text-silver">The address may be mistyped, or the page has moved.</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3"><Link to="/" className="btn btn-primary">Back home</Link><Link to="/contact" className="btn btn-ghost">Contact TAC</Link></div>
    </div>
  </div>
)
const PageLoading = () => <div role="status" aria-label="Loading" className="grid min-h-screen place-items-center bg-midnight"><span className="h-9 w-9 animate-spin rounded-full border-2 border-accent/25 border-t-accent" /></div>
const LegacyProduct = () => { const { slug } = useParams(); return <Navigate to={`/products/${slug}`} replace /> }

export default function App() {
  return (
    <AuthProvider>
    <MotionConfig reducedMotion="user">
    <Suspense fallback={<PageLoading />}>
    <Routes>
      <Route path="admin/*" element={<Admin />} />
      <Route path="dashboard/*" element={<Dashboard />} />
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="q/:token" element={<SharedQuote />} />
      <Route path="q/:token/proposal" element={<Proposal />} />
      <Route path="proposal/:id" element={<Proposal />} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="simulation" element={<Simulation />} />
        <Route path="book" element={<Booking />} />
        <Route path="design-my-home" element={<Configurator />} />
        <Route path="project-quote" element={<ProjectQuote />} />
        <Route path="about-us" element={<P.About />} />
        <Route path="about" element={<Navigate to="/about-us" replace />} />
        <Route path="services" element={<P.Services />} />
        <Route path="services/:slug" element={<P.ServiceDetail />} />
        <Route path="products" element={<P.Products />} />
        <Route path="products/:slug" element={<P.ProductDetail />} />
        <Route path="asin-products/:slug" element={<LegacyProduct />} />
        <Route path="asin-products-1/:slug" element={<LegacyProduct />} />
        <Route path="projects" element={<P.Projects />} />
        <Route path="projects/:slug" element={<P.ProjectDetail />} />
        <Route path="training" element={<P.Training />} />
        <Route path="contact" element={<P.Contact />} />
        <Route path="privacy" element={<P.Legal kind="privacy" />} />
        <Route path="terms" element={<P.Legal kind="terms" />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
    </Suspense>
    <Suspense fallback={null}><Assistant /></Suspense>
    <DemoBar />
    </MotionConfig>
    </AuthProvider>
  )
}

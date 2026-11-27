import { Navigate, Route, Routes, useParams } from 'react-router-dom'
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

const NotFound = () => <div className="grid min-h-[70vh] place-items-center pt-32 text-center"><div><h1 className="display">404</h1><a href="/" className="btn btn-primary mt-8">Back home</a></div></div>
const LegacyProduct = () => { const { slug } = useParams(); return <Navigate to={`/products/${slug}`} replace /> }

export default function App() {
  return (
    <AuthProvider>
    <Suspense fallback={<div className="min-h-screen" />}>
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
    </AuthProvider>
  )
}

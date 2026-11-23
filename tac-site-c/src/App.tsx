import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import { lazy, Suspense, type ComponentType } from 'react'
import { AuthProvider } from './lib/auth'

const L = (k: string) => lazy(() => import('./pages/Inner').then((m) => ({ default: (m as unknown as Record<string, ComponentType<any>>)[k] })))
const Admin = lazy(() => import('./pages/Admin'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Login = lazy(() => import('./pages/Auth').then((m) => ({ default: m.Login })))
const Register = lazy(() => import('./pages/Auth').then((m) => ({ default: m.Register })))
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
      <Route element={<Layout />}>
        <Route index element={<Home />} />
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
    </AuthProvider>
  )
}

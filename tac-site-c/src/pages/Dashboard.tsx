import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { homeFor, useAuth } from '../lib/auth'
import Shell from '../components/dashboard/Shell'
import { DesignsProvider } from './dashboard/useDesigns'
import Home from './dashboard/Home'
import Designs from './dashboard/Designs'
import Studio from './dashboard/Studio'

/** Customer / builder area: /dashboard (home), /dashboard/designs, /dashboard/quotes, /dashboard/design/:id (studio). */
export default function Dashboard() {
  const { user, loading } = useAuth()
  useEffect(() => {
    document.title = 'My dashboard | TAC UAE'
    const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex, nofollow'; document.head.appendChild(m)
    return () => m.remove()
  }, [])
  if (loading) return <div className="grid min-h-screen place-items-center bg-midnight"><Loader2 className="animate-spin text-cyan" /></div>
  if (!user) return <Navigate to="/login?next=/dashboard" replace />
  if (user.role === 'admin') return <Navigate to={homeFor('admin')} replace />
  const builder = user.role === 'builder'
  return (
    <DesignsProvider>
      <Routes>
        <Route element={<Shell builder={builder} />}>
          <Route index element={<Home builder={builder} />} />
          <Route path="designs" element={<Designs builder={builder} mode="all" />} />
          <Route path="quotes" element={<Designs builder={builder} mode="quotes" />} />
        </Route>
        <Route path="design/:id" element={<Studio builder={builder} />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DesignsProvider>
  )
}

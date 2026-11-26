import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { homeFor, isStaffRole, useAuth } from '../lib/auth'
import Shell from '../components/dashboard/Shell'
import { DesignsProvider } from './dashboard/useDesigns'
import Home from './dashboard/Home'
import Designs from './dashboard/Designs'
import Studio from './dashboard/Studio'
import BmsHome from './bms/BmsHome'
import ProjectsList from './bms/ProjectsList'
import ProjectWizard from './bms/ProjectWizard'
import BuilderAlarms from './bms/BuilderAlarms'
import ProjectPage from './bms/ProjectPage'
import { Appointments, Team } from './dashboard/Extras'
import { QuotationDetail, QuotationList } from './dashboard/Quotations'

/** Customer / builder area. Customers: home, designs, quotes, studio. Builders also get the building-management portal: projects, alarms, 3D digital twin. */
export default function Dashboard() {
  const { user, loading } = useAuth()
  useEffect(() => {
    document.title = 'My dashboard | TAC UAE'
    const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex, nofollow'; document.head.appendChild(m)
    return () => m.remove()
  }, [])
  if (loading) return <div className="grid min-h-screen place-items-center bg-midnight"><Loader2 className="animate-spin text-cyan" /></div>
  if (!user) return <Navigate to="/login?next=/dashboard" replace />
  if (isStaffRole(user.role)) return <Navigate to={homeFor(user.role)} replace />
  const builder = user.role === 'builder'
  return (
    <DesignsProvider>
      <Routes>
        <Route element={<Shell builder={builder} />}>
          <Route index element={builder ? <BmsHome /> : <Home builder={builder} />} />
          {builder && <Route path="projects" element={<ProjectsList />} />}
          {builder && <Route path="projects/new" element={<ProjectWizard />} />}
          {builder && <Route path="alarms" element={<BuilderAlarms />} />}
          <Route path="appointments" element={<Appointments />} />
          {builder && <Route path="team" element={<Team />} />}
          <Route path="quotations" element={<QuotationList builder={builder} />} />
          <Route path="quotations/:id" element={<QuotationDetail />} />
          <Route path="designs" element={<Designs builder={builder} mode="all" />} />
          <Route path="quotes" element={<Designs builder={builder} mode="quotes" />} />
        </Route>
        {builder && <Route path="projects/:id" element={<ProjectPage />} />}
        <Route path="design/:id" element={<Studio builder={builder} />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DesignsProvider>
  )
}

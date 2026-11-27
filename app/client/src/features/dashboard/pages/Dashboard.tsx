import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { homeFor, isStaffRole, useAuth } from '../../auth/lib/auth'
import Shell from '../components/Shell'
import { DesignsProvider } from './useDesigns'
import Home from './Home'
import Designs from './Designs'
import Studio from './Studio'
import BmsHome from '../../bms/pages/BmsHome'
import ProjectsList from '../../bms/pages/ProjectsList'
import ProjectWizard from '../../bms/pages/ProjectWizard'
import BuilderAlarms from '../../bms/pages/BuilderAlarms'
import ProjectPage from '../../bms/pages/ProjectPage'
import Profile from './Profile'
import { Appointments, Team } from './Extras'
import { QuotationDetail, QuotationList } from './Quotations'

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
          <Route path="profile" element={<Profile />} />
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

import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import CoursesPage from './pages/CoursesPage'
import CourseDetailPage from './pages/CourseDetailPage'
import InstructorsPage from './pages/InstructorsPage'
import NoticesPage from './pages/NoticesPage'
import NoticeDetailPage from './pages/NoticeDetailPage'
import ApplyPage from './pages/ApplyPage'
import SocialCallbackPage from './pages/SocialCallbackPage'
import LoginPage from './pages/admin/LoginPage'
import RequireAdmin from './pages/admin/RequireAdmin'
import AdminLayout from './pages/admin/AdminLayout'
import CoursesAdminPage from './pages/admin/CoursesAdminPage'
import NoticesAdminPage from './pages/admin/NoticesAdminPage'
import InstructorsAdminPage from './pages/admin/InstructorsAdminPage'
import ReservationsAdminPage from './pages/admin/ReservationsAdminPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:id" element={<CourseDetailPage />} />
        <Route path="/instructors" element={<InstructorsPage />} />
        <Route path="/notices" element={<NoticesPage />} />
        <Route path="/notices/:id" element={<NoticeDetailPage />} />
        <Route path="/apply" element={<ApplyPage />} />
        <Route path="/auth/social/callback" element={<SocialCallbackPage />} />
      </Route>

      <Route path="/admin/login" element={<LoginPage />} />
      <Route element={<RequireAdmin />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Navigate to="/admin/courses" replace />} />
          <Route path="/admin/courses" element={<CoursesAdminPage />} />
          <Route path="/admin/notices" element={<NoticesAdminPage />} />
          <Route path="/admin/instructors" element={<InstructorsAdminPage />} />
          <Route path="/admin/reservations" element={<ReservationsAdminPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App

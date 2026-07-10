import type { Metadata } from 'next'
import AdminRoute from '../AdminRoute'
import CoursesAdminPage from '../../../screens/admin/CoursesAdminPage'

export const metadata: Metadata = {
  title: '강좌 관리',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <AdminRoute allowedRoles={['CONTENT_MANAGER', 'SUPER_ADMIN']}>
      <CoursesAdminPage />
    </AdminRoute>
  )
}

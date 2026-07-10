import type { Metadata } from 'next'
import AdminRoute from '../AdminRoute'
import InstructorsAdminPage from '../../../screens/admin/InstructorsAdminPage'

export const metadata: Metadata = {
  title: '강사 관리',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <AdminRoute allowedRoles={['CONTENT_MANAGER', 'SUPER_ADMIN']}>
      <InstructorsAdminPage />
    </AdminRoute>
  )
}

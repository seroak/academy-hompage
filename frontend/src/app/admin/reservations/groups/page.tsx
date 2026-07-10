import type { Metadata } from 'next'
import { Suspense } from 'react'
import AdminRoute from '../../AdminRoute'
import GroupManagementAdminPage from '../../../../screens/admin/reservations/GroupManagementAdminPage'

export const metadata: Metadata = {
  title: '빈 수업(그룹) 관리',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <AdminRoute>
      <Suspense fallback={null}>
        <GroupManagementAdminPage />
      </Suspense>
    </AdminRoute>
  )
}

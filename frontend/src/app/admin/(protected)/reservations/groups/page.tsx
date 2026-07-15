import type { Metadata } from 'next'
import { Suspense } from 'react'
import GroupManagementAdminPage from '../../../../../screens/admin/reservations/GroupManagementAdminPage'

export const metadata: Metadata = {
  title: '빈 수업(그룹) 관리',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <GroupManagementAdminPage />
    </Suspense>
  )
}

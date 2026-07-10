import type { Metadata } from 'next'
import { Suspense } from 'react'
import AdminRoute from '../AdminRoute'
import ReservationsAdminPage from '../../../screens/admin/reservations/ReservationsAdminPage'

export const metadata: Metadata = {
  title: '예약 관리',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <AdminRoute>
      <Suspense fallback={null}>
        <ReservationsAdminPage />
      </Suspense>
    </AdminRoute>
  )
}

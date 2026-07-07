import type { Metadata } from 'next'
import AdminRoute from '../AdminRoute'
import ReservationsAdminPage from '../../../screens/admin/ReservationsAdminPage'

export const metadata: Metadata = {
  title: '예약 관리',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <AdminRoute>
      <ReservationsAdminPage />
    </AdminRoute>
  )
}

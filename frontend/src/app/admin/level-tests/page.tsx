import type { Metadata } from 'next'
import AdminRoute from '../AdminRoute'
import LevelTestsAdminPage from '../../../screens/admin/levelTests/LevelTestsAdminPage'

export const metadata: Metadata = {
  title: '레벨테스트 관리',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <AdminRoute>
      <LevelTestsAdminPage />
    </AdminRoute>
  )
}

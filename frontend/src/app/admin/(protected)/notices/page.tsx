import type { Metadata } from 'next'
import NoticesAdminPage from '../../../../screens/admin/NoticesAdminPage'

export const metadata: Metadata = {
  title: '공지 관리',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <NoticesAdminPage />
}

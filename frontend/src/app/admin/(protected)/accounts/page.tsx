import type { Metadata } from 'next'
import AdminAccountsPage from '../../../../screens/admin/AdminAccountsPage'

export const metadata: Metadata = {
  title: '관리자 계정',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <AdminAccountsPage />
}

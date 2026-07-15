import type { Metadata } from 'next'
import MembersAdminPage from '../../../../screens/admin/MembersAdminPage'

export const metadata: Metadata = {
  title: '회원 관리',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <MembersAdminPage />
}

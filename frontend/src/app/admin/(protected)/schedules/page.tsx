import type { Metadata } from 'next'
import ClassSchedulesAdminPage from '../../../../screens/admin/ClassSchedulesAdminPage'

export const metadata: Metadata = { title: '수업 일정 관리', robots: { index: false, follow: false } }
export default function Page() { return <ClassSchedulesAdminPage /> }

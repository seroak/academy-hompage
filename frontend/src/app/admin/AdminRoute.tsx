import type { ReactNode } from 'react'
import AdminLayout from '../../screens/admin/AdminLayout'
import RequireAdmin from '../../screens/admin/RequireAdmin'
import { getServerAuth } from '../../lib/serverAuth'

export default async function AdminRoute({
  children,
}: {
  children: ReactNode
}) {
  const { admin } = await getServerAuth()

  return (
    <RequireAdmin initialAdmin={admin}>
      <AdminLayout>{children}</AdminLayout>
    </RequireAdmin>
  )
}

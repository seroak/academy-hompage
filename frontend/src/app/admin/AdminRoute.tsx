import type { ReactNode } from 'react'
import AdminLayout from '../../screens/admin/AdminLayout'
import RequireAdmin from '../../screens/admin/RequireAdmin'
import { getServerAuth } from '../../lib/serverAuth'
import type { AdminRole } from '../../api/schemas/auth.schema'

export default async function AdminRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode
  allowedRoles?: AdminRole[]
}) {
  const { admin } = await getServerAuth()

  return (
    <RequireAdmin initialAdmin={admin} allowedRoles={allowedRoles}>
      <AdminLayout>{children}</AdminLayout>
    </RequireAdmin>
  )
}

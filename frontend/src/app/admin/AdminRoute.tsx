'use client'

import type { ReactNode } from 'react'
import AdminLayout from '../../screens/admin/AdminLayout'
import RequireAdmin from '../../screens/admin/RequireAdmin'

export default function AdminRoute({ children }: { children: ReactNode }) {
  return (
    <RequireAdmin>
      <AdminLayout>{children}</AdminLayout>
    </RequireAdmin>
  )
}

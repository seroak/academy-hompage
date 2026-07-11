import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import AdminLayout from '../../screens/admin/AdminLayout'
import { getServerAuth } from '../../lib/serverAuth'

export default async function AdminRoute({
  children,
}: {
  children: ReactNode
}) {
  const { admin } = await getServerAuth()

  if (!admin) {
    redirect('/?adminLogin=1')
  }

  return <AdminLayout>{children}</AdminLayout>
}

import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import AdminShell from '../../../screens/admin/AdminShell'
import { getServerAuth } from '../../../lib/serverAuth'

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const { admin } = await getServerAuth()

  if (!admin) {
    redirect('/?adminLogin=1')
  }

  return <AdminShell>{children}</AdminShell>
}

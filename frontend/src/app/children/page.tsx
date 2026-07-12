import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Layout from '../../components/Layout'
import ChildrenPage from '../../screens/ChildrenPage'
import { getServerAuth } from '../../lib/serverAuth'

export const metadata: Metadata = {
  title: '자녀 관리',
  robots: { index: false, follow: false },
}

export default async function Page() {
  const { parent } = await getServerAuth()
  if (!parent) redirect('/?login=1')
  return <Layout><ChildrenPage /></Layout>
}

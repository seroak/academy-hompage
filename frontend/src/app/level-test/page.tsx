import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Layout from '../../components/Layout'
import LevelTestPage from '../../screens/LevelTestPage'
import { getServerAuth } from '../../lib/serverAuth'
import { siteUrl } from '../../lib/seo'

export const metadata: Metadata = {
  title: '레벨테스트',
  description: '아이꿈 학원 레벨테스트를 예약 없이 바로 응시해 보세요.',
  alternates: { canonical: siteUrl('/level-test') },
  openGraph: {
    title: '레벨테스트 | 아이꿈 학원',
    description: '아이꿈 학원 레벨테스트를 예약 없이 바로 응시해 보세요.',
    url: siteUrl('/level-test'),
  },
}

export default async function Page() {
  const { admin, parent } = await getServerAuth()

  if (!parent && !admin) {
    redirect('/?login=1')
  }

  const isAdminPreview = !parent && admin

  return (
    <Layout>
      <LevelTestPage isAdminPreview={isAdminPreview} />
    </Layout>
  )
}

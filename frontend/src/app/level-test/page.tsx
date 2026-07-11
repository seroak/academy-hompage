import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Layout from '../../components/Layout'
import LevelTestPage from '../../screens/LevelTestPage'
import { getServerAuth } from '../../lib/serverAuth'
import { baseOpenGraph, siteUrl } from '../../lib/seo'

export const metadata: Metadata = {
  title: '레벨테스트',
  description: '용인 흥덕 유치부·초등 저학년 수학학원, 생각을 여는 수학 레벨테스트를 예약 없이 바로 응시해 보세요.',
  keywords: ['용인 수학학원', '흥덕 수학학원', '저학년 수학학원'],
  alternates: { canonical: siteUrl('/level-test') },
  openGraph: {
    ...baseOpenGraph(),
    title: '레벨테스트 | 생각을 여는 수학',
    description: '생각을 여는 수학 레벨테스트를 예약 없이 바로 응시해 보세요.',
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

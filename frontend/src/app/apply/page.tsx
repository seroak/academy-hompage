import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Layout from '../../components/Layout'
import ApplyPage from '../../screens/ApplyPage'
import { getServerAuth } from '../../lib/serverAuth'
import { baseOpenGraph, siteUrl } from '../../lib/seo'

export const metadata: Metadata = {
  title: '상담 신청',
  description: '용인 흥덕 유치부·초등 저학년 수학학원, 생각을 여는 수학 수업 상담과 그룹 편성 신청을 남겨 주세요.',
  keywords: ['용인 수학학원', '흥덕 수학학원', '유치부 수학학원'],
  robots: { index: false, follow: false },
  openGraph: {
    ...baseOpenGraph(),
    title: '상담 신청 | 생각을 여는 수학',
    description: '생각을 여는 수학 수업 상담과 신청을 안내합니다.',
    url: siteUrl('/apply'),
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
      <ApplyPage initialParent={parent} isAdminPreview={isAdminPreview} />
    </Layout>
  )
}

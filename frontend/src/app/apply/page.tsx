import type { Metadata } from 'next'
import Layout from '../../components/Layout'
import ApplyPage from '../../screens/ApplyPage'
import { siteUrl } from '../../lib/seo'

export const metadata: Metadata = {
  title: '상담 신청',
  description: '아이꿈 학원 수업 상담과 그룹 편성 신청을 남겨 주세요.',
  alternates: { canonical: siteUrl('/apply') },
  openGraph: {
    title: '상담 신청 | 아이꿈 학원',
    description: '아이꿈 학원 수업 상담과 신청을 안내합니다.',
    url: siteUrl('/apply'),
  },
}

export default function Page() {
  return (
    <Layout>
      <ApplyPage />
    </Layout>
  )
}

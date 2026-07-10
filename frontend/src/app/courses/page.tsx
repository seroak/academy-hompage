import type { Metadata } from 'next'
import Layout from '../../components/Layout'
import MathCurriculumPage from '../../screens/MathCurriculumPage'
import { siteUrl } from '../../lib/seo'

export const metadata: Metadata = {
  title: '수학교육 과정',
  description: '놀이에서 시작해 개념 이해, 사고력, 교과 연결로 이어지는 아이꿈만의 수학교육 과정입니다.',
  alternates: { canonical: siteUrl('/courses') },
  openGraph: {
    title: '수학교육 과정 | 아이꿈 학원',
    description: '아이의 흥미를 수학 자신감으로 이어가는 세 가지 과정을 만나보세요.',
    url: siteUrl('/courses'),
  },
}

export default function CoursesPage() {
  return (
    <Layout variant="landing">
      <MathCurriculumPage />
    </Layout>
  )
}

import type { Metadata } from 'next'
import Layout from '../../components/Layout'
import MathCurriculumPage from '../../screens/MathCurriculumPage'
import { baseOpenGraph, buildCoursesJsonLd, pageTwitter, rssAlternate, siteUrl } from '../../lib/seo'
import { programs } from '../../components/math-curriculum/data'

const title = '수학교육 과정 | 생각을 여는 수학'
const description = '플레이팩토, 요리수 연산, 씨투엠(C2M) — 아이의 흥미를 수학 자신감으로 이어가는 세 가지 과정을 만나보세요.'
const socialImage = '/images/og/courses.webp'

export const metadata: Metadata = {
  title: '수학교육 과정',
  description:
    '플레이팩토, 요리수 연산, 씨투엠(C2M) — 놀이에서 시작해 개념 이해, 사고력, 교과 연결로 이어지는 생각을 여는 수학만의 교육 과정입니다.',
  keywords: [
    '플레이팩토',
    '요리수 연산',
    '씨투엠',
    'C2M',
    '유치부 수학학원',
    '저학년 수학학원',
    '흥덕 플레이팩토',
    '용인 플레이팩토 학원',
  ],
  alternates: { canonical: siteUrl('/courses'), ...rssAlternate() },
  openGraph: {
    ...baseOpenGraph(socialImage),
    title,
    description,
    url: siteUrl('/courses'),
  },
  twitter: pageTwitter(title, description, socialImage),
}

export default function CoursesPage() {
  const coursesJsonLd = buildCoursesJsonLd(programs)

  return (
    <Layout variant="landing">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(coursesJsonLd) }}
      />
      <MathCurriculumPage />
    </Layout>
  )
}

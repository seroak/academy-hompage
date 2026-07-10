import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Badge from '../../../components/Badge'
import Layout from '../../../components/Layout'
import { fetchPublicCourse } from '../../../api/public.api'
import { siteUrl, truncateDescription } from '../../../lib/seo'

export const revalidate = 300

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const course = await fetchPublicCourse(id)

  if (!course) {
    return {
      title: '강좌를 찾을 수 없습니다',
      robots: { index: false, follow: false },
    }
  }

  const description = truncateDescription(course.description)

  return {
    title: course.title,
    description,
    alternates: { canonical: siteUrl(`/courses/${course.id}`) },
    openGraph: {
      title: `${course.title} | 아이꿈 학원`,
      description,
      url: siteUrl(`/courses/${course.id}`),
    },
  }
}

export default async function Page({ params }: PageProps) {
  const { id } = await params
  const course = await fetchPublicCourse(id)
  if (!course) notFound()

  const courseJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description,
    provider: {
      '@type': 'EducationalOrganization',
      name: '아이꿈 학원',
      sameAs: siteUrl('/'),
    },
    offers: {
      '@type': 'Offer',
      price: course.tuition,
      priceCurrency: 'KRW',
    },
  }

  return (
    <Layout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />
      <div>
        <Link href="/courses/list" className="text-sm text-brand-600 hover:underline">
          ← 강좌 목록으로
        </Link>
        <article className="mt-4 rounded-2xl border border-slate-200 bg-white p-8">
          <div className="flex gap-2">
            <Badge>{course.category}</Badge>
            <Badge>{course.level}</Badge>
          </div>
          <h1 className="mt-3 text-2xl font-bold text-brand-700">{course.title}</h1>
          <p className="mt-4 whitespace-pre-line text-slate-700">{course.description}</p>
          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-400">수강료</dt>
              <dd className="font-medium text-slate-800">
                {course.tuition.toLocaleString('ko-KR')}원
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">수업 일정</dt>
              <dd className="font-medium text-slate-800">{course.schedule}</dd>
            </div>
            {course.instructor && (
              <div>
                <dt className="text-slate-400">담당 강사</dt>
                <dd className="font-medium text-slate-800">{course.instructor.name}</dd>
              </div>
            )}
          </dl>
        </article>
      </div>
    </Layout>
  )
}

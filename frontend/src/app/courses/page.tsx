import type { Metadata } from 'next'
import Link from 'next/link'
import Badge from '../../components/Badge'
import Layout from '../../components/Layout'
import { fetchPublicCourses } from '../../api/public.api'
import { pastelFor } from '../../lib/pastels'
import { siteUrl } from '../../lib/seo'
import type { Course } from '../../api/schemas/course.schema'

export const revalidate = 300

export const metadata: Metadata = {
  title: '강좌 안내',
  description: '아이꿈 학원의 유치부, 초등 저학년, 창의 사고, 독서 표현 강좌를 확인해 보세요.',
  alternates: { canonical: siteUrl('/courses') },
  openGraph: {
    title: '강좌 안내 | 아이꿈 학원',
    description: '아이의 속도에 맞춘 아이꿈 학원 강좌를 안내합니다.',
    url: siteUrl('/courses'),
  },
}

async function getCourses(): Promise<Course[]> {
  try {
    return await fetchPublicCourses()
  } catch {
    return []
  }
}

export default async function Page() {
  const courses = await getCourses()

  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">강좌 안내</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course, index) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className={`rounded-2xl border border-slate-200 ${pastelFor(index)} p-5 transition hover:shadow-md`}
            >
              <div className="flex gap-2">
                <Badge>{course.category}</Badge>
                <Badge>{course.level}</Badge>
              </div>
              <h2 className="mt-3 font-bold text-brand-700">{course.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">{course.description}</p>
              <p className="mt-3 text-sm font-medium text-slate-700">
                {course.tuition.toLocaleString('ko-KR')}원 · {course.schedule}
              </p>
              {course.instructor && (
                <p className="mt-1 text-xs text-slate-500">담당: {course.instructor.name}</p>
              )}
            </Link>
          ))}
          {courses.length === 0 && (
            <p className="col-span-full py-10 text-center text-slate-400">
              등록된 강좌가 없습니다.
            </p>
          )}
        </div>
      </div>
    </Layout>
  )
}

import type { Metadata } from 'next'
import Badge from '../../components/Badge'
import Layout from '../../components/Layout'
import { fetchPublicInstructors } from '../../api/public.api'
import { pastelFor } from '../../lib/pastels'
import { siteUrl } from '../../lib/seo'
import type { Instructor } from '../../api/schemas/instructor.schema'

export const revalidate = 300

export const metadata: Metadata = {
  title: '강사진 소개',
  description: '아이꿈 학원 강사진의 과목과 교육 소개를 확인해 보세요.',
  alternates: { canonical: siteUrl('/instructors') },
  openGraph: {
    title: '강사진 소개 | 아이꿈 학원',
    description: '아이꿈 학원의 강사진을 소개합니다.',
    url: siteUrl('/instructors'),
  },
}

async function getInstructors(): Promise<Instructor[]> {
  try {
    return await fetchPublicInstructors()
  } catch {
    return []
  }
}

export default async function Page() {
  const instructors = await getInstructors()

  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">강사진 소개</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {instructors.map((instructor, index) => (
            <div
              key={instructor.id}
              className={`rounded-2xl border border-slate-200 ${pastelFor(index)} p-6`}
            >
              <Badge>{instructor.subject}</Badge>
              <h2 className="mt-3 text-lg font-bold text-brand-700">{instructor.name}</h2>
              <p className="mt-2 text-sm text-slate-600">{instructor.bio}</p>
            </div>
          ))}
          {instructors.length === 0 && (
            <p className="col-span-full py-10 text-center text-slate-400">
              등록된 강사가 없습니다.
            </p>
          )}
        </div>
      </div>
    </Layout>
  )
}

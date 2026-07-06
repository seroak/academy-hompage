import { Link } from 'react-router-dom'
import { useCoursesQuery } from '../queries/useCoursesQuery'
import { useNoticesQuery } from '../queries/useNoticesQuery'
import StatusMessage from '../components/StatusMessage'
import Badge from '../components/Badge'
import { pastelFor } from '../lib/pastels'

export default function HomePage() {
  const { courses, isLoading: coursesLoading, error: coursesError } = useCoursesQuery()
  const { notices, isLoading: noticesLoading, error: noticesError } = useNoticesQuery()

  return (
    <div className="flex flex-col gap-16">
      <section className="rounded-3xl bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 px-10 py-16 text-white">
        <h1 className="text-3xl font-bold sm:text-4xl">
          <span className="text-brand-300">푸른들 학원</span>과 함께 성장하세요
        </h1>
        <p className="mt-4 max-w-xl text-brand-100">
          수학, 영어, 과학 전문 강사진이 학생 개개인에 맞춘 커리큘럼으로 지도합니다.
        </p>
        <Link
          to="/courses"
          className="mt-6 inline-block rounded-lg bg-white px-5 py-2.5 font-medium text-brand-700 hover:bg-brand-50"
        >
          강좌 둘러보기
        </Link>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">대표 강좌</h2>
          <Link to="/courses" className="text-sm text-brand-600 hover:underline">
            전체 보기
          </Link>
        </div>
        <StatusMessage isLoading={coursesLoading} error={coursesError} />
        {!coursesLoading && !coursesError && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.slice(0, 3).map((course, index) => (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className={`rounded-2xl border border-slate-200 ${pastelFor(index)} p-5 transition hover:shadow-md`}
              >
                <Badge>{course.category}</Badge>
                <h3 className="mt-3 font-bold text-brand-700">{course.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{course.description}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">최근 공지</h2>
          <Link to="/notices" className="text-sm text-brand-600 hover:underline">
            전체 보기
          </Link>
        </div>
        <StatusMessage isLoading={noticesLoading} error={noticesError} />
        {!noticesLoading && !noticesError && (
          <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
            {notices.slice(0, 4).map((notice) => (
              <li key={notice.id}>
                <Link
                  to={`/notices/${notice.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2 text-sm text-slate-800">
                    {notice.pinned && (
                      <Badge className="border-brand-200 bg-brand-50 text-brand-700">고정</Badge>
                    )}
                    {notice.title}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(notice.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

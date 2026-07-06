import { Link } from 'react-router-dom'
import { useCoursesQuery } from '../queries/useCoursesQuery'
import StatusMessage from '../components/StatusMessage'
import Badge from '../components/Badge'
import { pastelFor } from '../lib/pastels'

export default function CoursesPage() {
  const { courses, isLoading, error } = useCoursesQuery()

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">강좌 안내</h1>
      <StatusMessage isLoading={isLoading} error={error} />
      {!isLoading && !error && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course, index) => (
            <Link
              key={course.id}
              to={`/courses/${course.id}`}
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
      )}
    </div>
  )
}

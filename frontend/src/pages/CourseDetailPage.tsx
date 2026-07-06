import { Link, useParams } from 'react-router-dom'
import { useCourseQuery } from '../queries/useCourseQuery'
import StatusMessage from '../components/StatusMessage'
import Badge from '../components/Badge'

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { course, isLoading, error } = useCourseQuery(id)

  return (
    <div>
      <Link to="/courses" className="text-sm text-brand-600 hover:underline">
        ← 강좌 목록으로
      </Link>
      <StatusMessage isLoading={isLoading} error={error} />
      {course && (
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
      )}
    </div>
  )
}

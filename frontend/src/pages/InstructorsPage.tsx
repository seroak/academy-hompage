import { useInstructorsQuery } from '../queries/useInstructorsQuery'
import StatusMessage from '../components/StatusMessage'
import Badge from '../components/Badge'
import { pastelFor } from '../lib/pastels'

export default function InstructorsPage() {
  const { instructors, isLoading, error } = useInstructorsQuery()

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">강사진 소개</h1>
      <StatusMessage isLoading={isLoading} error={error} />
      {!isLoading && !error && (
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
      )}
    </div>
  )
}

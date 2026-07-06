import { Link } from 'react-router-dom'
import { useNoticesQuery } from '../queries/useNoticesQuery'
import StatusMessage from '../components/StatusMessage'
import Badge from '../components/Badge'

export default function NoticesPage() {
  const { notices, isLoading, error } = useNoticesQuery()

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">공지사항</h1>
      <StatusMessage isLoading={isLoading} error={error} />
      {!isLoading && !error && (
        <ul className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
          {notices.map((notice) => (
            <li key={notice.id}>
              <Link
                to={`/notices/${notice.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-slate-50"
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
          {notices.length === 0 && (
            <li className="py-10 text-center text-slate-400">등록된 공지가 없습니다.</li>
          )}
        </ul>
      )}
    </div>
  )
}

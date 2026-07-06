import { Link, useParams } from 'react-router-dom'
import { useNoticeQuery } from '../queries/useNoticeQuery'
import StatusMessage from '../components/StatusMessage'
import Badge from '../components/Badge'

export default function NoticeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { notice, isLoading, error } = useNoticeQuery(id)

  return (
    <div>
      <Link to="/notices" className="text-sm text-brand-600 hover:underline">
        ← 공지사항 목록으로
      </Link>
      <StatusMessage isLoading={isLoading} error={error} />
      {notice && (
        <article className="mt-4 rounded-2xl border border-slate-200 bg-white p-8">
          {notice.pinned && (
            <Badge className="border-brand-200 bg-brand-50 text-brand-700">고정 공지</Badge>
          )}
          <h1 className="mt-3 text-2xl font-bold text-slate-900">{notice.title}</h1>
          <p className="mt-1 text-xs text-slate-400">
            {new Date(notice.createdAt).toLocaleDateString('ko-KR')}
          </p>
          <p className="mt-4 whitespace-pre-line text-slate-700">{notice.content}</p>
        </article>
      )}
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import Badge from '../../components/Badge'
import Layout from '../../components/Layout'
import { fetchPublicNotices } from '../../api/public.api'
import { siteUrl } from '../../lib/seo'
import type { Notice } from '../../api/schemas/notice.schema'

export const revalidate = 300

export const metadata: Metadata = {
  title: '공지사항',
  description: '아이꿈 학원의 최신 공지사항과 안내를 확인해 보세요.',
  alternates: { canonical: siteUrl('/notices') },
  openGraph: {
    title: '공지사항 | 아이꿈 학원',
    description: '아이꿈 학원의 공지사항을 안내합니다.',
    url: siteUrl('/notices'),
  },
}

async function getNotices(): Promise<Notice[]> {
  try {
    return await fetchPublicNotices()
  } catch {
    return []
  }
}

export default async function Page() {
  const notices = await getNotices()

  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">공지사항</h1>
        <ul className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
          {notices.map((notice) => (
            <li key={notice.id}>
              <Link
                href={`/notices/${notice.id}`}
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
      </div>
    </Layout>
  )
}

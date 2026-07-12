import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Badge from '../../../components/Badge'
import Layout from '../../../components/Layout'
import { fetchPublicNotice } from '../../../api/public.api'
import { baseOpenGraph, rssAlternate, siteUrl, truncateDescription } from '../../../lib/seo'

export const revalidate = 300

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const notice = await fetchPublicNotice(id)

  if (!notice) {
    return {
      title: '공지를 찾을 수 없습니다',
      robots: { index: false, follow: false },
    }
  }

  const description = truncateDescription(notice.content)

  return {
    title: notice.title,
    description,
    alternates: { canonical: siteUrl(`/notices/${notice.id}`), ...rssAlternate() },
    openGraph: {
      ...baseOpenGraph(),
      title: `${notice.title} | 생각을 여는 수학`,
      description,
      url: siteUrl(`/notices/${notice.id}`),
    },
  }
}

export default async function Page({ params }: PageProps) {
  const { id } = await params
  const notice = await fetchPublicNotice(id)
  if (!notice) notFound()

  return (
    <Layout>
      <div>
        <Link href="/notices" className="text-sm text-brand-600 hover:underline">
          ← 공지사항 목록으로
        </Link>
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
      </div>
    </Layout>
  )
}

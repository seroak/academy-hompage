import type { MetadataRoute } from 'next'
import { fetchPublicNotices } from '../api/public.api'
import { siteUrl } from '../lib/seo'

export const revalidate = 300

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    '/',
    '/notices',
    '/courses',
    '/schedule',
    '/courses/young-children-math',
    '/courses/thinking-math',
    '/courses/elementary-lower-grades',
    '/courses/heungdeok-math',
  ]
  const staticUrls = staticPaths.map((path) => ({
    url: siteUrl(path),
    changeFrequency: 'weekly' as const,
    priority: path === '/' ? 1 : 0.8,
  }))

  const notices = await fetchPublicNotices().catch(() => [])

  const noticeUrls = notices.map((notice) => ({
    url: siteUrl(`/notices/${notice.id}`),
    lastModified: new Date(notice.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: notice.pinned ? 0.7 : 0.5,
  }))

  return [...staticUrls, ...noticeUrls]
}

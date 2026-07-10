import type { MetadataRoute } from 'next'
import { fetchPublicCourses, fetchPublicNotices } from '../api/public.api'
import { siteUrl } from '../lib/seo'

export const revalidate = 300

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = ['/', '/courses', '/courses/list', '/instructors', '/notices']
  const staticUrls = staticPaths.map((path) => ({
    url: siteUrl(path),
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: path === '/' ? 1 : 0.8,
  }))

  const [courses, notices] = await Promise.all([
    fetchPublicCourses().catch(() => []),
    fetchPublicNotices().catch(() => []),
  ])

  const courseUrls = courses.map((course) => ({
    url: siteUrl(`/courses/${course.id}`),
    lastModified: new Date(course.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const noticeUrls = notices.map((notice) => ({
    url: siteUrl(`/notices/${notice.id}`),
    lastModified: new Date(notice.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: notice.pinned ? 0.7 : 0.5,
  }))

  return [...staticUrls, ...courseUrls, ...noticeUrls]
}

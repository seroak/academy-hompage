import { fetchPublicNotices } from '../../api/public.api'
import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from '../../lib/seo'

export const revalidate = 300

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export async function GET(): Promise<Response> {
  const notices = await fetchPublicNotices().catch(() => [])
  const items = notices
    .map((notice) => {
      const url = siteUrl(`/notices/${notice.id}`)
      return `    <item>
      <title>${escapeXml(notice.title)}</title>
      <link>${escapeXml(url)}</link>
      <description>${escapeXml(notice.content)}</description>
      <pubDate>${new Date(notice.createdAt).toUTCString()}</pubDate>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${escapeXml(siteUrl('/'))}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}

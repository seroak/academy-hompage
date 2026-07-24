import type { MetadataRoute } from 'next'
import { siteUrl } from '../lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/auth/social/callback', '/children'],
      },
      {
        userAgent: 'Yeti',
        allow: '/',
        disallow: ['/admin', '/admin/', '/auth/social/callback', '/children'],
      },
    ],
    sitemap: siteUrl('/sitemap.xml'),
  }
}

import type { MetadataRoute } from 'next'
import { SITE_DESCRIPTION, SITE_NAME } from '../lib/seo'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/favicon.png',
        sizes: '1254x1254',
        type: 'image/png',
      },
      {
        src: '/favicon-theme.png',
        sizes: '1254x1254',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}

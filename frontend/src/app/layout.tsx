import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import AgentationDev from '../components/AgentationDev'
import Providers from './providers'
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, baseOpenGraph, siteOgImage, siteUrl } from '../lib/seo'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'
const naverVerification = process.env.NAVER_SITE_VERIFICATION
const googleVerification = process.env.GOOGLE_SITE_VERIFICATION

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  alternates: {
    types: { 'application/rss+xml': siteUrl('/rss.xml') },
  },
  icons: {
    icon: '/favicon-theme.png',
    apple: '/favicon-theme.png',
  },
  openGraph: baseOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [siteOgImage()],
  },
  verification: {
    ...(naverVerification ? { other: { 'naver-site-verification': naverVerification } } : {}),
    ...(googleVerification ? { google: googleVerification } : {}),
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <body>
        <Providers>{children}</Providers>
        <AgentationDev />
      </body>
    </html>
  )
}

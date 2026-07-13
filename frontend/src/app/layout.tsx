import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import localFont from 'next/font/local'
import type { ReactNode } from 'react'
import './globals.css'
import Providers from './providers'
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, baseOpenGraph, rssAlternate, siteOgImage } from '../lib/seo'

const pretendard = localFont({
  src: [
    {
      path: '../../node_modules/pretendard/dist/web/static/woff2-subset/Pretendard-Medium.subset.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../node_modules/pretendard/dist/web/static/woff2-subset/Pretendard-Bold.subset.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../node_modules/pretendard/dist/web/static/woff2-subset/Pretendard-ExtraBold.subset.woff2',
      weight: '800',
      style: 'normal',
    },
  ],
  variable: '--font-pretendard',
  display: 'optional',
  preload: false,
})

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'
const naverVerification = process.env.NAVER_SITE_VERIFICATION
const googleVerification = process.env.GOOGLE_SITE_VERIFICATION
const AgentationDev =
  process.env.NODE_ENV === 'development'
    ? dynamic(() => import('../components/AgentationDev'))
    : null

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  alternates: rssAlternate(),
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
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
    <html lang="ko" data-scroll-behavior="smooth" className={pretendard.variable}>
      <body>
        <Providers>{children}</Providers>
        {AgentationDev ? <AgentationDev /> : null}
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import Providers from './providers'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
const naverVerification = process.env.NAVER_SITE_VERIFICATION

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: '아이꿈 학원',
    template: '%s | 아이꿈 학원',
  },
  description: '유치부부터 초등 저학년까지, 아이의 속도에 맞춘 따뜻한 배움을 제공합니다.',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: '아이꿈 학원',
  },
  verification: naverVerification
    ? {
        other: {
          'naver-site-verification': naverVerification,
        },
      }
    : undefined,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

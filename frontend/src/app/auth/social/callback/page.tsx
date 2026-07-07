import type { Metadata } from 'next'
import { Suspense } from 'react'
import Layout from '../../../../components/Layout'
import SocialCallbackPage from '../../../../screens/SocialCallbackPage'

export const metadata: Metadata = {
  title: '소셜 로그인 처리',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <Layout>
      <Suspense fallback={null}>
        <SocialCallbackPage />
      </Suspense>
    </Layout>
  )
}

import type { Metadata } from 'next'
import { Suspense } from 'react'
import Layout from '../../../components/Layout'
import VerifyEmailPage from '../../../screens/VerifyEmailPage'

export const metadata: Metadata = {
  title: '이메일 인증 처리',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <Layout>
      <Suspense fallback={null}>
        <VerifyEmailPage />
      </Suspense>
    </Layout>
  )
}

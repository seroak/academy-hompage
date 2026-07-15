import type { Metadata } from 'next'
import Layout from '../../../components/Layout'
import HeungdeokMathLandingPage from '../../../screens/HeungdeokMathLandingPage'

export const metadata: Metadata = {
  title: '흥덕 유치부·초등 저학년 수학',
  description: '놀이에서 개념 이해, 사고력, 교과 연결로 이어지는 흥덕 수학 상담을 신청하세요.',
  robots: { index: false, follow: false },
}

export default function HeungdeokMathPage() {
  return <Layout variant="landing"><HeungdeokMathLandingPage /></Layout>
}

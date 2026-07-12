import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: '관리자',
  robots: { index: false, follow: false },
}

export default function Page() {
  redirect('/admin/notices')
}

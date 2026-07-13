import type { Metadata } from 'next'
import Layout from '../../components/Layout'
import ClassSchedulePage from '../../screens/ClassSchedulePage'
import { fetchPublishedClassSchedules } from '../../api/public.api'
import { baseOpenGraph, rssAlternate, siteUrl } from '../../lib/seo'
import type { ClassSchedule } from '../../api/schemas/class-schedule.schema'

export const revalidate = 300
export const metadata: Metadata = { title: '수업 일정', description: '생각을 여는 수학의 분기별 수업일과 휴강·공휴일을 확인하세요.', alternates: { canonical: siteUrl('/schedule'), ...rssAlternate() }, openGraph: { ...baseOpenGraph(), title: '수업 일정 | 생각을 여는 수학', description: '분기별 수업 일정을 안내합니다.', url: siteUrl('/schedule') } }
export default async function Page() {
  let schedules: ClassSchedule[] = []
  let loadFailed = false
  try { schedules = await fetchPublishedClassSchedules() } catch { loadFailed = true }
  return <Layout><ClassSchedulePage schedules={schedules} loadFailed={loadFailed} /></Layout>
}

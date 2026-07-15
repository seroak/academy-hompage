'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { MarketingDashboard } from '../../api/schemas/marketing.schema'
import { useMarketingDashboardQuery, useMetaSyncMutation } from './hooks/useMarketingDashboardQuery'

const won = (value: number | null) => value === null ? '계산 불가' : `${Math.round(value).toLocaleString('ko-KR')}원`
const number = (value: number) => value.toLocaleString('ko-KR')
const percent = (value: number | null) => value === null ? '계산 불가' : `${value}%`
function seoulDate(offsetDays = 0) { const date = new Date(Date.now() + offsetDays * 86400000); return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(date) }

function MetricStrip({ data }: { data: MarketingDashboard }) {
  return <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[
    ['광고비', won(data.totals.spendWon), 'Meta 자동 동기화'], ['상담 신청', `${number(data.totals.leads)}건`, `랜딩→상담 신청 ${percent(data.totals.landingToLeadRate)}`], ['등록', `${number(data.totals.registrations)}명`, `방문→등록 ${percent(data.totals.visitToRegistrationRate)}`], ['등록당 광고비', won(data.totals.costPerRegistration), '실제 등록 기준'],
  ].map(([label, value, context]) => <div key={label} className="border-t-2 border-[#d96000] bg-[#fffdf7] px-5 py-5"><p className="text-xs font-black text-[#756956]">{label}</p><p className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#28231d]">{value}</p><p className="mt-2 text-xs font-bold text-[#857866]">{context}</p></div>)}</section>
}

function CreativeDetails({ creative }: { creative: MarketingDashboard['creatives'][number] }) {
  return <div className="grid gap-3 border-t border-[#ead9b7] bg-[#fff9ec] px-4 py-4 text-sm sm:grid-cols-3 lg:grid-cols-6">
    <span>노출 <b>{number(creative.impressions)}</b></span><span>링크 클릭 <b>{number(creative.linkClicks)}</b></span><span>CPC <b>{won(creative.cpc)}</b></span><span>CTA 클릭 <b>{number(creative.ctaClicks)}</b></span><span>양식 시작 <b>{number(creative.formStarts)}</b></span><span>유효 상담 <b>{number(creative.validLeads)}</b></span><span>상담 예약 <b>{number(creative.bookings)}</b></span><span>방문 <b>{number(creative.visits)}</b></span><span>랜딩→상담 신청 <b>{percent(creative.landingToLeadRate)}</b></span>
  </div>
}

export default function MarketingDashboardPage() {
  const [from, setFrom] = useState(seoulDate(-6))
  const [to, setTo] = useState(seoulDate())
  const [campaignId, setCampaignId] = useState('')
  const query = useMarketingDashboardQuery({ from, to, campaignId: campaignId || undefined })
  const sync = useMetaSyncMutation()
  const data = query.data
  const campaigns = data ? [...new Map(data.creatives.map((item) => [item.campaignId, item.campaignName])).entries()] : []
  const isStale = data?.meta.lastSuccessAt ? Date.now() - new Date(data.meta.lastSuccessAt).getTime() > 12 * 60 * 60 * 1000 : false

  return <div>
    <header className="flex flex-wrap items-end justify-between gap-5">
      <div><p className="text-sm font-black text-[#d96000]">META · WEBSITE PERFORMANCE</p><h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#26221c]">광고 분석</h1><p className="mt-2 text-sm font-medium text-[#716656]">어떤 광고가 상담과 등록으로 이어졌는지 소재별로 비교합니다.</p></div>
      <button type="button" disabled={sync.isPending || data?.meta.isRunning || !data?.meta.configured} onClick={() => sync.mutate()} className="h-11 rounded-full bg-[#2c4f40] px-5 text-sm font-black text-[#fffaf0] disabled:opacity-50">{sync.isPending || data?.meta.isRunning ? '동기화 중...' : '지금 동기화'}</button>
    </header>

    <section className="mt-6 flex flex-wrap gap-3 border-y border-[#ead9b7] py-4">
      <label className="grid gap-1 text-xs font-black text-[#6a604f]">시작일<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="h-10 rounded-lg border border-[#dac9a7] bg-white px-3 text-sm" /></label>
      <label className="grid gap-1 text-xs font-black text-[#6a604f]">종료일<input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="h-10 rounded-lg border border-[#dac9a7] bg-white px-3 text-sm" /></label>
      <label className="grid min-w-48 gap-1 text-xs font-black text-[#6a604f]">캠페인<select value={campaignId} onChange={(event) => setCampaignId(event.target.value)} className="h-10 rounded-lg border border-[#dac9a7] bg-white px-3 text-sm"><option value="">전체 캠페인</option>{campaigns.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
    </section>

    {query.isLoading ? <p className="mt-10 font-bold text-[#716656]">광고 성과를 불러오는 중...</p> : null}
    {query.error ? <p role="alert" className="mt-8 bg-[#fff0e8] p-4 font-bold text-[#a43b2b]">광고 분석 데이터를 불러오지 못했습니다.</p> : null}
    {data && !data.meta.configured ? <div className="mt-6 bg-[#fff1c7] p-5"><p className="font-black text-[#2e2922]">Meta API 연결이 필요합니다</p><p className="mt-1 text-sm font-medium text-[#675d4d]">백엔드에 읽기 전용 광고 계정과 액세스 토큰을 설정하면 자동 동기화됩니다.</p></div> : null}
    {data?.meta.lastError ? <p role="alert" className="mt-6 bg-[#fff0e8] p-4 font-bold text-[#a43b2b]">{data.meta.lastError}</p> : null}
    {isStale ? <p className="mt-6 bg-[#fff1c7] p-4 text-sm font-black text-[#765421]">Meta 데이터가 12시간 이상 갱신되지 않았습니다.</p> : null}
    {sync.isError ? <p role="alert" className="mt-4 text-sm font-black text-[#a43b2b]">Meta 동기화를 시작하지 못했습니다.</p> : null}

    {data ? <><MetricStrip data={data} />
      {data.newLeads > 0 ? <Link href="/admin/leads?status=NEW" className="mt-5 inline-flex font-black text-[#b44e00] underline underline-offset-4">신규 상담 신청 {data.newLeads}건 확인</Link> : null}
      <section className="mt-10"><div className="flex items-end justify-between"><div><p className="text-xs font-black text-[#d96000]">CREATIVE COMPARISON</p><h2 className="mt-1 text-2xl font-black text-[#29251f]">소재별 효율</h2></div><p className="text-xs font-bold text-[#817460]">{data.range.from} – {data.range.to}</p></div>
        {data.creatives.length === 0 ? <p className="mt-5 bg-white p-8 text-center text-sm font-bold text-[#716656]">선택한 기간에 연결된 광고 소재가 없습니다.</p> : <div className="mt-5 divide-y divide-[#ead9b7] border-y border-[#ead9b7] bg-white">{data.creatives.map((creative) => <details key={`${creative.campaignId}-${creative.adId}`}><summary aria-label={`${creative.adName} 상세 보기`} className="grid cursor-pointer gap-4 px-4 py-5 sm:grid-cols-[1.5fr_repeat(4,1fr)] sm:items-center"><div><p className="font-black text-[#29251f]">{creative.adName}</p><p className="mt-1 text-xs text-[#817460]">{creative.campaignName}</p></div><div><p className="text-xs text-[#817460]">광고비</p><b>{won(creative.spendWon)}</b></div><div><p className="text-xs text-[#817460]">랜딩·상담 신청</p><b>{creative.landingVisits} · {creative.leads}</b></div><div><p className="text-xs text-[#817460]">등록</p><b>{creative.registrations}명</b></div><div><p className="text-xs text-[#817460]">등록당 광고비</p><b>{won(creative.costPerRegistration)}</b></div></summary><CreativeDetails creative={creative} /></details>)}</div>}
      </section>
      <section className="mt-12 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]"><div><h2 className="text-2xl font-black text-[#29251f]">전체 전환 흐름</h2><ol className="mt-5 grid grid-cols-2 gap-px bg-[#ead9b7] sm:grid-cols-3">{[['랜딩 방문', data.totals.landingVisits], ['상담 신청', data.totals.leads], ['유효 상담', data.totals.validLeads], ['상담 예약', data.totals.bookings], ['방문', data.totals.visits], ['등록', data.totals.registrations]].map(([label, value]) => <li key={label} className="bg-[#fffdf7] p-4"><p className="text-xs font-black text-[#776b5a]">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></li>)}</ol></div><div><h2 className="text-2xl font-black text-[#29251f]">일별 변화</h2><div className="mt-5 divide-y divide-[#ead9b7]">{data.daily.map((day) => <div key={day.date} className="grid grid-cols-4 gap-2 py-3 text-sm"><b>{day.date.slice(5)}</b><span>{won(day.spendWon)}</span><span>상담 신청 {day.leads}</span><span>등록 {day.registrations}</span></div>)}</div></div></section>
    </> : null}
  </div>
}

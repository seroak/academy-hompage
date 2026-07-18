'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { LeadStatus } from '../../api/schemas/lead.schema'
import { useLeadsQuery, useUpdateLeadMutation } from './hooks/useLeadsQuery'

const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: '신규', CONTACTED: '연락 완료', CONSULTATION_BOOKED: '상담 예약', VISITED: '방문', REGISTERED: '등록', NO_RESPONSE: '미응답', DISQUALIFIED: '부적합',
}
const statuses = Object.keys(STATUS_LABELS) as LeadStatus[]

function phoneLabel(phone: string) {
  const digits = phone.replace(/\D/g, '')
  return digits.length === 11 ? `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}` : phone
}

export default function LeadsAdminPage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<LeadStatus | ''>(() => {
    const requested = searchParams.get('status')
    return statuses.includes(requested as LeadStatus) ? requested as LeadStatus : ''
  })
  const [campaign, setCampaign] = useState('')
  const [content, setContent] = useState('')
  const filters = { page: 1, status: status || undefined, campaign: campaign || undefined, content: content || undefined }
  const { list, summary } = useLeadsQuery(filters)
  const updateMutation = useUpdateLeadMutation()
  const funnel = summary.data

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-black text-[#d96000]">광고 · 상담 관리</p><h1 className="mt-1 text-3xl font-black tracking-[-0.035em] text-[#26221c]">광고 상담 신청</h1><p className="mt-2 text-sm font-medium text-[#716656]">광고 유입부터 연락·상담·등록까지 한 흐름으로 확인합니다.</p></div>
      </div>

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ['전체 상담 신청', funnel?.total ?? 0], ['유효 상담', funnel?.valid ?? 0], ['상담 예약', funnel?.booking ?? 0], ['방문', funnel?.visited ?? 0], ['등록', funnel?.registered ?? 0],
        ].map(([label, value]) => <div key={label} className="rounded-2xl border border-[#ead9b7] bg-white p-5"><p className="text-xs font-black text-[#766a59]">{label}</p><p className="mt-3 text-3xl font-black text-[#2e2922]">{value}</p></div>)}
      </section>

      <section className="mt-6 flex flex-wrap gap-3 rounded-2xl bg-[#fff3dc] p-4">
        <label className="grid gap-1 text-xs font-black text-[#665b4c]">상태<select value={status} onChange={(event) => setStatus(event.target.value as LeadStatus | '')} className="h-10 rounded-xl border border-[#ddc89f] bg-white px-3 text-sm"><option value="">전체</option>{statuses.map((item) => <option key={item} value={item}>{STATUS_LABELS[item]}</option>)}</select></label>
        <label className="grid gap-1 text-xs font-black text-[#665b4c]">캠페인<input value={campaign} onChange={(event) => setCampaign(event.target.value)} placeholder="heungdeok-v1" className="h-10 rounded-xl border border-[#ddc89f] bg-white px-3 text-sm" /></label>
        <label className="grid gap-1 text-xs font-black text-[#665b4c]">소재<input value={content} onChange={(event) => setContent(event.target.value)} placeholder="video-a" className="h-10 rounded-xl border border-[#ddc89f] bg-white px-3 text-sm" /></label>
      </section>

      {list.isLoading ? <p className="mt-8 text-sm font-bold text-[#746958]">상담 신청을 불러오는 중...</p> : null}
      {list.error ? <p className="mt-8 text-sm font-bold text-[#a43b2b]">상담 신청 목록을 불러오지 못했습니다.</p> : null}
      {list.data?.items.length === 0 ? <p className="mt-8 rounded-2xl bg-white p-8 text-center text-sm font-bold text-[#746958]">조건에 맞는 상담 신청이 없습니다.</p> : null}

      {list.data?.items.length ? <div className="mt-6 overflow-x-auto rounded-2xl border border-[#ead9b7] bg-white"><table className="min-w-[980px] w-full text-left text-sm"><thead className="bg-[#fff7e8] text-xs font-black text-[#716656]"><tr><th className="px-4 py-3">접수</th><th className="px-4 py-3">보호자·자녀</th><th className="px-4 py-3">연락</th><th className="px-4 py-3">유입 경로</th><th className="px-4 py-3">상태</th><th className="px-4 py-3">메모</th></tr></thead><tbody className="divide-y divide-[#efe2c8]">{list.data.items.map((lead) => <tr key={lead.id} className="align-top"><td className="px-4 py-4 text-[#766a59]">{new Date(lead.createdAt).toLocaleString('ko-KR')}</td><td className="px-4 py-4"><p className="font-black text-[#29251f]">{lead.guardianName}</p><p className="mt-1 text-xs text-[#766a59]">만 {lead.childAge}세</p></td><td className="px-4 py-4"><a href={`tel:${lead.phone}`} className="font-black text-[#a94700] underline underline-offset-4">{phoneLabel(lead.phone)}</a><p className="mt-1 text-xs text-[#766a59]">{lead.contactWindow === 'H13_15' ? '13~15시' : lead.contactWindow === 'H15_18' ? '15~18시' : '18~20시'}</p></td><td className="px-4 py-4"><p className="font-bold text-[#413a31]">{lead.utmSource ?? 'direct'} / {lead.utmCampaign ?? '-'} / {lead.utmContent ?? '-'}</p><p className="mt-1 max-w-60 truncate text-xs text-[#827562]">{lead.landingPath ?? '-'}</p></td><td className="px-4 py-4"><select aria-label={`${lead.guardianName} 상태`} value={lead.status} disabled={updateMutation.isPending} onChange={(event) => updateMutation.mutate({ id: lead.id, input: { status: event.target.value as LeadStatus } })} className="h-10 rounded-xl border border-[#ddc89f] bg-white px-3 font-bold">{statuses.map((item) => <option key={item} value={item}>{STATUS_LABELS[item]}</option>)}</select></td><td className="px-4 py-4"><input aria-label={`${lead.guardianName} 메모`} defaultValue={lead.adminNote ?? ''} onBlur={(event) => updateMutation.mutate({ id: lead.id, input: { adminNote: event.target.value || null } })} placeholder="상담 메모" className="h-10 w-48 rounded-xl border border-[#ddc89f] px-3" /></td></tr>)}</tbody></table></div> : null}
    </div>
  )
}

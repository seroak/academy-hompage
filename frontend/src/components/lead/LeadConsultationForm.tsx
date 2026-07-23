'use client'

import Link from 'next/link'
import { useCallback, useRef, useState } from 'react'
import { createLead } from '../../api/leads.api'
import { ContactWindowSchema, type ContactWindow } from '../../api/schemas/lead.schema'
import { ApiError } from '../../lib/apiClient'
import { isInAppBrowser } from '../../lib/browser/inAppBrowser'
import { readAttribution } from '../../lib/marketing/attribution'
import { sendTrackingEvent } from '../../lib/marketing/events'
import TurnstileWidget from './TurnstileWidget'

const fieldClass = 'h-12 w-full rounded-xl border border-[#ddcda9] bg-[#fffcf5] px-4 text-base font-bold text-[#30291f] outline-none transition focus:border-[#df6500] focus:ring-2 focus:ring-[#ffd39b]'
const contactWindows: { value: ContactWindow; label: string }[] = [
  { value: 'H09_10', label: '9~10시' },
  { value: 'H10_11', label: '10~11시' },
  { value: 'H11_12', label: '11~12시' },
  { value: 'H12_13', label: '12~13시' },
  { value: 'H13_14', label: '13~14시' },
  { value: 'H14_15', label: '14~15시' },
  { value: 'H15_16', label: '15~16시' },
  { value: 'H16_17', label: '16~17시' },
  { value: 'H17_18', label: '17~18시' },
  { value: 'H18_19', label: '18~19시' },
  { value: 'H19_20', label: '19~20시' },
  { value: 'H20_21', label: '20~21시' },
]

function readTextField(form: FormData, name: string) {
  const value = form.get(name)
  return typeof value === 'string' ? value : ''
}

export default function LeadConsultationForm() {
  const [turnstileToken, setTurnstileToken] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState('')
  const started = useRef(false)
  const handleToken = useCallback((token: string) => setTurnstileToken(token), [])

  const markStarted = () => {
    if (started.current) return
    started.current = true
    sendTrackingEvent('lead_form_start')
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    sendTrackingEvent('lead_submit_attempt')
    if (!event.currentTarget.checkValidity()) {
      sendTrackingEvent('lead_submit_blocked')
      event.currentTarget.reportValidity()
      return
    }
    if (!turnstileToken && !isInAppBrowser()) {
      sendTrackingEvent('lead_submit_blocked')
      setError('자동 입력 방지 확인을 완료해 주세요.')
      return
    }

    const form = new FormData(event.currentTarget)
    const attribution = readAttribution()
    setIsSubmitting(true)
    try {
      await createLead({
        guardianName: readTextField(form, 'guardianName'),
        phone: readTextField(form, 'phone'),
        childAge: Number(form.get('childAge')),
        contactWindow: ContactWindowSchema.parse(readTextField(form, 'contactWindow')),
        privacyConsent: true,
        privacyConsentVersion: '2026-07-15',
        turnstileToken,
        utmSource: attribution?.utmSource,
        utmMedium: attribution?.utmMedium,
        utmCampaign: attribution?.utmCampaign,
        utmContent: attribution?.utmContent,
        utmTerm: attribution?.utmTerm,
        fbclid: attribution?.fbclid,
        landingPath: attribution?.landingPath ?? window.location.pathname,
        referrer: attribution?.referrer ?? document.referrer,
        analyticsConsent: false,
        marketingConsent: false,
      })
      sendTrackingEvent('generate_lead')
      setIsComplete(true)
    } catch (cause) {
      sendTrackingEvent('lead_submit_error')
      setError(cause instanceof ApiError && cause.status < 500 ? cause.message : '상담 신청을 접수하지 못했습니다. 잠시 후 다시 시도해 주세요.')
      window.turnstile?.reset()
      setTurnstileToken('')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isComplete) {
    return (
      <div className="rounded-[28px] bg-[#264f3f] p-7 text-[#fffaf0]" aria-live="polite">
        <p className="text-xs font-black tracking-[0.15em] text-[#ffd27d]">상담 신청 완료</p>
        <h2 className="mt-3 text-2xl font-black">매일 9~21시 확인 후 연락드립니다</h2>
        <p className="mt-3 text-sm font-medium leading-6 text-[#e6eee9]">아이에게 맞는 수업 과정을 차분히 안내해 드릴게요.</p>
        <Link href="/courses?utm_source=lead_landing&utm_medium=completion&utm_campaign=heungdeok-v1" className="mt-6 inline-flex rounded-full bg-[#ffd27d] px-5 py-3 text-sm font-black text-[#264f3f]">수업 안내 보기</Link>
      </div>
    )
  }

  return (
    <form id="consultation-form" noValidate onSubmit={handleSubmit} onFocusCapture={markStarted} className="rounded-[28px] bg-[#fffdf7] p-6 shadow-[0_24px_60px_rgba(82,54,12,0.15)] sm:p-8">
      <p className="text-xs font-black tracking-[0.16em] text-[#d55f00]">1분 상담 신청</p>
      <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#27231d]">아이에게 맞는 시작점을 찾아보세요</h2>
      <p className="mt-2 text-sm font-medium leading-6 text-[#6d6252]">자녀 실명과 상세 시간표는 첫 신청에서 받지 않습니다.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-black text-[#4a4135]">보호자 이름<input name="guardianName" required maxLength={50} autoComplete="name" className={fieldClass} /></label>
        <label className="grid gap-2 text-sm font-black text-[#4a4135]">휴대전화<input name="phone" required inputMode="tel" autoComplete="tel" placeholder="010-0000-0000" className={fieldClass} /></label>
        <label className="grid gap-2 text-sm font-black text-[#4a4135]">자녀 만 나이<select name="childAge" required defaultValue="" className={fieldClass}><option value="" disabled>선택해 주세요</option>{Array.from({ length: 5 }, (_, index) => index + 5).map((age) => <option key={age} value={age}>{age === 9 ? '9세 이상' : `${age}세`}</option>)}</select></label>
        <label className="grid gap-2 text-sm font-black text-[#4a4135]">연락 가능 시간<select name="contactWindow" required defaultValue="" className={fieldClass}><option value="" disabled>선택해 주세요</option>{contactWindows.map((window) => <option key={window.value} value={window.value}>{window.label}</option>)}</select></label>
      </div>
      <label className="mt-5 flex items-start gap-3 text-sm font-bold leading-6 text-[#5a5043]"><input type="checkbox" required className="mt-1 size-4 accent-[#d96000]" /> <span>개인정보 수집·이용에 동의합니다. <Link href="/privacy" target="_blank" className="underline underline-offset-4">개인정보처리방침 자세히 보기</Link></span></label>
      <div className="mt-5"><TurnstileWidget onToken={handleToken} /></div>
      {error ? <p role="alert" className="mt-4 rounded-xl bg-[#fff0e8] p-3 text-sm font-black text-[#a43b2b]">{error}</p> : null}
      <button type="submit" disabled={isSubmitting} className="mt-5 h-14 w-full rounded-full bg-[#d96000] px-6 text-base font-black text-white transition hover:bg-[#b94e00] disabled:cursor-wait disabled:opacity-60">{isSubmitting ? '접수 중...' : '무료로 수업 방향 상담받기'}</button>
    </form>
  )
}

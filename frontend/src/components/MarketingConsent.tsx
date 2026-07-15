'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  captureAttribution,
  isTrackingEventName,
  loadAnalyticsTracking,
  loadMarketingTracking,
  readConsent,
  sendTrackingEvent,
  type ConsentPreferences,
  writeConsent,
} from '../lib/marketing'

const defaultPreferences = { analytics: false, marketing: false }

export default function MarketingConsent() {
  const [preferences, setPreferences] = useState<ConsentPreferences | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    captureAttribution(window.location, document.referrer)
    const saved = readConsent()
    setPreferences(saved)
    setIsOpen(!saved)

    const open = () => setIsOpen(true)
    window.addEventListener('openmath:open-consent', open)
    return () => window.removeEventListener('openmath:open-consent', open)
  }, [])

  useEffect(() => {
    if (!preferences) return
    if (preferences.analytics) loadAnalyticsTracking(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID)
    if (preferences.marketing) loadMarketingTracking(process.env.NEXT_PUBLIC_META_PIXEL_ID)
  }, [preferences])

  useEffect(() => {
    const handleTrackingEvent = (event: Event) => {
      if (!preferences || !('detail' in event)) return
      const detail = (event as CustomEvent<{ name?: unknown }>).detail
      if (isTrackingEventName(detail?.name)) sendTrackingEvent(detail.name, preferences)
    }
    window.addEventListener('openmath:track', handleTrackingEvent)
    return () => window.removeEventListener('openmath:track', handleTrackingEvent)
  }, [preferences])

  if (!isOpen) return null

  const selected = preferences ?? { ...defaultPreferences, updatedAt: '' }
  const save = () => {
    const next = writeConsent({ analytics: selected.analytics, marketing: selected.marketing })
    setPreferences(next)
    setIsOpen(false)
  }

  return (
    <dialog open aria-labelledby="marketing-consent-title" className="fixed inset-x-4 bottom-4 z-50 m-0 w-auto max-w-xl rounded-3xl border border-[#f2dfb9] bg-white p-0 text-[#222222] shadow-[0_20px_60px_rgba(68,44,10,0.25)] sm:left-auto sm:right-6 sm:w-[32rem]">
      <div className="p-6">
        <h2 id="marketing-consent-title" className="text-lg font-black">분석 및 마케팅 설정</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-[#655b4d]">
          방문 통계와 광고 성과 측정은 선택 동의 후에만 사용합니다. 자세한 내용은 <Link href="/privacy" className="font-black text-[#b55b00] underline underline-offset-4">개인정보처리방침</Link>에서 확인할 수 있습니다.
        </p>
        <div className="mt-5 grid gap-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-[#fffaf0] p-4 text-sm font-bold">
            <input aria-label="분석 쿠키" type="checkbox" checked={selected.analytics} onChange={(event) => setPreferences({ ...selected, analytics: event.target.checked })} className="mt-1 size-4 accent-[#e86f00]" />
            <span><span className="block text-[#3f3528]">분석 쿠키</span><span className="mt-1 block font-medium leading-5 text-[#655b4d]">GA4로 방문과 버튼 이용을 익명 통계로 확인합니다.</span></span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-[#fffaf0] p-4 text-sm font-bold">
            <input aria-label="마케팅 쿠키" type="checkbox" checked={selected.marketing} onChange={(event) => setPreferences({ ...selected, marketing: event.target.checked })} className="mt-1 size-4 accent-[#e86f00]" />
            <span><span className="block text-[#3f3528]">마케팅 쿠키</span><span className="mt-1 block font-medium leading-5 text-[#655b4d]">Meta Pixel로 광고 성과를 익명 측정합니다.</span></span>
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => { setPreferences(writeConsent(defaultPreferences)); setIsOpen(false) }} className="rounded-full px-4 py-2 text-sm font-black text-[#655b4d] underline underline-offset-4">거부</button>
          <button type="button" onClick={save} className="rounded-full bg-[#e86f00] px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-[#ca5e00]">선택 저장</button>
        </div>
      </div>
    </dialog>
  )
}

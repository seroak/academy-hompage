'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import {
  DAY_OF_WEEK_LABELS,
  RESERVATION_STATUS_LABELS,
  timeRangeLabel,
  type Reservation,
} from '../api/schemas/reservation.schema'

interface ReservationDetailModalProps {
  reservation: Reservation | null
  onClose: () => void
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const rowLabelClass = 'text-xs font-black text-[#8a7a61]'
const rowValueClass = 'text-sm font-bold text-[#222222]'

export default function ReservationDetailModal({ reservation, onClose }: ReservationDetailModalProps) {
  useEffect(() => {
    if (!reservation) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [reservation, onClose])

  if (!reservation) {
    return null
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[100] grid place-items-center bg-[#2b2418]/45 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-detail-title"
        className="max-h-[calc(100vh-48px)] w-full max-w-[440px] overflow-y-auto rounded-[28px] border border-[#f2dfb9] bg-[#fff9ec] p-6 shadow-[0_24px_70px_rgba(48,33,10,0.24)] sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black text-[#e86f00]">예약 상세</p>
            <h1 id="reservation-detail-title" className="mt-1 text-xl font-black text-[#222222]">
              {reservation.childName}{' '}
              <span className="text-base font-bold text-[#6a6256]">(만 {reservation.childAge}세)</span>
            </h1>
          </div>
          <button
            type="button"
            aria-label="예약 상세 닫기"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[#3f3a31] shadow-[0_8px_20px_rgba(48,33,10,0.08)] transition hover:text-[#d6452f]"
          >
            <X size={20} />
          </button>
        </div>

        <dl className="mt-6 grid gap-4">
          <div className="flex flex-col gap-1">
            <dt className={rowLabelClass}>보호자 이름</dt>
            <dd className={rowValueClass}>{reservation.parentName}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className={rowLabelClass}>이메일</dt>
            <dd className={rowValueClass}>{reservation.parentEmail}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className={rowLabelClass}>전화번호</dt>
            <dd className={rowValueClass}>{reservation.parentPhone || '미입력'}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className={rowLabelClass}>희망 시간</dt>
            <dd className="flex flex-wrap gap-2">
              {reservation.preferredSlots.map((slot) => (
                <span
                  key={`${slot.dayOfWeek}-${slot.startMinute}-${slot.endMinute}`}
                  className="rounded-full bg-[#fff0cf] px-3 py-1 text-xs font-black text-[#9f4d00]"
                >
                  {DAY_OF_WEEK_LABELS[slot.dayOfWeek as keyof typeof DAY_OF_WEEK_LABELS] ?? slot.dayOfWeek}{' '}
                  {timeRangeLabel(slot.startMinute, slot.endMinute)}
                </span>
              ))}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className={rowLabelClass}>상태</dt>
            <dd className={rowValueClass}>
              {RESERVATION_STATUS_LABELS[reservation.status] ?? reservation.status}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className={rowLabelClass}>요청사항</dt>
            <dd className={`${rowValueClass} whitespace-pre-wrap`}>{reservation.note || '요청사항 없음'}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className={rowLabelClass}>신청일</dt>
            <dd className={rowValueClass}>{formatDate(reservation.createdAt)}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

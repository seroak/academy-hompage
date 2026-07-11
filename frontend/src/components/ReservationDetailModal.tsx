'use client'

import { useEffect, useState, type SubmitEvent } from 'react'
import { X } from 'lucide-react'
import {
  DAY_OF_WEEK_LABELS,
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_OPTIONS,
  parseReservationStatus,
  UpdateReservationInputSchema,
  timeRangeLabel,
  type PreferredSlot,
  type Reservation,
  type UpdateReservationInput,
} from '../api/schemas/reservation.schema'
import PreferredSlotsPicker from './PreferredSlotsPicker'

interface ReservationDetailModalProps {
  reservation: Reservation | null
  onClose: () => void
  onSave?: (id: string, input: UpdateReservationInput) => Promise<void>
  isSaving?: boolean
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
const inputClass =
  'w-full rounded-xl border border-[#f2dfb9] bg-white px-3 py-2 text-sm font-bold text-[#222222] outline-none focus:border-[#e86f00]'
const errorTextClass = 'text-xs font-bold text-[#d6452f]'

interface FormState {
  childName: string
  childAge: number
  parentName: string
  parentEmail: string
  parentPhone: string
  note: string
  status: Reservation['status']
  preferredSlots: PreferredSlot[]
}

function formFromReservation(reservation: Reservation): FormState {
  return {
    childName: reservation.childName,
    childAge: reservation.childAge,
    parentName: reservation.parentName,
    parentEmail: reservation.parentEmail,
    parentPhone: reservation.parentPhone ?? '',
    note: reservation.note ?? '',
    status: reservation.status,
    preferredSlots: reservation.preferredSlots,
  }
}

interface ReservationDetailContentProps {
  reservation: Reservation
  onClose: () => void
  onSave?: (id: string, input: UpdateReservationInput) => Promise<void>
  isSaving?: boolean
}

function ReservationDetailContent({ reservation, onClose, onSave, isSaving }: ReservationDetailContentProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<FormState>(() => formFromReservation(reservation))
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  function handleStartEdit() {
    setForm(formFromReservation(reservation))
    setFieldErrors({})
    setSubmitError(null)
    setIsEditing(true)
  }

  function handleCancelEdit() {
    setFieldErrors({})
    setSubmitError(null)
    setIsEditing(false)
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!onSave) return

    const input = {
      childName: form.childName,
      childAge: Number(form.childAge),
      parentName: form.parentName,
      parentEmail: form.parentEmail,
      parentPhone: form.parentPhone || undefined,
      note: form.note || undefined,
      status: form.status,
      preferredSlots: form.preferredSlots.map(({ dayOfWeek, startMinute, endMinute }) => ({
        dayOfWeek,
        startMinute,
        endMinute,
      })),
    }

    const result = UpdateReservationInputSchema.safeParse(input)
    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        errors[String(issue.path[0])] = issue.message
      }
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setSubmitError(null)

    try {
      await onSave(reservation.id, result.data)
      setIsEditing(false)
    } catch {
      setSubmitError('학생 정보를 수정하지 못했습니다.')
    }
  }

  if (!isEditing) {
    return (
      <dialog
        open
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

        {onSave && (
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleStartEdit}
              className="rounded-full bg-[#fff0cf] px-5 py-2.5 text-sm font-black text-[#e86f00] transition hover:bg-[#ffe6ad]"
            >
              수정
            </button>
          </div>
        )}
      </dialog>
    )
  }

  return (
    <dialog
      open
      aria-modal="true"
      aria-label="예약 정보 수정"
      className="max-h-[calc(100vh-48px)] w-full max-w-[820px] overflow-y-auto overflow-x-hidden rounded-[28px] border border-[#f2dfb9] bg-[#fff9ec] p-6 shadow-[0_24px_70px_rgba(48,33,10,0.24)] sm:p-8"
    >
      <form onSubmit={handleSubmit}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black text-[#e86f00]">예약 정보 수정</p>
          <h1 className="mt-1 text-xl font-black text-[#222222]">{reservation.childName}</h1>
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

      <div className="mt-6 grid gap-4">
        <div className="flex flex-col gap-1">
          <label className={rowLabelClass} htmlFor="detail-childName">
            아이 이름
          </label>
          <input
            id="detail-childName"
            className={inputClass}
            value={form.childName}
            onChange={(event) => setForm((prev) => ({ ...prev, childName: event.target.value }))}
          />
          {fieldErrors.childName && <p className={errorTextClass}>{fieldErrors.childName}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label className={rowLabelClass} htmlFor="detail-childAge">
            아이 나이 (만)
          </label>
          <input
            id="detail-childAge"
            type="number"
            min={4}
            max={10}
            className={inputClass}
            value={form.childAge}
            onChange={(event) => setForm((prev) => ({ ...prev, childAge: Number(event.target.value) }))}
          />
          {fieldErrors.childAge && <p className={errorTextClass}>{fieldErrors.childAge}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label className={rowLabelClass} htmlFor="detail-parentName">
            보호자 이름
          </label>
          <input
            id="detail-parentName"
            className={inputClass}
            value={form.parentName}
            onChange={(event) => setForm((prev) => ({ ...prev, parentName: event.target.value }))}
          />
          {fieldErrors.parentName && <p className={errorTextClass}>{fieldErrors.parentName}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label className={rowLabelClass} htmlFor="detail-parentEmail">
            이메일
          </label>
          <input
            id="detail-parentEmail"
            type="email"
            className={inputClass}
            value={form.parentEmail}
            onChange={(event) => setForm((prev) => ({ ...prev, parentEmail: event.target.value }))}
          />
          {fieldErrors.parentEmail && <p className={errorTextClass}>{fieldErrors.parentEmail}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label className={rowLabelClass} htmlFor="detail-parentPhone">
            전화번호
          </label>
          <input
            id="detail-parentPhone"
            className={inputClass}
            value={form.parentPhone}
            onChange={(event) => setForm((prev) => ({ ...prev, parentPhone: event.target.value }))}
          />
          {fieldErrors.parentPhone && <p className={errorTextClass}>{fieldErrors.parentPhone}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label className={rowLabelClass} htmlFor="detail-status">
            상태
          </label>
          <select
            id="detail-status"
            className={inputClass}
            value={form.status}
            onChange={(event) => {
              const status = parseReservationStatus(event.target.value)
              if (status) setForm((prev) => ({ ...prev, status }))
            }}
          >
            {RESERVATION_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {RESERVATION_STATUS_LABELS[option]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className={rowLabelClass} htmlFor="detail-note">
            요청사항
          </label>
          <textarea
            id="detail-note"
            className={`${inputClass} min-h-20`}
            value={form.note}
            onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className={rowLabelClass}>희망 시간</span>
          <PreferredSlotsPicker
            value={form.preferredSlots}
            onChange={(slots) => setForm((prev) => ({ ...prev, preferredSlots: slots }))}
            childAge={form.childAge}
          />
          {fieldErrors.preferredSlots && <p className={errorTextClass}>{fieldErrors.preferredSlots}</p>}
        </div>
      </div>

      {submitError && <p className="mt-4 text-sm font-bold text-[#d6452f]">{submitError}</p>}

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={handleCancelEdit}
          disabled={isSaving}
          className="rounded-full bg-white px-5 py-2.5 text-sm font-black text-[#3f3a31] shadow-[0_8px_20px_rgba(48,33,10,0.08)] transition hover:text-[#d6452f] disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-full bg-[#e86f00] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#d6452f] disabled:opacity-50"
        >
          {isSaving ? '저장 중…' : '저장'}
        </button>
      </div>
      </form>
    </dialog>
  )
}

export default function ReservationDetailModal({ reservation, onClose, onSave, isSaving }: ReservationDetailModalProps) {
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
      <ReservationDetailContent
        key={reservation.id}
        reservation={reservation}
        onClose={onClose}
        onSave={onSave}
        isSaving={isSaving}
      />
    </div>
  )
}

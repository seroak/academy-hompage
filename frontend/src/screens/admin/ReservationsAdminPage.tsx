'use client'

import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useReservationsQuery } from './hooks/useReservationsQuery'
import { useReservationGroupsQuery } from './hooks/useReservationGroupsQuery'
import { useReservationMutations } from './hooks/useReservationMutations'
import { useReservationGroupMutations } from './hooks/useReservationGroupMutations'
import {
  DAY_OF_WEEK_LABELS,
  DAY_OF_WEEK_OPTIONS,
  HOUR_OPTIONS,
  hourLabel,
  type Reservation,
} from '../../api/schemas/reservation.schema'
import { CreateReservationGroupInputSchema } from '../../api/schemas/reservation-group.schema'

const CHILD_AGE_OPTIONS = [4, 5, 6, 7, 8, 9, 10]

const emptyGroupForm = {
  label: '',
  dayOfWeek: 'MON' as (typeof DAY_OF_WEEK_OPTIONS)[number],
  hour: 12 as (typeof HOUR_OPTIONS)[number],
}

const fieldClass =
  'h-11 rounded-2xl border border-[#f2dfb9] bg-[#fffdf8] px-4 text-sm font-semibold text-[#2f281d] outline-none transition focus:border-[#ff8a1f] focus:bg-white focus:ring-4 focus:ring-[#ffd66b]/25'

const labelClass = 'flex flex-col gap-2 text-sm font-black text-[#3f3a31]'
const errorClass = 'text-xs font-bold text-[#d6452f]'

function cellBackground(count: number): string {
  if (count === 0) return 'bg-white'
  if (count === 1) return 'bg-[#fffaf0]'
  if (count === 2) return 'bg-[#fff3c8]'
  return 'bg-[#ffe9a6]'
}

export default function ReservationsAdminPage() {
  const [ageFilter, setAgeFilter] = useState<number | undefined>(undefined)
  const { reservations, isLoading, error } = useReservationsQuery(
    ageFilter !== undefined ? { age: ageFilter } : {},
  )
  const { groups } = useReservationGroupsQuery()
  const { deleteReservation } = useReservationMutations()
  const { createGroup, deleteGroup, isCreating, createError } = useReservationGroupMutations()

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [groupForm, setGroupForm] = useState(emptyGroupForm)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const groupLabelByReservationId = useMemo(() => {
    const map = new Map<string, string>()
    for (const group of groups) {
      for (const reservation of group.reservations ?? []) {
        map.set(reservation.id, group.label)
      }
    }
    return map
  }, [groups])

  const waiting = reservations.filter((r) => r.status === 'WAITING')
  const grouped = reservations.filter((r) => r.status === 'GROUPED')
  const cancelledCount = reservations.filter((r) => r.status === 'CANCELLED').length
  function hasPreferredSlot(reservation: Reservation, day: string, hour: number): boolean {
    return reservation.preferredSlots.some((slot) => slot.dayOfWeek === day && slot.hour === hour)
  }

  function cellReservations(day: string, hour: number) {
    return {
      waitingInCell: waiting.filter((r) => hasPreferredSlot(r, day, hour)),
      groupedInCell: groups
        .filter((group) => group.status === 'CONFIRMED' && group.dayOfWeek === day && group.hour === hour)
        .flatMap((group) => group.reservations ?? []),
    }
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function selectCell(day: (typeof DAY_OF_WEEK_OPTIONS)[number], hour: (typeof HOUR_OPTIONS)[number]) {
    const { waitingInCell } = cellReservations(day, hour)
    setSelectedIds(new Set(waitingInCell.map((r) => r.id)))
    setGroupForm({
      label: groupForm.label || `${DAY_OF_WEEK_LABELS[day]}요일 ${hourLabel(hour)}반`,
      dayOfWeek: day,
      hour,
    })
  }

  async function handleConfirmGroup(event: FormEvent) {
    event.preventDefault()
    const input = { ...groupForm, reservationIds: Array.from(selectedIds) }
    const result = CreateReservationGroupInputSchema.safeParse(input)
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
      await createGroup(result.data)
      setSelectedIds(new Set())
      setGroupForm(emptyGroupForm)
    } catch {
      setSubmitError('그룹 확정에 실패했습니다.')
    }
  }

  async function handleCancelReservation(id: string) {
    if (!window.confirm('이 신청을 취소하시겠습니까?')) return
    try {
      await deleteReservation(id)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    } catch {
      window.alert('신청을 취소하지 못했습니다.')
    }
  }

  async function handleCancelGroup(id: string) {
    if (!window.confirm('이 그룹을 취소하시겠습니까? 소속 신청은 다시 대기 상태로 돌아갑니다.')) return
    try {
      await deleteGroup(id)
    } catch {
      window.alert('그룹을 취소하지 못했습니다.')
    }
  }

  function reservationTitle(r: Reservation): string {
    return `${r.parentName} · ${r.parentEmail}${r.parentPhone ? ` · ${r.parentPhone}` : ''}`
  }

  const confirmedGroupsCount = groups.filter((g) => g.status === 'CONFIRMED').length
  const statCards = [
    { label: '대기중', count: waiting.length, className: 'bg-[#fff3c8] text-[#9f4d00]' },
    { label: '그룹편성', count: grouped.length, className: 'bg-[#e9f9ec] text-[#2f7a3d]' },
    { label: '확정된 그룹', count: confirmedGroupsCount, className: 'bg-[#e7f4ff] text-[#236c9c]' },
    { label: '취소됨', count: cancelledCount, className: 'bg-[#fff5f1] text-[#d6452f]' },
  ]

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 rounded-[28px] bg-white px-6 py-6 shadow-[0_18px_46px_rgba(95,67,18,0.08)] sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div>
          <p className="text-sm font-black text-[#e86f00]">상담 예약 운영</p>
          <h1 className="mt-2 text-3xl font-black leading-tight tracking-[-0.01em] text-[#222222]">
            예약 관리
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#6f6253]">
            학부모 상담 신청을 요일과 시간별로 확인하고, 아이들의 수업 그룹을 확정합니다.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#fff3c8] px-4 py-2 text-sm font-black text-[#9f4d00]">
          총 예약
          <span className="text-lg text-[#e86f00]">{reservations.length}</span>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-[24px] border border-[#f2dfb9] bg-white p-5 shadow-[0_14px_36px_rgba(95,67,18,0.07)]"
          >
            <p className={`w-fit rounded-full px-3 py-1 text-xs font-black ${card.className}`}>
              {card.label}
            </p>
            <p className="mt-4 text-3xl font-black text-[#222222]">{card.count}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3 rounded-[24px] border border-[#f2dfb9] bg-white p-5 shadow-[0_14px_36px_rgba(95,67,18,0.07)] sm:flex-row sm:items-end sm:justify-between">
        <label className={labelClass}>
          나이 필터
          <select
            className={fieldClass}
            value={ageFilter ?? ''}
            onChange={(e) => setAgeFilter(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">전체</option>
            {CHILD_AGE_OPTIONS.map((age) => (
              <option key={age} value={age}>
                만 {age}세
              </option>
            ))}
          </select>
        </label>
        <p className="max-w-xl text-sm font-semibold leading-6 text-[#6f6253]">
          선택한 나이에 맞는 신청만 시간표에 표시됩니다.
        </p>
      </section>

      {isLoading && (
        <p className="rounded-[24px] border border-[#f2dfb9] bg-white px-5 py-4 text-sm font-bold text-[#6f6253]">
          불러오는 중...
        </p>
      )}
      {error && (
        <p className="rounded-[24px] border border-[#ffd6cc] bg-[#fff5f1] px-5 py-4 text-sm font-bold text-[#d6452f]">
          목록을 불러오지 못했습니다.
        </p>
      )}

      {!isLoading && !error && (
        <>
          <div className="overflow-x-auto rounded-[28px] border border-[#f2dfb9] bg-white shadow-[0_18px_46px_rgba(95,67,18,0.08)]">
            <table className="w-full min-w-[920px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-18 border-b border-[#f2dfb9] bg-[#fffaf0] p-3 text-xs font-black text-[#6f6253]">
                    시간
                  </th>
                  {DAY_OF_WEEK_OPTIONS.map((day) => (
                    <th
                      key={day}
                      className="min-w-[140px] border-b border-l border-[#f2dfb9] bg-[#fffaf0] p-3 text-xs font-black text-[#6f6253]"
                    >
                      {DAY_OF_WEEK_LABELS[day]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOUR_OPTIONS.map((hour) => (
                  <tr key={hour}>
                    <td className="border-b border-[#f6ead0] p-3 text-xs font-black text-[#6f6253]">
                      {hourLabel(hour)}
                    </td>
                    {DAY_OF_WEEK_OPTIONS.map((day) => {
                      const { waitingInCell, groupedInCell } = cellReservations(day, hour)
                      return (
                        <td
                          key={day}
                          className={`border-b border-l border-[#f6ead0] p-2 align-top ${cellBackground(waitingInCell.length)}`}
                        >
                          <div className="flex min-h-16 flex-col gap-1.5">
                            {waitingInCell.map((reservation) => (
                              <div key={reservation.id} className="flex items-center gap-1">
                                <button
                                  type="button"
                                  title={reservationTitle(reservation)}
                                  onClick={() => toggleSelected(reservation.id)}
                                  className={`flex-1 truncate rounded-full px-3 py-1.5 text-left text-xs font-black transition ${
                                    selectedIds.has(reservation.id)
                                      ? 'bg-[#ff8a1f] text-white shadow-[0_8px_18px_rgba(255,138,31,0.22)]'
                                      : 'border border-[#f2dfb9] bg-white text-[#3f3a31] hover:border-[#ffd66b] hover:text-[#e86f00]'
                                  }`}
                                >
                                  {reservation.childName}
                                  <span className="ml-1 opacity-70">({reservation.childAge})</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCancelReservation(reservation.id)}
                                  aria-label="신청 취소"
                                  className="grid size-7 shrink-0 place-items-center rounded-full text-[#d8bfa0] transition hover:bg-[#fff5f1] hover:text-[#d6452f]"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            {groupedInCell.map((reservation) => (
                              <span
                                key={reservation.id}
                                title={groupLabelByReservationId.get(reservation.id) ?? '편성됨'}
                                className="rounded-full bg-[#e7f4ff] px-3 py-1 text-[11px] font-bold text-[#236c9c]"
                              >
                                {reservation.childName} · 편성됨
                              </span>
                            ))}
                            {waitingInCell.length >= 1 && (
                              <button
                                type="button"
                                onClick={() => selectCell(day, hour)}
                                className="text-left text-[10px] font-black text-[#e86f00] hover:underline"
                              >
                                이 칸 전체 선택
                              </button>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs font-semibold leading-5 text-[#6f6253]">
            칸의 진하기는 해당 요일·시간에 대기중인 신청 인원 수를 나타냅니다. 이름을 클릭해 그룹 확정
            대상으로 선택하세요.
          </p>
        </>
      )}

      <form
        onSubmit={handleConfirmGroup}
        className="grid gap-5 rounded-[28px] border border-[#f2dfb9] bg-white p-6 shadow-[0_18px_46px_rgba(95,67,18,0.08)] sm:grid-cols-3 sm:p-8"
      >
        <div className="col-span-full flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-[#e86f00]">선택 신청 묶기</p>
            <h2 className="mt-1 text-xl font-black text-[#222222]">그룹 확정</h2>
          </div>
          <span className="w-fit rounded-full bg-[#fff3c8] px-3 py-1 text-xs font-black text-[#9f4d00]">
            선택 {selectedIds.size}명
          </span>
        </div>

        <label className={labelClass}>
          그룹 이름
          <input
            className={fieldClass}
            value={groupForm.label}
            onChange={(e) => setGroupForm({ ...groupForm, label: e.target.value })}
            placeholder="예: 월요일 12시반"
          />
          {fieldErrors.label && <span className={errorClass}>{fieldErrors.label}</span>}
        </label>

        <label className={labelClass}>
          확정 요일
          <select
            className={fieldClass}
            value={groupForm.dayOfWeek}
            onChange={(e) =>
              setGroupForm({
                ...groupForm,
                dayOfWeek: e.target.value as (typeof DAY_OF_WEEK_OPTIONS)[number],
              })
            }
          >
            {DAY_OF_WEEK_OPTIONS.map((day) => (
              <option key={day} value={day}>
                {DAY_OF_WEEK_LABELS[day]}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          확정 시간
          <select
            className={fieldClass}
            value={groupForm.hour}
            onChange={(e) =>
              setGroupForm({ ...groupForm, hour: Number(e.target.value) as (typeof HOUR_OPTIONS)[number] })
            }
          >
            {HOUR_OPTIONS.map((hour) => (
              <option key={hour} value={hour}>
                {hourLabel(hour)}
              </option>
            ))}
          </select>
        </label>

        <p className="col-span-full rounded-[20px] bg-[#fff9ec] px-4 py-3 text-sm font-black text-[#6f6253]">
          선택된 신청: {selectedIds.size}명
        </p>
        {fieldErrors.reservationIds && (
          <p className={`col-span-full ${errorClass}`}>{fieldErrors.reservationIds}</p>
        )}
        {(submitError || createError) && (
          <p className={`col-span-full ${errorClass}`}>
            {submitError ?? '그룹 확정에 실패했습니다.'}
          </p>
        )}

        <div className="col-span-full">
          <button
            type="submit"
            disabled={isCreating || selectedIds.size === 0}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#ff8a1f] px-6 text-sm font-black text-white shadow-[0_14px_28px_rgba(255,138,31,0.24)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#e86f00] disabled:translate-y-0 disabled:opacity-50"
          >
            선택한 신청으로 그룹 확정
          </button>
        </div>
      </form>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black text-[#222222]">확정된 그룹</h2>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#e86f00]">
            총 {groups.length}개
          </span>
        </div>
        <ul className="grid gap-4">
          {groups.length === 0 && (
            <li className="rounded-[28px] border border-[#f2dfb9] bg-white px-6 py-10 text-center shadow-[0_18px_46px_rgba(95,67,18,0.08)]">
              <p className="text-base font-black text-[#222222]">확정된 그룹이 없습니다.</p>
              <p className="mt-2 text-sm font-semibold text-[#6f6253]">
                시간표에서 신청을 선택한 뒤 그룹을 확정해 주세요.
              </p>
            </li>
          )}
          {groups.map((group) => (
            <li
              key={group.id}
              className="rounded-[28px] border border-[#f2dfb9] bg-white p-5 shadow-[0_14px_36px_rgba(95,67,18,0.07)]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-black text-[#222222]">{group.label}</p>
                    <span className="rounded-full bg-[#fff3c8] px-3 py-1 text-xs font-black text-[#9f4d00]">
                      {DAY_OF_WEEK_LABELS[group.dayOfWeek as keyof typeof DAY_OF_WEEK_LABELS] ??
                        group.dayOfWeek}{' '}
                      {hourLabel(group.hour)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-[#6f6253]">
                    <span className="rounded-full bg-[#fff9ec] px-3 py-1">
                      인원 {group.reservations?.length ?? 0}명
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 ${
                        group.status === 'CONFIRMED'
                          ? 'bg-[#e9f9ec] text-[#2f7a3d]'
                          : 'bg-[#fff5f1] text-[#d6452f]'
                      }`}
                    >
                      {group.status === 'CONFIRMED' ? '확정' : '취소됨'}
                    </span>
                  </div>
                </div>
                {group.status === 'CONFIRMED' && (
                  <button
                    type="button"
                    onClick={() => handleCancelGroup(group.id)}
                    className="inline-flex h-10 w-fit items-center justify-center rounded-full border border-[#ffd6cc] bg-[#fff5f1] px-4 text-sm font-black text-[#d6452f] transition duration-200 hover:-translate-y-0.5 hover:bg-[#ffe9e1]"
                  >
                    그룹 취소
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

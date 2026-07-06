import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useReservationsQuery } from './hooks/useReservationsQuery'
import { useReservationGroupsQuery } from './hooks/useReservationGroupsQuery'
import { useReservationMutations } from './hooks/useReservationMutations'
import { useReservationGroupMutations } from './hooks/useReservationGroupMutations'
import {
  DAY_OF_WEEK_LABELS,
  WEEKDAY_OPTIONS,
  HOUR_OPTIONS,
  hourLabel,
  type Reservation,
} from '../../api/schemas/reservation.schema'
import { CreateReservationGroupInputSchema } from '../../api/schemas/reservation-group.schema'

const CHILD_AGE_OPTIONS = [4, 5, 6, 7, 8, 9, 10]

const emptyGroupForm = {
  label: '',
  dayOfWeek: 'MON' as (typeof WEEKDAY_OPTIONS)[number],
  hour: 12 as (typeof HOUR_OPTIONS)[number],
}

function cellBackground(count: number): string {
  if (count === 0) return 'bg-white'
  if (count === 1) return 'bg-indigo-50'
  if (count === 2) return 'bg-indigo-100'
  return 'bg-indigo-200'
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
  const satWaiting = waiting.filter((r) => r.preferredDayOfWeek === 'SAT')

  function cellReservations(day: string, hour: number) {
    return {
      waitingInCell: waiting.filter((r) => r.preferredDayOfWeek === day && r.preferredHour === hour),
      groupedInCell: grouped.filter((r) => r.preferredDayOfWeek === day && r.preferredHour === hour),
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

  function selectCell(day: (typeof WEEKDAY_OPTIONS)[number], hour: (typeof HOUR_OPTIONS)[number]) {
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">예약 관리</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">대기중</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{waiting.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">그룹편성</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{grouped.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">확정된 그룹</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {groups.filter((g) => g.status === 'CONFIRMED').length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">취소됨</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{cancelledCount}</p>
        </div>
      </div>

      <div className="mt-6 flex items-end gap-3">
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          나이 필터
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
      </div>

      {isLoading && <p className="mt-6 text-slate-500">불러오는 중...</p>}
      {error && <p className="mt-6 text-red-600">목록을 불러오지 못했습니다.</p>}

      {!isLoading && !error && (
        <>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-16 border-b border-slate-200 p-2 text-xs font-medium text-slate-500">
                    시간
                  </th>
                  {WEEKDAY_OPTIONS.map((day) => (
                    <th
                      key={day}
                      className="min-w-[140px] border-b border-l border-slate-200 p-2 text-xs font-medium text-slate-500"
                    >
                      {DAY_OF_WEEK_LABELS[day]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOUR_OPTIONS.map((hour) => (
                  <tr key={hour}>
                    <td className="border-b border-slate-100 p-2 text-xs text-slate-500">
                      {hourLabel(hour)}
                    </td>
                    {WEEKDAY_OPTIONS.map((day) => {
                      const { waitingInCell, groupedInCell } = cellReservations(day, hour)
                      return (
                        <td
                          key={day}
                          className={`border-b border-l border-slate-100 p-1.5 align-top ${cellBackground(waitingInCell.length)}`}
                        >
                          <div className="flex flex-col gap-1">
                            {waitingInCell.map((reservation) => (
                              <div key={reservation.id} className="flex items-center gap-1">
                                <button
                                  type="button"
                                  title={reservationTitle(reservation)}
                                  onClick={() => toggleSelected(reservation.id)}
                                  className={`flex-1 truncate rounded-md px-2 py-1 text-left text-xs font-medium transition-colors ${
                                    selectedIds.has(reservation.id)
                                      ? 'bg-indigo-600 text-white'
                                      : 'border border-slate-200 bg-white text-slate-700 hover:border-indigo-400'
                                  }`}
                                >
                                  {reservation.childName}
                                  <span className="ml-1 opacity-70">({reservation.childAge})</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCancelReservation(reservation.id)}
                                  aria-label="신청 취소"
                                  className="text-slate-300 hover:text-red-600"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            {groupedInCell.map((reservation) => (
                              <span
                                key={reservation.id}
                                title={groupLabelByReservationId.get(reservation.id) ?? '편성됨'}
                                className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-400"
                              >
                                {reservation.childName} · 편성됨
                              </span>
                            ))}
                            {waitingInCell.length >= 1 && (
                              <button
                                type="button"
                                onClick={() => selectCell(day, hour)}
                                className="text-left text-[10px] text-indigo-600 hover:underline"
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
          <p className="mt-2 text-xs text-slate-500">
            칸의 진하기는 해당 요일·시간에 대기중인 신청 인원 수를 나타냅니다. 이름을 클릭해 그룹 확정
            대상으로 선택하세요.
          </p>

          {satWaiting.length > 0 && (
            <div className="mt-6">
              <h2 className="font-semibold text-slate-800">토요일 신청 (대기중)</h2>
              <ul className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
                {satWaiting.map((reservation) => (
                  <li key={reservation.id} className="flex items-center justify-between px-5 py-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(reservation.id)}
                        onChange={() => toggleSelected(reservation.id)}
                      />
                      <span className="text-sm text-slate-900">
                        {reservation.childName} (만 {reservation.childAge}세) · {hourLabel(reservation.preferredHour)}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleCancelReservation(reservation.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      취소
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <form
        onSubmit={handleConfirmGroup}
        className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-3"
      >
        <h2 className="col-span-full font-semibold text-slate-800">그룹 확정</h2>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          그룹 이름
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={groupForm.label}
            onChange={(e) => setGroupForm({ ...groupForm, label: e.target.value })}
            placeholder="예: 월요일 12시반"
          />
          {fieldErrors.label && <span className="text-xs text-red-600">{fieldErrors.label}</span>}
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          확정 요일
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={groupForm.dayOfWeek}
            onChange={(e) =>
              setGroupForm({
                ...groupForm,
                dayOfWeek: e.target.value as (typeof WEEKDAY_OPTIONS)[number],
              })
            }
          >
            {WEEKDAY_OPTIONS.map((day) => (
              <option key={day} value={day}>
                {DAY_OF_WEEK_LABELS[day]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          확정 시간
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
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

        <p className="col-span-full text-sm text-slate-600">선택된 신청: {selectedIds.size}명</p>
        {fieldErrors.reservationIds && (
          <p className="col-span-full text-xs text-red-600">{fieldErrors.reservationIds}</p>
        )}
        {(submitError || createError) && (
          <p className="col-span-full text-sm text-red-600">
            {submitError ?? '그룹 확정에 실패했습니다.'}
          </p>
        )}

        <div className="col-span-full">
          <button
            type="submit"
            disabled={isCreating || selectedIds.size === 0}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            선택한 신청으로 그룹 확정
          </button>
        </div>
      </form>

      <div className="mt-6">
        <h2 className="font-semibold text-slate-800">확정된 그룹</h2>
        <ul className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {groups.length === 0 && (
            <li className="px-5 py-4 text-sm text-slate-500">확정된 그룹이 없습니다.</li>
          )}
          {groups.map((group) => (
            <li key={group.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {group.label}
                  <span className="ml-2 text-xs text-indigo-600">
                    {DAY_OF_WEEK_LABELS[group.dayOfWeek as keyof typeof DAY_OF_WEEK_LABELS] ??
                      group.dayOfWeek}{' '}
                    {hourLabel(group.hour)}
                  </span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  인원 {group.reservations?.length ?? 0}명 · {group.status === 'CONFIRMED' ? '확정' : '취소됨'}
                </p>
              </div>
              {group.status === 'CONFIRMED' && (
                <button
                  type="button"
                  onClick={() => handleCancelGroup(group.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  그룹 취소
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

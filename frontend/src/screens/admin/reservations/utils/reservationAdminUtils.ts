import { Reservation, SLOT_STEP_MINUTES } from '../../../../api/schemas/reservation.schema'
import { ReservationGroup } from '../../../../api/schemas/reservation-group.schema'
import { DayOfWeek, SelectedSlot } from '../types'

export const ADMIN_ROW_MINUTES = SLOT_STEP_MINUTES
export const CHILD_AGE_OPTIONS = [4, 5, 6, 7, 8, 9, 10]

export function cellBackground(count: number): string {
  if (count === 0) return 'bg-white'
  if (count === 1) return 'bg-[#fffaf0]'
  if (count === 2) return 'bg-[#fff3c8]'
  return 'bg-[#ffe9a6]'
}

export function reservationTitle(r: Reservation): string {
  return `${r.parentName} · ${r.parentEmail}${r.parentPhone ? ` · ${r.parentPhone}` : ''}`
}

export function slotOverlapsRow(reservation: Reservation, day: string, rowStart: number): boolean {
  const rowEnd = rowStart + ADMIN_ROW_MINUTES
  return reservation.preferredSlots.some(
    (slot) => slot.dayOfWeek === day && slot.startMinute < rowEnd && slot.endMinute > rowStart,
  )
}

export function slotKey(reservationId: string, day: string, rowStart: number): string {
  return `${reservationId}-${day}-${rowStart}`
}

/**
 * 같은 신청(학생)·같은 요일로 묶이는 슬롯들이 끊김 없이 이어지는지 확인한다.
 * 빈 시간이 있으면 그 갭 뒤에 오는 슬롯을 반환하고, 없으면 null을 반환한다.
 */
export function findSlotGap(slots: SelectedSlot[]): SelectedSlot | null {
  const byReservationDay = new Map<string, SelectedSlot[]>()
  for (const slot of slots) {
    const key = `${slot.reservationId}-${slot.dayOfWeek}`
    const list = byReservationDay.get(key) ?? []
    list.push(slot)
    byReservationDay.set(key, list)
  }

  for (const list of byReservationDay.values()) {
    const sorted = [...list].sort((a, b) => a.startMinute - b.startMinute)
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].startMinute !== sorted[i - 1].endMinute) {
        return sorted[i]
      }
    }
  }

  return null
}

/**
 * 대기 신청의 희망 시간(preferredSlots)과 그룹의 기존 확정 시간(slots)이 특정 요일에 겹치는 구간을
 * 계산해, 그대로 그룹 편입 API에 보낼 수 있는 연속된 슬롯 목록으로 합쳐 반환한다.
 */
export function joinableSlotsForDay(
  reservation: Reservation,
  group: ReservationGroup,
  day: DayOfWeek,
): { dayOfWeek: DayOfWeek; startMinute: number; endMinute: number }[] {
  const preferredRanges = reservation.preferredSlots.filter((slot) => slot.dayOfWeek === day)

  const seen = new Set<string>()
  const groupRanges = group.slots.filter((slot) => {
    if (slot.dayOfWeek !== day) return false
    const key = `${slot.startMinute}-${slot.endMinute}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const overlaps: { dayOfWeek: DayOfWeek; startMinute: number; endMinute: number }[] = []
  for (const groupRange of groupRanges) {
    for (const preferred of preferredRanges) {
      const startMinute = Math.max(groupRange.startMinute, preferred.startMinute)
      const endMinute = Math.min(groupRange.endMinute, preferred.endMinute)
      if (startMinute < endMinute) {
        overlaps.push({ dayOfWeek: day, startMinute, endMinute })
      }
    }
  }

  overlaps.sort((a, b) => a.startMinute - b.startMinute)
  const merged: typeof overlaps = []
  for (const range of overlaps) {
    const last = merged[merged.length - 1]
    if (last && range.startMinute <= last.endMinute) {
      last.endMinute = Math.max(last.endMinute, range.endMinute)
    } else {
      merged.push({ ...range })
    }
  }
  return merged
}

/**
 * 신청의 희망 요일 전체에 대해 그룹과 겹치는 슬롯을 모아 반환한다.
 * "합류 희망" 신청을 승인할 때(어느 요일 칸에서 클릭했는지 알 수 없는 경우) 사용한다.
 */
export function joinableSlotsForAllDays(
  reservation: Reservation,
  group: ReservationGroup,
): { dayOfWeek: DayOfWeek; startMinute: number; endMinute: number }[] {
  const days = [...new Set(reservation.preferredSlots.map((slot) => slot.dayOfWeek))]
  return days.flatMap((day) => joinableSlotsForDay(reservation, group, day))
}

/**
 * 학생이 그룹에 합류 가능한지: 확정 그룹 + 여석 + 나이대 + 희망 시간 겹침을 모두 만족하는지 확인한다.
 */
export function isGroupJoinableForReservation(
  group: ReservationGroup,
  reservation: Reservation,
  day: DayOfWeek,
): boolean {
  if (group.status !== 'CONFIRMED') return false
  const memberCount = group.reservations?.length ?? 0
  if (memberCount >= group.capacity) return false
  if (reservation.childAge < group.minAge || reservation.childAge > group.maxAge) return false
  return joinableSlotsForDay(reservation, group, day).length > 0
}

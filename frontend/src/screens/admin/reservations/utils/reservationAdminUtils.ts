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

/**
 * 눈으로 확실히 구분되는 파스텔 30색 팔레트.
 * hue 24도 간격(15단계) x 명도 2단계로 구성해, 인접 hue라도 밝기 차이로 헷갈리지 않게 한다.
 */
const CHILD_PALETTE_HUES = [0, 24, 48, 72, 96, 120, 144, 168, 192, 216, 240, 264, 288, 312, 336]
const CHILD_PALETTE: { background: string; border: string }[] = CHILD_PALETTE_HUES.flatMap((h) => [
  { background: `hsl(${h} 72% 90%)`, border: `hsl(${h} 55% 68%)` },
  { background: `hsl(${h} 58% 80%)`, border: `hsl(${h} 46% 58%)` },
])

/**
 * 학생(childName + parentPhone)마다 안정적인 파스텔 색을 만든다.
 * 같은 학생은 어느 칸/그룹에서든 같은 색, 동명이인(다른 연락처)은 다른 색.
 * 전화번호가 비어 있으면 parentEmail로 폴백한다.
 * 색상환을 연속으로 나누지 않고 구분이 확실한 30색 팔레트 중 하나로 매핑한다.
 */
export function childColor(reservation: Reservation): { background: string; border: string } {
  const key = `${reservation.childName}|${reservation.parentPhone || reservation.parentEmail}`
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0
  }
  const index = Math.abs(hash) % CHILD_PALETTE.length
  return CHILD_PALETTE[index]
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
 * 같은 신청·같은 요일로 개별 선택된 슬롯들 중 인접하거나 겹치는 것을 하나의 연속 구간으로 합친다.
 * 관리자가 시간표에서 10분 단위 칸을 여러 개 클릭해 그룹을 확정할 때, 클릭한 칸 수만큼
 * 조각난 슬롯이 그대로 저장되면(예: 730-740, 740-750, ...) 시간표에서 하나의 박스로 묶여 보이지 않는다.
 */
export function mergeContiguousSlots<
  T extends { reservationId: string; dayOfWeek: string; startMinute: number; endMinute: number },
>(slots: T[]): T[] {
  const byKey = new Map<string, T[]>()
  for (const slot of slots) {
    const key = `${slot.reservationId}-${slot.dayOfWeek}`
    const list = byKey.get(key) ?? []
    list.push(slot)
    byKey.set(key, list)
  }

  const merged: T[] = []
  for (const list of byKey.values()) {
    const sorted = [...list].sort((a, b) => a.startMinute - b.startMinute)
    for (const slot of sorted) {
      const last = merged[merged.length - 1]
      if (last && last.reservationId === slot.reservationId && last.dayOfWeek === slot.dayOfWeek && slot.startMinute <= last.endMinute) {
        last.endMinute = Math.max(last.endMinute, slot.endMinute)
      } else {
        merged.push({ ...slot })
      }
    }
  }

  return merged
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

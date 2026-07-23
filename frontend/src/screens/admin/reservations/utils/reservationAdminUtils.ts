import { Reservation, SLOT_STEP_MINUTES } from '../../../../api/schemas/reservation.schema'

export const ADMIN_ROW_MINUTES = SLOT_STEP_MINUTES
export const CHILD_AGE_OPTIONS = [4, 5, 6, 7, 8, 9, 10]

/** 학생 블록을 드래그할 때 dataTransfer에 실어 보내는 페이로드. 그리드 셀과 미배정 영역 패널이 공유한다. */
export type DragPayload = { reservationId: string; fromGroupId: string }
export const DRAG_PAYLOAD_TYPE = 'application/x-reservation-member'

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

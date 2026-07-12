import { useMemo, useRef, useState } from 'react'
import {
  DAY_OF_WEEK_LABELS,
  DAY_OF_WEEK_OPTIONS,
  parseDayOfWeek,
  SLOT_STEP_MINUTES,
  timeRangeLabel,
  type PreferredSlot,
} from '../../api/schemas/reservation.schema'

export interface Anchor {
  dayOfWeek: (typeof DAY_OF_WEEK_OPTIONS)[number]
  minute: number
}

export type DragMode = 'select' | 'cancel'

export function slotKey(slot: Pick<PreferredSlot, 'dayOfWeek' | 'startMinute' | 'endMinute'>): string {
  return `${slot.dayOfWeek}-${slot.startMinute}-${slot.endMinute}`
}

export function buildSlot(anchor: Anchor, target: Anchor, existingSlots: PreferredSlot[]): PreferredSlot | null {
  if (anchor.dayOfWeek !== target.dayOfWeek) {
    return null
  }

  const forward = target.minute >= anchor.minute
  let startMinute = Math.min(anchor.minute, target.minute)
  let endMinute = Math.max(anchor.minute, target.minute) + SLOT_STEP_MINUTES
  const sameDaySlots = existingSlots
    .filter((slot) => slot.dayOfWeek === anchor.dayOfWeek)
    .sort((a, b) => a.startMinute - b.startMinute)

  for (const slot of sameDaySlots) {
    if (slot.endMinute <= startMinute || slot.startMinute >= endMinute) {
      continue
    }

    if (anchor.minute >= slot.startMinute && anchor.minute < slot.endMinute) {
      return null
    }

    if (forward && slot.startMinute > anchor.minute) {
      endMinute = Math.min(endMinute, slot.startMinute)
      break
    }

    if (!forward && slot.endMinute <= anchor.minute + SLOT_STEP_MINUTES) {
      startMinute = Math.max(startMinute, slot.endMinute)
    }
  }

  return { dayOfWeek: anchor.dayOfWeek, startMinute, endMinute }
}

// 두 지점(anchor~target) 사이의 요일·시간 범위를 계산하는 순수 함수.
// 훅 상태(anchor/hovered)에 의존하지 않아 "터치 탭 확정" 시점에 즉시 계산할 수 있다
// (setHovered 직후 같은 틱에서 읽으면 리렌더 전이라 값이 stale할 수 있어 이 방식을 쓴다).
export function computeRange(a: Anchor, h: Anchor): PreferredSlot | null {
  if (a.dayOfWeek !== h.dayOfWeek) {
    return null
  }

  return {
    dayOfWeek: a.dayOfWeek,
    startMinute: Math.min(a.minute, h.minute),
    endMinute: Math.max(a.minute, h.minute) + SLOT_STEP_MINUTES,
  }
}

export function usePreferredSlotsSelection(
  value: PreferredSlot[],
  onChange: (slots: PreferredSlot[]) => void,
  blockedSlots: PreferredSlot[] = [],
  // 좁은 화면(터치)에서는 "끌거나" 같은 드래그 안내 대신 탭 중심 문구를 쓴다.
  compactHint = false,
) {
  const didDragRef = useRef(false)
  const dragModeRef = useRef<DragMode>('select')
  const [anchor, setAnchor] = useState<Anchor | null>(null)
  const [hovered, setHovered] = useState<Anchor | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragMode, setDragMode] = useState<DragMode>('select')

  // 이미 선택한 슬롯뿐 아니라 확정돼 신청 불가한 슬롯도 드래그 범위의 경계(장애물)로 취급한다.
  const obstacles = useMemo(() => [...value, ...blockedSlots], [value, blockedSlots])

  const preview = useMemo(() => {
    if (!anchor || !hovered || dragMode !== 'select') {
      return null
    }

    return buildSlot(anchor, hovered, obstacles)
  }, [anchor, dragMode, hovered, obstacles])

  function buildSlotFromAnchor(target: Anchor): PreferredSlot | null {
    if (!anchor) {
      return null
    }

    return buildSlot(anchor, target, obstacles)
  }

  function commitSlot(slot: PreferredSlot | null) {
    if (!slot) {
      setIsDragging(false)
      return
    }

    onChange([...value, slot])
    setAnchor(null)
    setHovered(null)
    setIsDragging(false)
  }

  function clearSelectionDraft() {
    setAnchor(null)
    setHovered(null)
    setIsDragging(false)
    didDragRef.current = false
    dragModeRef.current = 'select'
    setDragMode('select')
  }

  function slotAt(dayOfWeek: Anchor['dayOfWeek'], minute: number): PreferredSlot | undefined {
    return value.find(
      (slot) => slot.dayOfWeek === dayOfWeek && slot.startMinute <= minute && slot.endMinute > minute,
    )
  }

  function removeSlot(slot: PreferredSlot) {
    onChange(value.filter((item) => slotKey(item) !== slotKey(slot)))
    clearSelectionDraft()
  }

  function beginDrag(nextAnchor: Anchor, mode: DragMode) {
    didDragRef.current = false
    dragModeRef.current = mode
    setDragMode(mode)
    setAnchor(nextAnchor)
    setHovered(nextAnchor)
    setIsDragging(true)
  }

  function dragRange(): (PreferredSlot & { dayOfWeek: Anchor['dayOfWeek'] }) | null {
    if (!anchor || !hovered) {
      return null
    }

    return computeRange(anchor, hovered)
  }

  function slotOverlapsRange(slot: PreferredSlot, range: PreferredSlot): boolean {
    return (
      slot.dayOfWeek === range.dayOfWeek &&
      slot.startMinute < range.endMinute &&
      slot.endMinute > range.startMinute
    )
  }

  function cancelSlotsInRange(range: PreferredSlot | null = dragRange()) {
    if (!range) {
      clearSelectionDraft()
      return
    }

    const nextSlots = value.flatMap((slot) => {
      if (!slotOverlapsRange(slot, range)) {
        return [slot]
      }

      const remaining: PreferredSlot[] = []
      const leftEndMinute = Math.max(slot.startMinute, range.startMinute)
      const rightStartMinute = Math.min(slot.endMinute, range.endMinute)

      if (leftEndMinute > slot.startMinute) {
        remaining.push({
          dayOfWeek: slot.dayOfWeek,
          startMinute: slot.startMinute,
          endMinute: leftEndMinute,
        })
      }

      if (slot.endMinute > rightStartMinute) {
        remaining.push({
          dayOfWeek: slot.dayOfWeek,
          startMinute: rightStartMinute,
          endMinute: slot.endMinute,
        })
      }

      return remaining
    })

    onChange(nextSlots)
    clearSelectionDraft()
  }

  function updateFromPoint(clientX: number, clientY: number) {
    const element = document.elementFromPoint(clientX, clientY)
    const cell = element?.closest<HTMLButtonElement>('[data-slot-day][data-slot-minute]')
    const dayOfWeek = cell ? parseDayOfWeek(cell.dataset.slotDay ?? '') : null
    const minute = Number(cell?.dataset.slotMinute)

    if (dayOfWeek === null || Number.isNaN(minute)) {
      return
    }

    if (anchor?.dayOfWeek !== dayOfWeek || anchor.minute !== minute) {
      didDragRef.current = true
    }
    setHovered({ dayOfWeek, minute })
  }

  function isBlockedAt(dayOfWeek: Anchor['dayOfWeek'], minute: number): boolean {
    return blockedSlots.some(
      (slot) => slot.dayOfWeek === dayOfWeek && slot.startMinute <= minute && slot.endMinute > minute,
    )
  }

  function handleCellPointerDown(nextAnchor: Anchor) {
    if (isBlockedAt(nextAnchor.dayOfWeek, nextAnchor.minute)) {
      return
    }

    const selectedSlot = slotAt(nextAnchor.dayOfWeek, nextAnchor.minute)
    if (anchor && !isDragging) {
      commitSlot(buildSlot(anchor, nextAnchor, obstacles))
      return
    }

    if (selectedSlot) {
      beginDrag(nextAnchor, 'cancel')
      return
    }

    beginDrag(nextAnchor, 'select')
  }

  // 터치(coarse pointer) 전용 "탭 2번" 확정 경로. 세로로 긴 그리드에서 시작 탭과
  // 종료 탭 사이에 페이지 스크롤이 필요하므로, pointerdown 즉시 커밋하는
  // handleCellPointerDown과 달리 이 함수는 셀에서 "이동 없는 탭(release)"이
  // 확인된 시점에만 호출된다(호출부는 PreferredSlotCell 참고).
  function handleCellTap(nextAnchor: Anchor) {
    if (isBlockedAt(nextAnchor.dayOfWeek, nextAnchor.minute)) {
      return
    }

    if (anchor) {
      if (dragModeRef.current === 'cancel') {
        cancelSlotsInRange(computeRange(anchor, nextAnchor))
      } else {
        commitSlot(buildSlot(anchor, nextAnchor, obstacles))
      }
      return
    }

    const selectedSlot = slotAt(nextAnchor.dayOfWeek, nextAnchor.minute)
    if (selectedSlot) {
      // 이미 선택된 슬롯을 탭하면 마우스로 드래그 없이 클릭했을 때와 동일하게
      // 그 자리에서 바로 취소한다(2번째 탭을 기다리지 않음).
      cancelSlotsInRange(computeRange(nextAnchor, nextAnchor))
      return
    }

    dragModeRef.current = 'select'
    setDragMode('select')
    setAnchor(nextAnchor)
    setHovered(nextAnchor)
  }

  const cancelRange = dragMode === 'cancel' ? dragRange() : null
  const cancelCount = cancelRange ? value.filter((slot) => slotOverlapsRange(slot, cancelRange)).length : 0
  const previewLabel = preview
    ? `${DAY_OF_WEEK_LABELS[preview.dayOfWeek]} ${timeRangeLabel(preview.startMinute, preview.endMinute)}`
    : cancelRange
      ? `취소할 시간 ${cancelCount}개`
    : anchor
      ? compactHint
        ? '종료 시각을 한 번 더 탭하세요'
        : '같은 요일 안에서 종료 시각을 선택해 주세요'
      : compactHint
        ? '시작 시각을 탭한 뒤 종료 시각을 한 번 더 탭하세요'
        : '시작 시각을 누른 뒤 끌거나 종료 시각을 한 번 더 눌러 주세요'

  return {
    anchor,
    hovered,
    isDragging,
    dragMode,
    dragModeRef,
    didDragRef,
    preview,
    cancelRange,
    previewLabel,
    slotAt,
    removeSlot,
    beginDrag,
    cancelSlotsInRange,
    updateFromPoint,
    handleCellPointerDown,
    handleCellTap,
    commitSlot,
    clearSelectionDraft,
    setHovered,
    setIsDragging,
    buildSlotFromAnchor,
    isBlockedAt,
  }
}

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

export function usePreferredSlotsSelection(
  value: PreferredSlot[],
  onChange: (slots: PreferredSlot[]) => void,
  blockedSlots: PreferredSlot[] = [],
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
    if (!anchor || !hovered || anchor.dayOfWeek !== hovered.dayOfWeek) {
      return null
    }

    return {
      dayOfWeek: anchor.dayOfWeek,
      startMinute: Math.min(anchor.minute, hovered.minute),
      endMinute: Math.max(anchor.minute, hovered.minute) + SLOT_STEP_MINUTES,
    }
  }

  function slotOverlapsRange(slot: PreferredSlot, range: PreferredSlot): boolean {
    return (
      slot.dayOfWeek === range.dayOfWeek &&
      slot.startMinute < range.endMinute &&
      slot.endMinute > range.startMinute
    )
  }

  function cancelSlotsInRange() {
    const range = dragRange()
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

  const cancelRange = dragMode === 'cancel' ? dragRange() : null
  const cancelCount = cancelRange ? value.filter((slot) => slotOverlapsRange(slot, cancelRange)).length : 0
  const previewLabel = preview
    ? `${DAY_OF_WEEK_LABELS[preview.dayOfWeek]} ${timeRangeLabel(preview.startMinute, preview.endMinute)}`
    : cancelRange
      ? `취소할 시간 ${cancelCount}개`
    : anchor
      ? '같은 요일 안에서 종료 시각을 선택해 주세요'
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
    commitSlot,
    clearSelectionDraft,
    setHovered,
    setIsDragging,
    buildSlotFromAnchor,
    isBlockedAt,
  }
}

'use client'

import { Fragment, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import {
  DAY_OF_WEEK_LABELS,
  DAY_OF_WEEK_OPTIONS,
  OPERATING_END_MINUTE,
  OPERATING_START_MINUTE,
  SLOT_STEP_MINUTES,
  timeLabel,
  timeRangeLabel,
  type PreferredSlot,
} from '../api/schemas/reservation.schema'
import type { JoinableGroup } from '../api/schemas/reservation-group.schema'

interface PreferredSlotsPickerProps {
  value: PreferredSlot[]
  onChange: (slots: PreferredSlot[]) => void
  joinableGroups?: JoinableGroup[]
  childAge?: number
}

interface Anchor {
  dayOfWeek: (typeof DAY_OF_WEEK_OPTIONS)[number]
  minute: number
}

type DragMode = 'select' | 'cancel'

const minuteOptions = Array.from(
  { length: (OPERATING_END_MINUTE - OPERATING_START_MINUTE) / SLOT_STEP_MINUTES },
  (_, index) => OPERATING_START_MINUTE + index * SLOT_STEP_MINUTES,
)

function slotKey(slot: Pick<PreferredSlot, 'dayOfWeek' | 'startMinute' | 'endMinute'>): string {
  return `${slot.dayOfWeek}-${slot.startMinute}-${slot.endMinute}`
}

function buildSlot(anchor: Anchor, target: Anchor, existingSlots: PreferredSlot[]): PreferredSlot | null {
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

export default function PreferredSlotsPicker({
  value,
  onChange,
  joinableGroups = [],
  childAge,
}: PreferredSlotsPickerProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const didDragRef = useRef(false)
  const dragModeRef = useRef<DragMode>('select')
  const [anchor, setAnchor] = useState<Anchor | null>(null)
  const [hovered, setHovered] = useState<Anchor | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragMode, setDragMode] = useState<DragMode>('select')

  const preview = useMemo(() => {
    if (!anchor || !hovered || dragMode !== 'select') {
      return null
    }

    return buildSlot(anchor, hovered, value)
  }, [anchor, dragMode, hovered, value])

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

  function joinableGroupsAt(dayOfWeek: Anchor['dayOfWeek'], minute: number): JoinableGroup[] {
    return joinableGroups.filter((group) => {
      if (childAge !== undefined && (childAge < group.minAge || childAge > group.maxAge)) {
        return false
      }
      return group.slots.some(
        (slot) => slot.dayOfWeek === dayOfWeek && slot.startMinute <= minute && slot.endMinute > minute,
      )
    })
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
    const dayOfWeek = cell?.dataset.slotDay as Anchor['dayOfWeek'] | undefined
    const minute = Number(cell?.dataset.slotMinute)

    if (!dayOfWeek || Number.isNaN(minute)) {
      return
    }

    if (anchor?.dayOfWeek !== dayOfWeek || anchor.minute !== minute) {
      didDragRef.current = true
    }
    setHovered({ dayOfWeek, minute })
  }

  function handleCellPointerDown(nextAnchor: Anchor) {
    const selectedSlot = slotAt(nextAnchor.dayOfWeek, nextAnchor.minute)
    if (anchor && !isDragging) {
      commitSlot(buildSlot(anchor, nextAnchor, value))
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

  return (
    <div className="rounded-xl border border-slate-200 bg-brand-50/40 p-3">
      {joinableGroups.length > 0 && (
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
          <span aria-hidden className="size-1.5 rounded-full bg-emerald-500" />
          초록색 칸은 지금 모집 중인 반이 있는 시간입니다. 선택하면 바로 합류를 신청할 수 있어요.
        </p>
      )}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-600">{previewLabel}</span>
        <div className="flex items-center gap-2">
          {anchor && (
            <button
              type="button"
              onClick={clearSelectionDraft}
              className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-500 hover:border-red-200 hover:text-red-600"
            >
              선택 취소
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div
          ref={gridRef}
          className="grid min-w-[720px] grid-cols-[64px_repeat(6,minmax(92px,1fr))] gap-1"
          onPointerMove={(event) => {
            if (isDragging) {
              updateFromPoint(event.clientX, event.clientY)
            }
          }}
          onPointerUp={() => {
            if (isDragging) {
              if (dragModeRef.current === 'cancel') {
                cancelSlotsInRange()
              } else {
                if (didDragRef.current) {
                  commitSlot(preview)
                } else {
                  setIsDragging(false)
                }                
              }
            }
          }}
          onPointerCancel={() => {
            setIsDragging(false)
            setHovered(null)
          }}
        >
          <div />
          {DAY_OF_WEEK_OPTIONS.map((day) => (
            <div key={day} className="px-2 py-1 text-center text-xs font-semibold text-slate-600">
              {DAY_OF_WEEK_LABELS[day]}
            </div>
          ))}
          {minuteOptions.map((minute) => (
            <Fragment key={minute}>
              <div
                key={`${minute}-label`}
                className="relative h-8 text-[11px] font-medium text-slate-500"
              >
                {minute % 30 === 0 ? (
                  <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-50 px-1">
                    {timeLabel(minute)}
                  </span>
                ) : null}
              </div>
              {DAY_OF_WEEK_OPTIONS.map((day) => {
                const selectedSlot = slotAt(day, minute)
                const selected = Boolean(selectedSlot)
                const inPreview =
                  preview?.dayOfWeek === day && preview.startMinute <= minute && preview.endMinute > minute
                const inCancelPreview =
                  cancelRange?.dayOfWeek === day &&
                  cancelRange.startMinute <= minute &&
                  cancelRange.endMinute > minute &&
                  selected
                const joinable = joinableGroupsAt(day, minute)
                const isJoinable = joinable.length > 0

                return (
                  <button
                    key={`${day}-${minute}`}
                    type="button"
                    data-slot-day={day}
                    data-slot-minute={minute}
                    title={
                      isJoinable
                        ? joinable
                            .map((group) => `${group.label} 모집중 ${group.filledCount}/${group.capacity}`)
                            .join(', ')
                        : undefined
                    }
                    aria-label={`${DAY_OF_WEEK_LABELS[day]}요일 ${timeLabel(minute)} 선택${
                      isJoinable ? ' (모집중인 반 있음)' : ''
                    }`}
                    onPointerDown={(event) => {
                      event.currentTarget.setPointerCapture(event.pointerId)
                      handleCellPointerDown({ dayOfWeek: day, minute })
                    }}
                    onPointerEnter={() => {
                      if (isDragging || anchor) {
                        setHovered({ dayOfWeek: day, minute })
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        if (selectedSlot) {
                          removeSlot(selectedSlot)
                        } else if (anchor) {
                          commitSlot(buildSlot(anchor, { dayOfWeek: day, minute }, value))
                        } else {
                          beginDrag({ dayOfWeek: day, minute }, 'select')
                          setIsDragging(false)
                        }
                      }
                    }}
                    className={`relative h-8 rounded-md border text-[10px] font-semibold transition ${
                      inCancelPreview
                        ? 'border-red-400 bg-red-500 text-white'
                        : selected
                          ? 'border-brand-700 bg-brand-600 text-white hover:border-red-300 hover:bg-red-500'
                          : inPreview
                            ? 'border-brand-500 bg-brand-200 text-brand-900'
                            : isJoinable
                              ? 'border-emerald-400 bg-emerald-50 text-emerald-700 hover:border-brand-300'
                              : 'border-slate-200 bg-white text-slate-500 hover:border-brand-300'
                    }`}
                  >
                    {isJoinable && !selected && (
                      <span
                        aria-hidden
                        className="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-emerald-500"
                      />
                    )}
                    {selectedSlot
                      ? minute === selectedSlot.startMinute
                        ? timeLabel(selectedSlot.startMinute)
                        : minute === selectedSlot.endMinute - SLOT_STEP_MINUTES
                          ? timeLabel(selectedSlot.endMinute)
                          : ''
                      : ''}
                  </button>
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>

      {value.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {value.map((slot) => (
            <li
              key={slotKey(slot)}
              className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm"
            >
              {DAY_OF_WEEK_LABELS[slot.dayOfWeek]} {timeRangeLabel(slot.startMinute, slot.endMinute)}
              <button
                type="button"
                aria-label="희망 시간 삭제"
                onClick={() => onChange(value.filter((item) => slotKey(item) !== slotKey(slot)))}
                className="grid size-5 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-red-600"
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

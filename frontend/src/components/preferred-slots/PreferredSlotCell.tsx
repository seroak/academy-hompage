import {
  DAY_OF_WEEK_LABELS,
  SLOT_STEP_MINUTES,
  timeLabel,
  type PreferredSlot,
  type DAY_OF_WEEK_OPTIONS
} from '../../api/schemas/reservation.schema'
import type { JoinableGroup } from '../../api/schemas/reservation-group.schema'
import type { Anchor } from './usePreferredSlotsSelection'

interface PreferredSlotCellProps {
  day: (typeof DAY_OF_WEEK_OPTIONS)[number]
  minute: number
  selectedSlot?: PreferredSlot
  inPreview: boolean
  inCancelPreview: boolean
  joinableGroups: JoinableGroup[]
  blocked: boolean
  remainingSeats?: number
  isDragging: boolean
  hasAnchor: boolean
  onPointerDown: (anchor: Anchor) => void
  onPointerEnter: (anchor: Anchor) => void
  onEnter: (anchor: Anchor, selectedSlot?: PreferredSlot) => void
}

export function PreferredSlotCell({
  day,
  minute,
  selectedSlot,
  inPreview,
  inCancelPreview,
  joinableGroups,
  blocked,
  remainingSeats,
  isDragging,
  hasAnchor,
  onPointerDown,
  onPointerEnter,
  onEnter,
}: PreferredSlotCellProps) {
  const isJoinable = joinableGroups.length > 0
  const selected = Boolean(selectedSlot)

  return (
    <button
      type="button"
      data-slot-day={day}
      data-slot-minute={minute}
      disabled={blocked}
      title={
        blocked
          ? '이미 정원이 찬 확정 시간이라 신청할 수 없습니다'
          : isJoinable
            ? joinableGroups
                .map((group) => `${group.label} 모집중 ${group.filledCount}/${group.capacity}`)
                .join(', ')
            : undefined
      }
      aria-label={`${DAY_OF_WEEK_LABELS[day]}요일 ${timeLabel(minute)} 선택${
        blocked ? ' (신청 불가)' : isJoinable ? ' (모집중인 반 있음)' : ''
      }`}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        onPointerDown({ dayOfWeek: day, minute })
      }}
      onPointerEnter={() => {
        if (isDragging || hasAnchor) {
          onPointerEnter({ dayOfWeek: day, minute })
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          onEnter({ dayOfWeek: day, minute }, selectedSlot)
        }
      }}
      className={`relative h-8 rounded-md border text-[10px] font-semibold transition ${
        blocked
          ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300'
          : inCancelPreview
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
      {isJoinable && !selected && !blocked && (
        <span
          aria-hidden
          className="absolute right-0.5 top-0.5 rounded-full bg-emerald-500 px-1 text-[8px] font-bold leading-tight text-white"
        >
          잔여{remainingSeats}
        </span>
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
}

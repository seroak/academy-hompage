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
  alreadyApplied: boolean
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
  alreadyApplied,
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
      disabled={blocked || alreadyApplied}
      title={
        blocked
          ? '이미 정원이 찬 확정 시간이라 신청할 수 없습니다'
          : alreadyApplied
            ? '이미 신청한 시간입니다'
            : isJoinable
              ? joinableGroups
                  .map((group) => `${group.label} 모집중 ${group.filledCount}/${group.capacity}`)
                  .join(', ')
              : undefined
      }
      aria-label={`${DAY_OF_WEEK_LABELS[day]}요일 ${timeLabel(minute)} 선택${
        blocked ? ' (신청 불가)' : alreadyApplied ? ' (이미 신청한 시간)' : isJoinable ? ' (모집중인 반 있음)' : ''
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
      className={`relative flex h-11 items-center justify-center rounded-md border text-[10px] font-semibold transition ${
        blocked
          ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300'
          : alreadyApplied
            ? 'cursor-not-allowed border-amber-300 bg-amber-100 text-amber-500'
            : inCancelPreview
              ? 'border-red-400 bg-red-500 text-white'
              : selected
                ? 'border-brand-700 bg-brand-600 text-white hover:border-red-300 hover:bg-red-500'
                : inPreview
                  ? 'border-brand-500 bg-brand-200 text-brand-900'
                  : isJoinable
                    ? 'border-emerald-600 bg-emerald-500 text-white hover:border-emerald-700 hover:bg-emerald-600'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-brand-300'
      }`}
    >
      {isJoinable && !selected && !blocked && !alreadyApplied && (
        <span
          aria-hidden
          className="text-[10px] font-bold leading-none"
        >
          잔여 {remainingSeats}석
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

import { X } from 'lucide-react'
import {
  DAY_OF_WEEK_LABELS,
  timeRangeLabel,
  type PreferredSlot,
} from '../../api/schemas/reservation.schema'
import { slotKey } from './usePreferredSlotsSelection'

interface SelectedSlotsListProps {
  slots: PreferredSlot[]
  onRemove: (slot: PreferredSlot) => void
}

export function SelectedSlotsList({ slots, onRemove }: SelectedSlotsListProps) {
  if (slots.length === 0) return null

  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {slots.map((slot) => (
        <li
          key={slotKey(slot)}
          className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm"
        >
          {DAY_OF_WEEK_LABELS[slot.dayOfWeek]} {timeRangeLabel(slot.startMinute, slot.endMinute)}
          <button
            type="button"
            aria-label="희망 시간 삭제"
            onClick={() => onRemove(slot)}
            className="grid size-5 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-red-600"
          >
            <X size={13} />
          </button>
        </li>
      ))}
    </ul>
  )
}

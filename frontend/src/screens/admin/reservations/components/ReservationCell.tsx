import { Info } from 'lucide-react'
import { Reservation } from '../../../../api/schemas/reservation.schema'
import { ReservationGroup } from '../../../../api/schemas/reservation-group.schema'
import { cellBackground, reservationTitle, slotKey } from '../utils/reservationAdminUtils'
import { DayOfWeek, SelectedSlot } from '../types'

type Props = {
  day: DayOfWeek
  rowStart: number
  waitingInCell: Reservation[]
  groupedInCell: Reservation[]
  selectedSlots: Map<string, SelectedSlot>
  groupLabelByReservationId: Map<string, string>
  joinableGroupsForReservation: (reservation: Reservation, day: DayOfWeek) => ReservationGroup[]
  onToggleSlot: (reservation: Reservation, day: DayOfWeek, rowStart: number) => void
  onSelectCell: (day: DayOfWeek, rowStart: number) => void
  onOpenDetail: (r: Reservation) => void
  onCancelReservation: (id: string) => void
  onAddToGroup: (reservation: Reservation, group: ReservationGroup, day: DayOfWeek) => void
}

export default function ReservationCell({
  day,
  rowStart,
  waitingInCell,
  groupedInCell,
  selectedSlots,
  groupLabelByReservationId,
  joinableGroupsForReservation,
  onToggleSlot,
  onSelectCell,
  onOpenDetail,
  onCancelReservation,
  onAddToGroup,
}: Props) {
  return (
    <td
      className={`border-b border-l border-[#f6ead0] p-2 align-top ${cellBackground(
        waitingInCell.length,
      )}`}
    >
      <div className="flex min-h-16 flex-col gap-1.5">
        {waitingInCell.map((reservation) => {
          const isSelected = selectedSlots.has(slotKey(reservation.id, day, rowStart))
          const joinableGroups = joinableGroupsForReservation(reservation, day)

          return (
            <div key={reservation.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  title={reservationTitle(reservation)}
                  onClick={() => onToggleSlot(reservation, day, rowStart)}
                  className={`flex-1 truncate rounded-full px-3 py-1.5 text-left text-xs font-black transition ${
                    isSelected
                      ? 'bg-[#ff8a1f] text-white shadow-[0_8px_18px_rgba(255,138,31,0.22)]'
                      : 'border border-[#f2dfb9] bg-white text-[#3f3a31] hover:border-[#ffd66b] hover:text-[#e86f00]'
                  }`}
                >
                  {reservation.childName}
                  <span className="ml-1 opacity-70">({reservation.childAge})</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenDetail(reservation)}
                  aria-label="예약 상세 보기"
                  className="grid size-7 shrink-0 place-items-center rounded-full text-[#8a7a61] transition hover:bg-[#fff0cf] hover:text-[#e86f00]"
                >
                  <Info size={15} strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={() => onCancelReservation(reservation.id)}
                  aria-label="신청 취소"
                  className="grid size-7 shrink-0 place-items-center rounded-full text-[#d8bfa0] transition hover:bg-[#fff5f1] hover:text-[#d6452f]"
                >
                  ×
                </button>
              </div>
              {joinableGroups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => onAddToGroup(reservation, group, day)}
                  className="w-fit rounded-full bg-[#eaf7ea] px-3 py-1 text-left text-[10px] font-black text-[#2f7a3d] transition hover:bg-[#d9f0da]"
                >
                  {group.label}에 추가 ({group.reservations?.length ?? 0}/{group.capacity})
                </button>
              ))}
            </div>
          )
        })}
        {groupedInCell.map((reservation) => (
          <button
            key={reservation.id}
            type="button"
            onClick={() => onOpenDetail(reservation)}
            title={groupLabelByReservationId.get(reservation.id) ?? '편성됨'}
            className="w-fit rounded-full bg-[#e7f4ff] px-3 py-1 text-left text-[11px] font-bold text-[#236c9c] transition hover:bg-[#d8ecff]"
          >
            {reservation.childName} · 편성됨
          </button>
        ))}
        {waitingInCell.length >= 1 && (
          <button
            type="button"
            onClick={() => onSelectCell(day, rowStart)}
            className="text-left text-[10px] font-black text-[#e86f00] hover:underline"
          >
            이 칸 전체 선택
          </button>
        )}
      </div>
    </td>
  )
}

import {
  DAY_OF_WEEK_LABELS,
  DAY_OF_WEEK_OPTIONS,
  OPERATING_END_MINUTE,
  OPERATING_START_MINUTE,
  timeLabel,
  Reservation,
} from '../../../../api/schemas/reservation.schema'
import { ReservationGroup } from '../../../../api/schemas/reservation-group.schema'
import ReservationCell from './ReservationCell'
import { DayOfWeek, SelectedSlot } from '../types'
import { ADMIN_ROW_MINUTES } from '../utils/reservationAdminUtils'

const ADMIN_ROW_STARTS = Array.from(
  { length: (OPERATING_END_MINUTE - OPERATING_START_MINUTE) / ADMIN_ROW_MINUTES },
  (_, index) => OPERATING_START_MINUTE + index * ADMIN_ROW_MINUTES,
)

type Props = {
  isLoading: boolean
  error: any
  selectedSlots: Map<string, SelectedSlot>
  getCellReservations: (day: DayOfWeek, rowStart: number) => { waitingInCell: Reservation[]; groupedInCell: Reservation[] }
  groupLabelByReservationId: Map<string, string>
  joinableGroupsForReservation: (reservation: Reservation, day: DayOfWeek) => ReservationGroup[]
  onToggleSlot: (reservation: Reservation, day: DayOfWeek, rowStart: number) => void
  onSelectCell: (day: DayOfWeek, rowStart: number) => void
  onOpenDetail: (r: Reservation) => void
  onCancelReservation: (id: string) => void
  onAddToGroup: (reservation: Reservation, group: ReservationGroup, day: DayOfWeek) => void
}

export default function ReservationTimetable({
  isLoading,
  error,
  selectedSlots,
  getCellReservations,
  groupLabelByReservationId,
  joinableGroupsForReservation,
  onToggleSlot,
  onSelectCell,
  onOpenDetail,
  onCancelReservation,
  onAddToGroup,
}: Props) {
  if (isLoading) {
    return (
      <p className="rounded-[24px] border border-[#f2dfb9] bg-white px-5 py-4 text-sm font-bold text-[#6f6253]">
        불러오는 중...
      </p>
    )
  }
  if (error) {
    return (
      <p className="rounded-[24px] border border-[#ffd6cc] bg-[#fff5f1] px-5 py-4 text-sm font-bold text-[#d6452f]">
        목록을 불러오지 못했습니다.
      </p>
    )
  }

  return (
    <>
      <div className="overflow-x-auto rounded-[28px] border border-[#f2dfb9] bg-white shadow-[0_18px_46px_rgba(95,67,18,0.08)]">
        <table className="w-full min-w-[920px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-18 border-b border-[#f2dfb9] bg-[#fffaf0] p-3 text-xs font-black text-[#6f6253]">
                시간
              </th>
              {DAY_OF_WEEK_OPTIONS.map((day) => (
                <th
                  key={day}
                  className="min-w-[140px] border-b border-l border-[#f2dfb9] bg-[#fffaf0] p-3 text-xs font-black text-[#6f6253]"
                >
                  {DAY_OF_WEEK_LABELS[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ADMIN_ROW_STARTS.map((rowStart) => (
              <tr key={rowStart}>
                <td className="relative border-b border-[#f6ead0] px-3 py-2 align-top text-xs font-black text-[#6f6253]">
                  {rowStart % 30 === 0 ? (
                    <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white px-1">
                      {timeLabel(rowStart)}
                    </span>
                  ) : null}
                </td>
                {DAY_OF_WEEK_OPTIONS.map((day) => {
                  const { waitingInCell, groupedInCell } = getCellReservations(day, rowStart)
                  return (
                    <ReservationCell
                      key={day}
                      day={day}
                      rowStart={rowStart}
                      waitingInCell={waitingInCell}
                      groupedInCell={groupedInCell}
                      selectedSlots={selectedSlots}
                      groupLabelByReservationId={groupLabelByReservationId}
                      joinableGroupsForReservation={joinableGroupsForReservation}
                      onToggleSlot={onToggleSlot}
                      onSelectCell={onSelectCell}
                      onOpenDetail={onOpenDetail}
                      onCancelReservation={onCancelReservation}
                      onAddToGroup={onAddToGroup}
                    />
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs font-semibold leading-5 text-[#6f6253]">
        칸의 진하기는 해당 요일·시간에 대기중인 신청 인원 수를 나타냅니다. 이름을 클릭해 그룹 확정
        대상으로 선택하세요.
      </p>
    </>
  )
}

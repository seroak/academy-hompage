import {
  DAY_OF_WEEK_OPTIONS,
  OPERATING_END_MINUTE,
  OPERATING_START_MINUTE,
  timeLabel,
  Reservation,
} from '../../../../api/schemas/reservation.schema'
import { ReservationGroup } from '../../../../api/schemas/reservation-group.schema'
import { DayOfWeek, SelectedSlot } from '../types'
import ReservationCell from './ReservationCell'
import { CellData } from '../hooks/useReservationTimetable'
import { ADMIN_ROW_MINUTES } from '../utils/reservationAdminUtils'

const ADMIN_ROW_STARTS = Array.from(
  { length: (OPERATING_END_MINUTE - OPERATING_START_MINUTE) / ADMIN_ROW_MINUTES },
  (_, index) => OPERATING_START_MINUTE + index * ADMIN_ROW_MINUTES,
)

type Props = {
  isLoading: boolean
  error: Error | null
  selectedSlots: Map<string, SelectedSlot>
  getCellReservations: (day: DayOfWeek, rowStart: number) => CellData
  groupByReservationId: Map<string, ReservationGroup>
  joinableGroupsForReservation: (reservation: Reservation, day: DayOfWeek) => ReservationGroup[]
  onToggleSlot: (reservation: Reservation, day: DayOfWeek, rowStart: number) => void
  onSelectCell: (day: DayOfWeek, rowStart: number) => void
  onOpenDetail: (r: Reservation) => void
  onCancelReservation: (id: string) => void
  onAddToGroup: (reservation: Reservation, group: ReservationGroup, day: DayOfWeek) => void
  onOpenGroupDetail: (groupId: string) => void
  onMoveMember: (reservationId: string, fromGroupId: string, toGroupId: string) => void
}

export default function ReservationTimetable({
  isLoading,
  error,
  selectedSlots,
  getCellReservations,
  groupByReservationId,
  joinableGroupsForReservation,
  onToggleSlot,
  onSelectCell,
  onOpenDetail,
  onCancelReservation,
  onAddToGroup,
  onOpenGroupDetail,
  onMoveMember,
}: Props) {
  if (isLoading) {
    return <div className="py-20 text-center text-sm font-semibold text-[#6f6253]">시간표를 불러오는 중입니다...</div>
  }

  if (error) {
    return <div className="py-20 text-center text-sm font-semibold text-red-500">시간표를 불러오지 못했습니다.</div>
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-[#e8d5b5] bg-white shadow-sm">
      <table className="w-full min-w-[800px] table-fixed border-collapse">
        <thead>
          <tr className="border-b border-[#e8d5b5] bg-[#fffcf5]">
            <th className="w-20 p-3 text-center text-sm font-black text-[#8a7a61]">시간</th>
            {DAY_OF_WEEK_OPTIONS.map((day) => (
              <th
                key={day}
                className="min-w-[140px] border-l border-[#f6ead0] p-3 text-center text-sm font-black text-[#5c5140]"
              >
                {
                  { MON: '월', TUE: '화', WED: '수', THU: '목', FRI: '금', SAT: '토', SUN: '일' }[
                    day
                  ]
                }
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ADMIN_ROW_STARTS.map((rowStart) => (
            <tr key={rowStart} className="group transition-colors hover:bg-[#faf6ef]">
              <td className="relative border-b border-[#f6ead0] px-3 py-2 align-top text-xs font-black text-[#6f6253]">
                {rowStart % 30 === 0 ? (
                  <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white px-1">
                    {timeLabel(rowStart)}
                  </span>
                ) : null}
              </td>
              {DAY_OF_WEEK_OPTIONS.map((day) => {
                const { waitingInCell, groupedInCell, emptyGroupsInCell, rowSpan, skipRender } = getCellReservations(day, rowStart)
                
                if (skipRender) return null

                return (
                  <ReservationCell
                    key={`${day}-${rowStart}`}
                    day={day}
                    rowStart={rowStart}
                    rowSpan={rowSpan}
                    waitingInCell={waitingInCell}
                    groupedInCell={groupedInCell}
                    emptyGroupsInCell={emptyGroupsInCell}
                    selectedSlots={selectedSlots}
                    groupByReservationId={groupByReservationId}
                    joinableGroupsForReservation={joinableGroupsForReservation}
                    onToggleSlot={onToggleSlot}
                    onSelectCell={onSelectCell}
                    onOpenDetail={onOpenDetail}
                    onCancelReservation={onCancelReservation}
                    onAddToGroup={onAddToGroup}
                    onOpenGroupDetail={onOpenGroupDetail}
                    onMoveMember={onMoveMember}
                  />
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
